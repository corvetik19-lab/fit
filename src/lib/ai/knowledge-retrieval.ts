import { cosineSimilarity } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";

import { embedQueryText } from "@/lib/ai/embeddings";
import { buildHybridKnowledgeMatches } from "@/lib/ai/knowledge-hybrid-ranking";
import {
  parseVector,
  rankChunkByTokens,
  toVectorLiteral,
  type JsonRecord,
  type KnowledgeChunkRow,
  type KnowledgeEmbeddingRow,
  type RetrievedKnowledgeItem,
} from "@/lib/ai/knowledge-model";
import {
  clampKnowledgeContextLimit,
  KNOWLEDGE_RETRIEVAL_LIMITS,
} from "@/lib/ai/knowledge-retrieval-config";
import {
  resolveKnowledgeRetrievalMode,
  selectKnowledgeRetrievalMatches,
} from "@/lib/ai/knowledge-retrieval-rollout";
import { logger } from "@/lib/logger";

const KNOWLEDGE_FALLBACK_PAGE_SIZE = 200;
const KNOWLEDGE_CHUNK_BATCH_SIZE = 200;

export async function collectPaginatedRows<T>({
  fetchPage,
  pageSize = KNOWLEDGE_FALLBACK_PAGE_SIZE,
}: {
  fetchPage: (from: number, to: number) => Promise<T[]>;
  pageSize?: number;
}) {
  const rows: T[] = [];

  for (let pageIndex = 0; ; pageIndex += 1) {
    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;
    const page = await fetchPage(from, to);

    if (!page.length) {
      break;
    }

    rows.push(...page);

    if (page.length < pageSize) {
      break;
    }
  }

  return rows;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export function rankKnowledgeChunksByText(
  chunks: KnowledgeChunkRow[],
  query: string,
  limit: number,
) {
  return chunks
    .map((chunk) => ({
      id: chunk.id,
      sourceType: chunk.source_type,
      sourceId: chunk.source_id,
      content: chunk.content,
      metadata: chunk.metadata,
      similarity: rankChunkByTokens(chunk, query),
    }))
    .filter((item) => item.similarity > 0)
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, limit);
}

export function rankKnowledgeMatchesFromEmbeddingRows({
  chunksById,
  embeddingRows,
  limit,
  queryEmbedding,
}: {
  chunksById: Map<string, KnowledgeChunkRow>;
  embeddingRows: KnowledgeEmbeddingRow[];
  limit: number;
  queryEmbedding: number[];
}) {
  return embeddingRows
    .map((row) => {
      const chunk = chunksById.get(row.chunk_id);

      if (!chunk) {
        return null;
      }

      const candidateEmbedding = parseVector(row.embedding);

      if (!candidateEmbedding.length || candidateEmbedding.length !== queryEmbedding.length) {
        return null;
      }

      return {
        id: chunk.id,
        sourceType: chunk.source_type,
        sourceId: chunk.source_id,
        content: chunk.content,
        metadata: chunk.metadata,
        similarity: cosineSimilarity(queryEmbedding, candidateEmbedding),
      } satisfies RetrievedKnowledgeItem;
    })
    .filter((item): item is RetrievedKnowledgeItem => Boolean(item))
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, limit);
}

async function retrieveKnowledgeMatchesViaRpc(
  supabase: SupabaseClient,
  queryEmbedding: number[],
  limit: number,
) {
  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: toVectorLiteral(queryEmbedding),
    match_count: limit,
    match_threshold: 0.45,
  });

  if (error) {
    throw error;
  }

  return ((data as
    | Array<{
        id: string;
        source_type: string;
        source_id: string | null;
        content: string;
        metadata: JsonRecord;
        similarity: number;
      }>
    | null) ?? [])
    .map((item) => ({
      id: item.id,
      sourceType: item.source_type,
      sourceId: item.source_id,
      content: item.content,
      metadata: item.metadata ?? {},
      similarity: Number(item.similarity),
    }))
    .filter((item) => Number.isFinite(item.similarity));
}

async function retrieveKnowledgeMatchesViaTextRpc(
  supabase: SupabaseClient,
  query: string,
  limit: number,
) {
  const { data, error } = await supabase.rpc("search_knowledge_chunks_text", {
    query_text: query,
    match_count: limit,
  });

  if (error) {
    throw error;
  }

  return ((data as
    | Array<{
        id: string;
        source_type: string;
        source_id: string | null;
        content: string;
        metadata: JsonRecord;
        similarity: number;
      }>
    | null) ?? [])
    .map((item) => ({
      id: item.id,
      sourceType: item.source_type,
      sourceId: item.source_id,
      content: item.content,
      metadata: item.metadata ?? {},
      similarity: Number(item.similarity),
    }))
    .filter((item) => Number.isFinite(item.similarity));
}

async function retrieveKnowledgeMatchesWithFallback(
  supabase: SupabaseClient,
  userId: string,
  queryEmbedding: number[],
  limit: number,
) {
  const embeddingRows = await collectPaginatedRows({
    fetchPage: async (from, to) => {
      const { data, error } = await supabase
        .from("knowledge_embeddings")
        .select("chunk_id, embedding")
        .eq("user_id", userId)
        .order("id", { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      return (data as KnowledgeEmbeddingRow[] | null) ?? [];
    },
  });

  if (!embeddingRows.length) {
    return [] as RetrievedKnowledgeItem[];
  }

  const chunkIds = [...new Set(embeddingRows.map((row) => row.chunk_id))];
  const chunkPages = await Promise.all(
    chunkArray(chunkIds, KNOWLEDGE_CHUNK_BATCH_SIZE).map(async (chunkIdBatch) => {
      const { data, error } = await supabase
        .from("knowledge_chunks")
        .select("id, source_type, source_id, content, metadata")
        .eq("user_id", userId)
        .in("id", chunkIdBatch);

      if (error) {
        throw error;
      }

      return (data as KnowledgeChunkRow[] | null) ?? [];
    }),
  );
  const chunks = chunkPages.flat();
  const chunksById = new Map(chunks.map((chunk) => [chunk.id, chunk]));

  return rankKnowledgeMatchesFromEmbeddingRows({
    chunksById,
    embeddingRows,
    limit,
    queryEmbedding,
  });
}

async function retrieveKnowledgeMatchesViaTextFallback(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  limit: number,
) {
  const chunks = await collectPaginatedRows({
    fetchPage: async (from, to) => {
      const { data, error } = await supabase
        .from("knowledge_chunks")
        .select("id, source_type, source_id, content, metadata")
        .eq("user_id", userId)
        .order("id", { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      return (data as KnowledgeChunkRow[] | null) ?? [];
    },
  });

  return rankKnowledgeChunksByText(chunks, query, limit);
}

export async function retrieveKnowledgeMatchesWithPipeline({
  ensureKnowledgeIndex,
  limit = 6,
  query,
  supabase,
  userId,
}: {
  ensureKnowledgeIndex: (
    supabase: SupabaseClient,
    userId: string,
  ) => Promise<void>;
  limit?: number;
  query: string;
  supabase: SupabaseClient;
  userId: string;
}): Promise<RetrievedKnowledgeItem[]> {
  const finalLimit = clampKnowledgeContextLimit(limit);
  const retrievalMode = resolveKnowledgeRetrievalMode();

  try {
    await ensureKnowledgeIndex(supabase, userId);
  } catch (error) {
    logger.warn("knowledge index refresh failed; using existing chunks only", {
      error,
      userId,
    });
  }

  let queryEmbedding: number[] | null = null;

  try {
    queryEmbedding = await embedQueryText(query);
  } catch (error) {
    logger.warn("knowledge query embedding unavailable; falling back to text retrieval", {
      error,
      userId,
    });
  }

  let semanticMatches: RetrievedKnowledgeItem[] = [];

  if (queryEmbedding) {
    try {
      semanticMatches = await retrieveKnowledgeMatchesViaRpc(
        supabase,
        queryEmbedding,
        Math.max(finalLimit, KNOWLEDGE_RETRIEVAL_LIMITS.semanticCandidates),
      );
    } catch (error) {
      logger.warn("knowledge RPC retrieval fell back to app-side vector ranking", {
        error,
        userId,
      });
    }

    if (!semanticMatches.length) {
      try {
        semanticMatches = await retrieveKnowledgeMatchesWithFallback(
          supabase,
          userId,
          queryEmbedding,
          Math.max(finalLimit, KNOWLEDGE_RETRIEVAL_LIMITS.semanticCandidates),
        );
      } catch (error) {
        logger.warn("knowledge vector fallback failed; trying text retrieval", {
          error,
          userId,
        });
      }
    }
  }

  let textMatches: RetrievedKnowledgeItem[] = [];

  try {
    textMatches = await retrieveKnowledgeMatchesViaTextRpc(
      supabase,
      query,
      Math.max(finalLimit, KNOWLEDGE_RETRIEVAL_LIMITS.lexicalCandidates),
    );
  } catch (error) {
    logger.warn("knowledge text RPC retrieval fell back to app-side text ranking", {
      error,
      userId,
    });
  }

  if (!textMatches.length) {
    try {
      textMatches = await retrieveKnowledgeMatchesViaTextFallback(
        supabase,
        userId,
        query,
        Math.max(finalLimit, KNOWLEDGE_RETRIEVAL_LIMITS.lexicalCandidates),
      );
    } catch (error) {
      logger.warn("knowledge text fallback failed", {
        error,
        userId,
      });
    }
  }

  if (!semanticMatches.length && !textMatches.length) {
    return [];
  }

  const hybridMatches =
    retrievalMode === "legacy"
      ? []
      : buildHybridKnowledgeMatches({
          limit: finalLimit,
          query,
          textMatches,
          vectorMatches: semanticMatches,
        });

  const selection = selectKnowledgeRetrievalMatches({
    hybridMatches,
    limit: finalLimit,
    mode: retrievalMode,
    semanticMatches,
    textMatches,
  });

  if (selection.rollout.mode === "shadow") {
    logger.info("knowledge retrieval shadow snapshot", {
      fallbackToLegacy: selection.rollout.fallbackToLegacy,
      hybridIds: selection.rollout.hybridIds,
      legacyIds: selection.rollout.legacyIds,
      rankingChanged: selection.rollout.rankingChanged,
      selectedIds: selection.rollout.selectedIds,
      semanticCandidateCount: selection.rollout.semanticCandidateCount,
      textCandidateCount: selection.rollout.textCandidateCount,
      userId,
    });
  } else if (selection.rollout.fallbackToLegacy) {
    logger.warn("knowledge retrieval hybrid mode fell back to legacy ranking", {
      semanticCandidateCount: selection.rollout.semanticCandidateCount,
      textCandidateCount: selection.rollout.textCandidateCount,
      userId,
    });
  }

  return selection.matches;
}
