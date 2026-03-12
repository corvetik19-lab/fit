import {
  BILLING_FEATURE_KEYS,
  createFeatureAccessDeniedResponse,
  incrementFeatureUsage,
  readUserBillingAccess,
} from "@/lib/billing-access";
import { generateWorkoutPlanProposalForUser } from "@/lib/ai/plan-generation";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { hasAiRuntimeEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      goal?: string;
      equipment?: string[];
      daysPerWeek?: number;
      focus?: string;
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
        message: "Нужно войти в аккаунт, чтобы генерировать AI-тренировки.",
      });
    }

    const access = await readUserBillingAccess(supabase, user.id, {
      email: user.email,
    });
    const feature = access.features[BILLING_FEATURE_KEYS.workoutPlan];

    if (!feature.allowed) {
      return createFeatureAccessDeniedResponse(feature);
    }

    const proposal = await generateWorkoutPlanProposalForUser(supabase, user.id, {
      goal: body.goal ?? null,
      equipment: body.equipment,
      daysPerWeek: body.daysPerWeek ?? null,
      focus: body.focus ?? null,
    });

    await incrementFeatureUsage(
      supabase,
      user.id,
      BILLING_FEATURE_KEYS.workoutPlan,
    );

    return Response.json({ data: proposal });
  } catch (error) {
    logger.error("workout plan route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "WORKOUT_PLAN_FAILED",
      message: "Не удалось сгенерировать предложение тренировочного плана.",
    });
  }
}
