import {
  BILLING_FEATURE_KEYS,
  createFeatureAccessDeniedResponse,
  incrementFeatureUsage,
  readUserBillingAccessOrFallback,
} from "@/lib/billing-access";
import { generateWorkoutPlanProposalForUser } from "@/lib/ai/plan-generation";
import { workoutPlanRequestSchema } from "@/lib/ai/schemas";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { hasAiRuntimeEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
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
        message: "Нужно войти в аккаунт, чтобы генерировать тренировочные планы через ИИ.",
      });
    }

    const body = workoutPlanRequestSchema.parse(await request.json().catch(() => ({})));

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
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "WORKOUT_PLAN_INVALID",
        message: "Параметры тренировочного плана заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("workout plan route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "WORKOUT_PLAN_FAILED",
      message: "Не удалось сгенерировать предложение тренировочного плана.",
    });
  }
}
