import { gateway } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { hasOpenRouterEnv, serverEnv } from "@/lib/env";

const DEFAULT_CHAT_MODEL = "google/gemini-3.1-pro-preview";
const DEFAULT_VISION_MODEL = "google/gemini-3.1-pro-preview";
const DEFAULT_GATEWAY_EMBEDDING_MODEL = "voyage/voyage-3-large";
const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_VOYAGE_EMBEDDING_MODEL = "voyage-3-large";

const openRouter = hasOpenRouterEnv()
  ? createOpenAICompatible({
      apiKey: serverEnv.OPENROUTER_API_KEY,
      baseURL: serverEnv.OPENROUTER_BASE_URL ?? DEFAULT_OPENROUTER_BASE_URL,
      headers: {
        ...(serverEnv.OPENROUTER_SITE_URL
          ? { "HTTP-Referer": serverEnv.OPENROUTER_SITE_URL }
          : {}),
        ...(serverEnv.OPENROUTER_APP_NAME
          ? { "X-Title": serverEnv.OPENROUTER_APP_NAME }
          : {}),
      },
      includeUsage: true,
      name: "openrouter",
      supportsStructuredOutputs: true,
    })
  : null;

export const models = {
  chat: openRouter
    ? openRouter(serverEnv.OPENROUTER_CHAT_MODEL ?? DEFAULT_CHAT_MODEL)
    : gateway(DEFAULT_CHAT_MODEL),
  vision: openRouter
    ? openRouter(serverEnv.OPENROUTER_VISION_MODEL ?? DEFAULT_VISION_MODEL)
    : gateway(serverEnv.OPENROUTER_VISION_MODEL ?? DEFAULT_VISION_MODEL),
  embeddings: DEFAULT_GATEWAY_EMBEDDING_MODEL,
};

export const aiProviders = {
  chat: openRouter ? "openrouter" : "gateway",
  embeddings: serverEnv.VOYAGE_API_KEY ? "voyage" : "gateway",
};

export const defaultModels = {
  chat: serverEnv.OPENROUTER_CHAT_MODEL ?? DEFAULT_CHAT_MODEL,
  vision: serverEnv.OPENROUTER_VISION_MODEL ?? DEFAULT_VISION_MODEL,
  gatewayEmbeddings: DEFAULT_GATEWAY_EMBEDDING_MODEL,
  voyageEmbeddings: serverEnv.VOYAGE_EMBEDDING_MODEL ?? DEFAULT_VOYAGE_EMBEDDING_MODEL,
};
