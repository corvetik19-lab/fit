import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { hasAiGatewayEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { hasRiskyIntent } from "@/lib/safety";

export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as {
      messages?: Array<Omit<UIMessage, "id">>;
    };

    if (!hasAiGatewayEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_GATEWAY_NOT_CONFIGURED",
        message: "AI Gateway env is missing.",
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
        message: "messages payload is required.",
      });
    }

    if (hasRiskyIntent(lastText)) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_SAFETY_BLOCK",
        message:
          "The requested guidance crosses the current safety envelope for the app.",
      });
    }

    const result = streamText({
      model: "google/gemini-3.1-pro-preview",
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
      message: "Unable to process chat request.",
    });
  }
}
