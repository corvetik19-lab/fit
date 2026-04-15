import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { withTransientRetry } from "@/lib/runtime-retry";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resetWorkoutDayExecution } from "@/lib/workout/execution";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withTransientRetry(async () => await supabase.auth.getUser());

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы сбросить прогресс тренировки.",
      });
    }

    const { id } = paramsSchema.parse(await params);
    const result = await resetWorkoutDayExecution(supabase, user.id, id);

    if (result.error) {
      return createApiErrorResponse(result.error);
    }

    return Response.json({ data: result.data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "WORKOUT_DAY_RESET_INVALID",
        message: "Параметры тренировочного дня заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("workout day reset route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "WORKOUT_DAY_RESET_FAILED",
      message: "Не удалось сбросить прогресс тренировки.",
    });
  }
}
