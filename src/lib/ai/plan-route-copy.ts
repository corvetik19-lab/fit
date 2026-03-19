import { isAiProviderConfigurationFailure } from "@/lib/ai/runtime-errors";

type AiPlanKind = "meal" | "workout";

const PLAN_LABELS: Record<AiPlanKind, string> = {
  meal: "плана питания",
  workout: "тренировочного плана",
};

const AI_PLAN_AUTH_MESSAGES: Record<AiPlanKind, string> = {
  meal: "Нужно войти в аккаунт, чтобы генерировать планы питания через AI.",
  workout:
    "Нужно войти в аккаунт, чтобы генерировать тренировочные планы через AI.",
};

const AI_PLAN_NOT_CONFIGURED_MESSAGES: Record<AiPlanKind, string> = {
  meal: "AI-контур для планов питания пока не настроен.",
  workout: "AI-контур для тренировочных планов пока не настроен.",
};

const AI_PLAN_INVALID_MESSAGES: Record<AiPlanKind, string> = {
  meal: "Параметры плана питания заполнены некорректно.",
  workout: "Параметры тренировочного плана заполнены некорректно.",
};

const AI_PLAN_FAILED_MESSAGES: Record<AiPlanKind, string> = {
  meal: "Не удалось сгенерировать предложение плана питания.",
  workout: "Не удалось сгенерировать предложение тренировочного плана.",
};

const AI_PLAN_PROVIDER_MESSAGES: Record<AiPlanKind, string> = {
  meal: "Сервис AI временно недоступен. Провайдер не активирован для генерации планов питания.",
  workout:
    "Сервис AI временно недоступен. Провайдер не активирован для генерации тренировочных планов.",
};

export const AI_MEAL_PLAN_SAFETY_MESSAGE =
  "Комментарий к плану питания вышел за безопасный контур приложения.";

export function getAiPlanAuthMessage(kind: AiPlanKind) {
  return AI_PLAN_AUTH_MESSAGES[kind];
}

export function getAiPlanNotConfiguredMessage(kind: AiPlanKind) {
  return AI_PLAN_NOT_CONFIGURED_MESSAGES[kind];
}

export function getAiPlanInvalidMessage(kind: AiPlanKind) {
  return AI_PLAN_INVALID_MESSAGES[kind];
}

export function getAiPlanFailedMessage(kind: AiPlanKind) {
  return AI_PLAN_FAILED_MESSAGES[kind];
}

export function buildAiPlanProviderErrorMessage(
  kind: AiPlanKind,
  error: unknown,
) {
  return isAiProviderConfigurationFailure(error)
    ? AI_PLAN_PROVIDER_MESSAGES[kind]
    : getAiPlanFailedMessage(kind);
}

export function getAiPlanLabel(kind: AiPlanKind) {
  return PLAN_LABELS[kind];
}
