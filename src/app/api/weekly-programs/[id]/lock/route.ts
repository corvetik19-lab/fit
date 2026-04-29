import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { withTransientRetry } from "@/lib/runtime-retry";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerUserOrNull } from "@/lib/supabase/server-user";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const WEEKLY_PROGRAM_LOCK_RETRY_CONFIG = {
  attempts: 4,
  delaysMs: [300, 800, 1_500, 2_500] as const,
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authSupabase = await createServerSupabaseClient();
    const user = await readServerUserOrNull(authSupabase, request);

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы зафиксировать недельную программу.",
      });
    }

    const dataSupabase = createAdminSupabaseClient();
    const { id } = paramsSchema.parse(await params);
    const { data: lockedProgram, error: lockedProgramError } =
      await withTransientRetry(
        async () =>
          await dataSupabase
            .from("weekly_programs")
            .update({
              is_locked: true,
              status: "active",
            })
            .eq("id", id)
            .eq("user_id", user.id)
            .eq("is_locked", false)
            .select(
              "id, title, status, is_locked, week_start_date, week_end_date, created_at",
            )
            .maybeSingle(),
        WEEKLY_PROGRAM_LOCK_RETRY_CONFIG,
      );

    if (lockedProgramError) {
      if (lockedProgramError.code === "23505") {
        return createApiErrorResponse({
          status: 409,
          code: "WEEKLY_PROGRAM_ACTIVE_WEEK_CONFLICT",
          message: "На эту неделю уже есть активная программа.",
        });
      }

      throw lockedProgramError;
    }

    if (lockedProgram) {
      return Response.json({
        data: lockedProgram,
      });
    }

    const { data: currentProgram, error: currentProgramError } =
      await withTransientRetry(
        async () =>
          await dataSupabase
            .from("weekly_programs")
            .select("id, is_locked")
            .eq("id", id)
            .eq("user_id", user.id)
            .maybeSingle(),
        WEEKLY_PROGRAM_LOCK_RETRY_CONFIG,
      );

    if (currentProgramError) {
      throw currentProgramError;
    }

    if (!currentProgram) {
      return createApiErrorResponse({
        status: 404,
        code: "WEEKLY_PROGRAM_NOT_FOUND",
        message: "Недельная программа не найдена.",
      });
    }

    if (currentProgram.is_locked) {
      return createApiErrorResponse({
        status: 400,
        code: "WEEKLY_PROGRAM_ALREADY_LOCKED",
        message: "Недельная программа уже зафиксирована.",
      });
    }

    return createApiErrorResponse({
      status: 409,
      code: "WEEKLY_PROGRAM_LOCK_CONFLICT",
      message:
        "Состояние программы изменилось во время запроса. Обнови экран и попробуй ещё раз.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "WEEKLY_PROGRAM_LOCK_INVALID",
        message: "Параметры недельной программы заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("weekly program lock route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "WEEKLY_PROGRAM_LOCK_FAILED",
      message: "Не удалось зафиксировать недельную программу.",
    });
  }
}
