import { z } from "zod";

import { deleteAiChatSession, isAiChatSessionError } from "@/lib/ai/chat";
import {
  AI_CHAT_SESSION_DELETE_AUTH_MESSAGE,
  AI_CHAT_SESSION_DELETE_FAILED_MESSAGE,
  AI_CHAT_SESSION_INVALID_ID_MESSAGE,
  getAiSessionRouteContext,
} from "@/lib/ai/session-route-helpers";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const authContext = await getAiSessionRouteContext();

    if (!authContext) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: AI_CHAT_SESSION_DELETE_AUTH_MESSAGE,
      });
    }

    const { id } = paramsSchema.parse(await context.params);

    await deleteAiChatSession(authContext.supabase, authContext.user.id, id);

    return Response.json({ data: { deleted: true, sessionId: id } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_CHAT_SESSION_INVALID",
        message: AI_CHAT_SESSION_INVALID_ID_MESSAGE,
        details: error.flatten(),
      });
    }

    if (isAiChatSessionError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    logger.error("delete ai chat session route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "AI_CHAT_SESSION_DELETE_FAILED",
      message: AI_CHAT_SESSION_DELETE_FAILED_MESSAGE,
    });
  }
}
