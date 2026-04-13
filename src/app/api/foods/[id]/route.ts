import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { optionalImageUrlSchema } from "@/lib/image-url";
import { logger } from "@/lib/logger";
import {
  buildFoodUpdateData,
  deleteOwnedNutritionEntity,
} from "@/lib/nutrition/nutrition-self-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const foodUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  kcal: z.number().int().min(0).max(5000).optional(),
  protein: z.number().min(0).max(500).optional(),
  fat: z.number().min(0).max(500).optional(),
  carbs: z.number().min(0).max(500).optional(),
  barcode: z.string().trim().max(64).nullable().optional(),
  imageUrl: optionalImageUrlSchema,
});

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const foodSelect =
  "id, name, brand, source, kcal, protein, fat, carbs, barcode, image_url, ingredients_text, quantity, serving_size, created_at, updated_at";

export async function PATCH(
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
        message: "Нужно войти в аккаунт, чтобы редактировать продукты.",
      });
    }

    const payload = foodUpdateSchema.parse(await request.json());
    const { id } = paramsSchema.parse(await params);
    const updateData = buildFoodUpdateData({
      name: payload.name,
      kcal: payload.kcal,
      protein: payload.protein,
      fat: payload.fat,
      carbs: payload.carbs,
      barcode: payload.barcode,
      image_url: payload.imageUrl,
    });

    if (!Object.keys(updateData).length) {
      return createApiErrorResponse({
        status: 400,
        code: "FOOD_UPDATE_EMPTY",
        message: "Нет изменений для сохранения.",
      });
    }

    const { data, error } = await supabase
      .from("foods")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(foodSelect)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return createApiErrorResponse({
        status: 404,
        code: "FOOD_NOT_FOUND",
        message: "Продукт не найден.",
      });
    }

    return Response.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "FOOD_UPDATE_INVALID",
        message: "Данные продукта или параметры маршрута заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("food update route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "FOOD_UPDATE_FAILED",
      message: "Не удалось обновить продукт.",
    });
  }
}

export async function DELETE(
  _request: Request,
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
        message: "Нужно войти в аккаунт, чтобы удалять продукты.",
      });
    }

    const { id } = paramsSchema.parse(await params);
    const data = await deleteOwnedNutritionEntity(supabase, "foods", user.id, id);

    if (!data) {
      return createApiErrorResponse({
        status: 404,
        code: "FOOD_NOT_FOUND",
        message: "Продукт не найден.",
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "FOOD_DELETE_INVALID",
        message: "Идентификатор продукта заполнен некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("food delete route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "FOOD_DELETE_FAILED",
      message: "Не удалось удалить продукт.",
    });
  }
}
