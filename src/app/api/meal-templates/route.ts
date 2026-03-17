import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const mealTemplateCreateSchema = z.object({
  title: z.string().trim().min(2).max(120),
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
        message: "Нужно войти в аккаунт, чтобы сохранять шаблоны питания.",
      });
    }

    const payload = mealTemplateCreateSchema.parse(await request.json());
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
        code: "MEAL_TEMPLATE_CREATE_MISSING_FOOD",
        message: "Один или несколько продуктов шаблона не найдены.",
      });
    }

    const templateItems = payload.items.map((item) => {
      const food = foodsById.get(item.foodId);

      if (!food) {
        throw new Error(`Food ${item.foodId} was not found during template insert.`);
      }

      return {
        foodId: food.id,
        foodNameSnapshot: food.name,
        servings: Number(item.servings.toFixed(2)),
        kcal: Math.round(Number(food.kcal ?? 0) * item.servings),
        protein: Number((Number(food.protein ?? 0) * item.servings).toFixed(2)),
        fat: Number((Number(food.fat ?? 0) * item.servings).toFixed(2)),
        carbs: Number((Number(food.carbs ?? 0) * item.servings).toFixed(2)),
      };
    });

    const { data, error } = await supabase
      .from("meal_templates")
      .insert({
        user_id: user.id,
        title: payload.title,
        payload: {
          source: "manual_draft",
          items: templateItems,
        },
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ data });
  } catch (error) {
    logger.error("meal template create route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "MEAL_TEMPLATE_CREATE_INVALID",
        message: "Данные шаблона питания заполнены некорректно.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "MEAL_TEMPLATE_CREATE_FAILED",
      message: "Не удалось сохранить шаблон питания.",
    });
  }
}
