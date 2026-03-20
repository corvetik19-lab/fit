import { generateObject } from "ai";
import { ZodError } from "zod";

import { createAiChatMessage, ensureAiChatSession, touchAiChatSession } from "@/lib/ai/chat";
import { models } from "@/lib/ai/gateway";
import {
  AI_MEAL_PHOTO_IMAGE_INVALID_MESSAGE,
  AI_MEAL_PHOTO_IMAGE_REQUIRED_MESSAGE,
  AI_MEAL_PHOTO_NOT_CONFIGURED_MESSAGE,
  AI_MEAL_PHOTO_SAFETY_MESSAGE,
  AI_MEAL_PHOTO_SCHEMA_INVALID_MESSAGE,
  AI_MEAL_PHOTO_TOO_LARGE_MESSAGE,
  AI_MEAL_PHOTO_UNAUTHORIZED_MESSAGE,
  buildMealPhotoAssistantChatMessage,
  buildMealPhotoFailureResponse,
  buildMealPhotoUserChatMessage,
  buildMealPhotoVisionPrompt,
} from "@/lib/ai/meal-photo-runtime-copy";
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

export async function POST(request: Request) {
  try {
    if (!hasAiRuntimeEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_RUNTIME_NOT_CONFIGURED",
        message: AI_MEAL_PHOTO_NOT_CONFIGURED_MESSAGE,
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
        message: AI_MEAL_PHOTO_UNAUTHORIZED_MESSAGE,
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
        message: AI_MEAL_PHOTO_IMAGE_REQUIRED_MESSAGE,
      });
    }

    if (!image.type.startsWith("image/")) {
      return createApiErrorResponse({
        status: 400,
        code: "MEAL_PHOTO_IMAGE_INVALID",
        message: AI_MEAL_PHOTO_IMAGE_INVALID_MESSAGE,
      });
    }

    if (image.size > MAX_IMAGE_BYTES) {
      return createApiErrorResponse({
        status: 400,
        code: "MEAL_PHOTO_TOO_LARGE",
        message: AI_MEAL_PHOTO_TOO_LARGE_MESSAGE,
      });
    }

    if (notes && hasRiskyIntent(notes)) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_SAFETY_BLOCK",
        message: AI_MEAL_PHOTO_SAFETY_MESSAGE,
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
              text: buildMealPhotoVisionPrompt(notes),
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
      content: buildMealPhotoUserChatMessage(notes),
    });
    const assistantMessage = await createAiChatMessage(supabase, {
      userId: user.id,
      sessionId: session.id,
      role: "assistant",
      content: buildMealPhotoAssistantChatMessage(result.object),
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
        message: AI_MEAL_PHOTO_SCHEMA_INVALID_MESSAGE,
        details: error.flatten(),
      });
    }

    const failure = buildMealPhotoFailureResponse(error);

    return createApiErrorResponse({
      status: failure.status,
      code: failure.code,
      message: failure.message,
    });
  }
}
