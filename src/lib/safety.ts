const riskPatterns = [
  /extreme calorie deficit/i,
  /medical diagnosis/i,
  /starve/i,
  /dangerous cut/i,
  /экстремальн(ый|ого)\s+дефицит/i,
  /поставь\s+диагноз/i,
  /голод(ать|ание)/i,
  /сушка\s+любой\s+ценой/i,
  /опасн(ая|ый)\s+нагрузк/i,
];

export function hasRiskyIntent(input: string) {
  return riskPatterns.some((pattern) => pattern.test(input));
}
