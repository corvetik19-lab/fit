import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { buildFoodCreateData } from "@/lib/nutrition/nutrition-self-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const foodCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  kcal: z.number().int().min(0).max(5000),
  protein: z.number().min(0).max(500),
  fat: z.number().min(0).max(500),
  carbs: z.number().min(0).max(500),
  barcode: z.string().trim().max(64).nullable().optional(),
});

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы загрузить продукты.",
      });
    }

    const { data, error } = await supabase
      .from("foods")
      .select(
        "id, name, brand, source, kcal, protein, fat, carbs, barcode, image_url, ingredients_text, quantity, serving_size, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return Response.json({ data: data ?? [] });
  } catch (error) {
    logger.error("foods list route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "FOODS_LIST_FAILED",
      message: "Не удалось загрузить список продуктов.",
    });
  }
}

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
        message: "Нужно войти в аккаунт, чтобы добавлять продукты.",
      });
    }

    const payload = foodCreateSchema.parse(await request.json());

    const { data, error } = await supabase
      .from("foods")
      .insert(buildFoodCreateData(user.id, payload))
      .select(
        "id, name, brand, source, kcal, protein, fat, carbs, barcode, image_url, ingredients_text, quantity, serving_size, created_at, updated_at",
      )
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "FOOD_CREATE_INVALID",
        message: "Данные продукта заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("food create route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "FOOD_CREATE_FAILED",
      message: "Не удалось создать продукт.",
    });
  }
}
