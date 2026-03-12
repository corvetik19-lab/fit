export const AI_EVAL_SUITES = [
  "all",
  "assistant",
  "retrieval",
  "meal_plan",
  "workout_plan",
  "safety",
  "tool_calls",
] as const;

export type AiEvalSuite = (typeof AI_EVAL_SUITES)[number];

export const AI_EVAL_SUITE_LABELS: Record<AiEvalSuite, string> = {
  all: "Полный прогон",
  assistant: "AI-ассистент",
  retrieval: "История и поиск контекста",
  meal_plan: "Планы питания",
  workout_plan: "Тренировочные планы",
  safety: "Безопасность и приватность",
  tool_calls: "Инструменты и сценарии действий",
};

export function getAiEvalSuiteLabel(value: string | null | undefined) {
  if (!value) {
    return AI_EVAL_SUITE_LABELS.all;
  }

  return AI_EVAL_SUITE_LABELS[value as AiEvalSuite] ?? value;
}
