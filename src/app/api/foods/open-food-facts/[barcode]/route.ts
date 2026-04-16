import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { type NutritionFood } from "@/lib/nutrition/meal-logging";
import {
  lookupOpenFoodFactsProduct,
  openFoodFactsBarcodePattern,
} from "@/lib/nutrition/open-food-facts";
import { withTransientRetry } from "@/lib/runtime-retry";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerUserOrNull } from "@/lib/supabase/server-user";

const paramsSchema = z.object({
  barcode: z.string().trim().regex(openFoodFactsBarcodePattern),
});

const foodSelect =
  "id, name, brand, source, kcal, protein, fat, carbs, barcode, image_url, ingredients_text, quantity, serving_size, created_at, updated_at";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ barcode: string }> },
) {
  try {
    const authSupabase = await createServerSupabaseClient();
    const user = await readServerUserOrNull(authSupabase, request);

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы искать продукты по штрихкоду.",
      });
    }

    const { barcode } = paramsSchema.parse(await params);
    const readSupabase = createAdminSupabaseClient();
    const product = await withTransientRetry(
      async () => await lookupOpenFoodFactsProduct(barcode),
      {
        attempts: 4,
        delaysMs: [800, 2_000, 4_000],
      },
    );

    if (!product) {
      return createApiErrorResponse({
        status: 404,
        code: "FOOD_LOOKUP_NOT_FOUND",
        message: "Продукт с таким штрихкодом не найден в Open Food Facts.",
      });
    }

    const existingFoods = await withTransientRetry(
      async () => {
        const { data, error } = await readSupabase
          .from("foods")
          .select(foodSelect)
          .eq("user_id", user.id)
          .eq("barcode", product.barcode)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (error) {
          throw error;
        }

        return (data ?? []) as NutritionFood[];
      },
      {
        attempts: 4,
        delaysMs: [500, 1_500, 3_000],
      },
    );

    return Response.json({
      data: {
        existingFood: existingFoods[0] ?? null,
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
