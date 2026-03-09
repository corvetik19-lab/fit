import { generateObject } from "ai";

import { createAiPlanProposal } from "@/lib/ai/proposals";
import { mealPlanSchema } from "@/lib/ai/schemas";
import { getAiUserContext } from "@/lib/ai/user-context";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { hasAiGatewayEnv } from "@/lib/env";
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
        message: "Нужно войти в аккаунт, чтобы генерировать AI-планы питания.",
      });
    }

    if (body.dietaryNotes && hasRiskyIntent(body.dietaryNotes)) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_SAFETY_BLOCK",
        message: "Комментарий к плану питания вышел за текущий safety-контур приложения.",
      });
    }

    const context = await getAiUserContext(supabase, user.id);
    const goal = body.goal ?? context.goal.goalType ?? "maintenance";
    const kcalTarget = body.kcalTarget ?? context.nutritionTargets.kcalTarget ?? 2200;
    const dietaryNotes =
      body.dietaryNotes ??
      context.onboarding.dietaryPreferences.join(", ") ??
      "без ограничений";
    const mealsPerDay = body.mealsPerDay ?? 4;

    const result = await generateObject({
      model: "google/gemini-3.1-pro-preview",
      schema: mealPlanSchema,
      prompt: `Собери proposal плана питания для пользователя фитнес-приложения.

Контекст пользователя:
- цель: ${goal}
- целевая калорийность: ${kcalTarget}
- приёмов пищи в день: ${mealsPerDay}
- пол: ${context.onboarding.sex ?? "не указан"}
- возраст: ${context.onboarding.age ?? "не указан"}
- рост: ${context.onboarding.heightCm ?? "не указан"}
- вес: ${context.onboarding.weightKg ?? "не указан"}
- уровень подготовки: ${context.onboarding.fitnessLevel ?? "не указан"}
- пищевые предпочтения: ${context.onboarding.dietaryPreferences.join(", ") || "не указаны"}
- дополнительный комментарий: ${dietaryNotes || "нет"}
- сегодняшняя сводка по питанию: ${JSON.stringify(context.latestNutritionSummary)}

Правила:
- ответ должен быть practical, non-medical;
- учитывай цель пользователя и текущую целевую калорийность;
- не предлагай экстремальные дефициты или рискованные схемы;
- meals должны быть реалистичными и пригодными для ручного логирования.`,
    });

    const proposal = await createAiPlanProposal(supabase, {
      userId: user.id,
      proposalType: "meal_plan",
      payload: {
        kind: "meal_plan",
        request: {
          goal,
          kcalTarget,
          dietaryNotes,
          mealsPerDay,
        },
        context,
        proposal: result.object,
      },
    });

    return Response.json({ data: proposal });
  } catch (error) {
    logger.error("meal plan route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "MEAL_PLAN_FAILED",
      message: "Не удалось сгенерировать proposal плана питания.",
    });
  }
}
