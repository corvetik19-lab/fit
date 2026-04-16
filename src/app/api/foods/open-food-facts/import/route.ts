import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { type NutritionFood } from "@/lib/nutrition/meal-logging";
import {
  buildFoodCreateData,
  buildFoodUpdateData,
} from "@/lib/nutrition/nutrition-self-service";
import {
  lookupOpenFoodFactsProduct,
  openFoodFactsBarcodePattern,
} from "@/lib/nutrition/open-food-facts";
import { withTransientRetry } from "@/lib/runtime-retry";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerUserOrNull } from "@/lib/supabase/server-user";

const payloadSchema = z.object({
  barcode: z.string().trim().regex(openFoodFactsBarcodePattern),
});

const foodSelect =
  "id, name, brand, source, kcal, protein, fat, carbs, barcode, image_url, ingredients_text, quantity, serving_size, created_at, updated_at";

function buildImportedFoodPayload(
  userId: string,
  product: Awaited<ReturnType<typeof lookupOpenFoodFactsProduct>>,
) {
  if (!product) {
    return null;
  }

  return buildFoodCreateData(userId, {
    name: product.name,
    brand: product.brand,
    source: "open_food_facts",
    kcal: Math.max(0, Math.round(product.kcal ?? 0)),
    protein: Math.max(0, product.protein ?? 0),
    fat: Math.max(0, product.fat ?? 0),
    carbs: Math.max(0, product.carbs ?? 0),
    barcode: product.barcode,
    image_url: product.imageUrl,
    ingredients_text: product.ingredientsText,
    quantity: product.quantity,
    serving_size: product.servingSize,
  });
}

export async function POST(request: Request) {
  try {
    const authSupabase = await createServerSupabaseClient();
    const user = await readServerUserOrNull(authSupabase, request);

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы импортировать продукт по штрихкоду.",
      });
    }

    const { barcode } = payloadSchema.parse(await request.json());
    const writeSupabase = createAdminSupabaseClient();
    const existingFoodsByBarcode = await withTransientRetry(
      async () => {
        const { data, error } = await writeSupabase
          .from("foods")
          .select(foodSelect)
          .eq("user_id", user.id)
          .eq("barcode", barcode)
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
    const existingFoodByBarcode = existingFoodsByBarcode[0] ?? null;

    if (existingFoodByBarcode) {
      return Response.json({
        data: existingFoodByBarcode,
        meta: {
          existed: true,
          imported: false,
          source: existingFoodByBarcode.source,
        },
      });
    }

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
        code: "FOOD_IMPORT_NOT_FOUND",
        message: "Продукт с таким штрихкодом не найден в Open Food Facts.",
      });
    }

    const existingFoods = await withTransientRetry(
      async () => {
        const { data, error } = await writeSupabase
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

    const existingFood = existingFoods[0] ?? null;

    if (existingFood?.source === "open_food_facts") {
      const data = await withTransientRetry(
        async () => {
          const { data: updatedFood, error } = await writeSupabase
            .from("foods")
            .update(
              buildFoodUpdateData({
                name: product.name,
                brand: product.brand,
                kcal: Math.max(0, Math.round(product.kcal ?? 0)),
                protein: Math.max(0, product.protein ?? 0),
                fat: Math.max(0, product.fat ?? 0),
                carbs: Math.max(0, product.carbs ?? 0),
                barcode: product.barcode,
                image_url: product.imageUrl,
                ingredients_text: product.ingredientsText,
                quantity: product.quantity,
                serving_size: product.servingSize,
              }),
            )
            .eq("id", existingFood.id)
            .eq("user_id", user.id)
            .select(foodSelect)
            .single();

          if (error) {
            throw error;
          }

          return updatedFood as NutritionFood;
        },
        {
          attempts: 4,
          delaysMs: [500, 1_500, 3_000],
        },
      );

      return Response.json({
        data,
        meta: {
          existed: true,
          imported: true,
          source: "open_food_facts",
        },
      });
    }

    if (existingFood) {
      return Response.json({
        data: existingFood,
        meta: {
          existed: true,
          imported: false,
          source: existingFood.source,
        },
      });
    }

    const importPayload = buildImportedFoodPayload(user.id, product);

    if (!importPayload) {
      return createApiErrorResponse({
        status: 502,
        code: "FOOD_IMPORT_INVALID",
        message: "Не удалось нормализовать продукт из Open Food Facts.",
      });
    }

    const data = await withTransientRetry(
      async () => {
        const { data: insertedFood, error } = await writeSupabase
          .from("foods")
          .insert(importPayload)
          .select(foodSelect)
          .single();

        if (error) {
          throw error;
        }

        return insertedFood as NutritionFood;
      },
      {
        attempts: 4,
        delaysMs: [500, 1_500, 3_000],
      },
    );

    return Response.json({
      data,
      meta: {
        existed: false,
        imported: true,
        source: "open_food_facts",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "FOOD_IMPORT_INVALID",
        message: "Штрихкод продукта заполнен некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("open food facts import route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "FOOD_IMPORT_FAILED",
      message: "Не удалось импортировать продукт из Open Food Facts.",
    });
  }
}
