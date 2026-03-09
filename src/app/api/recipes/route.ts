import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const recipeCreateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  instructions: z.string().trim().max(2000).nullable().optional(),
  servings: z.number().positive().max(50),
  items: z
    .array(
      z.object({
        foodId: z.string().uuid(),
        servings: z.number().positive().max(20),
      }),
    )
    .min(1)
    .max(30),
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
        message: "Войди в аккаунт, чтобы сохранять рецепты.",
      });
    }

    const payload = recipeCreateSchema.parse(await request.json());
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
        code: "RECIPE_CREATE_MISSING_FOOD",
        message: "Один или несколько продуктов рецепта не найдены.",
      });
    }

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        title: payload.title,
        instructions: payload.instructions?.trim() || null,
        servings: Number(payload.servings.toFixed(2)),
      })
      .select("id")
      .single();

    if (recipeError) {
      throw recipeError;
    }

    const recipeItemsPayload = payload.items.map((item) => {
      const food = foodsById.get(item.foodId);

      if (!food) {
        throw new Error(`Food ${item.foodId} was not found during recipe insert.`);
      }

      return {
        user_id: user.id,
        recipe_id: recipe.id,
        food_id: food.id,
        food_name_snapshot: food.name,
        servings: Number(item.servings.toFixed(2)),
        kcal: Math.round(Number(food.kcal ?? 0) * item.servings),
        protein: Number((Number(food.protein ?? 0) * item.servings).toFixed(2)),
        fat: Number((Number(food.fat ?? 0) * item.servings).toFixed(2)),
        carbs: Number((Number(food.carbs ?? 0) * item.servings).toFixed(2)),
      };
    });

    const { error: recipeItemsError } = await supabase
      .from("recipe_items")
      .insert(recipeItemsPayload);

    if (recipeItemsError) {
      await supabase.from("recipes").delete().eq("id", recipe.id).eq("user_id", user.id);
      throw recipeItemsError;
    }

    return Response.json({ data: { id: recipe.id } });
  } catch (error) {
    logger.error("recipe create route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "RECIPE_CREATE_INVALID",
        message: "Данные рецепта заполнены некорректно.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "RECIPE_CREATE_FAILED",
      message: "Не удалось сохранить рецепт.",
    });
  }
}
