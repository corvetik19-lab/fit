import { hasAiRetrievalTelemetryEnv } from "@/lib/env";

import type {
  KnowledgeRetrievalMode,
  KnowledgeRetrievalSelection,
} from "@/lib/ai/knowledge-retrieval-rollout";

const TELEMETRY_STEP_KEYS = [
  "indexRefreshMs",
  "queryEmbeddingMs",
  "semanticRpcMs",
  "semanticFallbackMs",
  "lexicalRpcMs",
  "lexicalFallbackMs",
  "hybridRankMs",
] as const;

type TelemetryStepKey = (typeof TELEMETRY_STEP_KEYS)[number];

type TelemetrySummary = {
  candidateCounts: {
    returned: number;
    semantic: number;
    text: number;
  };
  limit: number;
  mode: KnowledgeRetrievalMode;
  queryLength: number;
  rollout: KnowledgeRetrievalSelection["rollout"] | null;
  steps: Partial<Record<TelemetryStepKey, number>>;
};

function roundMilliseconds(value: number) {
  return Number(value.toFixed(2));
}

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function shouldLogKnowledgeRetrievalTelemetry(
  mode: KnowledgeRetrievalMode,
) {
  return hasAiRetrievalTelemetryEnv() || mode === "shadow";
}

export function createKnowledgeRetrievalTelemetry({
  limit,
  mode,
  queryLength,
}: {
  limit: number;
  mode: KnowledgeRetrievalMode;
  queryLength: number;
}) {
  const summary: TelemetrySummary = {
    candidateCounts: {
      returned: 0,
      semantic: 0,
      text: 0,
    },
    limit,
    mode,
    queryLength,
    rollout: null,
    steps: {},
  };

  return {
    async measure<T>(step: TelemetryStepKey, run: () => Promise<T>) {
      const startedAt = now();
      const result = await run();
      summary.steps[step] = roundMilliseconds(now() - startedAt);
      return result;
    },
    setCandidateCounts({
      returned,
      semantic,
      text,
    }: {
      returned: number;
      semantic: number;
      text: number;
    }) {
      summary.candidateCounts = { returned, semantic, text };
    },
    setRollout(rollout: KnowledgeRetrievalSelection["rollout"]) {
      summary.rollout = rollout;
    },
    toSummary() {
      return summary;
    },
  };
}
