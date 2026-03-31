import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { type NutritionFood } from "@/lib/nutrition/meal-logging";
import {
  lookupOpenFoodFactsProduct,
  openFoodFactsBarcodePattern,
} from "@/lib/nutrition/open-food-facts";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const paramsSchema = z.object({
  barcode: z.string().trim().regex(openFoodFactsBarcodePattern),
});

const foodSelect =
  "id, name, brand, source, kcal, protein, fat, carbs, barcode, image_url, ingredients_text, quantity, serving_size, created_at, updated_at";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ barcode: string }> },
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
        message: "Нужно войти в аккаунт, чтобы искать продукты по штрихкоду.",
      });
    }

    const { barcode } = paramsSchema.parse(await params);
    const product = await lookupOpenFoodFactsProduct(barcode);

    if (!product) {
      return createApiErrorResponse({
        status: 404,
        code: "FOOD_LOOKUP_NOT_FOUND",
        message: "Продукт с таким штрихкодом не найден в Open Food Facts.",
      });
    }

    const { data: existingFoods, error: existingFoodError } = await supabase
      .from("foods")
      .select(foodSelect)
      .eq("user_id", user.id)
      .eq("barcode", product.barcode)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (existingFoodError) {
      throw existingFoodError;
    }

    return Response.json({
      data: {
        existingFood: ((existingFoods ?? [])[0] as NutritionFood | undefined) ?? null,
        product,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "FOOD_LOOKUP_INVALID",
        message: "Штрихкод продукта заполнен некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("open food facts lookup route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "FOOD_LOOKUP_FAILED",
      message: "Не удалось получить продукт из Open Food Facts.",
    });
  }
}
