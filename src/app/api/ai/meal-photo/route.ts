import { generateObject } from "ai";
import { ZodError } from "zod";

import { createAiChatMessage, ensureAiChatSession, touchAiChatSession } from "@/lib/ai/chat";
import { models } from "@/lib/ai/gateway";
import { mealPhotoAnalysisSchema } from "@/lib/ai/schemas";
import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  BILLING_FEATURE_KEYS,
  createFeatureAccessDeniedResponse,
  incrementFeatureUsage,
  readUserBillingAccessOrFallback,
} from "@/lib/billing-access";
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
    return "Внешний ИИ-провайдер сейчас недоступен для анализа фото. Маршрут готов, но обработка изображений временно выключена до активации баланса.";
  }

  return "Не удалось выполнить ИИ-анализ фото блюда.";
}

function buildUserChatMessage(notes: string | null) {
  return notes?.trim()
    ? `Загрузил фото еды. Контекст: ${notes.trim()}`
    : "Загрузил фото еды для анализа.";
}

function formatConfidence(value: "low" | "medium" | "high") {
  switch (value) {
    case "high":
      return "высокая";
    case "medium":
      return "средняя";
    default:
      return "низкая";
  }
}

function buildAssistantChatMessage(result: {
  title: string;
  summary: string;
  confidence: "low" | "medium" | "high";
  estimatedKcal: number;
  macros: {
    protein: number;
    fat: number;
    carbs: number;
  };
  items: Array<{
    name: string;
    portion: string;
    confidence: "low" | "medium" | "high";
  }>;
  suggestions: string[];
}) {
  const items =
    result.items.length > 0
      ? result.items
          .map(
            (item) =>
              `- ${item.name} • ${item.portion} • уверенность ${formatConfidence(item.confidence)}`,
          )
          .join("\n")
      : "- Состав блюда определить точно не удалось.";
  const suggestions =
    result.suggestions.length > 0
      ? result.suggestions.map((item) => `- ${item}`).join("\n")
      : "- Можно продолжить вопросом про рецепт, замены или план питания.";

  return [
    `### ${result.title}`,
    result.summary,
    "",
    `Оценка: **${result.estimatedKcal} ккал**`,
    `Белки: **${result.macros.protein} г** • Жиры: **${result.macros.fat} г** • Углеводы: **${result.macros.carbs} г**`,
    `Уверенность анализа: **${formatConfidence(result.confidence)}**`,
    "",
    "Что видно на фото:",
    items,
    "",
    "Что можно сделать дальше:",
    suggestions,
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    if (!hasAiRuntimeEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_RUNTIME_NOT_CONFIGURED",
        message: "ИИ-контур пока не настроен для анализа фото.",
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
        message: "Нужно войти в аккаунт, чтобы использовать ИИ-анализ фото.",
      });
    }

    const access = await readUserBillingAccessOrFallback(supabase, user.id, {
      email: user.email,
    });
    const feature = access.features[BILLING_FEATURE_KEYS.mealPhoto];

    if (!feature.allowed) {
      return createFeatureAccessDeniedResponse(feature);
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const notesValue = formData.get("notes");
    const sessionValue = formData.get("sessionId");
    const notes =
      typeof notesValue === "string" && notesValue.trim().length
        ? notesValue.trim()
        : null;
    const sessionId =
      typeof sessionValue === "string" && sessionValue.trim().length
        ? sessionValue.trim()
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
          "Комментарий к фото вышел за безопасный контур приложения. Переформулируй запрос в рамках питания и фитнеса.",
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

    const session = await ensureAiChatSession(
      supabase,
      user.id,
      sessionId,
      notes ?? "Разбор фото еды",
    );
    const userMessage = await createAiChatMessage(supabase, {
      userId: user.id,
      sessionId: session.id,
      role: "user",
      content: buildUserChatMessage(notes),
    });
    const assistantMessage = await createAiChatMessage(supabase, {
      userId: user.id,
      sessionId: session.id,
      role: "assistant",
      content: buildAssistantChatMessage(result.object),
    });

    await touchAiChatSession(supabase, user.id, session.id);
    await incrementFeatureUsage(supabase, user.id, BILLING_FEATURE_KEYS.mealPhoto);

    return Response.json({
      data: result.object,
      messages: {
        assistant: assistantMessage,
        user: userMessage,
      },
      session: {
        id: session.id,
        title: session.title,
      },
    });
  } catch (error) {
    logger.error("meal photo route failed", { error });

    if (error instanceof ZodError) {
      return createApiErrorResponse({
        status: 502,
        code: "MEAL_PHOTO_RESPONSE_SCHEMA_INVALID",
        message:
          "AI вернул неполный анализ фото. Попробуй другое фото блюда или более чёткий ракурс.",
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
