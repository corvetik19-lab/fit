import { generateObject } from "ai";

import { createAiPlanProposal } from "@/lib/ai/proposals";
import { workoutPlanSchema } from "@/lib/ai/schemas";
import { getAiUserContext } from "@/lib/ai/user-context";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { hasAiGatewayEnv } from "@/lib/env";
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

    if (!hasAiGatewayEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "AI_GATEWAY_NOT_CONFIGURED",
        message: "AI Gateway не настроен.",
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

    const context = await getAiUserContext(supabase, user.id);
    const goal = body.goal ?? context.goal.goalType ?? "maintenance";
    const equipment = body.equipment?.length
      ? body.equipment
      : context.onboarding.equipment.length
        ? context.onboarding.equipment
        : ["собственный вес"];
    const daysPerWeek =
      body.daysPerWeek ?? context.goal.weeklyTrainingDays ?? 3;
    const focus = body.focus ?? "общий прогресс без перегруза";

    const result = await generateObject({
      model: "google/gemini-3.1-pro-preview",
      schema: workoutPlanSchema,
      prompt: `Собери proposal тренировочного плана для пользователя fitness-приложения.

Контекст пользователя:
- цель: ${goal}
- тренировочных дней в неделю: ${daysPerWeek}
- оборудование: ${equipment.join(", ")}
- уровень подготовки: ${context.onboarding.fitnessLevel ?? "не указан"}
- травмы/ограничения: ${context.onboarding.injuries.join(", ") || "не указаны"}
- пол: ${context.onboarding.sex ?? "не указан"}
- возраст: ${context.onboarding.age ?? "не указан"}
- вес: ${context.onboarding.weightKg ?? "не указан"}
- фокус пользователя: ${focus}

Правила:
- план должен быть realistic и safe;
- не предлагай медицинские рекомендации;
- учитывай ограничения и оборудование;
- summary и exercise names делай пригодными для русскоязычного UI.`,
    });

    const proposal = await createAiPlanProposal(supabase, {
      userId: user.id,
      proposalType: "workout_plan",
      payload: {
        kind: "workout_plan",
        request: {
          goal,
          equipment,
          daysPerWeek,
          focus,
        },
        context,
        proposal: result.object,
      },
    });

    return Response.json({ data: proposal });
  } catch (error) {
    logger.error("workout plan route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "WORKOUT_PLAN_FAILED",
      message: "Не удалось сгенерировать proposal тренировочного плана.",
    });
  }
}
