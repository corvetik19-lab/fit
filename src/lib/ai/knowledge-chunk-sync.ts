import type { SupabaseClient } from "@supabase/supabase-js";

import { type JsonRecord, type KnowledgeChunkRow, type KnowledgeDocument } from "@/lib/ai/knowledge-model";
import { fetchAllRows } from "@/lib/ai/knowledge-source-data";

type ExistingKnowledgeChunk = KnowledgeChunkRow & {
  metadata: JsonRecord;
};

type PlannedKnowledgeChunkSync = {
  deleteChunkIds: string[];
  insertedDocuments: KnowledgeDocument[];
  unchangedChunks: ExistingKnowledgeChunk[];
};

const CHUNK_DELETE_BATCH_SIZE = 200;
const CHUNK_INSERT_BATCH_SIZE = 100;

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function getDocumentSourceKey(document: KnowledgeDocument) {
  const sourceKey = document.metadata.sourceKey;
  if (typeof sourceKey === "string" && sourceKey.trim()) {
    return sourceKey;
  }

  return `${document.sourceType}:${document.sourceId ?? "none"}`;
}

function getChunkSourceKey(chunk: ExistingKnowledgeChunk) {
  const sourceKey = chunk.metadata.sourceKey;
  if (typeof sourceKey === "string" && sourceKey.trim()) {
    return sourceKey;
  }

  return `${chunk.source_type}:${chunk.source_id ?? "none"}`;
}

function getContentHash(metadata: JsonRecord) {
  const contentHash = metadata.contentHash;
  return typeof contentHash === "string" && contentHash.trim() ? contentHash : null;
}

export function planKnowledgeChunkSync({
  documents,
  existingChunks,
}: {
  documents: KnowledgeDocument[];
  existingChunks: ExistingKnowledgeChunk[];
}): PlannedKnowledgeChunkSync {
  const desiredBySourceKey = new Map<string, KnowledgeDocument>();

  for (const document of documents) {
    desiredBySourceKey.set(getDocumentSourceKey(document), document);
  }

  const existingBySourceKey = new Map<string, ExistingKnowledgeChunk>();
  const duplicateChunkIds: string[] = [];

  for (const chunk of existingChunks) {
    const sourceKey = getChunkSourceKey(chunk);

    if (existingBySourceKey.has(sourceKey)) {
      duplicateChunkIds.push(chunk.id);
      continue;
    }

    existingBySourceKey.set(sourceKey, chunk);
  }

  const deleteChunkIds = [...duplicateChunkIds];
  const insertedDocuments: KnowledgeDocument[] = [];
  const unchangedChunks: ExistingKnowledgeChunk[] = [];

  for (const [sourceKey, document] of desiredBySourceKey.entries()) {
    const existingChunk = existingBySourceKey.get(sourceKey);

    if (!existingChunk) {
      insertedDocuments.push(document);
      continue;
    }

    const existingHash = getContentHash(existingChunk.metadata);
    const desiredHash = getContentHash(document.metadata);

    if (
      existingHash &&
      desiredHash &&
      existingHash === desiredHash &&
      existingChunk.content === document.content
    ) {
      unchangedChunks.push(existingChunk);
      continue;
    }

    deleteChunkIds.push(existingChunk.id);
    insertedDocuments.push(document);
  }

  for (const [sourceKey, existingChunk] of existingBySourceKey.entries()) {
    if (!desiredBySourceKey.has(sourceKey)) {
      deleteChunkIds.push(existingChunk.id);
    }
  }

  return {
    deleteChunkIds,
    insertedDocuments,
    unchangedChunks,
  };
}

export async function syncKnowledgeDocuments({
  documents,
  supabase,
  userId,
}: {
  documents: KnowledgeDocument[];
  supabase: SupabaseClient;
  userId: string;
}) {
  const existingChunks = await fetchAllRows<ExistingKnowledgeChunk>(async (from, to) =>
    await supabase
      .from("knowledge_chunks")
      .select("id, source_type, source_id, content, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to),
  );

  const plan = planKnowledgeChunkSync({
    documents,
    existingChunks,
  });

  for (const idBatch of chunkArray(plan.deleteChunkIds, CHUNK_DELETE_BATCH_SIZE)) {
    if (!idBatch.length) {
      continue;
    }

    const { error } = await supabase
      .from("knowledge_chunks")
      .delete()
      .eq("user_id", userId)
      .in("id", idBatch);

    if (error) {
      throw error;
    }
  }

  const insertedChunks: KnowledgeChunkRow[] = [];

  for (const documentBatch of chunkArray(plan.insertedDocuments, CHUNK_INSERT_BATCH_SIZE)) {
    if (!documentBatch.length) {
      continue;
    }

    const { data, error } = await supabase
      .from("knowledge_chunks")
      .insert(
        documentBatch.map((document) => ({
          user_id: userId,
          source_type: document.sourceType,
          source_id: document.sourceId,
          content: document.content,
          metadata: document.metadata,
        })),
      )
      .select("id, source_type, source_id, content, metadata");

    if (error) {
      throw error;
    }

    insertedChunks.push(...((data as KnowledgeChunkRow[] | null) ?? []));
  }

  return {
    deletedChunks: plan.deleteChunkIds.length,
    insertedChunks,
    totalChunks: plan.unchangedChunks.length + insertedChunks.length,
    unchangedChunks: plan.unchangedChunks,
  };
}
