import { createApiErrorResponse } from "@/lib/api/error-response";
import { deleteAiChatSession } from "@/lib/ai/chat";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

    const { id } = await context.params;

    if (!id?.trim()) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_CHAT_SESSION_INVALID",
        message: "Chat id is required.",
      });
    }

    await deleteAiChatSession(authContext.supabase, authContext.user.id, id);

    return Response.json({ data: { deleted: true, sessionId: id } });
  } catch (error) {
    logger.error("delete ai chat session route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "AI_CHAT_SESSION_DELETE_FAILED",
      message: "Unable to delete the selected AI chat.",
    });
  }
}
