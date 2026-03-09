import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { recalculateDailyNutritionSummary } from "@/lib/nutrition/meal-logging";
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
        message: "Войди в аккаунт, чтобы сохранять приёмы пищи.",
      });
    }

    const payload = mealCreateSchema.parse(await request.json());
    const uniqueFoodIds = [...new Set(payload.items.map((item) => item.foodId))];
    const { data: foods, error: foodsError } = await supabase
      .from("foods")
      .select("id, name, kcal, protein, fat, carbs")
      .eq("user_id", user.id)
      .in("id", uniqueFoodIds);

    if (foodsError) {
      throw foodsError;
    }

    const foodsById = new Map((foods ?? []).map((food) => [food.id, food]));

    if (foodsById.size !== uniqueFoodIds.length) {
      return createApiErrorResponse({
        status: 400,
        code: "MEAL_CREATE_MISSING_FOOD",
        message: "Один или несколько продуктов не найдены.",
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

    const mealItemsPayload = payload.items.map((item) => {
      const food = foodsById.get(item.foodId);

      if (!food) {
        throw new Error(`Food ${item.foodId} was not found during insert.`);
      }

      return {
        user_id: user.id,
        meal_id: meal.id,
        food_id: food.id,
        food_name_snapshot: food.name,
        servings: Number(item.servings.toFixed(2)),
        kcal: Math.round(Number(food.kcal ?? 0) * item.servings),
        protein: Number((Number(food.protein ?? 0) * item.servings).toFixed(2)),
        fat: Number((Number(food.fat ?? 0) * item.servings).toFixed(2)),
        carbs: Number((Number(food.carbs ?? 0) * item.servings).toFixed(2)),
      };
    });

    const { error: mealItemsError } = await supabase
      .from("meal_items")
      .insert(mealItemsPayload);

    if (mealItemsError) {
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
