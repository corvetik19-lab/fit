import { createApiErrorResponse } from "@/lib/api/error-response";
import { deleteAllAiChatSessions } from "@/lib/ai/chat";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

export async function DELETE() {
  try {
    const context = await getAuthenticatedContext();

    if (!context) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Sign in before clearing AI chat history.",
      });
    }

    await deleteAllAiChatSessions(context.supabase, context.user.id);

    return Response.json({ data: { cleared: true } });
  } catch (error) {
    logger.error("delete all ai chat sessions route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "AI_CHAT_HISTORY_CLEAR_FAILED",
      message: "Unable to clear AI chat history.",
    });
  }
}
