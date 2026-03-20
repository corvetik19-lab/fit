import { z } from "zod";

import { createAiChatSession, deleteAllAiChatSessions } from "@/lib/ai/chat";
import {
  AI_CHAT_NEW_SESSION_TITLE,
  AI_CHAT_SESSION_CLEAR_AUTH_MESSAGE,
  AI_CHAT_SESSION_CLEAR_FAILED_MESSAGE,
  AI_CHAT_SESSION_CREATE_AUTH_MESSAGE,
  AI_CHAT_SESSION_CREATE_FAILED_MESSAGE,
  AI_CHAT_SESSION_INVALID_CREATE_MESSAGE,
  getAiSessionRouteContext,
} from "@/lib/ai/session-route-helpers";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";

const createSessionSchema = z.object({
  titleSeed: z.string().trim().min(1).max(240).optional(),
});

export async function POST(request: Request) {
  try {
    const context = await getAiSessionRouteContext();

    if (!context) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: AI_CHAT_SESSION_CREATE_AUTH_MESSAGE,
      });
    }

    const body = createSessionSchema.parse(
      await request.json().catch(() => ({})),
    );
    const session = await createAiChatSession(
      context.supabase,
      context.user.id,
      body.titleSeed ?? AI_CHAT_NEW_SESSION_TITLE,
    );

    return Response.json({ data: { session } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_CHAT_SESSION_INVALID",
        message: AI_CHAT_SESSION_INVALID_CREATE_MESSAGE,
        details: error.flatten(),
      });
    }

    logger.error("create ai chat session route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "AI_CHAT_SESSION_CREATE_FAILED",
      message: AI_CHAT_SESSION_CREATE_FAILED_MESSAGE,
    });
  }
}

export async function DELETE() {
  try {
    const context = await getAiSessionRouteContext();

    if (!context) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: AI_CHAT_SESSION_CLEAR_AUTH_MESSAGE,
      });
    }

    await deleteAllAiChatSessions(context.supabase, context.user.id);

    return Response.json({ data: { cleared: true } });
  } catch (error) {
    logger.error("delete all ai chat sessions route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "AI_CHAT_HISTORY_CLEAR_FAILED",
      message: AI_CHAT_SESSION_CLEAR_FAILED_MESSAGE,
    });
  }
}
