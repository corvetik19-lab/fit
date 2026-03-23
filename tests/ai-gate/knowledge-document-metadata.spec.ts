import { expect, test } from "@playwright/test";

import {
  KNOWLEDGE_CHUNK_VERSION,
  buildKnowledgeDocumentMetadata,
} from "@/lib/ai/knowledge-document-metadata";
import type { KnowledgeDocument } from "@/lib/ai/knowledge-model";

test.describe("knowledge document metadata", () => {
  test("builds source key, source family and recency metadata", () => {
    const document: KnowledgeDocument = {
      content: "Жим лежа 80 кг 5x5. Высокий RPE и усталость мешают прогрессу.",
      metadata: {
        updatedAt: "2026-03-20T09:00:00.000Z",
      },
      sourceId: "day-1",
      sourceType: "workout_day",
    };

    const metadata = buildKnowledgeDocumentMetadata(document);

    expect(metadata.sourceKey).toBe("workout_day:day-1");
    expect(metadata.sourceFamily).toBe("workout");
    expect(metadata.chunkVersion).toBe(KNOWLEDGE_CHUNK_VERSION);
    expect(metadata.recencyAt).toBe("2026-03-20T09:00:00.000Z");
    expect(typeof metadata.contentHash).toBe("string");
    expect((metadata.contentHash as string).length).toBe(64);
    expect(Number(metadata.tokenCount)).toBeGreaterThan(5);
  });

  test("keeps fallback metadata deterministic", () => {
    const document: KnowledgeDocument = {
      content: "Истории пока мало, поэтому нужен осторожный ответ.",
      metadata: {
        category: "fallback",
      },
      sourceId: null,
      sourceType: "fallback_context",
    };

    const metadata = buildKnowledgeDocumentMetadata(document);

    expect(metadata.sourceKey).toBe("fallback_context:none");
    expect(metadata.sourceFamily).toBe("fallback");
    expect(metadata.importanceWeight).toBe(0.2);
    expect(metadata.recencyAt).toBeNull();
  });
});
