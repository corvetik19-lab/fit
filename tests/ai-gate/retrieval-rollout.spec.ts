import { expect, test } from "@playwright/test";

import {
  buildLegacyKnowledgeMatches,
  normalizeKnowledgeRetrievalMode,
  selectKnowledgeRetrievalMatches,
} from "@/lib/ai/knowledge-retrieval-rollout";
import type { RetrievedKnowledgeItem } from "@/lib/ai/knowledge-model";

function createItem(
  overrides: Partial<RetrievedKnowledgeItem> &
    Pick<
      RetrievedKnowledgeItem,
      "content" | "id" | "similarity" | "sourceType"
    >,
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

test.describe("knowledge retrieval rollout", () => {
  test("normalizes retrieval mode and defaults to hybrid", () => {
    expect(normalizeKnowledgeRetrievalMode(undefined)).toBe("hybrid");
    expect(normalizeKnowledgeRetrievalMode("")).toBe("hybrid");
    expect(normalizeKnowledgeRetrievalMode("shadow")).toBe("shadow");
    expect(normalizeKnowledgeRetrievalMode("LEGACY")).toBe("legacy");
    expect(normalizeKnowledgeRetrievalMode("unknown-mode")).toBe("hybrid");
  });

  test("legacy mode prefers semantic matches and preserves score breakdown", () => {
    const legacyMatches = buildLegacyKnowledgeMatches({
      limit: 3,
      semanticMatches: [
        createItem({
          id: "semantic-1",
          sourceType: "workout_day",
          similarity: 0.91,
          content: "Progressive overload on bench press stalled.",
        }),
      ],
      textMatches: [
        createItem({
          id: "text-1",
          sourceType: "nutrition_day",
          similarity: 18,
          content: "Calories dropped below target.",
        }),
      ],
    });

    expect(legacyMatches).toHaveLength(1);
    expect(legacyMatches[0]?.id).toBe("semantic-1");
    expect(legacyMatches[0]?.vectorScore).toBe(0.91);
    expect(legacyMatches[0]?.textScore).toBeUndefined();
  });

  test("shadow mode keeps legacy ranking while exposing hybrid delta", () => {
    const semanticMatches = [
      createItem({
        id: "workout-day",
        sourceType: "workout_day",
        similarity: 0.9,
        content: "Heavy bench session with high RPE.",
      }),
    ];
    const textMatches = [
      createItem({
        id: "nutrition-day",
        sourceType: "nutrition_day",
        similarity: 14,
        content: "Protein intake stayed below target.",
      }),
    ];
    const hybridMatches = [
      createItem({
        id: "nutrition-day",
        sourceType: "nutrition_day",
        similarity: 0.77,
        fusedScore: 0.25,
        rerankScore: 0.77,
        content: "Protein intake stayed below target.",
      }),
      createItem({
        id: "workout-day",
        sourceType: "workout_day",
        similarity: 0.73,
        fusedScore: 0.21,
        rerankScore: 0.73,
        content: "Heavy bench session with high RPE.",
      }),
    ];

    const selection = selectKnowledgeRetrievalMatches({
      hybridMatches,
      limit: 2,
      mode: "shadow",
      semanticMatches,
      textMatches,
    });

    expect(selection.matches.map((item) => item.id)).toEqual(["workout-day"]);
    expect(selection.rollout.legacyIds).toEqual(["workout-day"]);
    expect(selection.rollout.hybridIds).toEqual([
      "nutrition-day",
      "workout-day",
    ]);
    expect(selection.rollout.rankingChanged).toBe(true);
    expect(selection.rollout.selectedMode).toBe("legacy");
  });

  test("hybrid mode falls back to legacy ranking when no hybrid matches exist", () => {
    const selection = selectKnowledgeRetrievalMatches({
      hybridMatches: [],
      limit: 2,
      mode: "hybrid",
      semanticMatches: [],
      textMatches: [
        createItem({
          id: "text-1",
          sourceType: "nutrition_day",
          similarity: 15,
          content: "Meal log with low calories.",
        }),
      ],
    });

    expect(selection.matches.map((item) => item.id)).toEqual(["text-1"]);
    expect(selection.rollout.fallbackToLegacy).toBe(true);
    expect(selection.rollout.selectedMode).toBe("legacy");
  });
});
