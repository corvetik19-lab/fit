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
    return "Исторический RAG-контекст пока пуст.";
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
    "без ограничений";
  const mealsPerDay = input.mealsPerDay ?? 4;
  const knowledge = await retrieveKnowledgeMatches(
    supabase,
    userId,
    `Питание, рацион, калории, белок и история пользователя. Цель ${goal}. Калории ${kcalTarget}. Комментарий ${dietaryNotes}.`,
    8,
  );

  const result = await generateObject({
    model: models.chat,
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
- свежая сводка по питанию: ${JSON.stringify(context.latestNutritionSummary)}
- средняя калорийность за 7 дней: ${context.nutritionInsights.avgKcalLast7 ?? "нет данных"}
- средний белок за 7 дней: ${context.nutritionInsights.avgProteinLast7 ?? "нет данных"}
- отклонение от цели по калориям: ${context.nutritionInsights.kcalDeltaFromTarget ?? "нет данных"}
- отклонение от цели по белку: ${context.nutritionInsights.proteinDeltaFromTarget ?? "нет данных"}

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
- ответ должен быть practical и non-medical;
- учитывай цель пользователя, текущую калорийность и всю доступную историю питания;
- не предлагай экстремальные дефициты или рискованные схемы;
- meals делай реалистичными и пригодными для ручного логирования.`,
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
    `Тренировки, упражнения, повторения и прогресс пользователя. Цель ${goal}. Дней ${daysPerWeek}. Фокус ${focus}.`,
    8,
  );

  const result = await generateObject({
    model: models.chat,
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
- завершённых тренировочных дней за 28 дней: ${context.workoutInsights.completedDaysLast28}
- сохранённых сетов за 28 дней: ${context.workoutInsights.loggedSetsLast28}
- средние фактические повторы: ${context.workoutInsights.avgActualReps ?? "нет данных"}
- средний рабочий вес: ${context.workoutInsights.avgActualWeightKg ?? "нет данных"}
- средний RPE: ${context.workoutInsights.avgActualRpe ?? "нет данных"}
- средний отдых между сетами: ${context.workoutInsights.avgRestSecondsLast28 ?? "нет данных"}
- доля тяжёлых сетов (RPE 8.5+): ${context.workoutInsights.hardSetShareLast28 ?? "нет данных"}
- подходов с заметками за 28 дней: ${context.workoutInsights.notedSetsLast28}
- тоннаж за 28 дней: ${context.workoutInsights.tonnageLast28Kg ?? "нет данных"}
- лучший зафиксированный вес: ${context.workoutInsights.bestSetWeightKg ?? "нет данных"}
- лучшая оценка 1ПМ: ${context.workoutInsights.bestEstimatedOneRmKg ?? "нет данных"}
- последний вес тела в тренировочный день: ${context.workoutInsights.latestSessionBodyWeightKg ?? "нет данных"}

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
- план должен быть realistic и safe;
- не предлагай медицинские рекомендации;
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
