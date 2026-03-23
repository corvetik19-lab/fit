import { expect, test } from "@playwright/test";

import { planKnowledgeChunkSync } from "@/lib/ai/knowledge-chunk-sync";
import { buildKnowledgeDocumentMetadata } from "@/lib/ai/knowledge-document-metadata";
import type { KnowledgeDocument } from "@/lib/ai/knowledge-model";

function createDocument(
  overrides: Partial<KnowledgeDocument> & Pick<KnowledgeDocument, "content" | "sourceId" | "sourceType">,
): KnowledgeDocument {
  const base: KnowledgeDocument = {
    content: "",
    metadata: {},
    sourceId: null,
    sourceType: "fallback_context",
  };

  const document = {
    ...base,
    ...overrides,
  };

  return {
    ...document,
    metadata: buildKnowledgeDocumentMetadata(document),
  };
}

test.describe("knowledge chunk sync plan", () => {
  test("keeps unchanged chunks, inserts changed chunks and deletes stale ones", () => {
    const unchangedDocument = createDocument({
      content: "Стабильный профиль пользователя.",
      sourceId: "profile-1",
      sourceType: "user_profile",
    });
    const changedDocument = createDocument({
      content: "Обновлённая история тренировки с новым тоннажом.",
      sourceId: "day-1",
      sourceType: "workout_day",
    });

    const plan = planKnowledgeChunkSync({
      documents: [unchangedDocument, changedDocument],
      existingChunks: [
        {
          content: unchangedDocument.content,
          id: "chunk-unchanged",
          metadata: unchangedDocument.metadata,
          source_id: unchangedDocument.sourceId,
          source_type: unchangedDocument.sourceType,
        },
        {
          content: "Старая версия истории тренировки.",
          id: "chunk-changed",
          metadata: {
            ...changedDocument.metadata,
            contentHash: "outdated",
          },
          source_id: changedDocument.sourceId,
          source_type: changedDocument.sourceType,
        },
        {
          content: "Лишний старый chunk.",
          id: "chunk-stale",
          metadata: {
            sourceKey: "meal_log:stale",
          },
          source_id: "stale",
          source_type: "meal_log",
        },
      ],
    });

    expect(plan.unchangedChunks.map((chunk) => chunk.id)).toEqual(["chunk-unchanged"]);
    expect(plan.insertedDocuments.map((document) => document.sourceType)).toEqual([
      "workout_day",
    ]);
    expect(plan.deleteChunkIds.sort()).toEqual(["chunk-changed", "chunk-stale"]);
  });
});
