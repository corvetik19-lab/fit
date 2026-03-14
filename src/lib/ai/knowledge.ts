import type { SupabaseClient } from "@supabase/supabase-js";

import { buildKnowledgeDocuments } from "@/lib/ai/knowledge-documents";
import { aiProviders, defaultModels } from "@/lib/ai/gateway";
import {
  type KnowledgeChunkRow,
  type KnowledgeReindexResult,
  type RetrievedKnowledgeItem,
} from "@/lib/ai/knowledge-model";
import {
  ensureKnowledgeIndexState,
  refreshKnowledgeEmbeddings as refreshKnowledgeEmbeddingsWithIndexing,
} from "@/lib/ai/knowledge-indexing";
import { listKnowledgeChunkInputs } from "@/lib/ai/knowledge-source-data";
import { retrieveKnowledgeMatchesWithPipeline } from "@/lib/ai/knowledge-retrieval";

export type {
  KnowledgeReindexResult,
  RetrievedKnowledgeItem,
} from "@/lib/ai/knowledge-model";

const KNOWLEDGE_EMBEDDING_MODEL =
  aiProviders.embeddings === "voyage"
    ? defaultModels.voyageEmbeddings
    : defaultModels.gatewayEmbeddings;

export async function reindexUserKnowledgeBase(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    mode?: "embeddings" | "full";
  },
): Promise<KnowledgeReindexResult> {
  const mode = options?.mode ?? "full";

  if (mode === "embeddings") {
    const chunks = await listKnowledgeChunkInputs(supabase, userId);

    if (!chunks.length) {
      return reindexUserKnowledgeBase(supabase, userId, {
        mode: "full",
      });
    }

    return refreshKnowledgeEmbeddingsWithIndexing({
      embeddingModel: KNOWLEDGE_EMBEDDING_MODEL,
      listKnowledgeChunkInputs,
      supabase,
      userId,
    });
  }

  const documents = await buildKnowledgeDocuments(supabase, userId);

  const { error: deleteError } = await supabase
    .from("knowledge_chunks")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    throw deleteError;
  }

  const { data: insertedChunks, error: chunkInsertError } = await supabase
    .from("knowledge_chunks")
    .insert(
      documents.map((document) => ({
        user_id: userId,
        source_type: document.sourceType,
        source_id: document.sourceId,
        content: document.content,
        metadata: document.metadata,
      })),
    )
    .select("id, source_type, source_id, content, metadata");

  if (chunkInsertError) {
    throw chunkInsertError;
  }

  const chunks = (insertedChunks as KnowledgeChunkRow[] | null) ?? [];

  if (!chunks.length) {
    return {
      indexedChunks: 0,
      embeddingsIndexed: 0,
      mode: "full",
      searchMode: "text",
    };
  }

  const embeddingsResult = await refreshKnowledgeEmbeddingsWithIndexing({
    embeddingModel: KNOWLEDGE_EMBEDDING_MODEL,
    listKnowledgeChunkInputs,
    supabase,
    userId,
  });

  return {
    embeddingsIndexed: embeddingsResult.embeddingsIndexed,
    indexedChunks: chunks.length,
    mode: "full",
    searchMode: embeddingsResult.searchMode,
  };
}

async function ensureKnowledgeIndex(
  supabase: SupabaseClient,
  userId: string,
) {
  await ensureKnowledgeIndexState({
    embeddingModel: KNOWLEDGE_EMBEDDING_MODEL,
    reindexKnowledgeBase: async (innerSupabase, innerUserId) => {
      await reindexUserKnowledgeBase(innerSupabase, innerUserId);
    },
    refreshKnowledgeEmbeddings: async (innerSupabase, innerUserId) =>
      await refreshKnowledgeEmbeddingsWithIndexing({
        embeddingModel: KNOWLEDGE_EMBEDDING_MODEL,
        listKnowledgeChunkInputs,
        supabase: innerSupabase,
        userId: innerUserId,
      }),
    supabase,
    userId,
  });
}

export async function retrieveKnowledgeMatches(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  limit = 6,
): Promise<RetrievedKnowledgeItem[]> {
  return retrieveKnowledgeMatchesWithPipeline({
    ensureKnowledgeIndex,
    limit,
    query,
    supabase,
    userId,
  });
}
