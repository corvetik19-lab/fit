import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import {
  buildNutritionItemSnapshots,
  buildRecipeItemInsertPayload,
  getMissingNutritionFoodIds,
  loadOwnedNutritionFoods,
} from "@/lib/nutrition/nutrition-write-model";
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
        message: "Нужно войти в аккаунт, чтобы сохранять рецепты.",
      });
    }

    const payload = recipeCreateSchema.parse(await request.json());
    const { foodsById, uniqueFoodIds } = await loadOwnedNutritionFoods(
      supabase,
      user.id,
      payload.items,
    );
    const missingFoodIds = getMissingNutritionFoodIds(uniqueFoodIds, foodsById);

    if (missingFoodIds.length) {
      return createApiErrorResponse({
        status: 400,
        code: "RECIPE_CREATE_MISSING_FOOD",
        message: "Один или несколько продуктов для рецепта не найдены.",
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

    const itemSnapshots = buildNutritionItemSnapshots(payload.items, foodsById);
    const recipeItemsPayload = buildRecipeItemInsertPayload(
      user.id,
      recipe.id,
      itemSnapshots,
    );

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
