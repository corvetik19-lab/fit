import {
  BILLING_FEATURE_KEYS,
  createFeatureAccessDeniedResponse,
  incrementFeatureUsage,
  readUserBillingAccessOrFallback,
} from "@/lib/billing-access";
import { generateMealPlanProposalForUser } from "@/lib/ai/plan-generation";
import { mealPlanRequestSchema } from "@/lib/ai/schemas";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { hasAiRuntimeEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { hasRiskyIntent } from "@/lib/safety";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Нужно войти в аккаунт, чтобы генерировать планы питания через ИИ.",
      });
    }

    const body = mealPlanRequestSchema.parse(await request.json().catch(() => ({})));

    if (!hasAiRuntimeEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_RUNTIME_NOT_CONFIGURED",
        message: "ИИ-контур пока не настроен.",
      });
    }

    const access = await readUserBillingAccessOrFallback(supabase, user.id, {
      email: user.email,
    });
    const feature = access.features[BILLING_FEATURE_KEYS.mealPlan];

    if (!feature.allowed) {
      return createFeatureAccessDeniedResponse(feature);
    }

    if (body.dietaryNotes && hasRiskyIntent(body.dietaryNotes)) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_SAFETY_BLOCK",
        message:
          "Комментарий к плану питания вышел за безопасный контур приложения.",
      });
    }

    const proposal = await generateMealPlanProposalForUser(supabase, user.id, {
      goal: body.goal ?? null,
      kcalTarget: body.kcalTarget ?? null,
      dietaryNotes: body.dietaryNotes ?? undefined,
      mealsPerDay: body.mealsPerDay ?? null,
    });

    await incrementFeatureUsage(supabase, user.id, BILLING_FEATURE_KEYS.mealPlan);

    return Response.json({ data: proposal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "MEAL_PLAN_INVALID",
        message: "Параметры плана питания заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("meal plan route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "MEAL_PLAN_FAILED",
      message: "Не удалось сгенерировать предложение плана питания.",
    });
  }
}
