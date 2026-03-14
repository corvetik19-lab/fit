import { generateObject } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";

import { models } from "@/lib/ai/gateway";
import { retrieveKnowledgeMatches } from "@/lib/ai/knowledge";
import { createAiPlanProposal } from "@/lib/ai/proposals";
import { mealPlanSchema, workoutPlanSchema } from "@/lib/ai/schemas";
import { formatStructuredKnowledgeForPrompt } from "@/lib/ai/structured-knowledge";
import { getAiRuntimeContext } from "@/lib/ai/user-context";
import { formatNutritionCoachingSignalsForPrompt } from "@/lib/nutrition/coaching-signals";
import { formatNutritionMealPatternsForPrompt } from "@/lib/nutrition/meal-patterns";
import { formatNutritionStrategyForPrompt } from "@/lib/nutrition/strategy-recommendations";
import { formatWorkoutCoachingSignalsForPrompt } from "@/lib/workout/coaching-signals";

type MealPlanGenerationInput = {
  dietaryNotes?: string;
  goal?: string | null;
  kcalTarget?: number | null;
  mealsPerDay?: number | null;
};

type WorkoutPlanGenerationInput = {
  daysPerWeek?: number | null;
  equipment?: string[];
  focus?: string | null;
  goal?: string | null;
};

function buildKnowledgeExcerpt(
  knowledge: Awaited<ReturnType<typeof retrieveKnowledgeMatches>>,
) {
  if (!knowledge.length) {
    return "Исторический RAG-контекст пока пуст. Если данных не хватает, скажи об этом прямо.";
  }

  return knowledge
    .map((item, index) => `[${index + 1}] ${item.sourceType}: ${item.content}`)
    .join("\n\n");
}

export async function generateMealPlanProposalForUser(
  supabase: SupabaseClient,
  userId: string,
  input: MealPlanGenerationInput,
) {
  const { context } = await getAiRuntimeContext(supabase, userId);
  const goal = input.goal ?? context.goal.goalType ?? "maintenance";
  const kcalTarget = input.kcalTarget ?? context.nutritionTargets.kcalTarget ?? 2200;
  const dietaryNotes =
    input.dietaryNotes ??
    context.onboarding.dietaryPreferences.join(", ") ??
    "без дополнительных ограничений";
  const mealsPerDay = input.mealsPerDay ?? 4;
  const knowledge = await retrieveKnowledgeMatches(
    supabase,
    userId,
    `Питание, рацион, калории, белок и история пользователя. Цель ${goal}. Калории ${kcalTarget}. Ограничения ${dietaryNotes}.`,
    8,
  );

  const result = await generateObject({
    model: models.chat,
    schema: mealPlanSchema,
    prompt: `Собери proposal плана питания для пользователя фитнес-приложения.

Контекст пользователя:
- Цель: ${goal}
- Целевая калорийность: ${kcalTarget}
- Приёмов пищи в день: ${mealsPerDay}
- Пол: ${context.onboarding.sex ?? "не указан"}
- Возраст: ${context.onboarding.age ?? "не указан"}
- Рост: ${context.onboarding.heightCm ?? "не указан"}
- Вес: ${context.onboarding.weightKg ?? "не указан"}
- Уровень подготовки: ${context.onboarding.fitnessLevel ?? "не указан"}
- Пищевые предпочтения: ${context.onboarding.dietaryPreferences.join(", ") || "не указаны"}
- Дополнительные комментарии: ${dietaryNotes || "нет"}
- Свежая сводка по питанию: ${JSON.stringify(context.latestNutritionSummary)}
- Средняя калорийность за 7 дней: ${context.nutritionInsights.avgKcalLast7 ?? "нет данных"}
- Средний белок за 7 дней: ${context.nutritionInsights.avgProteinLast7 ?? "нет данных"}
- Отклонение от цели по калориям: ${context.nutritionInsights.kcalDeltaFromTarget ?? "нет данных"}
- Отклонение от цели по белку: ${context.nutritionInsights.proteinDeltaFromTarget ?? "нет данных"}

Коуч-сигналы по тренировочной истории:
${formatWorkoutCoachingSignalsForPrompt(context.workoutInsights.coachingSignals)}

Пищевые коуч-сигналы:
${formatNutritionCoachingSignalsForPrompt(context.nutritionInsights.coachingSignals)}

Meal-level паттерны питания:
${formatNutritionMealPatternsForPrompt(context.nutritionInsights.mealPatterns)}

Приоритетные рекомендации по рациону:
${formatNutritionStrategyForPrompt(context.nutritionInsights.strategy)}

Нормализованные факты и приоритеты:
${formatStructuredKnowledgeForPrompt(context.structuredKnowledge)}

Исторический RAG-контекст:
${buildKnowledgeExcerpt(knowledge)}

Правила:
- ответ должен быть практичным и не медицинским;
- учитывай цель пользователя, целевую калорийность и всю доступную историю питания;
- не предлагай экстремальные дефициты, голодание или рискованные схемы;
- план должен быть реалистичным и пригодным для ежедневного логирования в приложении.`,
  });

  return createAiPlanProposal(supabase, {
    userId,
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
      knowledge,
      proposal: result.object,
    },
  });
}

export async function generateWorkoutPlanProposalForUser(
  supabase: SupabaseClient,
  userId: string,
  input: WorkoutPlanGenerationInput,
) {
  const { context } = await getAiRuntimeContext(supabase, userId);
  const goal = input.goal ?? context.goal.goalType ?? "maintenance";
  const equipment = input.equipment?.length
    ? input.equipment
    : context.onboarding.equipment.length
      ? context.onboarding.equipment
      : ["собственный вес"];
  const daysPerWeek = input.daysPerWeek ?? context.goal.weeklyTrainingDays ?? 3;
  const focus = input.focus ?? "общий прогресс без перегруза";
  const knowledge = await retrieveKnowledgeMatches(
    supabase,
    userId,
    `Тренировки, упражнения, ограничения, восстановление и прогресс пользователя. Цель ${goal}. Дней ${daysPerWeek}. Фокус ${focus}.`,
    8,
  );

  const result = await generateObject({
    model: models.chat,
    schema: workoutPlanSchema,
    prompt: `Собери proposal тренировочного плана для пользователя фитнес-приложения.

Контекст пользователя:
- Цель: ${goal}
- Тренировочных дней в неделю: ${daysPerWeek}
- Оборудование: ${equipment.join(", ")}
- Уровень подготовки: ${context.onboarding.fitnessLevel ?? "не указан"}
- Травмы и ограничения: ${context.onboarding.injuries.join(", ") || "не указаны"}
- Пол: ${context.onboarding.sex ?? "не указан"}
- Возраст: ${context.onboarding.age ?? "не указан"}
- Вес: ${context.onboarding.weightKg ?? "не указан"}
- Фокус пользователя: ${focus}
- Завершённых тренировочных дней за 28 дней: ${context.workoutInsights.completedDaysLast28}
- Залогированных сетов за 28 дней: ${context.workoutInsights.loggedSetsLast28}
- Средние фактические повторы: ${context.workoutInsights.avgActualReps ?? "нет данных"}
- Средний рабочий вес: ${context.workoutInsights.avgActualWeightKg ?? "нет данных"} кг
- Средний RPE: ${context.workoutInsights.avgActualRpe ?? "нет данных"}
- Доля тяжёлых сетов (RPE 8.5+): ${context.workoutInsights.hardSetShareLast28 ?? "нет данных"}
- Тоннаж за 28 дней: ${context.workoutInsights.tonnageLast28Kg ?? "нет данных"} кг
- Лучший зафиксированный вес: ${context.workoutInsights.bestSetWeightKg ?? "нет данных"} кг
- Лучшая оценка 1ПМ: ${context.workoutInsights.bestEstimatedOneRmKg ?? "нет данных"} кг
- Последний вес тела в тренировочный день: ${context.workoutInsights.latestSessionBodyWeightKg ?? "нет данных"} кг

Коуч-сигналы по прогрессии и восстановлению:
${formatWorkoutCoachingSignalsForPrompt(context.workoutInsights.coachingSignals)}

Пищевые коуч-сигналы:
${formatNutritionCoachingSignalsForPrompt(context.nutritionInsights.coachingSignals)}

Meal-level паттерны питания:
${formatNutritionMealPatternsForPrompt(context.nutritionInsights.mealPatterns)}

Приоритетные рекомендации по рациону:
${formatNutritionStrategyForPrompt(context.nutritionInsights.strategy)}

Нормализованные факты и приоритеты:
${formatStructuredKnowledgeForPrompt(context.structuredKnowledge)}

Исторический RAG-контекст:
${buildKnowledgeExcerpt(knowledge)}

Правила:
- план должен быть реалистичным и безопасным;
- не предлагай медицинские назначения;
- учитывай ограничения, оборудование, рабочие веса, тоннаж и всю доступную историю тренировок;
- summary и exercise names делай пригодными для русскоязычного UI.`,
  });

  return createAiPlanProposal(supabase, {
    userId,
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
      knowledge,
      proposal: result.object,
    },
  });
}
