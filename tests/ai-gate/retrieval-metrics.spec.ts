import { expect, test } from "@playwright/test";

import {
  calculateNdcgAtK,
  calculateRecallAtK,
  groupRetrievalEvalCasesByTopic,
  scoreRetrievalEvalCase,
  type RetrievalEvalCase,
} from "@/lib/ai/knowledge-retrieval-evals";

test.describe("retrieval metrics", () => {
  test("computes Recall@K and nDCG@K for ranked results", () => {
    const relevantIds = ["chunk-a", "chunk-b"];
    const rankedIds = ["chunk-a", "chunk-x", "chunk-b", "chunk-y"];

    expect(calculateRecallAtK(relevantIds, rankedIds, 1)).toBe(0.5);
    expect(calculateRecallAtK(relevantIds, rankedIds, 3)).toBe(1);
    expect(calculateNdcgAtK(relevantIds, rankedIds, 3)).toBeGreaterThan(0.9);
  });

  test("groups retrieval eval cases by topic and scores a case", () => {
    const cases: RetrievalEvalCase[] = [
      {
        id: "case-workout",
        query: "почему застой в жиме",
        relevantIds: ["workout-1"],
        topic: "workouts",
      },
      {
        id: "case-nutrition",
        query: "почему не добираю белок",
        relevantIds: ["nutrition-1", "nutrition-2"],
        topic: "nutrition",
      },
    ];

    const grouped = groupRetrievalEvalCasesByTopic(cases);

    expect(grouped.workouts).toHaveLength(1);
    expect(grouped.nutrition).toHaveLength(1);
    expect(grouped.profile).toHaveLength(0);

    const metrics = scoreRetrievalEvalCase(cases[1]!, [
      "nutrition-2",
      "noise",
      "nutrition-1",
    ]);

    expect(metrics.recallAt10).toBe(1);
    expect(metrics.recallAt5).toBe(1);
    expect(metrics.ndcgAt10).toBeGreaterThan(0.9);
  });
});
