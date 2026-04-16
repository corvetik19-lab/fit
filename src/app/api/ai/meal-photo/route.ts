import { generateObject, generateText } from "ai";
import { ZodError } from "zod";

import {
  createAiChatMessage,
  ensureAiChatSession,
  touchAiChatSession,
} from "@/lib/ai/chat";
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
  buildMealPhotoDeterministicFallback,
  buildMealPhotoFailureResponse,
  buildMealPhotoUserChatMessage,
  buildMealPhotoVisionPrompt,
} from "@/lib/ai/meal-photo-runtime-copy";
import { AI_VISION_MAX_OUTPUT_TOKENS } from "@/lib/ai/runtime-budgets";
import { mealPhotoAnalysisSchema } from "@/lib/ai/schemas";
import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  BILLING_FEATURE_KEYS,
  createFeatureAccessDeniedResponse,
  incrementFeatureUsage,
  readPlatformAdminRoleOrNull,
  readUserBillingAccessOrFallback,
} from "@/lib/billing-access";
import { hasAiRuntimeEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { withTimeout, withTransientRetry } from "@/lib/runtime-retry";
import { hasRiskyIntent } from "@/lib/safety";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerUserOrNull } from "@/lib/supabase/server-user";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MEAL_PHOTO_AI_TIMEOUT_MS = 30_000;

function buildMealPhotoJsonFallbackPrompt(notes: string | null) {
  return [
    buildMealPhotoVisionPrompt(notes),
    "",
    "Верни только JSON-объект без markdown и без пояснений.",
    "Точная схема:",
    "{",
    '  "title": "string",',
    '  "summary": "string",',
    '  "confidence": "low|medium|high",',
    '  "estimatedKcal": 0,',
    '  "macros": { "protein": 0, "fat": 0, "carbs": 0 },',
    '  "items": [{ "name": "string", "portion": "string", "confidence": "low|medium|high" }],',
    '  "suggestions": ["string"]',
    "}",
  ].join("\n");
}

function extractMealPhotoCandidateText(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as {
    text?: unknown;
    responseBody?: unknown;
    cause?: { responseBody?: unknown } | unknown;
  };

  if (typeof candidate.text === "string" && candidate.text.trim().length) {
    return candidate.text;
  }

  if (
    typeof candidate.responseBody === "string" &&
    candidate.responseBody.trim().length
  ) {
    return candidate.responseBody;
  }

  if (
    candidate.cause &&
    typeof candidate.cause === "object" &&
    "responseBody" in candidate.cause &&
    typeof candidate.cause.responseBody === "string" &&
    candidate.cause.responseBody.trim().length
  ) {
    return candidate.cause.responseBody;
  }

  return null;
}

function tryRecoverMealPhotoAnalysis(error: unknown) {
  const rawCandidate = extractMealPhotoCandidateText(error);

  if (!rawCandidate) {
    return null;
  }

  const firstBrace = rawCandidate.indexOf("{");
  const lastBrace = rawCandidate.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const normalizedCandidate = rawCandidate
    .slice(firstBrace, lastBrace + 1)
    .replace(/```json|```/giu, "")
    .replace(/\\(?!["\\/bfnrtu])/gu, "\\\\")
    .trim();

  try {
    const parsed = JSON.parse(normalizedCandidate);
    const result = mealPhotoAnalysisSchema.safeParse(parsed);

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function isRetryableMealPhotoObjectError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const candidate = error as Error & {
    finishReason?: string | null;
    cause?: unknown;
  };

  if (String(candidate.finishReason ?? "").toLowerCase() === "length") {
    return true;
  }

  const message = candidate.message.toLowerCase();

  return (
    message.includes("no object generated") ||
    message.includes("could not parse the response")
  );
}

async function generateMealPhotoAnalysis(input: {
  imageBytes: Uint8Array;
  mediaType: string;
  notes: string | null;
}) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await withTimeout(
        generateObject({
          maxOutputTokens: AI_VISION_MAX_OUTPUT_TOKENS + attempt * 400,
          model: models.vision,
          schema: mealPhotoAnalysisSchema,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: buildMealPhotoVisionPrompt(input.notes),
                },
                {
                  type: "image",
                  image: input.imageBytes,
                  mediaType: input.mediaType,
                },
              ],
            },
          ],
        }),
        MEAL_PHOTO_AI_TIMEOUT_MS,
        "meal photo ai generation",
      );
    } catch (error) {
      lastError = error;

      const recovered = tryRecoverMealPhotoAnalysis(error);

      if (recovered) {
        logger.warn("meal photo recovered malformed structured output", {
          attempt: attempt + 1,
        });

        return {
          object: recovered,
        };
      }

      if (!isRetryableMealPhotoObjectError(error)) {
        throw error;
      }

      if (attempt === 1) {
        break;
      }

      logger.warn("meal photo is retrying after incomplete structured output", {
        attempt: attempt + 1,
        error,
      });
    }
  }

  try {
    const result = await withTimeout(
      generateText({
        maxOutputTokens: AI_VISION_MAX_OUTPUT_TOKENS + 400,
        model: models.vision,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: buildMealPhotoJsonFallbackPrompt(input.notes),
              },
              {
                type: "image",
                image: input.imageBytes,
                mediaType: input.mediaType,
              },
            ],
          },
        ],
      }),
      MEAL_PHOTO_AI_TIMEOUT_MS,
      "meal photo ai text fallback",
    );

    const recovered = tryRecoverMealPhotoAnalysis({ text: result.text });

    if (recovered) {
      logger.warn("meal photo used text fallback recovery", {});
      return {
        object: recovered,
      };
    }
  } catch (textFallbackError) {
    const recovered = tryRecoverMealPhotoAnalysis(textFallbackError);

    if (recovered) {
      logger.warn("meal photo recovered text fallback output after error", {});
      return {
        object: recovered,
      };
    }

    logger.warn("meal photo text fallback failed", {
      error: textFallbackError,
    });
  }

  throw lastError;
}

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
    const adminSupabase = createAdminSupabaseClient();
    const user = await readServerUserOrNull(supabase, request);

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "UNAUTHORIZED",
        message: AI_MEAL_PHOTO_UNAUTHORIZED_MESSAGE,
      });
    }

    let platformAdminRole = null;
    try {
      platformAdminRole = await readPlatformAdminRoleOrNull(adminSupabase, user.id);
    } catch (error) {
      logger.warn("meal photo admin role lookup skipped", {
        error,
        userId: user.id,
      });
    }

    const access = await readUserBillingAccessOrFallback(adminSupabase, user.id, {
      email: user.email,
      role: platformAdminRole,
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
    let result: Awaited<ReturnType<typeof generateMealPhotoAnalysis>>;
    let degraded = false;

    try {
      result = await generateMealPhotoAnalysis({
        imageBytes,
        mediaType: image.type,
        notes,
      });
    } catch (analysisError) {
      degraded = true;
      logger.warn("meal photo is using deterministic fallback", {
        error: analysisError,
        userId: user.id,
      });
      result = {
        object: buildMealPhotoDeterministicFallback(notes),
      };
    }

    let session:
      | {
          id: string;
          title: string | null;
        }
      | null = null;
    let userMessage: unknown = null;
    let assistantMessage: unknown = null;

    try {
      const sessionRecord = await withTransientRetry(
        async () =>
          await ensureAiChatSession(
            adminSupabase,
            user.id,
            sessionId,
            notes ?? "Разбор фото еды",
          ),
        {
          attempts: 4,
          delaysMs: [500, 1_500, 3_000],
        },
      );
      session = sessionRecord;
      userMessage = await withTransientRetry(
        async () =>
          await createAiChatMessage(adminSupabase, {
            userId: user.id,
            sessionId: sessionRecord.id,
            role: "user",
            content: buildMealPhotoUserChatMessage(notes),
          }),
        {
          attempts: 4,
          delaysMs: [500, 1_500, 3_000],
        },
      );
      assistantMessage = await withTransientRetry(
        async () =>
          await createAiChatMessage(adminSupabase, {
            userId: user.id,
            sessionId: sessionRecord.id,
            role: "assistant",
            content: buildMealPhotoAssistantChatMessage(result.object),
          }),
        {
          attempts: 4,
          delaysMs: [500, 1_500, 3_000],
        },
      );

      await withTransientRetry(
        async () =>
          await touchAiChatSession(adminSupabase, user.id, sessionRecord.id),
        {
          attempts: 4,
          delaysMs: [500, 1_500, 3_000],
        },
      );
    } catch (persistenceError) {
      logger.warn("meal photo chat persistence skipped", {
        error: persistenceError,
        userId: user.id,
      });
      session = null;
      userMessage = null;
      assistantMessage = null;
    }

    try {
      await withTransientRetry(
        async () =>
          await incrementFeatureUsage(
            adminSupabase,
            user.id,
            BILLING_FEATURE_KEYS.mealPhoto,
          ),
        {
          attempts: 3,
          delaysMs: [500, 1_500, 3_000],
        },
      );
    } catch (usageError) {
      logger.warn("meal photo feature usage increment skipped", {
        error: usageError,
        userId: user.id,
      });
    }

    return Response.json({
      data: result.object,
      meta: {
        degraded,
      },
      messages: {
        assistant: assistantMessage,
        user: userMessage,
      },
      session: {
        id: session?.id ?? null,
        title: session?.title ?? null,
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
