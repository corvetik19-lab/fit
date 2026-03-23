import { getAiRetrievalMode } from "@/lib/env";

import {
  clampKnowledgeContextLimit,
  KNOWLEDGE_RETRIEVAL_LIMITS,
} from "@/lib/ai/knowledge-retrieval-config";
import type { RetrievedKnowledgeItem } from "@/lib/ai/knowledge-model";

export const KNOWLEDGE_RETRIEVAL_MODES = [
  "legacy",
  "hybrid",
  "shadow",
] as const;

export type KnowledgeRetrievalMode =
  (typeof KNOWLEDGE_RETRIEVAL_MODES)[number];

export type KnowledgeRetrievalSelection = {
  matches: RetrievedKnowledgeItem[];
  rollout: {
    fallbackToLegacy: boolean;
    hybridIds: string[];
    legacyIds: string[];
    mode: KnowledgeRetrievalMode;
    rankingChanged: boolean;
    selectedIds: string[];
    selectedMode: "legacy" | "hybrid";
    semanticCandidateCount: number;
    textCandidateCount: number;
  };
};

function withScoreBreakdown(
  item: RetrievedKnowledgeItem,
  scoreKey: "textScore" | "vectorScore",
) {
  return {
    ...item,
    [scoreKey]: item[scoreKey] ?? item.similarity,
  } satisfies RetrievedKnowledgeItem;
}

export function normalizeKnowledgeRetrievalMode(
  value: string | null | undefined,
): KnowledgeRetrievalMode {
  if (!value) {
    return "hybrid";
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "legacy") {
    return "legacy";
  }

  if (normalized === "shadow") {
    return "shadow";
  }

  return "hybrid";
}

export function resolveKnowledgeRetrievalMode() {
  return normalizeKnowledgeRetrievalMode(getAiRetrievalMode());
}

export function buildLegacyKnowledgeMatches({
  limit,
  semanticMatches,
  textMatches,
}: {
  limit: number;
  semanticMatches: RetrievedKnowledgeItem[];
  textMatches: RetrievedKnowledgeItem[];
}) {
  const finalLimit = clampKnowledgeContextLimit(limit);
  const semanticSelection = semanticMatches
    .slice(0, Math.max(finalLimit, KNOWLEDGE_RETRIEVAL_LIMITS.finalContext))
    .map((item) => withScoreBreakdown(item, "vectorScore"));

  if (semanticSelection.length) {
    return semanticSelection.slice(0, finalLimit);
  }

  return textMatches
    .slice(0, Math.max(finalLimit, KNOWLEDGE_RETRIEVAL_LIMITS.finalContext))
    .map((item) => withScoreBreakdown(item, "textScore"))
    .slice(0, finalLimit);
}

function listIds(items: RetrievedKnowledgeItem[]) {
  return items.map((item) => item.id);
}

export function selectKnowledgeRetrievalMatches({
  hybridMatches,
  limit,
  mode,
  semanticMatches,
  textMatches,
}: {
  hybridMatches: RetrievedKnowledgeItem[];
  limit: number;
  mode: KnowledgeRetrievalMode;
  semanticMatches: RetrievedKnowledgeItem[];
  textMatches: RetrievedKnowledgeItem[];
}): KnowledgeRetrievalSelection {
  const finalLimit = clampKnowledgeContextLimit(limit);
  const legacyMatches = buildLegacyKnowledgeMatches({
    limit: finalLimit,
    semanticMatches,
    textMatches,
  });
  const fallbackToLegacy = mode === "hybrid" && !hybridMatches.length;

  const matches =
    mode === "legacy" || mode === "shadow" || fallbackToLegacy
      ? legacyMatches
      : hybridMatches.slice(0, finalLimit);

  return {
    matches,
    rollout: {
      fallbackToLegacy,
      hybridIds: listIds(hybridMatches.slice(0, finalLimit)),
      legacyIds: listIds(legacyMatches),
      mode,
      rankingChanged:
        listIds(legacyMatches).join(",") !==
        listIds(hybridMatches.slice(0, finalLimit)).join(","),
      selectedIds: listIds(matches),
      selectedMode:
        mode === "hybrid" && !fallbackToLegacy ? "hybrid" : "legacy",
      semanticCandidateCount: semanticMatches.length,
      textCandidateCount: textMatches.length,
    },
  };
}
