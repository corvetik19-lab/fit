import { isAiProviderConfigurationFailure } from "@/lib/ai/runtime-errors";

export const AI_CHAT_NOT_CONFIGURED_MESSAGE =
  "Сервис ИИ временно недоступен. Контур чата ещё не настроен.";
export const AI_CHAT_UNAUTHORIZED_MESSAGE =
  "Нужно войти в аккаунт, чтобы открыть чат с ИИ.";
export const AI_CHAT_INVALID_PAYLOAD_MESSAGE =
  "Запрос к чату с ИИ заполнен некорректно.";

const AI_CHAT_PROVIDER_MESSAGE =
  "Сервис ИИ временно недоступен. Провайдер не активирован для чата и живых ответов.";
const AI_CHAT_RUNTIME_MESSAGE =
  "Сервис ИИ временно не ответил. Попробуй ещё раз немного позже.";

export function buildAiChatSafetyFallback() {
  return [
    "Я не помогаю с опасными или экстремальными рекомендациями.",
    "Если вопрос касается сильного дефицита, обезвоживания, выраженной боли или медицинских симптомов, безопаснее получить очную консультацию врача.",
    "Я могу помочь только с более безопасным и реалистичным планом по тренировкам, питанию и восстановлению.",
  ].join(" ");
}

export function buildAiChatProviderErrorMessage(error: unknown) {
  return isAiProviderConfigurationFailure(error)
    ? AI_CHAT_PROVIDER_MESSAGE
    : AI_CHAT_RUNTIME_MESSAGE;
}
