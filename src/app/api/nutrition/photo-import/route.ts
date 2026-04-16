import { createHash } from "node:crypto";

import { StorageClient } from "@supabase/storage-js";
import { ZodError, z } from "zod";

import { mealPhotoAnalysisSchema } from "@/lib/ai/schemas";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { publicEnv, serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { recalculateDailyNutritionSummary } from "@/lib/nutrition/meal-logging";
import {
  buildMealItemInsertPayload,
  type NutritionItemSnapshot,
} from "@/lib/nutrition/nutrition-write-model";
import { buildFoodCreateData } from "@/lib/nutrition/nutrition-self-service";
import { withTimeout, withTransientRetry } from "@/lib/runtime-retry";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerUserOrNull } from "@/lib/supabase/server-user";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const NUTRITION_CAPTURE_BUCKET = "nutrition-captures";
const INLINE_IMAGE_FALLBACK_MAX_BYTES = 1_500_000;
const NUTRITION_PHOTO_IMPORT_DB_TIMEOUT_MS = 25_000;

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
    .map((item) => `${item.name} - ${item.portion}`)
    .join(", ");

  if (notes) {
    return `${analysis.summary}\n\nСостав на фото: ${composition}\n\nКонтекст: ${notes}`;
  }

  return `${analysis.summary}\n\nСостав на фото: ${composition}`;
}

function createNutritionCaptureStorageClient() {
  if (
    !publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !serverEnv.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error("Missing Supabase storage upload environment variables.");
  }

  return new StorageClient(
    `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`,
    {
      Authorization: `Bearer ${serverEnv.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    },
    undefined,
    { useNewHostname: true },
  );
}

async function uploadNutritionCaptureImage(userId: string, image: File) {
  const imageBuffer = Buffer.from(await image.arrayBuffer());

  try {
    const storageClient = createNutritionCaptureStorageClient();
    const extension =
      image.name.split(".").pop()?.trim().toLowerCase() ||
      image.type.split("/").pop()?.trim().toLowerCase() ||
      "jpg";
    const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";
    const storagePath = `${userId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${safeExtension}`;

    await withTransientRetry(
      async () => {
        const { error } = await storageClient
          .from(NUTRITION_CAPTURE_BUCKET)
          .upload(storagePath, imageBuffer, {
            cacheControl: "3600",
            contentType: image.type,
            upsert: false,
          });

        if (error) {
          throw error;
        }
      },
      {
        attempts: 5,
        delaysMs: [800, 2_000, 4_000, 6_500],
      },
    );

    const {
      data: { publicUrl },
    } = storageClient.from(NUTRITION_CAPTURE_BUCKET).getPublicUrl(storagePath);

    return {
      publicUrl,
      storagePath,
    };
  } catch (error) {
    logger.warn("nutrition photo import image upload skipped", { error });

    if (
      image.type.startsWith("image/") &&
      imageBuffer.length <= INLINE_IMAGE_FALLBACK_MAX_BYTES
    ) {
      logger.warn("nutrition photo import is using inline image fallback", {
        imageBytes: imageBuffer.length,
        userId,
      });

      return {
        publicUrl: null,
        storagePath: null,
        previewUrl: `data:${image.type};base64,${imageBuffer.toString("base64")}`,
      };
    }

    return null;
  }
}

async function removeNutritionCaptureImage(storagePath: string) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    await adminSupabase.storage
      .from(NUTRITION_CAPTURE_BUCKET)
      .remove([storagePath]);
  } catch (error) {
    logger.warn("nutrition photo import image cleanup failed", {
      error,
      storagePath,
    });
  }
}

export async function POST(request: Request) {
  let authenticatedUserId: string | null = null;
  let uploadedImagePath: string | null = null;
  let createdFoodId: string | null = null;
  let createdMealId: string | null = null;
  let shouldRollbackFood = false;
  let persistenceCommitted = false;

  try {
    const authSupabase = await createServerSupabaseClient();
    const user = await readServerUserOrNull(authSupabase, request);

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message:
          "Нужно войти в аккаунт, чтобы сохранять продукты с камеры.",
      });
    }

    authenticatedUserId = user.id;
    const writeSupabase = createAdminSupabaseClient();

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
        message: "В photo import можно передавать только изображения.",
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

    const foodId = createdFoodId ?? crypto.randomUUID();
    createdFoodId = foodId;
    const food = await withTransientRetry(
      async () => {
        const { error } = await writeSupabase.from("foods").upsert(
          {
            id: foodId,
            ...buildFoodCreateData(user.id, {
              name: payload.analysis.title,
              source: "ai_photo",
              kcal: payload.analysis.estimatedKcal,
              protein: payload.analysis.macros.protein,
              fat: payload.analysis.macros.fat,
              carbs: payload.analysis.macros.carbs,
                image_url:
                  uploadedImage?.storagePath && uploadedImage.publicUrl
                    ? uploadedImage.publicUrl
                    : null,
                ingredients_text: buildIngredientsText(
                  payload.analysis,
                  payload.notes,
                ).slice(0, 900),
              serving_size: "1 порция",
            }),
          },
          {
            onConflict: "id",
          },
        );

        if (error) {
          throw error;
        }

        const { data, error: selectError } = await writeSupabase
          .from("foods")
          .select(foodSelect)
          .eq("id", foodId)
          .single();

        if (selectError) {
          throw selectError;
        }

        return data;
      },
      {
        attempts: 6,
        delaysMs: [500, 1_500, 3_000, 5_000, 8_000],
      },
    );

    if (payload.mode === "food") {
      persistenceCommitted = true;

      return Response.json({
        data: {
          food,
        },
        meta: {
          addedToMeal: false,
          imageStored: Boolean(uploadedImage?.publicUrl),
          imagePreviewUrl:
            uploadedImage?.publicUrl ?? uploadedImage?.previewUrl ?? null,
        },
      });
    }

    shouldRollbackFood = true;

    const mealId = createdMealId ?? crypto.randomUUID();
    createdMealId = mealId;
    const meal = await withTransientRetry(
      async () => {
        const { error } = await withTimeout(Promise.resolve(writeSupabase.from("meals").upsert(
          {
            id: mealId,
            eaten_at: eatenAt,
            source: "manual",
            user_id: user.id,
          },
          {
            onConflict: "id",
          },
        )), NUTRITION_PHOTO_IMPORT_DB_TIMEOUT_MS, "nutrition photo import meal upsert");

        if (error) {
          throw error;
        }

        const { data, error: selectError } = await withTimeout(Promise.resolve(writeSupabase
          .from("meals")
          .select("id, eaten_at")
          .eq("id", mealId)
          .single()), NUTRITION_PHOTO_IMPORT_DB_TIMEOUT_MS, "nutrition photo import meal select");

        if (selectError) {
          throw selectError;
        }

        return data;
      },
      {
        attempts: 6,
        delaysMs: [500, 1_500, 3_000, 5_000, 8_000],
      },
    );

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

    try {
      const mealItemPayload = buildMealItemInsertPayload(
        user.id,
        meal.id,
        itemSnapshots,
      ).map((item, index) => ({
        id: createHash("sha1")
          .update(`${meal.id}:${item.food_id}:${index}`)
          .digest("hex")
          .slice(0, 32)
          .replace(
            /(.{8})(.{4})(.{4})(.{4})(.{12})/,
            "$1-$2-$3-$4-$5",
          ),
        ...item,
      }));

      await withTransientRetry(
        async () => {
          const { error } = await withTimeout(Promise.resolve(writeSupabase
            .from("meal_items")
            .upsert(mealItemPayload, {
              onConflict: "id",
            })), NUTRITION_PHOTO_IMPORT_DB_TIMEOUT_MS, "nutrition photo import meal items upsert");

          if (error) {
            throw error;
          }
        },
        {
          attempts: 6,
          delaysMs: [500, 1_500, 3_000, 5_000, 8_000],
        },
      );
    } catch (mealItemsError) {
      await writeSupabase
        .from("meals")
        .delete()
        .eq("id", meal.id)
        .eq("user_id", user.id);
      createdMealId = null;
      throw mealItemsError;
    }

    persistenceCommitted = true;

    let summary = null;
    let summaryDeferred = false;

    try {
      summary = await withTransientRetry(
        async () =>
          await withTimeout(
            recalculateDailyNutritionSummary(
              writeSupabase,
              user.id,
              summaryDate,
            ),
            NUTRITION_PHOTO_IMPORT_DB_TIMEOUT_MS,
            "nutrition photo import summary recalculation",
          ),
        {
          attempts: 4,
          delaysMs: [500, 1_500, 3_000],
        },
      );
    } catch (summaryError) {
      summaryDeferred = true;
      logger.warn("nutrition photo import summary recalculation skipped", {
        error: summaryError,
        summaryDate,
        userId: user.id,
      });
    }

    return Response.json({
      data: {
        food,
        meal,
        summary,
      },
      meta: {
        addedToMeal: true,
        imageStored: Boolean(uploadedImage?.publicUrl),
        imagePreviewUrl:
          uploadedImage?.publicUrl ?? uploadedImage?.previewUrl ?? null,
        summaryDeferred,
      },
    });
  } catch (error) {
    if (!persistenceCommitted && createdMealId && authenticatedUserId) {
      try {
        const rollbackSupabase = createAdminSupabaseClient();
        await rollbackSupabase
          .from("meals")
          .delete()
          .eq("id", createdMealId)
          .eq("user_id", authenticatedUserId);
      } catch (rollbackError) {
        logger.warn("nutrition photo import meal rollback failed", {
          createdMealId,
          error: rollbackError,
        });
      }
    }

    if (
      !persistenceCommitted &&
      shouldRollbackFood &&
      createdFoodId &&
      authenticatedUserId
    ) {
      try {
        const rollbackSupabase = createAdminSupabaseClient();
        await rollbackSupabase
          .from("foods")
          .delete()
          .eq("id", createdFoodId)
          .eq("user_id", authenticatedUserId);
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
      message:
        "Не удалось сохранить результат фотоанализа в питание.",
    });
  }
}
