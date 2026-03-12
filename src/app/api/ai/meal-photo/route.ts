import { generateObject } from "ai";
import { ZodError } from "zod";

import { mealPhotoAnalysisSchema } from "@/lib/ai/schemas";
import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  BILLING_FEATURE_KEYS,
  createFeatureAccessDeniedResponse,
  incrementFeatureUsage,
  readUserBillingAccess,
} from "@/lib/billing-access";
import { models } from "@/lib/ai/gateway";
import { hasAiRuntimeEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { hasRiskyIntent } from "@/lib/safety";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function buildVisionPrompt(notes: string | null) {
  return [
    "Ты анализируешь фото еды для фитнес-приложения fit.",
    "Верни только структурированный объект анализа блюда.",
    "Пиши summary и suggestions только по-русски.",
    "Не давай медицинских советов и не выдумывай ингредиенты, если фото неясное.",
    "Если уверенность низкая, честно укажи это и снизь confidence.",
    `Дополнительный пользовательский контекст: ${notes ?? "без дополнительного контекста"}.`,
  ].join(" ");
}

function buildProviderErrorMessage(error: unknown) {
  const raw =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const normalized = raw.toLowerCase();

  if (
    normalized.includes("credit card") ||
    normalized.includes("insufficient credits") ||
    normalized.includes("payment required") ||
    normalized.includes("quota") ||
    normalized.includes("billing")
  ) {
    return "Внешний AI-провайдер сейчас недоступен для анализа фото. Код маршрута готов, но live-обработка изображения временно отключена до активации баланса.";
  }

  return "Не удалось выполнить AI-анализ фото блюда.";
}

export async function POST(request: Request) {
  try {
    if (!hasAiRuntimeEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_RUNTIME_NOT_CONFIGURED",
        message: "AI runtime не настроен для анализа фото.",
      });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Нужно войти в аккаунт, чтобы использовать AI-анализ фото.",
      });
    }

    const access = await readUserBillingAccess(supabase, user.id, {
      email: user.email,
    });
    const feature = access.features[BILLING_FEATURE_KEYS.mealPhoto];

    if (!feature.allowed) {
      return createFeatureAccessDeniedResponse(feature);
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const notesValue = formData.get("notes");
    const notes =
      typeof notesValue === "string" && notesValue.trim().length
        ? notesValue.trim()
        : null;

    if (!(image instanceof File)) {
      return createApiErrorResponse({
        status: 400,
        code: "MEAL_PHOTO_IMAGE_REQUIRED",
        message: "Нужно приложить изображение блюда.",
      });
    }

    if (!image.type.startsWith("image/")) {
      return createApiErrorResponse({
        status: 400,
        code: "MEAL_PHOTO_IMAGE_INVALID",
        message: "Поддерживаются только изображения.",
      });
    }

    if (image.size > MAX_IMAGE_BYTES) {
      return createApiErrorResponse({
        status: 400,
        code: "MEAL_PHOTO_TOO_LARGE",
        message: "Изображение слишком большое. Используй файл до 8 МБ.",
      });
    }

    if (notes && hasRiskyIntent(notes)) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_SAFETY_BLOCK",
        message:
          "Дополнительный комментарий к фото вышел за текущий safety-контур приложения.",
      });
    }

    const imageBytes = new Uint8Array(await image.arrayBuffer());
    const result = await generateObject({
      model: models.vision,
      schema: mealPhotoAnalysisSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildVisionPrompt(notes),
            },
            {
              type: "image",
              image: imageBytes,
              mediaType: image.type,
            },
          ],
        },
      ],
    });

    await incrementFeatureUsage(supabase, user.id, BILLING_FEATURE_KEYS.mealPhoto);

    return Response.json({ data: result.object });
  } catch (error) {
    logger.error("meal photo route failed", { error });

    if (error instanceof ZodError) {
      return createApiErrorResponse({
        status: 502,
        code: "MEAL_PHOTO_RESPONSE_SCHEMA_INVALID",
        message:
          "AI вернул неполный анализ фото. Попробуй другое фото блюда или более четкий ракурс.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 502,
      code: "MEAL_PHOTO_FAILED",
      message: buildProviderErrorMessage(error),
    });
  }
}
