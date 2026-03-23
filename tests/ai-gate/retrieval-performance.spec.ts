import { expect, test } from "@playwright/test";

import { buildHybridKnowledgeMatches } from "@/lib/ai/knowledge-hybrid-ranking";
import { summarizeRetrievalLatencySamples } from "@/lib/ai/knowledge-retrieval-performance";
import { selectKnowledgeRetrievalMatches } from "@/lib/ai/knowledge-retrieval-rollout";
import type { RetrievedKnowledgeItem } from "@/lib/ai/knowledge-model";

function createItem(
  id: string,
  sourceType: string,
  similarity: number,
  content: string,
  metadata: Record<string, unknown>,
): RetrievedKnowledgeItem {
  return {
    content,
    id,
    metadata,
    similarity,
    sourceId: id,
    sourceType,
  };
}

test.describe("retrieval performance baseline", () => {
  test("hybrid ranking stays within the deterministic latency budget", () => {
    const vectorMatches = Array.from({ length: 30 }, (_, index) =>
      createItem(
        `vector-${index}`,
        "workout_day",
        0.92 - index * 0.01,
        `Workout chunk ${index} with bench press, RPE and recovery notes.`,
        {
          updatedAt: new Date(Date.now() - index * 86_400_000).toISOString(),
        },
      ),
    );
    const textMatches = Array.from({ length: 30 }, (_, index) =>
      createItem(
        `text-${index}`,
        "nutrition_day",
        24 - index,
        `Nutrition chunk ${index} with calories, protein and recovery.`,
        {
          summaryDate: new Date(Date.now() - index * 86_400_000).toISOString(),
        },
      ),
    );
    const samples: number[] = [];

    for (let iteration = 0; iteration < 250; iteration += 1) {
      const startedAt = performance.now();
      const hybridMatches = buildHybridKnowledgeMatches({
        limit: 8,
        query: "bench press recovery calories protein history",
        textMatches,
        vectorMatches,
      });

      selectKnowledgeRetrievalMatches({
        hybridMatches,
        limit: 8,
        mode: "hybrid",
        semanticMatches: vectorMatches,
        textMatches,
      });

      samples.push(performance.now() - startedAt);
    }

    const summary = summarizeRetrievalLatencySamples(samples);
    console.log("retrieval deterministic latency baseline", summary);

    expect(summary.sampleSize).toBe(250);
    expect(summary.p95Ms).toBeLessThan(25);
    expect(summary.maxMs).toBeLessThan(50);
  });
});
