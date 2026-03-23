import { expect, test } from "@playwright/test";

import { createKnowledgeRetrievalTelemetry } from "@/lib/ai/knowledge-retrieval-telemetry";
import type { KnowledgeRetrievalSelection } from "@/lib/ai/knowledge-retrieval-rollout";

const rollout: KnowledgeRetrievalSelection["rollout"] = {
  fallbackToLegacy: false,
  hybridIds: ["hybrid-1", "hybrid-2"],
  legacyIds: ["legacy-1", "legacy-2"],
  mode: "hybrid",
  rankingChanged: true,
  selectedIds: ["hybrid-1", "hybrid-2"],
  selectedMode: "hybrid",
  semanticCandidateCount: 12,
  textCandidateCount: 9,
};

test.describe("knowledge retrieval telemetry", () => {
  test("records step timings, candidate counts and rollout summary", async () => {
    const telemetry = createKnowledgeRetrievalTelemetry({
      limit: 8,
      mode: "hybrid",
      queryLength: 42,
    });

    await telemetry.measure("queryEmbeddingMs", async () => {
      await Promise.resolve();
    });
    await telemetry.measure("hybridRankMs", async () => {
      await Promise.resolve();
    });

    telemetry.setCandidateCounts({
      returned: 6,
      semantic: 12,
      text: 9,
    });
    telemetry.setRollout(rollout);

    const summary = telemetry.toSummary();

    expect(summary.mode).toBe("hybrid");
    expect(summary.limit).toBe(8);
    expect(summary.queryLength).toBe(42);
    expect(summary.candidateCounts).toEqual({
      returned: 6,
      semantic: 12,
      text: 9,
    });
    expect(summary.rollout).toEqual(rollout);
    expect(summary.steps.queryEmbeddingMs ?? 0).toBeGreaterThanOrEqual(0);
    expect(summary.steps.hybridRankMs ?? 0).toBeGreaterThanOrEqual(0);
  });
});
