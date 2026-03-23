import { expect, test } from "@playwright/test";

import { buildHybridKnowledgeMatches } from "@/lib/ai/knowledge-hybrid-ranking";
import type { RetrievedKnowledgeItem } from "@/lib/ai/knowledge-model";
import { KNOWLEDGE_RETRIEVAL_LIMITS } from "@/lib/ai/knowledge-retrieval-config";

function createItem(
  overrides: Partial<RetrievedKnowledgeItem> & Pick<RetrievedKnowledgeItem, "id" | "content" | "sourceType" | "similarity">,
): RetrievedKnowledgeItem {
  const base: RetrievedKnowledgeItem = {
    content: "",
    id: "",
    metadata: {},
    similarity: 0,
    sourceId: null,
    sourceType: "",
  };

  return {
    ...base,
    ...overrides,
    metadata: overrides.metadata ?? {},
    sourceId: overrides.sourceId ?? overrides.id,
  };
}

test.describe("hybrid retrieval ranking", () => {
  test("fuses vector and lexical candidates into one ranked context", () => {
    const vectorMatches = [
      createItem({
        id: "workout-day-1",
        sourceType: "workout_day",
        similarity: 0.91,
        content:
          "Жим лежа застопорился после тяжелой недели. Высокий RPE и плохое восстановление мешают прогрессу.",
        metadata: {
          updatedAt: new Date().toISOString(),
        },
      }),
      createItem({
        id: "structured-fact-1",
        sourceType: "structured_fact",
        similarity: 0.89,
        content:
          "Главный риск сейчас — недовосстановление после жима и тяговых тренировок.",
        metadata: {
          generatedAt: new Date().toISOString(),
        },
      }),
    ];

    const textMatches = [
      createItem({
        id: "workout-day-1",
        sourceType: "workout_day",
        similarity: 16,
        content:
          "Жим лежа застопорился после тяжелой недели. Высокий RPE и плохое восстановление мешают прогрессу.",
        metadata: {
          updatedAt: new Date().toISOString(),
        },
      }),
      createItem({
        id: "nutrition-day-1",
        sourceType: "nutrition_day",
        similarity: 14,
        content:
          "Калории и белок за день были ниже цели, что ухудшило восстановление после тренировки.",
        metadata: {
          summaryDate: new Date().toISOString(),
        },
      }),
    ];

    const ranked = buildHybridKnowledgeMatches({
      limit: 3,
      query: "почему застой в жиме лежа и восстановление",
      textMatches,
      vectorMatches,
    });

    expect(ranked).toHaveLength(3);
    expect(ranked[0]?.id).toBe("workout-day-1");
    expect(ranked[0]?.vectorScore).toBe(0.91);
    expect(ranked[0]?.textScore).toBe(16);
    expect(ranked[0]?.fusedScore).toBeTruthy();
    expect(ranked[0]?.rerankScore).toBeTruthy();
    expect(ranked[0]?.matchedTerms?.length ?? 0).toBeGreaterThan(0);
    expect(ranked[0]?.sourceKind).toBe("workout");
    expect(ranked[0]?.similarity).toBe(ranked[0]?.rerankScore);
  });

  test("respects configured context cap", () => {
    const vectorMatches = Array.from({ length: 20 }, (_, index) =>
      createItem({
        id: `vector-${index}`,
        sourceType: "workout_day",
        similarity: 0.8 - index * 0.01,
        content: `Тренировка ${index} с подходами и восстановлением.`,
      }),
    );
    const textMatches = Array.from({ length: 20 }, (_, index) =>
      createItem({
        id: `text-${index}`,
        sourceType: "nutrition_day",
        similarity: 20 - index,
        content: `Питание ${index} с белком и калориями.`,
      }),
    );

    const ranked = buildHybridKnowledgeMatches({
      limit: 99,
      query: "восстановление и калории",
      textMatches,
      vectorMatches,
    });

    expect(ranked.length).toBe(KNOWLEDGE_RETRIEVAL_LIMITS.finalContext);
  });
});
