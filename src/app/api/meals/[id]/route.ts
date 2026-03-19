import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { deleteOwnedMealAndRecalculateSummary } from "@/lib/nutrition/nutrition-self-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const mealDeleteSchema = z.object({
  summaryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы удалять приёмы пищи.",
      });
    }

    const payload = mealDeleteSchema.parse(await request.json());
    const { id } = paramsSchema.parse(await params);
    const result = await deleteOwnedMealAndRecalculateSummary(
      supabase,
      user.id,
      id,
      payload.summaryDate,
    );

    if (!result) {
      return createApiErrorResponse({
        status: 404,
        code: "MEAL_NOT_FOUND",
        message: "Приём пищи не найден.",
      });
    }

    return Response.json({ data: { summary: result.summary } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "MEAL_DELETE_INVALID",
        message: "Данные для удаления приёма пищи заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("meal delete route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "MEAL_DELETE_FAILED",
      message: "Не удалось удалить приём пищи.",
    });
  }
}
