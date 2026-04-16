import { z } from "zod";

import { generateWorkoutPlanProposalForUser } from "@/lib/ai/plan-generation";
import {
  buildAiPlanProviderErrorMessage,
  getAiPlanAuthMessage,
  getAiPlanInvalidMessage,
  getAiPlanNotConfiguredMessage,
} from "@/lib/ai/plan-route-copy";
import { isAiProviderConfigurationFailure } from "@/lib/ai/runtime-errors";
import { workoutPlanRequestSchema } from "@/lib/ai/schemas";
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
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerUserOrNull } from "@/lib/supabase/server-user";

const WORKOUT_PLAN_USAGE_TIMEOUT_MS = 5_000;

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const user = await readServerUserOrNull(supabase, request);

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "UNAUTHORIZED",
        message: getAiPlanAuthMessage("workout"),
      });
    }

    const adminSupabase = createAdminSupabaseClient();

    const body = workoutPlanRequestSchema.parse(
      await request.json().catch(() => ({})),
    );

    if (!hasAiRuntimeEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_RUNTIME_NOT_CONFIGURED",
        message: getAiPlanNotConfiguredMessage("workout"),
      });
    }

    let platformAdminRole = null;
    try {
      platformAdminRole = await readPlatformAdminRoleOrNull(adminSupabase, user.id);
    } catch (error) {
      logger.warn("workout plan admin role lookup skipped", {
        error,
        userId: user.id,
      });
    }

    const access = await withTransientRetry(
      async () =>
        await readUserBillingAccessOrFallback(supabase, user.id, {
          email: user.email,
          role: platformAdminRole,
        }),
      {
        attempts: 3,
        delaysMs: [500, 1_500, 3_000],
      },
    );
    const feature = access.features[BILLING_FEATURE_KEYS.workoutPlan];

    if (!feature.allowed) {
      return createFeatureAccessDeniedResponse(feature);
    }

    const proposal = await generateWorkoutPlanProposalForUser(adminSupabase, user.id, {
      goal: body.goal ?? null,
      equipment: body.equipment,
      daysPerWeek: body.daysPerWeek ?? null,
      focus: body.focus ?? null,
    });

    try {
      await withTransientRetry(
        async () =>
          await withTimeout(
            incrementFeatureUsage(
              adminSupabase,
              user.id,
              BILLING_FEATURE_KEYS.workoutPlan,
            ),
            WORKOUT_PLAN_USAGE_TIMEOUT_MS,
            "workout plan usage increment",
          ),
        {
          attempts: 2,
          delaysMs: [500, 1_500],
        },
      );
    } catch (error) {
      logger.warn("workout plan usage increment skipped", {
        error,
        userId: user.id,
      });
    }

    return Response.json({ data: proposal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "WORKOUT_PLAN_INVALID",
        message: getAiPlanInvalidMessage("workout"),
        details: error.flatten(),
      });
    }

    logger.error("workout plan route failed", { error });

    return createApiErrorResponse({
      status: isAiProviderConfigurationFailure(error) ? 503 : 500,
      code: isAiProviderConfigurationFailure(error)
        ? "AI_PROVIDER_UNAVAILABLE"
        : "WORKOUT_PLAN_FAILED",
      message: buildAiPlanProviderErrorMessage("workout", error),
    });
  }
}
