export type RetrievalLatencySummary = {
  maxMs: number;
  meanMs: number;
  p50Ms: number;
  p95Ms: number;
  sampleSize: number;
};

function percentile(sortedSamples: number[], ratio: number) {
  if (!sortedSamples.length) {
    return 0;
  }

  const position = Math.min(
    sortedSamples.length - 1,
    Math.max(0, Math.ceil(sortedSamples.length * ratio) - 1),
  );
  return Number(sortedSamples[position]?.toFixed(4) ?? 0);
}

export function summarizeRetrievalLatencySamples(samples: number[]) {
  if (!samples.length) {
    return {
      maxMs: 0,
      meanMs: 0,
      p50Ms: 0,
      p95Ms: 0,
      sampleSize: 0,
    } satisfies RetrievalLatencySummary;
  }

  const sorted = [...samples].sort((left, right) => left - right);
  const mean =
    sorted.reduce((sum, value) => sum + value, 0) / sorted.length;

  return {
    maxMs: Number(sorted.at(-1)?.toFixed(4) ?? 0),
    meanMs: Number(mean.toFixed(4)),
    p50Ms: percentile(sorted, 0.5),
    p95Ms: percentile(sorted, 0.95),
    sampleSize: sorted.length,
  } satisfies RetrievalLatencySummary;
}
