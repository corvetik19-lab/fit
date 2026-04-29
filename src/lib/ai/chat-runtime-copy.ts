import { isAiProviderConfigurationFailure } from "@/lib/ai/runtime-errors";

export const AI_CHAT_NOT_CONFIGURED_MESSAGE =
  "AI chat is temporarily unavailable. The chat runtime is not configured yet.";

export const AI_CHAT_UNAUTHORIZED_MESSAGE =
  "You need to sign in before opening the AI chat.";

export const AI_CHAT_INVALID_PAYLOAD_MESSAGE =
  "The AI chat request payload is invalid.";

const AI_CHAT_PROVIDER_MESSAGE =
  "AI chat is temporarily unavailable because the provider is not active for live responses.";

const AI_CHAT_RUNTIME_MESSAGE =
  "AI chat did not answer in time. Please try again in a moment.";

export function buildAiChatSafetyFallback() {
  return [
    "I cannot help with dangerous or extreme recommendations.",
    "If this is about severe restriction, dehydration, serious pain, or medical symptoms, the safer next step is an in-person medical consultation.",
    "I can still help with a safer and more realistic plan for training, nutrition, and recovery.",
  ].join(" ");
}

export function buildAiChatProviderErrorMessage(error: unknown) {
  return isAiProviderConfigurationFailure(error)
    ? AI_CHAT_PROVIDER_MESSAGE
    : AI_CHAT_RUNTIME_MESSAGE;
}
