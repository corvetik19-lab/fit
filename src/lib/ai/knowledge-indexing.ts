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

  const { error: deleteError } = await supabase
    .from("knowledge_embeddings")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    throw deleteError;
  }

  try {
    const embeddings = await embedDocumentTexts(chunks.map((chunk) => chunk.content));

    const { error: embeddingInsertError } = await supabase
      .from("knowledge_embeddings")
      .insert(
        embeddings.map((embedding, index) => ({
          user_id: userId,
          chunk_id: chunks[index]?.id,
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
      searchMode: "text",
    };
  }

  return {
    indexedChunks: chunks.length,
    embeddingsIndexed: chunks.length,
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
