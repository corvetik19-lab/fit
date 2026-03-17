import { z } from "zod";

import { createAiChatSession, deleteAllAiChatSessions } from "@/lib/ai/chat";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const createSessionSchema = z.object({
  titleSeed: z.string().trim().min(1).max(240).optional(),
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

export async function POST(request: Request) {
  try {
    const context = await getAuthenticatedContext();

    if (!context) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы создать новый AI-чат.",
      });
    }

    const body = createSessionSchema.parse(
      await request.json().catch(() => ({})),
    );
    const session = await createAiChatSession(
      context.supabase,
      context.user.id,
      body.titleSeed ?? "Новый чат",
    );

    return Response.json({ data: { session } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_CHAT_SESSION_INVALID",
        message: "Параметры нового AI-чата заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("create ai chat session route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "AI_CHAT_SESSION_CREATE_FAILED",
      message: "Не удалось создать новый AI-чат.",
    });
  }
}

export async function DELETE() {
  try {
    const context = await getAuthenticatedContext();

    if (!context) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы очистить историю чатов с ИИ.",
      });
    }

    await deleteAllAiChatSessions(context.supabase, context.user.id);

    return Response.json({ data: { cleared: true } });
  } catch (error) {
    logger.error("delete all ai chat sessions route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "AI_CHAT_HISTORY_CLEAR_FAILED",
      message: "Не удалось очистить историю чатов с ИИ.",
    });
  }
}
