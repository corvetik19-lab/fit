import {
  isExactLookupToken,
  normalizeTextForSearch,
  tokenizeSearchQuery,
  type RetrievedKnowledgeItem,
} from "@/lib/ai/knowledge-model";

import { KNOWLEDGE_RETRIEVAL_LIMITS } from "@/lib/ai/knowledge-retrieval-config";

type RankedKnowledgeCandidate = {
  content: string;
  fusedScore: number;
  id: string;
  matchedTerms: string[];
  metadata: Record<string, unknown>;
  rerankScore: number;
  sourceId: string | null;
  sourceKind: string;
  sourceType: string;
  textRank: number | null;
  textScore: number | null;
  vectorRank: number | null;
  vectorScore: number | null;
};

const SOURCE_PRIORS: Record<string, number> = {
  structured: 0.08,
  workout: 0.06,
  nutrition: 0.05,
  memory: 0.04,
  profile: 0.03,
  fallback: 0.01,
};

const RECENCY_METADATA_KEYS = [
  "generatedAt",
  "updatedAt",
  "summaryDate",
  "measuredAt",
  "createdAt",
  "eatenAt",
  "weekEndDate",
  "weekStartDate",
];

function reciprocalRank(rank: number | null) {
  if (!rank) {
    return 0;
  }

  return 1 / (40 + rank);
}

function roundScore(value: number) {
  return Number(value.toFixed(6));
}

function resolveSourceKind(sourceType: string) {
  if (
    sourceType.startsWith("workout_") ||
    sourceType === "weekly_program" ||
    sourceType === "exercise_history"
  ) {
    return "workout";
  }

  if (
    sourceType.startsWith("nutrition_") ||
    sourceType === "meal_log" ||
    sourceType === "meal_photo_analysis"
  ) {
    return "nutrition";
  }

  if (
    sourceType.startsWith("structured_") ||
    sourceType === "context_snapshot" ||
    sourceType === "user_memory"
  ) {
    return sourceType.startsWith("structured_") ? "structured" : "memory";
  }

  if (
    sourceType === "user_profile" ||
    sourceType === "body_metrics_overview" ||
    sourceType === "body_metric_entry"
  ) {
    return "profile";
  }

  if (sourceType === "fallback_context") {
    return "fallback";
  }

  return "general";
}

function extractRecencyBoost(metadata: Record<string, unknown>) {
  for (const key of RECENCY_METADATA_KEYS) {
    const rawValue = metadata[key];

    if (typeof rawValue !== "string" || !rawValue.trim()) {
      continue;
    }

    const timestamp = Date.parse(rawValue);
    if (!Number.isFinite(timestamp)) {
      continue;
    }

    const ageInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);

    if (ageInDays <= 7) {
      return 0.05;
    }

    if (ageInDays <= 30) {
      return 0.03;
    }

    if (ageInDays <= 90) {
      return 0.015;
    }

    return 0;
  }

  return 0;
}

function buildMatchedTerms(queryTokens: string[], content: string, sourceType: string) {
  if (!queryTokens.length) {
    return [];
  }

  const haystack = normalizeTextForSearch(`${sourceType} ${content}`);
  return queryTokens.filter((token) => haystack.includes(token)).slice(0, 6);
}

function buildRerankScore({
  candidate,
  normalizedQuery,
  queryTokens,
}: {
  candidate: RankedKnowledgeCandidate;
  normalizedQuery: string;
  queryTokens: string[];
}) {
  const haystack = normalizeTextForSearch(
    `${candidate.sourceType} ${candidate.sourceId ?? ""} ${candidate.content}`,
  );
  const exactBoost =
    normalizedQuery && haystack.includes(normalizedQuery) ? 0.1 : 0;
  const exactLookupBoost = candidate.matchedTerms.some((term) =>
    isExactLookupToken(term),
  )
    ? 0.24
    : 0;
  const termCoverageBoost = queryTokens.length
    ? (candidate.matchedTerms.length / queryTokens.length) * 0.12
    : 0;
  const dualSignalBoost =
    candidate.vectorRank !== null && candidate.textRank !== null ? 0.04 : 0;
  const sourcePriorBoost = SOURCE_PRIORS[candidate.sourceKind] ?? 0.02;
  const recencyBoost = extractRecencyBoost(candidate.metadata);

  return roundScore(
    candidate.fusedScore +
      exactBoost +
      exactLookupBoost +
      termCoverageBoost +
      dualSignalBoost +
      sourcePriorBoost +
      recencyBoost,
  );
}

export function buildHybridKnowledgeMatches({
  limit,
  query,
  textMatches,
  vectorMatches,
}: {
  limit: number;
  query: string;
  textMatches: RetrievedKnowledgeItem[];
  vectorMatches: RetrievedKnowledgeItem[];
}) {
  const finalLimit = Math.min(
    Math.max(1, Math.trunc(limit)),
    KNOWLEDGE_RETRIEVAL_LIMITS.finalContext,
  );
  const queryTokens = tokenizeSearchQuery(query);
  const normalizedQuery = normalizeTextForSearch(query).trim();
  const candidates = new Map<string, RankedKnowledgeCandidate>();

  for (const [index, item] of vectorMatches.entries()) {
    const current = candidates.get(item.id);
    const sourceKind = resolveSourceKind(item.sourceType);
    const matchedTerms = buildMatchedTerms(queryTokens, item.content, item.sourceType);

    candidates.set(item.id, {
      content: item.content,
      fusedScore: current?.fusedScore ?? 0,
      id: item.id,
      matchedTerms: current?.matchedTerms.length ? current.matchedTerms : matchedTerms,
      metadata: item.metadata,
      rerankScore: current?.rerankScore ?? 0,
      sourceId: item.sourceId,
      sourceKind,
      sourceType: item.sourceType,
      textRank: current?.textRank ?? null,
      textScore: current?.textScore ?? null,
      vectorRank: index + 1,
      vectorScore: item.vectorScore ?? item.similarity,
    });
  }

  for (const [index, item] of textMatches.entries()) {
    const current = candidates.get(item.id);
    const sourceKind = current?.sourceKind ?? resolveSourceKind(item.sourceType);
    const matchedTerms =
      current?.matchedTerms.length
        ? current.matchedTerms
        : buildMatchedTerms(queryTokens, item.content, item.sourceType);

    candidates.set(item.id, {
      content: item.content,
      fusedScore: current?.fusedScore ?? 0,
      id: item.id,
      matchedTerms,
      metadata: item.metadata,
      rerankScore: current?.rerankScore ?? 0,
      sourceId: item.sourceId,
      sourceKind,
      sourceType: item.sourceType,
      textRank: index + 1,
      textScore: item.textScore ?? item.similarity,
      vectorRank: current?.vectorRank ?? null,
      vectorScore: current?.vectorScore ?? null,
    });
  }

  const fusedCandidates = [...candidates.values()]
    .map((candidate) => ({
      ...candidate,
      fusedScore: roundScore(
        reciprocalRank(candidate.vectorRank) + reciprocalRank(candidate.textRank),
      ),
    }))
    .sort((left, right) => right.fusedScore - left.fusedScore)
    .slice(0, KNOWLEDGE_RETRIEVAL_LIMITS.fusedCandidates)
    .map((candidate) => ({
      ...candidate,
      rerankScore: buildRerankScore({
        candidate,
        normalizedQuery,
        queryTokens,
      }),
    }))
    .sort((left, right) => {
      if (right.rerankScore !== left.rerankScore) {
        return right.rerankScore - left.rerankScore;
      }

      return right.fusedScore - left.fusedScore;
    });

  return fusedCandidates.slice(0, finalLimit).map(
    (candidate): RetrievedKnowledgeItem => ({
      content: candidate.content,
      fusedScore: candidate.fusedScore,
      id: candidate.id,
      matchedTerms: candidate.matchedTerms,
      metadata: candidate.metadata,
      rerankScore: candidate.rerankScore,
      similarity: candidate.rerankScore,
      sourceId: candidate.sourceId,
      sourceKind: candidate.sourceKind,
      sourceType: candidate.sourceType,
      textScore: candidate.textScore,
      vectorScore: candidate.vectorScore,
    }),
  );
}
