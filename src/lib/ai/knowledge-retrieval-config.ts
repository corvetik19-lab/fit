export const KNOWLEDGE_RETRIEVAL_LIMITS = {
  semanticCandidates: 30,
  lexicalCandidates: 30,
  fusedCandidates: 20,
  finalContext: 8,
} as const;

export function clampKnowledgeContextLimit(limit?: number) {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return KNOWLEDGE_RETRIEVAL_LIMITS.finalContext;
  }

  return Math.min(
    Math.max(1, Math.trunc(limit)),
    KNOWLEDGE_RETRIEVAL_LIMITS.finalContext,
  );
}
