import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { recalculateDailyNutritionSummary } from "@/lib/nutrition/meal-logging";
import {
  buildMealItemInsertPayload,
  buildNutritionItemSnapshots,
  getMissingNutritionFoodIds,
  loadOwnedNutritionFoods,
} from "@/lib/nutrition/nutrition-write-model";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const mealCreateSchema = z.object({
  eatenAt: z.string().datetime({ offset: true }),
  summaryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z
    .array(
      z.object({
        foodId: z.string().uuid(),
        servings: z.number().positive().max(20),
      }),
    )
    .min(1)
    .max(20),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы сохранять приёмы пищи.",
      });
    }

    const payload = mealCreateSchema.parse(await request.json());
    const { foodsById, uniqueFoodIds } = await loadOwnedNutritionFoods(
      supabase,
      user.id,
      payload.items,
    );
    const missingFoodIds = getMissingNutritionFoodIds(uniqueFoodIds, foodsById);

    if (missingFoodIds.length) {
      return createApiErrorResponse({
        status: 400,
        code: "MEAL_CREATE_MISSING_FOOD",
        message: "Один или несколько продуктов для приёма пищи не найдены.",
      });
    }

    const { data: meal, error: mealError } = await supabase
      .from("meals")
      .insert({
        user_id: user.id,
        source: "manual",
        eaten_at: payload.eatenAt,
      })
      .select("id, eaten_at")
      .single();

    if (mealError) {
      throw mealError;
    }

    const itemSnapshots = buildNutritionItemSnapshots(payload.items, foodsById);
    const mealItemsPayload = buildMealItemInsertPayload(
      user.id,
      meal.id,
      itemSnapshots,
    );

    const { error: mealItemsError } = await supabase
      .from("meal_items")
      .insert(mealItemsPayload);

    if (mealItemsError) {
      await supabase.from("meals").delete().eq("id", meal.id).eq("user_id", user.id);
      throw mealItemsError;
    }

    const summary = await recalculateDailyNutritionSummary(
      supabase,
      user.id,
      payload.summaryDate,
    );

    return Response.json({
      data: {
        meal,
        summary,
      },
    });
  } catch (error) {
    logger.error("meal create route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "MEAL_CREATE_INVALID",
        message: "Данные приёма пищи заполнены некорректно.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "MEAL_CREATE_FAILED",
      message: "Не удалось сохранить приём пищи.",
    });
  }
}
