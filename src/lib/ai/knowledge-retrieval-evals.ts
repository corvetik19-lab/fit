import {
  RETRIEVAL_EVAL_TOPICS,
  type RetrievalEvalTopic,
} from "@/lib/ai/eval-suites";

export type RetrievalEvalCase = {
  id: string;
  query: string;
  relevantIds: string[];
  topic: RetrievalEvalTopic;
};

export type RetrievalEvalMetrics = {
  ndcgAt10: number;
  recallAt10: number;
  recallAt5: number;
};

function roundMetric(value: number) {
  return Number(value.toFixed(4));
}

export function calculateRecallAtK(
  relevantIds: string[],
  rankedIds: string[],
  k: number,
) {
  if (!relevantIds.length) {
    return 1;
  }

  const relevantSet = new Set(relevantIds);
  const topK = rankedIds.slice(0, k);
  const matched = topK.filter((id) => relevantSet.has(id)).length;

  return roundMetric(matched / relevantSet.size);
}

function calculateDcgAtK(relevantIds: string[], rankedIds: string[], k: number) {
  const relevantSet = new Set(relevantIds);

  return rankedIds.slice(0, k).reduce((sum, id, index) => {
    if (!relevantSet.has(id)) {
      return sum;
    }

    return sum + 1 / Math.log2(index + 2);
  }, 0);
}

export function calculateNdcgAtK(
  relevantIds: string[],
  rankedIds: string[],
  k: number,
) {
  if (!relevantIds.length) {
    return 1;
  }

  const idealRanking = relevantIds.slice(0, k);
  const idealDcg = calculateDcgAtK(relevantIds, idealRanking, k);

  if (idealDcg === 0) {
    return 0;
  }

  return roundMetric(calculateDcgAtK(relevantIds, rankedIds, k) / idealDcg);
}

export function scoreRetrievalEvalCase(
  evalCase: RetrievalEvalCase,
  rankedIds: string[],
): RetrievalEvalMetrics {
  return {
    ndcgAt10: calculateNdcgAtK(evalCase.relevantIds, rankedIds, 10),
    recallAt10: calculateRecallAtK(evalCase.relevantIds, rankedIds, 10),
    recallAt5: calculateRecallAtK(evalCase.relevantIds, rankedIds, 5),
  };
}

export function groupRetrievalEvalCasesByTopic(cases: RetrievalEvalCase[]) {
  return RETRIEVAL_EVAL_TOPICS.reduce(
    (accumulator, topic) => {
      accumulator[topic] = cases.filter((entry) => entry.topic === topic);
      return accumulator;
    },
    {} as Record<RetrievalEvalTopic, RetrievalEvalCase[]>,
  );
}
