import { ZodError, z } from "zod";

import { mealPhotoAnalysisSchema } from "@/lib/ai/schemas";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { recalculateDailyNutritionSummary } from "@/lib/nutrition/meal-logging";
import {
  buildMealItemInsertPayload,
  type NutritionItemSnapshot,
} from "@/lib/nutrition/nutrition-write-model";
import { buildFoodCreateData } from "@/lib/nutrition/nutrition-self-service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const NUTRITION_CAPTURE_BUCKET = "nutrition-captures";

const payloadSchema = z.object({
  analysis: mealPhotoAnalysisSchema,
  mode: z.enum(["food", "meal"]).default("food"),
  notes: z.string().trim().max(600).nullable().optional(),
});

const foodSelect =
  "id, name, brand, source, kcal, protein, fat, carbs, barcode, image_url, ingredients_text, quantity, serving_size, created_at, updated_at";

function buildIngredientsText(
  analysis: z.infer<typeof mealPhotoAnalysisSchema>,
  notes: string | null | undefined,
) {
  const composition = analysis.items
    .map((item) => `${item.name} — ${item.portion}`)
    .join(", ");

  if (notes) {
    return `${analysis.summary}\n\nСостав на фото: ${composition}\n\nКонтекст: ${notes}`;
  }

  return `${analysis.summary}\n\nСостав на фото: ${composition}`;
}

async function uploadNutritionCaptureImage(userId: string, image: File) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    const extension =
      image.name.split(".").pop()?.trim().toLowerCase() ||
      image.type.split("/").pop()?.trim().toLowerCase() ||
      "jpg";
    const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";
    const storagePath = `${userId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${safeExtension}`;
    const imageBytes = await image.arrayBuffer();

    const { error: uploadError } = await adminSupabase.storage
      .from(NUTRITION_CAPTURE_BUCKET)
      .upload(storagePath, imageBytes, {
        cacheControl: "3600",
        contentType: image.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = adminSupabase.storage.from(NUTRITION_CAPTURE_BUCKET).getPublicUrl(storagePath);

    return {
      publicUrl,
      storagePath,
    };
  } catch (error) {
    logger.warn("nutrition photo import image upload skipped", { error });
    return null;
  }
}

async function removeNutritionCaptureImage(storagePath: string) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    await adminSupabase.storage.from(NUTRITION_CAPTURE_BUCKET).remove([storagePath]);
  } catch (error) {
    logger.warn("nutrition photo import image cleanup failed", { error, storagePath });
  }
}

export async function POST(request: Request) {
  let uploadedImagePath: string | null = null;
  let createdFoodId: string | null = null;
  let shouldRollbackFood = false;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы сохранять продукты с камеры.",
      });
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const rawAnalysis = formData.get("analysis");
    const rawMode = formData.get("mode");
    const rawNotes = formData.get("notes");

    if (!(image instanceof File)) {
      return createApiErrorResponse({
        status: 400,
        code: "NUTRITION_PHOTO_IMPORT_IMAGE_REQUIRED",
        message: "Сначала добавь фото, которое нужно сохранить в питание.",
      });
    }

    if (!image.type.startsWith("image/")) {
      return createApiErrorResponse({
        status: 400,
        code: "NUTRITION_PHOTO_IMPORT_IMAGE_INVALID",
        message: "В import photo flow можно передавать только изображение.",
      });
    }

    if (image.size > MAX_IMAGE_BYTES) {
      return createApiErrorResponse({
        status: 400,
        code: "NUTRITION_PHOTO_IMPORT_TOO_LARGE",
        message: "Файл слишком большой. Используй изображение до 8 МБ.",
      });
    }

    if (typeof rawAnalysis !== "string") {
      return createApiErrorResponse({
        status: 400,
        code: "NUTRITION_PHOTO_IMPORT_INVALID",
        message: "Не удалось прочитать результат AI-анализа фото.",
      });
    }

    const payload = payloadSchema.parse({
      analysis: JSON.parse(rawAnalysis),
      mode: typeof rawMode === "string" ? rawMode : undefined,
      notes: typeof rawNotes === "string" ? rawNotes : undefined,
    });

    const uploadedImage = await uploadNutritionCaptureImage(user.id, image);
    uploadedImagePath = uploadedImage?.storagePath ?? null;
    const eatenAt = new Date().toISOString();
    const summaryDate = eatenAt.slice(0, 10);

    const { data: food, error: foodError } = await supabase
      .from("foods")
      .insert(
        buildFoodCreateData(user.id, {
          name: payload.analysis.title,
          source: "ai_photo",
          kcal: payload.analysis.estimatedKcal,
          protein: payload.analysis.macros.protein,
          fat: payload.analysis.macros.fat,
          carbs: payload.analysis.macros.carbs,
          image_url: uploadedImage?.publicUrl ?? null,
          ingredients_text: buildIngredientsText(payload.analysis, payload.notes),
          serving_size: "1 порция",
        }),
      )
      .select(foodSelect)
      .single();

    if (foodError) {
      throw foodError;
    }

    createdFoodId = food.id;

    if (payload.mode === "food") {
      return Response.json({
        data: {
          food,
        },
        meta: {
          addedToMeal: false,
          imageStored: Boolean(uploadedImage?.publicUrl),
        },
      });
    }

    shouldRollbackFood = true;

    const { data: meal, error: mealError } = await supabase
      .from("meals")
      .insert({
        eaten_at: eatenAt,
        source: "manual",
        user_id: user.id,
      })
      .select("id, eaten_at")
      .single();

    if (mealError) {
      throw mealError;
    }

    const itemSnapshots: NutritionItemSnapshot[] = [
      {
        carbs: food.carbs,
        fat: food.fat,
        foodId: food.id,
        foodNameSnapshot: food.name,
        kcal: food.kcal,
        protein: food.protein,
        servings: 1,
      },
    ];

    const { error: mealItemsError } = await supabase
      .from("meal_items")
      .insert(buildMealItemInsertPayload(user.id, meal.id, itemSnapshots));

    if (mealItemsError) {
      await supabase.from("meals").delete().eq("id", meal.id).eq("user_id", user.id);
      throw mealItemsError;
    }

    const summary = await recalculateDailyNutritionSummary(
      supabase,
      user.id,
      summaryDate,
    );

    return Response.json({
      data: {
        food,
        meal,
        summary,
      },
      meta: {
        addedToMeal: true,
        imageStored: Boolean(uploadedImage?.publicUrl),
      },
    });
  } catch (error) {
    if (shouldRollbackFood && createdFoodId) {
      try {
        const rollbackSupabase = await createServerSupabaseClient();
        const {
          data: { user },
        } = await rollbackSupabase.auth.getUser();

        if (user) {
          await rollbackSupabase
            .from("foods")
            .delete()
            .eq("id", createdFoodId)
            .eq("user_id", user.id);
        }
      } catch (rollbackError) {
        logger.warn("nutrition photo import food rollback failed", {
          createdFoodId,
          error: rollbackError,
        });
      }
    }

    if (uploadedImagePath) {
      await removeNutritionCaptureImage(uploadedImagePath);
    }

    if (error instanceof SyntaxError || error instanceof ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "NUTRITION_PHOTO_IMPORT_INVALID",
        message: "Данные photo import заполнены некорректно.",
        details: error instanceof ZodError ? error.flatten() : undefined,
      });
    }

    logger.error("nutrition photo import route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "NUTRITION_PHOTO_IMPORT_FAILED",
      message: "Не удалось сохранить результат фотоанализа в питание.",
    });
  }
}
