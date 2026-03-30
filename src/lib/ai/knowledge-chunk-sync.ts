import { createHash } from "node:crypto";

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

export type KnowledgeChunkInsertRow = {
  chunk_version: number;
  content: string;
  content_hash: string;
  importance_weight: number;
  metadata: JsonRecord;
  recency_at: string | null;
  source_id: string | null;
  source_key: string;
  source_type: string;
  token_count: number;
  user_id: string;
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

function buildContentHash(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function getNumberMetadataValue(
  metadata: JsonRecord,
  key: string,
  fallback: number,
) {
  const value = metadata[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function buildKnowledgeChunkInsertRow(
  userId: string,
  document: KnowledgeDocument,
): KnowledgeChunkInsertRow {
  const sourceKey = getDocumentSourceKey(document);
  const contentHash = getContentHash(document.metadata) ?? buildContentHash(document.content);
  const chunkVersion = Math.max(
    1,
    Math.trunc(getNumberMetadataValue(document.metadata, "chunkVersion", 1)),
  );
  const importanceWeight = getNumberMetadataValue(
    document.metadata,
    "importanceWeight",
    0,
  );
  const recencyAt =
    typeof document.metadata.recencyAt === "string" &&
    document.metadata.recencyAt.trim()
      ? document.metadata.recencyAt
      : null;
  const tokenCount = Math.max(
    1,
    Math.trunc(getNumberMetadataValue(document.metadata, "tokenCount", 1)),
  );

  return {
    chunk_version: chunkVersion,
    content: document.content,
    content_hash: contentHash,
    importance_weight: importanceWeight,
    metadata: document.metadata,
    recency_at: recencyAt,
    source_id: document.sourceId,
    source_key: sourceKey,
    source_type: document.sourceType,
    token_count: tokenCount,
    user_id: userId,
  };
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
        documentBatch.map((document) =>
          buildKnowledgeChunkInsertRow(userId, document),
        ),
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
