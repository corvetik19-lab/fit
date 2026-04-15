import { z } from "zod";

import { generateMealPlanProposalForUser } from "@/lib/ai/plan-generation";
import {
  AI_MEAL_PLAN_SAFETY_MESSAGE,
  buildAiPlanProviderErrorMessage,
  getAiPlanAuthMessage,
  getAiPlanInvalidMessage,
  getAiPlanNotConfiguredMessage,
} from "@/lib/ai/plan-route-copy";
import { isAiProviderConfigurationFailure } from "@/lib/ai/runtime-errors";
import { mealPlanRequestSchema } from "@/lib/ai/schemas";
import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  BILLING_FEATURE_KEYS,
  createFeatureAccessDeniedResponse,
  incrementFeatureUsage,
  readUserBillingAccessOrFallback,
} from "@/lib/billing-access";
import { hasAiRuntimeEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { withTimeout, withTransientRetry } from "@/lib/runtime-retry";
import { hasRiskyIntent } from "@/lib/safety";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const MEAL_PLAN_USAGE_TIMEOUT_MS = 5_000;

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withTransientRetry(async () => await supabase.auth.getUser(), {
      attempts: 4,
      delaysMs: [500, 1_500, 3_000, 5_000],
    });

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "UNAUTHORIZED",
        message: getAiPlanAuthMessage("meal"),
      });
    }

    const body = mealPlanRequestSchema.parse(
      await request.json().catch(() => ({})),
    );

    if (!hasAiRuntimeEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_RUNTIME_NOT_CONFIGURED",
        message: getAiPlanNotConfiguredMessage("meal"),
      });
    }

    const access = await withTransientRetry(
      async () =>
        await readUserBillingAccessOrFallback(supabase, user.id, {
          email: user.email,
        }),
      {
        attempts: 3,
        delaysMs: [500, 1_500, 3_000],
      },
    );
    const feature = access.features[BILLING_FEATURE_KEYS.mealPlan];

    if (!feature.allowed) {
      return createFeatureAccessDeniedResponse(feature);
    }

    if (body.dietaryNotes && hasRiskyIntent(body.dietaryNotes)) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_SAFETY_BLOCK",
        message: AI_MEAL_PLAN_SAFETY_MESSAGE,
      });
    }

    const proposal = await generateMealPlanProposalForUser(supabase, user.id, {
      goal: body.goal ?? null,
      kcalTarget: body.kcalTarget ?? null,
      dietaryNotes: body.dietaryNotes ?? undefined,
      mealsPerDay: body.mealsPerDay ?? null,
    });

    try {
      await withTransientRetry(
        async () =>
          await withTimeout(
            incrementFeatureUsage(
              supabase,
              user.id,
              BILLING_FEATURE_KEYS.mealPlan,
            ),
            MEAL_PLAN_USAGE_TIMEOUT_MS,
            "meal plan usage increment",
          ),
        {
          attempts: 2,
          delaysMs: [500, 1_500],
        },
      );
    } catch (error) {
      logger.warn("meal plan usage increment skipped", {
        error,
        userId: user.id,
      });
    }

    return Response.json({ data: proposal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "MEAL_PLAN_INVALID",
        message: getAiPlanInvalidMessage("meal"),
        details: error.flatten(),
      });
    }

    logger.error("meal plan route failed", { error });

    return createApiErrorResponse({
      status: isAiProviderConfigurationFailure(error) ? 503 : 500,
      code: isAiProviderConfigurationFailure(error)
        ? "AI_PROVIDER_UNAVAILABLE"
        : "MEAL_PLAN_FAILED",
      message: buildAiPlanProviderErrorMessage("meal", error),
    });
  }
}
