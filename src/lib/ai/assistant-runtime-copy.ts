import { isAiProviderConfigurationFailure } from "@/lib/ai/runtime-errors";

export const AI_ASSISTANT_NOT_CONFIGURED_MESSAGE =
  "Сервис ИИ временно недоступен. Контур ассистента ещё не настроен.";
export const AI_ASSISTANT_UNAUTHORIZED_MESSAGE =
  "Нужно войти в аккаунт, чтобы открыть ИИ-ассистента.";
export const AI_ASSISTANT_EMPTY_MESSAGE =
  "Для ответа нужен текстовый запрос.";
export const AI_ASSISTANT_INVALID_PAYLOAD_MESSAGE =
  "Запрос к ассистенту заполнен некорректно.";

export const AI_ASSISTANT_GUARDRAIL_STREAM_SYSTEM =
  "Ответь кратко, строго по-русски, без markdown, не раскрывай внутренние детали и не добавляй ничего сверх смысла сообщения.";
export const AI_ASSISTANT_RISKY_STREAM_SYSTEM =
  "Повтори ответ кратко и безопасно на русском языке, без лишних деталей.";

export const AI_ASSISTANT_TOOL_DESCRIPTIONS = {
  applyProposal:
    "Применить уже созданное AI-предложение в приложение.",
  approveProposal:
    "Подтвердить уже созданное AI-предложение.",
  createMealPlan:
    "Создать черновик плана питания внутри приложения.",
  createWorkoutPlan:
    "Создать черновик недельной программы тренировок внутри приложения.",
  listRecentProposals:
    "Показать последние AI-черновики и уже подтверждённые предложения.",
  searchWeb:
    "Найти свежую спортивную, нутриционную или восстановительную информацию в интернете и вернуть короткую подборку ссылок.",
} as const;

export function buildAssistantSafetyFallback() {
  return [
    "Я не помогаю с опасными или экстремальными схемами.",
    "Если вопрос касается жёсткого дефицита, обезвоживания, боли, резкого ухудшения самочувствия или других медицинских симптомов, лучше обратиться к врачу.",
    "Я могу помочь собрать более безопасный план по тренировкам, питанию и восстановлению.",
  ].join(" ");
}

export function buildAssistantStreamErrorMessage(error: unknown) {
  return isAiProviderConfigurationFailure(error)
    ? "Сервис ИИ временно недоступен. Провайдер не активирован для ассистента и живых ответов."
    : "Сервис ИИ временно не ответил. Попробуй ещё раз немного позже.";
}

export function buildAssistantSearchWebSummary(input: {
  query: string;
  results: Array<{ title: string; url: string }>;
}) {
  return `Поиск в интернете по запросу "${input.query}": ${input.results
    .slice(0, 4)
    .map((result) => `${result.title} (${result.url})`)
    .join("; ")}`;
}

export function buildAssistantProposalListSummary(input: {
  count: number;
  items: Array<{
    proposalType: "meal_plan" | "workout_plan";
    status: string;
    title: string;
  }>;
}) {
  return `Найдено AI-предложений: ${input.count}. ${input.items
    .slice(0, 4)
    .map((item) => `${item.title} [${item.proposalType}/${item.status}]`)
    .join(" | ")}`;
}

export function buildAssistantProposalActionSummary(input: {
  status: string;
  summary: string;
  title: string;
}) {
  return `${input.title}. Статус: ${input.status}. ${input.summary}`;
}

export function buildAssistantMealPlanDescription(input: {
  caloriesTarget: number;
  mealsCount: number;
}) {
  return `Цель ${input.caloriesTarget} ккал, ${input.mealsCount} приёмов пищи.`;
}

export function buildAssistantWorkoutPlanApplyLabel() {
  return "Добавить в тренировки";
}

export function buildAssistantMealPlanApplyLabel() {
  return "Добавить в питание";
}

export function buildAssistantFeatureUnavailableMessage(feature: "meal" | "workout" | "proposal") {
  switch (feature) {
    case "meal":
      return "План питания сейчас недоступен для текущего доступа.";
    case "workout":
      return "План тренировок сейчас недоступен для текущего доступа.";
    case "proposal":
      return "Это предложение сейчас недоступно для текущего доступа.";
    default:
      return "Функция сейчас недоступна для текущего доступа.";
  }
}

export function buildAssistantApprovedProposalSummary() {
  return "Черновик подтверждён и готов к применению.";
}

export function buildAssistantAppliedProposalSummary(
  proposalType: "meal_plan" | "workout_plan",
) {
  return proposalType === "meal_plan"
    ? "План применён: шаблоны питания уже добавлены в приложение."
    : "План применён: создан новый недельный черновик тренировок.";
}
