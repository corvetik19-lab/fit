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

export const RETRIEVAL_EVAL_TOPICS = [
  "workouts",
  "nutrition",
  "profile",
  "plans",
  "recent_history",
] as const;

export type RetrievalEvalTopic = (typeof RETRIEVAL_EVAL_TOPICS)[number];

export const RETRIEVAL_EVAL_TOPIC_LABELS: Record<RetrievalEvalTopic, string> = {
  workouts: "Тренировки и нагрузка",
  nutrition: "Питание и КБЖУ",
  profile: "Профиль и цели",
  plans: "Черновики и планы",
  recent_history: "Недавняя история и динамика",
};

export function getAiEvalSuiteLabel(value: string | null | undefined) {
  if (!value) {
    return AI_EVAL_SUITE_LABELS.all;
  }

  return AI_EVAL_SUITE_LABELS[value as AiEvalSuite] ?? value;
}

export function getRetrievalEvalTopicLabel(value: string | null | undefined) {
  if (!value) {
    return RETRIEVAL_EVAL_TOPIC_LABELS.workouts;
  }

  return RETRIEVAL_EVAL_TOPIC_LABELS[value as RetrievalEvalTopic] ?? value;
}
