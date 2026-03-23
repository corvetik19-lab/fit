import type { SupabaseClient } from "@supabase/supabase-js";

import { buildKnowledgeDocuments } from "@/lib/ai/knowledge-documents";
import { aiProviders, defaultModels } from "@/lib/ai/gateway";
import {
  type KnowledgeChunkRow,
  type KnowledgeReindexResult,
} from "@/lib/ai/knowledge-model";
import {
  ensureKnowledgeIndexState,
  refreshKnowledgeEmbeddings as refreshKnowledgeEmbeddingsWithIndexing,
} from "@/lib/ai/knowledge-indexing";
import { syncKnowledgeDocuments } from "@/lib/ai/knowledge-chunk-sync";
import { listKnowledgeChunkInputs } from "@/lib/ai/knowledge-source-data";

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
  const chunkSyncResult = await syncKnowledgeDocuments({
    documents,
    supabase,
    userId,
  });
  const chunks = [
    ...chunkSyncResult.unchangedChunks,
    ...chunkSyncResult.insertedChunks,
  ] as KnowledgeChunkRow[];

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

export async function ensureKnowledgeIndex(
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
