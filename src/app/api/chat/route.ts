import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { models } from "@/lib/ai/gateway";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { hasAiRuntimeEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { hasRiskyIntent } from "@/lib/safety";

export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as {
      messages?: Array<Omit<UIMessage, "id">>;
    };

    if (!hasAiRuntimeEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_RUNTIME_NOT_CONFIGURED",
        message: "ИИ-контур сейчас не настроен для этого чата.",
      });
    }

    const lastMessage = messages?.at(-1);
    const lastText =
      lastMessage?.parts
        ?.flatMap((part) => (part.type === "text" ? [part.text] : []))
        .join(" ")
        .trim() ?? "";

    if (!messages?.length || !lastText) {
      return createApiErrorResponse({
        status: 400,
        code: "CHAT_PAYLOAD_INVALID",
        message: "Для ответа нужен текстовый запрос.",
      });
    }

    if (hasRiskyIntent(lastText)) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_SAFETY_BLOCK",
        message: "Этот запрос выходит за безопасный контур приложения.",
      });
    }

    const result = streamText({
      model: models.chat,
      system:
        "You are fit AI. Help with workouts and nutrition. Stay non-medical, cite tradeoffs, and propose rather than auto-commit.",
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    logger.error("chat route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "CHAT_ROUTE_FAILED",
      message: "Не удалось обработать запрос к чату.",
    });
  }
}
