import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildNutritionCoachingSignals,
  type NutritionCoachingSignal,
} from "@/lib/nutrition/coaching-signals";
import {
  buildNutritionMealPatternStats,
  type NutritionMealPatternStats,
} from "@/lib/nutrition/meal-patterns";
import {
  buildNutritionStrategyRecommendations,
  type NutritionStrategyRecommendation,
} from "@/lib/nutrition/strategy-recommendations";
import {
  buildStructuredKnowledgeFromContext,
  buildStructuredKnowledgeSignature,
  type AiStructuredKnowledgeSnapshot,
} from "@/lib/ai/structured-knowledge";
import { logger } from "@/lib/logger";
import {
  buildWorkoutCoachingSignals,
  type WorkoutCoachingSignal,
} from "@/lib/workout/coaching-signals";

export const AI_RUNTIME_CONTEXT_SNAPSHOT_REASON = "ai_runtime_context_v1";
export const AI_RUNTIME_CONTEXT_SNAPSHOT_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export type AiUserContext = {
  profile: {
    fullName: string | null;
  };
  onboarding: {
    age: number | null;
    sex: string | null;
    heightCm: number | null;
    weightKg: number | null;
    fitnessLevel: string | null;
    equipment: string[];
    injuries: string[];
    dietaryPreferences: string[];
  };
  goal: {
    goalType: string | null;
    targetWeightKg: number | null;
    weeklyTrainingDays: number | null;
  };
  nutritionTargets: {
    kcalTarget: number | null;
    proteinTarget: number | null;
    fatTarget: number | null;
    carbsTarget: number | null;
  };
  latestBodyMetrics: {
    weightKg: number | null;
    bodyFatPct: number | null;
    measuredAt: string | null;
  };
  latestNutritionSummary: {
    summaryDate: string | null;
    kcal: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  };
  workoutInsights: {
    completedDaysLast28: number;
    loggedSetsLast28: number;
    avgActualReps: number | null;
    avgActualWeightKg: number | null;
    avgActualRpe: number | null;
    hardSetShareLast28: number | null;
    tonnageLast28Kg: number | null;
    bestSetWeightKg: number | null;
    bestEstimatedOneRmKg: number | null;
    latestCompletedDayAt: string | null;
    latestSessionBodyWeightKg: number | null;
    coachingSignals: WorkoutCoachingSignal[];
  };
  nutritionInsights: {
    daysTrackedLast7: number;
    avgKcalLast7: number | null;
    avgProteinLast7: number | null;
    kcalDeltaFromTarget: number | null;
    proteinDeltaFromTarget: number | null;
    latestTrackedDay: string | null;
    coachingSignals: NutritionCoachingSignal[];
    mealPatterns: NutritionMealPatternStats;
    strategy: NutritionStrategyRecommendation[];
  };
  structuredKnowledge: AiStructuredKnowledgeSnapshot;
};

type AiRuntimeContextSnapshotPayload = {
  context: AiUserContext;
  generatedAt: string;
  kind: "ai_runtime_context";
  structuredKnowledgeSignature: string;
  version: 1;
};

type AiRuntimeContextSnapshotRow = {
  created_at: string;
  id: string;
  payload: AiRuntimeContextSnapshotPayload | Record<string, unknown>;
  snapshot_reason: string;
};

export type AiRuntimeContextResult = {
  cache: {
    generatedAt: string | null;
    snapshotCreatedAt: string | null;
    snapshotId: string | null;
    snapshotReason: string | null;
    source: "live" | "snapshot";
  };
  context: AiUserContext;
};

export function createEmptyAiUserContext(): AiUserContext {
  return {
    goal: {
      goalType: null,
      targetWeightKg: null,
      weeklyTrainingDays: null,
    },
    latestBodyMetrics: {
      bodyFatPct: null,
      measuredAt: null,
      weightKg: null,
    },
    latestNutritionSummary: {
      carbs: null,
      fat: null,
      kcal: null,
      protein: null,
      summaryDate: null,
    },
    nutritionInsights: {
      avgKcalLast7: null,
      avgProteinLast7: null,
      coachingSignals: [],
      daysTrackedLast7: 0,
      kcalDeltaFromTarget: null,
      latestTrackedDay: null,
      mealPatterns: {
        avgMealKcal: null,
        avgMealsPerTrackedDay: null,
        avgProteinPerMeal: null,
        dominantWindow: null,
        eveningCaloriesShare: null,
        mealCount: 0,
        patterns: [],
        proteinDenseMealShare: null,
        topFoods: [],
        trackedMealDays: 0,
      },
      proteinDeltaFromTarget: null,
      strategy: [],
    },
    nutritionTargets: {
      carbsTarget: null,
      fatTarget: null,
      kcalTarget: null,
      proteinTarget: null,
    },
    onboarding: {
      age: null,
      dietaryPreferences: [],
      equipment: [],
      fitnessLevel: null,
      heightCm: null,
      injuries: [],
      sex: null,
      weightKg: null,
    },
    profile: {
      fullName: null,
    },
    structuredKnowledge: {
      facts: [],
      generatedAt: new Date().toISOString(),
    },
    workoutInsights: {
      avgActualReps: null,
      avgActualRpe: null,
      avgActualWeightKg: null,
      bestEstimatedOneRmKg: null,
      bestSetWeightKg: null,
      coachingSignals: [],
      completedDaysLast28: 0,
      hardSetShareLast28: null,
      latestCompletedDayAt: null,
      latestSessionBodyWeightKg: null,
      loggedSetsLast28: 0,
      tonnageLast28Kg: null,
    },
  };
}

export function createEmptyAiRuntimeContextResult(): AiRuntimeContextResult {
  const context = createEmptyAiUserContext();

  return {
    cache: {
      generatedAt: context.structuredKnowledge.generatedAt,
      snapshotCreatedAt: null,
      snapshotId: null,
      snapshotReason: null,
      source: "live",
    },
    context,
  };
}

function normalizeJsonArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.flatMap((item) => (typeof item === "string" ? [item] : []));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createAiRuntimeContextSnapshotPayload(
  context: AiUserContext,
): AiRuntimeContextSnapshotPayload {
  return {
    context,
    generatedAt: new Date().toISOString(),
    kind: "ai_runtime_context",
    structuredKnowledgeSignature: buildStructuredKnowledgeSignature(
      context.structuredKnowledge,
    ),
    version: 1,
  };
}

function parseAiRuntimeContextSnapshotPayload(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  if (value.kind !== "ai_runtime_context" || value.version !== 1) {
    return null;
  }

  if (typeof value.generatedAt !== "string") {
    return null;
  }

  if (!isRecord(value.context)) {
    return null;
  }

  const context = value.context as AiUserContext;

  if (
    !isRecord(context.workoutInsights) ||
    !isRecord(context.nutritionInsights) ||
    !isRecord(context.structuredKnowledge)
  ) {
    return null;
  }

  return {
    context,
    generatedAt: value.generatedAt,
    kind: "ai_runtime_context" as const,
    structuredKnowledgeSignature:
      typeof value.structuredKnowledgeSignature === "string"
        ? value.structuredKnowledgeSignature
        : "",
    version: 1 as const,
  };
}

async function getAiRuntimeContextFreshnessCursor(
  supabase: SupabaseClient,
  userId: string,
) {
  const [
    goalResult,
    workoutDayResult,
    workoutSetResult,
    nutritionSummaryResult,
    mealResult,
    bodyMetricResult,
  ] = await Promise.all([
    supabase
      .from("goals")
      .select("updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_days")
      .select("updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_sets")
      .select("updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("daily_nutrition_summaries")
      .select("summary_date")
      .eq("user_id", userId)
      .order("summary_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("meals")
      .select("eaten_at")
      .eq("user_id", userId)
      .order("eaten_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("body_metrics")
      .select("measured_at")
      .eq("user_id", userId)
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const possibleError =
    goalResult.error ??
    workoutDayResult.error ??
    workoutSetResult.error ??
    nutritionSummaryResult.error ??
    mealResult.error ??
    bodyMetricResult.error;

  if (possibleError) {
    throw possibleError;
  }

  return [
    goalResult.data?.updated_at ?? null,
    workoutDayResult.data?.updated_at ?? null,
    workoutSetResult.data?.updated_at ?? null,
    nutritionSummaryResult.data?.summary_date ?? null,
    mealResult.data?.eaten_at ?? null,
    bodyMetricResult.data?.measured_at ?? null,
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;
}

export async function getAiUserContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<AiUserContext> {
  const today = new Date().toISOString().slice(0, 10);
  const last28Days = new Date();
  last28Days.setDate(last28Days.getDate() - 28);
  const last56Days = new Date();
  last56Days.setDate(last56Days.getDate() - 56);
  const last14Days = new Date();
  last14Days.setDate(last14Days.getDate() - 14);
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 6);
  const last7DaysDate = last7Days.toISOString().slice(0, 10);

  const [
    profileResult,
    onboardingResult,
    goalResult,
    nutritionProfileResult,
    bodyMetricsResult,
    nutritionSummaryResult,
    workoutDaysResult,
    workoutSetsResult,
    nutritionTrendResult,
    mealsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("onboarding_profiles")
      .select(
        "age, sex, height_cm, weight_kg, fitness_level, equipment, injuries, dietary_preferences",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("goals")
      .select("goal_type, target_weight_kg, weekly_training_days")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("nutrition_profiles")
      .select("kcal_target, protein_target, fat_target, carbs_target")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("body_metrics")
      .select("weight_kg, body_fat_pct, measured_at")
      .eq("user_id", userId)
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("daily_nutrition_summaries")
      .select("summary_date, kcal, protein, fat, carbs")
      .eq("user_id", userId)
      .eq("summary_date", today)
      .maybeSingle(),
    supabase
      .from("workout_days")
      .select("updated_at, body_weight_kg")
      .eq("user_id", userId)
      .eq("status", "done")
      .gte("updated_at", last56Days.toISOString())
      .order("updated_at", { ascending: false }),
    supabase
      .from("workout_sets")
      .select("actual_reps, actual_weight_kg, actual_rpe, updated_at")
      .eq("user_id", userId)
      .not("actual_reps", "is", null)
      .gte("updated_at", last56Days.toISOString())
      .order("updated_at", { ascending: false }),
    supabase
      .from("daily_nutrition_summaries")
      .select("summary_date, kcal, protein, fat, carbs")
      .eq("user_id", userId)
      .gte("summary_date", last7DaysDate)
      .order("summary_date", { ascending: false }),
    supabase
      .from("meals")
      .select("id, eaten_at")
      .eq("user_id", userId)
      .gte("eaten_at", last14Days.toISOString())
      .order("eaten_at", { ascending: false }),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (onboardingResult.error) {
    throw onboardingResult.error;
  }

  if (goalResult.error) {
    throw goalResult.error;
  }

  if (nutritionProfileResult.error) {
    throw nutritionProfileResult.error;
  }

  if (bodyMetricsResult.error) {
    throw bodyMetricsResult.error;
  }

  if (nutritionSummaryResult.error) {
    throw nutritionSummaryResult.error;
  }

  if (workoutDaysResult.error) {
    throw workoutDaysResult.error;
  }

  if (workoutSetsResult.error) {
    throw workoutSetsResult.error;
  }

  if (nutritionTrendResult.error) {
    throw nutritionTrendResult.error;
  }

  if (mealsResult.error) {
    throw mealsResult.error;
  }

  const currentWindowStart = last28Days.getTime();
  const workoutDays = workoutDaysResult.data ?? [];
  const currentWorkoutDays = workoutDays.filter(
    (row) => new Date(row.updated_at).getTime() >= currentWindowStart,
  );
  const workoutSets = (workoutSetsResult.data ?? []).filter(
    (row) => typeof row.actual_reps === "number",
  );
  const currentWorkoutSets = workoutSets.filter(
    (row) => new Date(row.updated_at).getTime() >= currentWindowStart,
  );
  const previousWorkoutSets = workoutSets.filter(
    (row) => new Date(row.updated_at).getTime() < currentWindowStart,
  );
  const nutritionTrend = nutritionTrendResult.data ?? [];
  const mealRows = mealsResult.data ?? [];
  const mealItemsResult = mealRows.length
    ? await supabase
        .from("meal_items")
        .select("meal_id, food_name_snapshot, servings, kcal, protein, fat, carbs")
        .eq("user_id", userId)
        .in(
          "meal_id",
          mealRows.map((meal) => meal.id),
        )
    : { data: [], error: null };

  if (mealItemsResult.error) {
    throw mealItemsResult.error;
  }

  const mealItemsRows = mealItemsResult.data ?? [];
  const avgActualReps = currentWorkoutSets.length
    ? Number(
        (
          currentWorkoutSets.reduce((sum, row) => sum + (row.actual_reps ?? 0), 0) /
          currentWorkoutSets.length
        ).toFixed(1),
      )
    : null;
  const weightSamples = currentWorkoutSets.flatMap((row) => {
    const parsed = Number(row.actual_weight_kg);
    return Number.isFinite(parsed) ? [parsed] : [];
  });
  const avgActualWeightKg = weightSamples.length
    ? Number(
        (
          weightSamples.reduce((sum, value) => sum + value, 0) /
          weightSamples.length
        ).toFixed(1),
      )
      : null;
  const rpeSamples = currentWorkoutSets.flatMap((row) => {
    const parsed = Number(row.actual_rpe);
    return Number.isFinite(parsed) ? [parsed] : [];
  });
  const avgActualRpe = rpeSamples.length
    ? Number(
        (
          rpeSamples.reduce((sum, value) => sum + value, 0) / rpeSamples.length
        ).toFixed(1),
      )
    : null;
  const hardSetShareLast28 = rpeSamples.length
    ? Number(
        (
          rpeSamples.filter((value) => value >= 8.5).length / rpeSamples.length
        ).toFixed(2),
      )
    : null;
  const tonnageLast28Kg = currentWorkoutSets.reduce((sum, row) => {
    const actualReps = row.actual_reps ?? null;
    const actualWeightKg = Number(row.actual_weight_kg);

    if (!Number.isFinite(actualWeightKg) || actualReps === null) {
      return sum;
    }

    return sum + actualReps * actualWeightKg;
  }, 0);
  const bestSetWeightKg = weightSamples.length ? Math.max(...weightSamples) : null;
  const latestSessionBodyWeightKg =
    currentWorkoutDays
      .map((row) => Number(row.body_weight_kg))
      .find((value) => Number.isFinite(value)) ?? null;
  const bestEstimatedOneRmKg = currentWorkoutSets.reduce<number | null>((best, row) => {
    const actualReps = row.actual_reps ?? null;
    const actualWeightKg = Number(row.actual_weight_kg);

    if (actualReps === null || !Number.isFinite(actualWeightKg) || actualReps <= 0) {
      return best;
    }

    const estimate = actualWeightKg * (1 + actualReps / 30);
    return best === null ? estimate : Math.max(best, estimate);
  }, null);
  const previousWeightSamples = previousWorkoutSets.flatMap((row) => {
    const parsed = Number(row.actual_weight_kg);
    return Number.isFinite(parsed) ? [parsed] : [];
  });
  const recentTonnageKg = Number(tonnageLast28Kg.toFixed(1));
  const previousTonnageKg = Number(
    previousWorkoutSets
      .reduce((sum, row) => {
        const actualReps = row.actual_reps ?? null;
        const actualWeightKg = Number(row.actual_weight_kg);

        if (!Number.isFinite(actualWeightKg) || actualReps === null) {
          return sum;
        }

        return sum + actualReps * actualWeightKg;
      }, 0)
      .toFixed(1),
  );
  const recentAvgActualWeightKg = weightSamples.length
    ? Number(
        (
          weightSamples.reduce((sum, value) => sum + value, 0) / weightSamples.length
        ).toFixed(1),
      )
    : null;
  const previousAvgActualWeightKg = previousWeightSamples.length
    ? Number(
        (
          previousWeightSamples.reduce((sum, value) => sum + value, 0) /
          previousWeightSamples.length
        ).toFixed(1),
      )
    : null;
  const goalDaysPerWeek = goalResult.data?.weekly_training_days ?? null;
  const daysSinceLastWorkout = workoutDays[0]
    ? Math.max(
        0,
        Math.round(
          (Date.now() - new Date(workoutDays[0].updated_at).getTime()) / 86_400_000,
        ),
      )
    : null;
  const consistencyRatio =
    goalDaysPerWeek && goalDaysPerWeek > 0
      ? Number((currentWorkoutDays.length / (goalDaysPerWeek * 4)).toFixed(2))
      : null;
  const coachingSignals = buildWorkoutCoachingSignals({
    recentCompletedDays: currentWorkoutDays.length,
    recentCompletedSets: currentWorkoutSets.length,
    previousCompletedSets: previousWorkoutSets.length,
    recentTonnageKg,
    previousTonnageKg,
    recentAvgActualWeightKg,
    previousAvgActualWeightKg,
    avgActualRpeRecent: avgActualRpe,
    hardSetShareRecent: hardSetShareLast28,
    avgRestSecondsRecent: null,
    notedSetsRecent: 0,
    daysSinceLastWorkout,
    consistencyRatio,
    goalDaysPerWeek,
  });
  const nutritionTotals = nutritionTrend.reduce(
    (accumulator, row) => ({
      kcal: accumulator.kcal + (row.kcal ?? 0),
      protein: accumulator.protein + Number(row.protein ?? 0),
    }),
    { kcal: 0, protein: 0 },
  );
  const avgKcalLast7 = nutritionTrend.length
    ? Math.round(nutritionTotals.kcal / nutritionTrend.length)
    : null;
  const avgProteinLast7 = nutritionTrend.length
    ? Number((nutritionTotals.protein / nutritionTrend.length).toFixed(1))
    : null;
  const kcalTarget = nutritionProfileResult.data?.kcal_target ?? null;
  const proteinTarget = nutritionProfileResult.data?.protein_target ?? null;
  const latestWeightKg =
    bodyMetricsResult.data?.weight_kg !== null &&
    bodyMetricsResult.data?.weight_kg !== undefined
      ? Number(bodyMetricsResult.data?.weight_kg)
      : null;
  const nutritionCoachingSignals = buildNutritionCoachingSignals({
    trackedDays: nutritionTrend.length,
    targetAlignedDays: nutritionTrend.filter((row) => {
      const kcalDelta =
        kcalTarget !== null && row.kcal !== null ? row.kcal - kcalTarget : null;
      const proteinDelta =
        proteinTarget !== null ? Number(row.protein ?? 0) - proteinTarget : null;

      if (kcalDelta === null && proteinDelta === null) {
        return false;
      }

      return (
        (kcalDelta === null || Math.abs(kcalDelta) <= 200) &&
        (proteinDelta === null || proteinDelta >= -10)
      );
    }).length,
    avgKcalDelta:
      avgKcalLast7 !== null && kcalTarget !== null ? avgKcalLast7 - kcalTarget : null,
    avgProteinDelta:
      avgProteinLast7 !== null && proteinTarget !== null
        ? Number((avgProteinLast7 - proteinTarget).toFixed(1))
        : null,
    latestWeightKg,
    previousWeightKg: null,
    deltaKg: null,
    goalType: goalResult.data?.goal_type ?? null,
    targetWeightKg: goalResult.data?.target_weight_kg ?? null,
  });
  const mealItemsByMealId = new Map<
    string,
    Array<{
      food_name_snapshot: string;
      servings: number | string | null;
      kcal: number | string | null;
      protein: number | string | null;
      fat: number | string | null;
      carbs: number | string | null;
    }>
  >();

  for (const item of mealItemsRows) {
    const bucket = mealItemsByMealId.get(item.meal_id) ?? [];
    bucket.push(item);
    mealItemsByMealId.set(item.meal_id, bucket);
  }

  const mealPatterns = buildNutritionMealPatternStats(
    mealRows.map((meal) => {
      const items = mealItemsByMealId.get(meal.id) ?? [];

      return {
        id: meal.id,
        eatenAt: meal.eaten_at,
        totals: {
          kcal: items.reduce((sum, item) => sum + Number(item.kcal ?? 0), 0),
          protein: items.reduce((sum, item) => sum + Number(item.protein ?? 0), 0),
          fat: items.reduce((sum, item) => sum + Number(item.fat ?? 0), 0),
          carbs: items.reduce((sum, item) => sum + Number(item.carbs ?? 0), 0),
        },
        items: items.map((item) => ({
          foodNameSnapshot: item.food_name_snapshot,
          servings: Number(item.servings ?? 0),
          kcal: Number(item.kcal ?? 0),
          protein: Number(item.protein ?? 0),
          fat: Number(item.fat ?? 0),
          carbs: Number(item.carbs ?? 0),
        })),
      };
    }),
  );
  const nutritionStrategy = buildNutritionStrategyRecommendations({
    coachingSignals: nutritionCoachingSignals,
    mealPatterns: mealPatterns.patterns,
    topFoods: mealPatterns.topFoods,
    trackedDays: nutritionTrend.length,
  });

  const contextBase = {
    profile: {
      fullName: profileResult.data?.full_name ?? null,
    },
    onboarding: {
      age: onboardingResult.data?.age ?? null,
      sex: onboardingResult.data?.sex ?? null,
      heightCm: onboardingResult.data?.height_cm ?? null,
      weightKg: onboardingResult.data?.weight_kg ?? null,
      fitnessLevel: onboardingResult.data?.fitness_level ?? null,
      equipment: normalizeJsonArray(onboardingResult.data?.equipment),
      injuries: normalizeJsonArray(onboardingResult.data?.injuries),
      dietaryPreferences: normalizeJsonArray(
        onboardingResult.data?.dietary_preferences,
      ),
    },
    goal: {
      goalType: goalResult.data?.goal_type ?? null,
      targetWeightKg: goalResult.data?.target_weight_kg ?? null,
      weeklyTrainingDays: goalResult.data?.weekly_training_days ?? null,
    },
    nutritionTargets: {
      kcalTarget: nutritionProfileResult.data?.kcal_target ?? null,
      proteinTarget: nutritionProfileResult.data?.protein_target ?? null,
      fatTarget: nutritionProfileResult.data?.fat_target ?? null,
      carbsTarget: nutritionProfileResult.data?.carbs_target ?? null,
    },
    latestBodyMetrics: {
      weightKg: bodyMetricsResult.data?.weight_kg ?? null,
      bodyFatPct: bodyMetricsResult.data?.body_fat_pct ?? null,
      measuredAt: bodyMetricsResult.data?.measured_at ?? null,
    },
    latestNutritionSummary: {
      summaryDate: nutritionSummaryResult.data?.summary_date ?? null,
      kcal: nutritionSummaryResult.data?.kcal ?? null,
      protein: nutritionSummaryResult.data?.protein ?? null,
      fat: nutritionSummaryResult.data?.fat ?? null,
      carbs: nutritionSummaryResult.data?.carbs ?? null,
    },
    workoutInsights: {
      completedDaysLast28: currentWorkoutDays.length,
      loggedSetsLast28: currentWorkoutSets.length,
      avgActualReps,
      avgActualWeightKg,
      avgActualRpe,
      hardSetShareLast28,
      tonnageLast28Kg: currentWorkoutSets.length ? recentTonnageKg : null,
      bestSetWeightKg,
      bestEstimatedOneRmKg:
        bestEstimatedOneRmKg !== null ? Number(bestEstimatedOneRmKg.toFixed(1)) : null,
      latestCompletedDayAt: workoutDays[0]?.updated_at ?? null,
      latestSessionBodyWeightKg,
      coachingSignals,
    },
    nutritionInsights: {
      daysTrackedLast7: nutritionTrend.length,
      avgKcalLast7,
      avgProteinLast7,
      kcalDeltaFromTarget:
        avgKcalLast7 !== null && kcalTarget !== null ? avgKcalLast7 - kcalTarget : null,
      proteinDeltaFromTarget:
        avgProteinLast7 !== null && proteinTarget !== null
          ? Number((avgProteinLast7 - proteinTarget).toFixed(1))
          : null,
      latestTrackedDay: nutritionTrend[0]?.summary_date ?? null,
      coachingSignals: nutritionCoachingSignals,
      mealPatterns,
      strategy: nutritionStrategy,
    },
  };

  return {
    ...contextBase,
    structuredKnowledge: buildStructuredKnowledgeFromContext(contextBase),
  };
}

export async function persistAiRuntimeContextSnapshot(
  supabase: SupabaseClient,
  userId: string,
  context: AiUserContext,
  snapshotReason = AI_RUNTIME_CONTEXT_SNAPSHOT_REASON,
) {
  const payload = createAiRuntimeContextSnapshotPayload(context);

  const { data, error } = await supabase
    .from("user_context_snapshots")
    .insert({
      user_id: userId,
      snapshot_reason: snapshotReason,
      payload,
    })
    .select("id, snapshot_reason, created_at")
    .single();

  if (error) {
    throw error;
  }

  return {
    createdAt: data.created_at,
    generatedAt: payload.generatedAt,
    snapshotId: data.id,
    snapshotReason: data.snapshot_reason,
  };
}

export async function getAiRuntimeContext(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    forceRefresh?: boolean;
    maxAgeMs?: number;
    persistSnapshot?: boolean;
    snapshotReason?: string;
  },
): Promise<AiRuntimeContextResult> {
  const maxAgeMs = options?.maxAgeMs ?? AI_RUNTIME_CONTEXT_SNAPSHOT_MAX_AGE_MS;
  const snapshotReason = options?.snapshotReason ?? AI_RUNTIME_CONTEXT_SNAPSHOT_REASON;

  if (!options?.forceRefresh) {
    const { data, error } = await supabase
      .from("user_context_snapshots")
      .select("id, snapshot_reason, payload, created_at")
      .eq("user_id", userId)
      .eq("snapshot_reason", snapshotReason)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.warn("failed to read AI runtime context snapshot", {
        error,
        snapshotReason,
        userId,
      });
    } else if (data) {
      const parsed = parseAiRuntimeContextSnapshotPayload(
        (data as AiRuntimeContextSnapshotRow).payload,
      );
      const ageMs = Date.now() - new Date(data.created_at).getTime();
      let hasNewerUserData = false;

      try {
        const freshnessCursor = await getAiRuntimeContextFreshnessCursor(
          supabase,
          userId,
        );
        hasNewerUserData =
          typeof freshnessCursor === "string" &&
          new Date(freshnessCursor).getTime() > new Date(data.created_at).getTime();
      } catch (error) {
        logger.warn("failed to calculate AI runtime freshness cursor", {
          error,
          userId,
        });
      }

      if (parsed && Number.isFinite(ageMs) && ageMs <= maxAgeMs && !hasNewerUserData) {
        return {
          cache: {
            generatedAt: parsed.generatedAt,
            snapshotCreatedAt: data.created_at,
            snapshotId: data.id,
            snapshotReason: data.snapshot_reason,
            source: "snapshot",
          },
          context: parsed.context,
        };
      }
    }
  }

  const context = await getAiUserContext(supabase, userId);

  if (options?.persistSnapshot !== false) {
    try {
      const persisted = await persistAiRuntimeContextSnapshot(
        supabase,
        userId,
        context,
        snapshotReason,
      );

      return {
        cache: {
          generatedAt: persisted.generatedAt,
          snapshotCreatedAt: persisted.createdAt,
          snapshotId: persisted.snapshotId,
          snapshotReason: persisted.snapshotReason,
          source: "live",
        },
        context,
      };
    } catch (error) {
      logger.warn("failed to persist AI runtime context snapshot", {
        error,
        snapshotReason,
        userId,
      });
    }
  }

  return {
    cache: {
      generatedAt: context.structuredKnowledge.generatedAt,
      snapshotCreatedAt: null,
      snapshotId: null,
      snapshotReason,
      source: "live",
    },
    context,
  };
}
