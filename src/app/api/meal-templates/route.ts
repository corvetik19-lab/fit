import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import {
  buildMealTemplatePayloadItems,
  buildNutritionItemSnapshots,
  getMissingNutritionFoodIds,
  loadOwnedNutritionFoods,
} from "@/lib/nutrition/nutrition-write-model";
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
    const { foodsById, uniqueFoodIds } = await loadOwnedNutritionFoods(
      supabase,
      user.id,
      payload.items,
    );
    const missingFoodIds = getMissingNutritionFoodIds(uniqueFoodIds, foodsById);

    if (missingFoodIds.length) {
      return createApiErrorResponse({
        status: 400,
        code: "MEAL_TEMPLATE_CREATE_MISSING_FOOD",
        message: "Один или несколько продуктов для шаблона питания не найдены.",
      });
    }

    const itemSnapshots = buildNutritionItemSnapshots(payload.items, foodsById);
    const templateItems = buildMealTemplatePayloadItems(itemSnapshots);

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
