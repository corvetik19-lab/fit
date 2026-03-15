import {
  BILLING_FEATURE_KEYS,
  createFeatureAccessDeniedResponse,
  incrementFeatureUsage,
  readUserBillingAccessOrFallback,
} from "@/lib/billing-access";
import { generateMealPlanProposalForUser } from "@/lib/ai/plan-generation";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { hasAiRuntimeEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { hasRiskyIntent } from "@/lib/safety";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      goal?: string;
      kcalTarget?: number;
      dietaryNotes?: string;
      mealsPerDay?: number;
    };

    if (!hasAiRuntimeEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_RUNTIME_NOT_CONFIGURED",
        message: "AI runtime не настроен.",
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
        message: "Нужно войти в аккаунт, чтобы генерировать AI-планы питания.",
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
          "Комментарий к плану питания вышел за текущий safety-контур приложения.",
      });
    }

    const proposal = await generateMealPlanProposalForUser(supabase, user.id, {
      goal: body.goal ?? null,
      kcalTarget: body.kcalTarget ?? null,
      dietaryNotes: body.dietaryNotes,
      mealsPerDay: body.mealsPerDay ?? null,
    });

    await incrementFeatureUsage(supabase, user.id, BILLING_FEATURE_KEYS.mealPlan);

    return Response.json({ data: proposal });
  } catch (error) {
    logger.error("meal plan route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "MEAL_PLAN_FAILED",
      message: "Не удалось сгенерировать предложение плана питания.",
    });
  }
}
