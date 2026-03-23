import { createHash } from "node:crypto";

import {
  resolveKnowledgeChunkPolicy,
  type KnowledgeChunkPolicy,
} from "@/lib/ai/knowledge-chunk-policy";
import type { JsonRecord, KnowledgeDocument } from "@/lib/ai/knowledge-model";

export const KNOWLEDGE_CHUNK_VERSION = 2;

function pickRecencyValue(metadata: JsonRecord, policy: KnowledgeChunkPolicy) {
  for (const key of policy.recencyKeys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function estimateTokenCount(content: string) {
  const words = content
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);

  return Math.max(words.length, 1);
}

function buildContentHash(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

export function buildKnowledgeDocumentMetadata(document: KnowledgeDocument): JsonRecord {
  const policy = resolveKnowledgeChunkPolicy(document.sourceType);

  return {
    ...document.metadata,
    chunkVersion: KNOWLEDGE_CHUNK_VERSION,
    contentHash: buildContentHash(document.content),
    importanceWeight: policy.importanceWeight,
    recencyAt: pickRecencyValue(document.metadata, policy),
    sourceFamily: policy.family,
    sourceKey: `${document.sourceType}:${document.sourceId ?? "none"}`,
    tokenCount: estimateTokenCount(document.content),
  };
}

export function finalizeKnowledgeDocument(document: KnowledgeDocument): KnowledgeDocument {
  return {
    ...document,
    metadata: buildKnowledgeDocumentMetadata(document),
  };
}

export function finalizeKnowledgeDocuments(documents: KnowledgeDocument[]) {
  return documents.map((document) => finalizeKnowledgeDocument(document));
}
