import { ZodError } from "zod";

import { mealPhotoAnalysisSchema } from "@/lib/ai/schemas";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { hasAiGatewayEnv, serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { hasRiskyIntent } from "@/lib/safety";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function stripCodeFences(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  if ("output_text" in payload && typeof payload.output_text === "string") {
    return payload.output_text.trim();
  }

  if (!("output" in payload) || !Array.isArray(payload.output)) {
    return "";
  }

  return payload.output
    .flatMap((item) =>
      item && typeof item === "object" && "content" in item && Array.isArray(item.content)
        ? item.content
        : [],
    )
    .flatMap((content) =>
      content &&
      typeof content === "object" &&
      "text" in content &&
      typeof content.text === "string"
        ? [content.text]
        : [],
    )
    .join("\n")
    .trim();
}

export async function POST(request: Request) {
  try {
    if (!hasAiGatewayEnv() || !serverEnv.AI_GATEWAY_API_KEY) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_GATEWAY_NOT_CONFIGURED",
        message: "AI Gateway не настроен для анализа фото.",
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
        message: "Дополнительный комментарий к фото вышел за текущий safety-контур приложения.",
      });
    }

    const imageBytes = Buffer.from(await image.arrayBuffer());
    const imageDataUrl = `data:${image.type};base64,${imageBytes.toString("base64")}`;

    const upstreamResponse = await fetch("https://ai-gateway.vercel.sh/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serverEnv.AI_GATEWAY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Ты анализируешь фото еды для fitness-приложения. Ответ должен быть только валидным JSON без markdown и пояснений.

Верни объект строго такого вида:
{
  "title": string,
  "summary": string,
  "confidence": "low" | "medium" | "high",
  "estimatedKcal": number,
  "macros": {
    "protein": number,
    "fat": number,
    "carbs": number
  },
  "items": [
    {
      "name": string,
      "portion": string,
      "confidence": "low" | "medium" | "high"
    }
  ],
  "suggestions": string[]
}

Правила:
- не выдумывай медицинские советы;
- если фото неясное, снижай confidence и честно укажи неопределённость;
- калории и макросы оценивай как целые числа;
- suggestions должны содержать короткие практические подсказки для ручного логирования;
- summary и suggestions пиши по-русски;
- учитывай дополнительный контекст пользователя: ${notes ?? "без дополнительного контекста"}.`,
              },
              {
                type: "input_image",
                image_url: imageDataUrl,
              },
            ],
          },
        ],
      }),
    });

    const upstreamPayload = (await upstreamResponse.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    if (!upstreamResponse.ok) {
      logger.error("meal photo upstream failed", {
        status: upstreamResponse.status,
        upstreamPayload,
      });

      return createApiErrorResponse({
        status: 502,
        code: "MEAL_PHOTO_UPSTREAM_FAILED",
        message: "AI Gateway не смог обработать фото блюда.",
      });
    }

    const outputText = extractOutputText(upstreamPayload);

    if (!outputText) {
      return createApiErrorResponse({
        status: 502,
        code: "MEAL_PHOTO_EMPTY_RESPONSE",
        message: "AI вернул пустой ответ при анализе фото.",
      });
    }

    const parsedJson = JSON.parse(stripCodeFences(outputText));
    const analysis = mealPhotoAnalysisSchema.parse(parsedJson);

    return Response.json({ data: analysis });
  } catch (error) {
    logger.error("meal photo route failed", { error });

    if (error instanceof SyntaxError) {
      return createApiErrorResponse({
        status: 502,
        code: "MEAL_PHOTO_RESPONSE_INVALID",
        message: "AI вернул ответ в неожиданном формате. Попробуй другое фото.",
      });
    }

    if (error instanceof ZodError) {
      return createApiErrorResponse({
        status: 502,
        code: "MEAL_PHOTO_RESPONSE_SCHEMA_INVALID",
        message: "AI вернул неполный анализ фото. Попробуй другое фото.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "MEAL_PHOTO_FAILED",
      message: "Не удалось выполнить AI-анализ фото блюда.",
    });
  }
}
