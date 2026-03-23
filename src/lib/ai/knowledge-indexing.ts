import type { SupabaseClient } from "@supabase/supabase-js";

import { embedDocumentTexts } from "@/lib/ai/embeddings";
import {
  toVectorLiteral,
  type KnowledgeChunkEmbeddingInput,
  type KnowledgeReindexResult,
} from "@/lib/ai/knowledge-model";
import { logger } from "@/lib/logger";

export async function refreshKnowledgeEmbeddings({
  embeddingModel,
  listKnowledgeChunkInputs,
  supabase,
  userId,
}: {
  embeddingModel: string;
  listKnowledgeChunkInputs: (
    supabase: SupabaseClient,
    userId: string,
  ) => Promise<KnowledgeChunkEmbeddingInput[]>;
  supabase: SupabaseClient;
  userId: string;
}): Promise<KnowledgeReindexResult> {
  const chunks = await listKnowledgeChunkInputs(supabase, userId);

  if (!chunks.length) {
    return {
      indexedChunks: 0,
      embeddingsIndexed: 0,
      mode: "embeddings",
      searchMode: "text",
    };
  }

  const { data: existingEmbeddings, error: existingEmbeddingsError } = await supabase
    .from("knowledge_embeddings")
    .select("chunk_id")
    .eq("user_id", userId)
    .eq("model", embeddingModel);

  if (existingEmbeddingsError) {
    throw existingEmbeddingsError;
  }

  const currentChunkIds = new Set(chunks.map((chunk) => chunk.id));
  const existingChunkIds = new Set(
    ((existingEmbeddings as Array<{ chunk_id: string }> | null) ?? []).map(
      (row) => row.chunk_id,
    ),
  );
  const staleChunkIds = [...existingChunkIds].filter(
    (chunkId) => !currentChunkIds.has(chunkId),
  );

  if (staleChunkIds.length) {
    const { error: deleteError } = await supabase
      .from("knowledge_embeddings")
      .delete()
      .eq("user_id", userId)
      .eq("model", embeddingModel)
      .in("chunk_id", staleChunkIds);

    if (deleteError) {
      throw deleteError;
    }
  }

  const chunksNeedingEmbeddings = chunks.filter(
    (chunk) => !existingChunkIds.has(chunk.id),
  );

  if (!chunksNeedingEmbeddings.length) {
    return {
      indexedChunks: chunks.length,
      embeddingsIndexed: 0,
      mode: "embeddings",
      searchMode: chunks.length ? "vector" : "text",
    };
  }

  try {
    const embeddings = await embedDocumentTexts(
      chunksNeedingEmbeddings.map((chunk) => chunk.content),
    );

    const { error: embeddingInsertError } = await supabase
      .from("knowledge_embeddings")
      .insert(
        embeddings.map((embedding, index) => ({
          user_id: userId,
          chunk_id: chunksNeedingEmbeddings[index]?.id,
          embedding: toVectorLiteral(embedding),
          model: embeddingModel,
        })),
      );

    if (embeddingInsertError) {
      throw embeddingInsertError;
    }
  } catch (error) {
    logger.warn("knowledge embeddings unavailable; text retrieval only", {
      error,
      userId,
    });

    return {
      indexedChunks: chunks.length,
      embeddingsIndexed: 0,
      mode: "embeddings",
      searchMode: existingChunkIds.size ? "vector" : "text",
    };
  }

  return {
    indexedChunks: chunks.length,
    embeddingsIndexed: chunksNeedingEmbeddings.length,
    mode: "embeddings",
    searchMode: "vector",
  };
}

export async function ensureKnowledgeIndexState({
  embeddingModel,
  reindexKnowledgeBase,
  refreshKnowledgeEmbeddings,
  supabase,
  userId,
}: {
  embeddingModel: string;
  reindexKnowledgeBase: (supabase: SupabaseClient, userId: string) => Promise<void>;
  refreshKnowledgeEmbeddings: (
    supabase: SupabaseClient,
    userId: string,
  ) => Promise<KnowledgeReindexResult>;
  supabase: SupabaseClient;
  userId: string;
}) {
  const { count, error } = await supabase
    .from("knowledge_chunks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  if (!count) {
    await reindexKnowledgeBase(supabase, userId);
    return;
  }

  const { count: embeddingCount, error: embeddingCountError } = await supabase
    .from("knowledge_embeddings")
    .select("chunk_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("model", embeddingModel);

  if (embeddingCountError) {
    throw embeddingCountError;
  }

  if (!embeddingCount) {
    try {
      await refreshKnowledgeEmbeddings(supabase, userId);
    } catch (error) {
      logger.warn("knowledge embeddings refresh failed during ensure", {
        error,
        userId,
      });
    }
  }
}
