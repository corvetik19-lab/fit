import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { recalculateDailyNutritionSummary } from "@/lib/nutrition/meal-logging";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const mealDeleteSchema = z.object({
  summaryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
        message: "Войди в аккаунт, чтобы удалять приёмы пищи.",
      });
    }

    const payload = mealDeleteSchema.parse(await request.json());
    const { id } = await params;
    const { data: meal, error: mealLookupError } = await supabase
      .from("meals")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (mealLookupError) {
      throw mealLookupError;
    }

    if (!meal) {
      return createApiErrorResponse({
        status: 404,
        code: "MEAL_NOT_FOUND",
        message: "Приём пищи не найден.",
      });
    }

    const { error: deleteError } = await supabase
      .from("meals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      throw deleteError;
    }

    const summary = await recalculateDailyNutritionSummary(
      supabase,
      user.id,
      payload.summaryDate,
    );

    return Response.json({ data: { summary } });
  } catch (error) {
    logger.error("meal delete route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "MEAL_DELETE_INVALID",
        message: "Некорректные данные для удаления приёма пищи.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "MEAL_DELETE_FAILED",
      message: "Не удалось удалить приём пищи.",
    });
  }
}
