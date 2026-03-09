import { gateway } from "ai";

export const models = {
  chat: gateway("google/gemini-3.1-pro-preview"),
  embeddings: "voyage/voyage-4-large",
};
