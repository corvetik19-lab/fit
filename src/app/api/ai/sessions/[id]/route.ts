import { z } from "zod";

import { deleteAiChatSession, isAiChatSessionError } from "@/lib/ai/chat";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const paramsSchema = z.object({
  id: z.string().uuid(),
});

async function getAuthenticatedContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return { supabase, user };
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const authContext = await getAuthenticatedContext();

    if (!authContext) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Sign in before deleting an AI chat.",
      });
    }

    const { id } = paramsSchema.parse(await context.params);

    await deleteAiChatSession(authContext.supabase, authContext.user.id, id);

    return Response.json({ data: { deleted: true, sessionId: id } });
  } catch (error) {
    logger.error("delete ai chat session route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_CHAT_SESSION_INVALID",
        message: "Некорректный идентификатор AI-чата.",
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

    return createApiErrorResponse({
      status: 500,
      code: "AI_CHAT_SESSION_DELETE_FAILED",
      message: "Unable to delete the selected AI chat.",
    });
  }
}
