import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createDashboardAggregateSnapshotPayload,
  createDashboardRuntimeSnapshotPayload,
  parseDashboardAggregateSnapshotPayload,
  parseDashboardRuntimeSnapshotPayload,
  type DashboardAggregateSnapshotPayload,
  type DashboardRuntimeSnapshotConfig,
  type DashboardRuntimeSnapshotPayload,
} from "@/lib/dashboard/dashboard-snapshot";
import {
  addUtcDays,
  getDateDaysAgo,
  getDaysBetween,
  getDaysSince,
  getEstimatedOneRmKg,
  getIsoTimestampDaysAgo,
  getMomentum,
  getSetTonnageKg,
  getTomorrowDateString,
  getUtcDateStringFromTimestamp,
  getUtcWeekStart,
  roundToSingleDecimal,
  toOptionalNumber,
  toSafeNumber,
  toUtcDateString,
} from "@/lib/dashboard/dashboard-utils";
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
  buildWorkoutCoachingSignals,
  type WorkoutCoachingSignal,
} from "@/lib/workout/coaching-signals";
import { formatPlannedRepTarget } from "@/lib/workout/rep-ranges";

export type DashboardSnapshot = {
  activePrograms: number;
  draftPrograms: number;
  completedDays: number;
  loggedSets: number;
  exercises: number;
  templates: number;
  aiSessions: number;
  nutritionDays: number;
};

export type DashboardMetricComparison = {
  current: number;
  previous: number;
  delta: number;
};

export type DashboardWorkoutChartPoint = {
  label: string;
  rangeLabel: string;
  completedDays: number;
  loggedSets: number;
  tonnageKg: number;
};

export type DashboardWorkoutTopExercise = {
  exerciseTitle: string;
  completedSets: number;
  avgActualReps: number | null;
  avgActualWeightKg: number | null;
  avgActualRpe: number | null;
  bestSetWeightKg: number | null;
  bestEstimatedOneRmKg: number | null;
  latestLoggedAt: string | null;
  recentCompletedSets: number;
  previousCompletedSets: number;
  recentAvgActualReps: number | null;
  previousAvgActualReps: number | null;
  repsDelta: number | null;
  recentAvgActualWeightKg: number | null;
  previousAvgActualWeightKg: number | null;
  weightDeltaKg: number | null;
  recentTonnageKg: number;
  previousTonnageKg: number;
  tonnageDeltaKg: number;
  momentum: "up" | "stable" | "down";
};

export type DashboardWorkoutRecentDayExercise = {
  exerciseTitle: string;
  loggedSets: number;
  avgActualReps: number | null;
  avgActualWeightKg: number | null;
  avgActualRpe: number | null;
  bestSetWeightKg: number | null;
  plannedRepTarget: string | null;
  tonnageKg: number;
  setNotes: string[];
};

export type DashboardWorkoutRecentDay = {
  id: string;
  dayOfWeek: number;
  completedAt: string;
  exerciseCount: number;
  loggedSets: number;
  avgActualReps: number | null;
  avgActualWeightKg: number | null;
  avgActualRpe: number | null;
  bestSetWeightKg: number | null;
  tonnageKg: number;
  bodyWeightKg: number | null;
  sessionNote: string | null;
  exerciseTitles: string[];
  exerciseDetails: DashboardWorkoutRecentDayExercise[];
};

export type DashboardWorkoutRecovery = {
  status: "fresh" | "steady" | "needs_attention";
  summary: string;
  daysSinceLastWorkout: number | null;
  avgRecoveryDays: number | null;
  longestGapDays: number | null;
  completedDaysLast14: number;
  loggedSetsLast14: number;
  avgActualRpeLast14: number | null;
  goalDaysPerWeek: number | null;
  consistencyRatio: number | null;
};

export type DashboardWorkoutCharts = {
  weeklyTrend: DashboardWorkoutChartPoint[];
  totals: {
    completedDays: number;
    loggedSets: number;
    tonnageKg: number;
  };
  highlights: {
    activeWeeks: number;
    avgActualReps: number | null;
    avgActualWeightKg: number | null;
    avgActualRpe: number | null;
    avgCompletedDaysPerWeek: number;
    avgLoggedSetsPerWorkout: number;
    hardSetShareLast14: number | null;
    bestSetWeightKg: number | null;
    bestEstimatedOneRmKg: number | null;
    latestWorkoutAt: string | null;
  };
  recovery: DashboardWorkoutRecovery;
  coachingSignals: WorkoutCoachingSignal[];
  topExercises: DashboardWorkoutTopExercise[];
  recentDays: DashboardWorkoutRecentDay[];
};

export type DashboardNutritionChartPoint = {
  label: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type DashboardNutritionRecentDay = {
  summaryDate: string;
  label: string;
  tracked: boolean;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  kcalDelta: number | null;
  proteinDelta: number | null;
  isTargetAligned: boolean | null;
};

export type DashboardNutritionCharts = {
  dailyTrend: DashboardNutritionChartPoint[];
  totals: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  averages: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  targets: {
    kcal: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  };
  highlights: {
    trackedDays: number;
    targetAlignedDays: number;
    latestTrackedAt: string | null;
    avgKcalDelta: number | null;
    avgProteinDelta: number | null;
  };
  bodyMetrics: {
    latestWeightKg: number | null;
    previousWeightKg: number | null;
    deltaKg: number | null;
    latestMeasuredAt: string | null;
    bodyFatPct: number | null;
  };
  coachingSignals: NutritionCoachingSignal[];
  mealPatterns: NutritionMealPatternStats;
  strategy: NutritionStrategyRecommendation[];
  recentDays: DashboardNutritionRecentDay[];
};

export type DashboardPeriodComparison = {
  workoutsCompleted: DashboardMetricComparison;
  caloriesTracked: DashboardMetricComparison;
  aiSessions: DashboardMetricComparison;
};

export const DASHBOARD_RUNTIME_SNAPSHOT_REASON = "dashboard_runtime_v1";
export const DASHBOARD_RUNTIME_SNAPSHOT_MAX_AGE_MS = 2 * 60 * 60 * 1000;
export const DASHBOARD_AGGREGATE_SNAPSHOT_REASON = "dashboard_aggregate_v1";
export const DASHBOARD_AGGREGATE_SNAPSHOT_MAX_AGE_MS = 4 * 60 * 60 * 1000;
export const DASHBOARD_AGGREGATE_LOOKBACK_DAYS = 180;

export type DashboardRuntimeMetrics = {
  nutritionCharts: DashboardNutritionCharts;
  periodComparison: DashboardPeriodComparison;
  snapshot: DashboardSnapshot;
  workoutCharts: DashboardWorkoutCharts;
};

export type DashboardRuntimeMetricsResult = {
  cache: {
    generatedAt: string | null;
    snapshotCreatedAt: string | null;
    snapshotId: string | null;
    snapshotReason: string | null;
    source: "live" | "snapshot";
  };
  metrics: DashboardRuntimeMetrics;
};

export type DashboardAggregateDay = {
  aiSessions: number;
  carbs: number;
  date: string;
  fat: number;
  kcal: number;
  loggedSets: number;
  protein: number;
  tonnageKg: number;
  trackedNutrition: boolean;
  workoutsCompleted: number;
};

export type DashboardAggregateBundle = {
  days: DashboardAggregateDay[];
  lookbackDays: number;
};

export type DashboardAggregateBundleResult = {
  cache: {
    generatedAt: string | null;
    snapshotCreatedAt: string | null;
    snapshotId: string | null;
    snapshotReason: string | null;
    source: "live" | "snapshot";
  };
  bundle: DashboardAggregateBundle;
};

type DashboardRuntimeSnapshotRow = {
  created_at: string;
  id: string;
  payload:
    | DashboardRuntimeSnapshotPayload<DashboardRuntimeMetrics>
    | Record<string, unknown>;
  snapshot_reason: string;
};

type DashboardAggregateSnapshotRow = {
  created_at: string;
  id: string;
  payload:
    | DashboardAggregateSnapshotPayload<DashboardAggregateBundle>
    | Record<string, unknown>;
  snapshot_reason: string;
};

type DashboardWorkoutDayAggregateRow = {
  updated_at: string;
};

type DashboardWorkoutSetAggregateRow = {
  actual_reps: number | null;
  actual_weight_kg: number | string | null;
  updated_at: string;
};

type DashboardAiSessionAggregateRow = {
  created_at: string;
};

type WorkoutSetRow = {
  set_number: number;
  planned_reps: number;
  planned_reps_min: number | null;
  planned_reps_max: number | null;
  actual_reps: number | null;
  actual_weight_kg: number | string | null;
  actual_rpe: number | string | null;
};

type WorkoutExerciseAnalyticsRow = {
  exercise_title_snapshot: string;
  updated_at: string;
  workout_sets: WorkoutSetRow[] | null;
};

type WorkoutDayAnalyticsRow = {
  id: string;
  day_of_week: number;
  updated_at: string;
  body_weight_kg: number | string | null;
  session_note: string | null;
  workout_exercises:
    | Array<{
        exercise_title_snapshot: string;
        workout_sets: WorkoutSetRow[] | null;
      }>
    | null;
};

type WorkoutSetAnalyticsRow = {
  updated_at: string;
  actual_reps: number | null;
  actual_weight_kg: number | string | null;
  actual_rpe: number | string | null;
};

type GoalAnalyticsRow = {
  weekly_training_days: number | null;
};

type GoalNutritionAnalyticsRow = {
  goal_type: string | null;
  target_weight_kg: number | null;
};

type NutritionSummaryRow = {
  summary_date: string;
  kcal: number | null;
  protein: number | string | null;
  fat: number | string | null;
  carbs: number | string | null;
};

type NutritionTargetsRow = {
  kcal_target: number | null;
  protein_target: number | null;
  fat_target: number | null;
  carbs_target: number | null;
};

type BodyMetricRow = {
  weight_kg: number | string | null;
  body_fat_pct: number | string | null;
  measured_at: string;
};

type NutritionMealAnalyticsRow = {
  id: string;
  eaten_at: string;
};

type NutritionMealItemAnalyticsRow = {
  meal_id: string;
  food_name_snapshot: string;
  servings: number | string | null;
  kcal: number | string | null;
  protein: number | string | null;
  fat: number | string | null;
  carbs: number | string | null;
};

const shortDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

const rangeDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  timeZone: "UTC",
});

const dayLabelFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

function buildRecoverySummary(input: {
  consistencyRatio: number | null;
  daysSinceLastWorkout: number | null;
  loggedSetsLast14: number;
  goalDaysPerWeek: number | null;
  status: DashboardWorkoutRecovery["status"];
}) {
  if (input.daysSinceLastWorkout === null) {
    return "Пока нет завершённых тренировок. После первых сессий здесь появится сигнал по ритму и восстановлению.";
  }

  if (input.status === "fresh") {
    return input.goalDaysPerWeek
      ? `Ритм держится близко к цели: за последние 14 дней выполнено ${input.loggedSetsLast14} рабочих подходов, а пауза после последней тренировки всего ${input.daysSinceLastWorkout} дн.`
      : `Ритм сейчас хороший: последняя тренировка была ${input.daysSinceLastWorkout} дн. назад, а рабочие подходы фиксируются стабильно.`;
  }

  if (input.status === "steady") {
    return input.consistencyRatio !== null
      ? `Темп остаётся рабочим, но есть запас для более ровного графика: выполнено ${Math.round(input.consistencyRatio * 100)}% от целевого ритма за последние 14 дней.`
      : "Темп остаётся рабочим. Следующая задача — удерживать более стабильный график без длинных пауз.";
  }

  return "Есть сигнал просадки по ритму: стоит вернуться к регулярности, прежде чем AI будет повышать объём в новых рекомендациях.";
}

function buildWeeklyTrendSkeleton(weeks: number) {
  const currentWeekStart = getUtcWeekStart(new Date());

  return Array.from({ length: weeks }, (_, index) => {
    const weekStart = addUtcDays(currentWeekStart, (index - weeks + 1) * 7);
    const weekEnd = addUtcDays(weekStart, 6);

    return {
      weekStart,
      weekEnd,
      label: shortDateFormatter.format(weekStart),
      rangeLabel: `${rangeDateFormatter.format(weekStart)} - ${rangeDateFormatter.format(weekEnd)}`,
      completedDays: 0,
      loggedSets: 0,
      tonnageKg: 0,
    };
  });
}

function getWeeklyTrendIndex(
  weekStartsAt: Date,
  bucketStart: Date,
  totalBuckets: number,
) {
  const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
  const index = Math.floor(
    (weekStartsAt.getTime() - bucketStart.getTime()) / millisecondsPerWeek,
  );

  if (index < 0 || index >= totalBuckets) {
    return null;
  }

  return index;
}

export async function getDashboardSnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<DashboardSnapshot> {
  const [
    activeProgramsResult,
    draftProgramsResult,
    completedDaysResult,
    loggedSetsResult,
    exercisesResult,
    templatesResult,
    aiSessionsResult,
    nutritionDaysResult,
  ] = await Promise.all([
    supabase
      .from("weekly_programs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase
      .from("weekly_programs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "draft"),
    supabase
      .from("workout_days")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "done"),
    supabase
      .from("workout_sets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("actual_reps", "is", null),
    supabase
      .from("exercise_library")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_archived", false),
    supabase
      .from("workout_templates")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("ai_chat_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("daily_nutrition_summaries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const failedResult = [
    activeProgramsResult,
    draftProgramsResult,
    completedDaysResult,
    loggedSetsResult,
    exercisesResult,
    templatesResult,
    aiSessionsResult,
    nutritionDaysResult,
  ].find((result) => result.error);

  if (failedResult?.error) {
    throw failedResult.error;
  }

  return {
    activePrograms: activeProgramsResult.count ?? 0,
    draftPrograms: draftProgramsResult.count ?? 0,
    completedDays: completedDaysResult.count ?? 0,
    loggedSets: loggedSetsResult.count ?? 0,
    exercises: exercisesResult.count ?? 0,
    templates: templatesResult.count ?? 0,
    aiSessions: aiSessionsResult.count ?? 0,
    nutritionDays: nutritionDaysResult.count ?? 0,
  };
}

export async function getDashboardWorkoutCharts(
  supabase: SupabaseClient,
  userId: string,
  weeks: number,
): Promise<DashboardWorkoutCharts> {
  const weeklyTrend = buildWeeklyTrendSkeleton(weeks);
  const oldestWeekStart = weeklyTrend[0]?.weekStart;

  if (!oldestWeekStart) {
    return {
      weeklyTrend: [],
      totals: {
        completedDays: 0,
        loggedSets: 0,
        tonnageKg: 0,
      },
      highlights: {
        activeWeeks: 0,
        avgActualReps: null,
        avgActualWeightKg: null,
        avgActualRpe: null,
        avgCompletedDaysPerWeek: 0,
        avgLoggedSetsPerWorkout: 0,
        hardSetShareLast14: null,
        bestSetWeightKg: null,
        bestEstimatedOneRmKg: null,
        latestWorkoutAt: null,
      },
      recovery: {
        status: "needs_attention",
        summary:
          "Пока нет завершённых тренировок. После первых сессий здесь появится сигнал по ритму и восстановлению.",
        daysSinceLastWorkout: null,
        avgRecoveryDays: null,
        longestGapDays: null,
        completedDaysLast14: 0,
        loggedSetsLast14: 0,
        avgActualRpeLast14: null,
        goalDaysPerWeek: null,
        consistencyRatio: null,
      },
      coachingSignals: [],
      topExercises: [],
      recentDays: [],
    };
  }

  const recoveryWindowStart = getIsoTimestampDaysAgo(14);
  const recentExerciseSplitTimestamp = getIsoTimestampDaysAgo(28);

  const [
    completedDaysResult,
    loggedSetsResult,
    exerciseAnalyticsResult,
    recentDaysResult,
    goalResult,
  ] =
    await Promise.all([
      supabase
        .from("workout_days")
        .select("updated_at")
        .eq("user_id", userId)
        .eq("status", "done")
        .gte("updated_at", oldestWeekStart.toISOString()),
      supabase
        .from("workout_sets")
        .select("updated_at, actual_reps, actual_weight_kg, actual_rpe")
        .eq("user_id", userId)
        .not("actual_reps", "is", null)
        .gte("updated_at", oldestWeekStart.toISOString()),
      supabase
        .from("workout_exercises")
        .select(
          "exercise_title_snapshot, updated_at, workout_sets(set_number, planned_reps, planned_reps_min, planned_reps_max, actual_reps, actual_weight_kg, actual_rpe)",
        )
        .eq("user_id", userId)
        .gte("updated_at", oldestWeekStart.toISOString())
        .order("updated_at", { ascending: false }),
      supabase
        .from("workout_days")
        .select(
          "id, day_of_week, updated_at, body_weight_kg, session_note, workout_exercises(exercise_title_snapshot, workout_sets(set_number, planned_reps, planned_reps_min, planned_reps_max, actual_reps, actual_weight_kg, actual_rpe))",
        )
        .eq("user_id", userId)
        .eq("status", "done")
        .order("updated_at", { ascending: false })
        .limit(6),
      supabase
        .from("goals")
        .select("weekly_training_days")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (completedDaysResult.error) {
    throw completedDaysResult.error;
  }

  if (loggedSetsResult.error) {
    throw loggedSetsResult.error;
  }

  if (exerciseAnalyticsResult.error) {
    throw exerciseAnalyticsResult.error;
  }

  if (recentDaysResult.error) {
    throw recentDaysResult.error;
  }

  if (goalResult.error) {
    throw goalResult.error;
  }

  for (const row of completedDaysResult.data ?? []) {
    const weekIndex = getWeeklyTrendIndex(
      getUtcWeekStart(new Date(row.updated_at)),
      oldestWeekStart,
      weeklyTrend.length,
    );

    if (weekIndex == null) {
      continue;
    }

    weeklyTrend[weekIndex].completedDays += 1;
  }

  const loggedSetRows =
    (loggedSetsResult.data as WorkoutSetAnalyticsRow[] | null) ?? [];

  for (const row of loggedSetRows) {
    const weekIndex = getWeeklyTrendIndex(
      getUtcWeekStart(new Date(row.updated_at)),
      oldestWeekStart,
      weeklyTrend.length,
    );

    if (weekIndex == null) {
      continue;
    }

    weeklyTrend[weekIndex].loggedSets += 1;
    weeklyTrend[weekIndex].tonnageKg += getSetTonnageKg(
      row.actual_reps,
      toOptionalNumber(row.actual_weight_kg),
    );
  }

  const exerciseStats = new Map<
    string,
    {
      completedSets: number;
      repsTotal: number;
      repsSamples: number;
      weightTotal: number;
      weightSamples: number;
      rpeTotal: number;
      rpeSamples: number;
      tonnageKg: number;
      bestSetWeightKg: number | null;
      bestEstimatedOneRmKg: number | null;
      latestLoggedAt: string | null;
      recentCompletedSets: number;
      previousCompletedSets: number;
      recentRepsTotal: number;
      recentRepsSamples: number;
      previousRepsTotal: number;
      previousRepsSamples: number;
      recentWeightTotal: number;
      recentWeightSamples: number;
      previousWeightTotal: number;
      previousWeightSamples: number;
      recentTonnageKg: number;
      previousTonnageKg: number;
    }
  >();
  let totalLoggedReps = 0;
  let totalLoggedRepSamples = 0;
  let totalLoggedWeight = 0;
  let totalLoggedWeightSamples = 0;
  let totalLoggedRpe = 0;
  let totalLoggedRpeSamples = 0;
  let recentWindowCompletedSets = 0;
  let previousWindowCompletedSets = 0;
  let recentWindowTonnageKg = 0;
  let previousWindowTonnageKg = 0;
  let recentWindowWeightTotal = 0;
  let recentWindowWeightSamples = 0;
  let previousWindowWeightTotal = 0;
  let previousWindowWeightSamples = 0;
  let bestSetWeightKg: number | null = null;
  let bestEstimatedOneRmKg: number | null = null;

  const exerciseRows =
    (exerciseAnalyticsResult.data as WorkoutExerciseAnalyticsRow[] | null) ?? [];

  for (const row of exerciseRows) {
    const title = row.exercise_title_snapshot.trim() || "Без названия";
    const loggedSets = (row.workout_sets ?? []).flatMap((set) =>
      typeof set.actual_reps === "number"
          ? [
            {
              actualReps: set.actual_reps,
              actualWeightKg: toOptionalNumber(set.actual_weight_kg),
              actualRpe: toOptionalNumber(set.actual_rpe),
            },
          ]
        : [],
    );

    if (!loggedSets.length) {
      continue;
    }

    const current = exerciseStats.get(title) ?? {
      completedSets: 0,
      repsTotal: 0,
      repsSamples: 0,
      weightTotal: 0,
      weightSamples: 0,
      rpeTotal: 0,
      rpeSamples: 0,
      tonnageKg: 0,
      bestSetWeightKg: null,
      bestEstimatedOneRmKg: null,
      latestLoggedAt: null,
      recentCompletedSets: 0,
      previousCompletedSets: 0,
      recentRepsTotal: 0,
      recentRepsSamples: 0,
      previousRepsTotal: 0,
      previousRepsSamples: 0,
      recentWeightTotal: 0,
      recentWeightSamples: 0,
      previousWeightTotal: 0,
      previousWeightSamples: 0,
      recentTonnageKg: 0,
      previousTonnageKg: 0,
    };
    const isRecentWindow =
      new Date(row.updated_at).getTime() >= new Date(recentExerciseSplitTimestamp).getTime();
    const repsTotal = loggedSets.reduce((sum, set) => sum + set.actualReps, 0);
    const repsSamples = loggedSets.length;
    const weightValues = loggedSets.flatMap((set) =>
      set.actualWeightKg !== null ? [set.actualWeightKg] : [],
    );
    const weightTotal = weightValues.reduce((sum, value) => sum + value, 0);
    const weightSamples = weightValues.length;
    const rpeValues = loggedSets.flatMap((set) =>
      set.actualRpe !== null ? [set.actualRpe] : [],
    );
    const rpeTotal = rpeValues.reduce((sum, value) => sum + value, 0);
    const rpeSamples = rpeValues.length;
    const tonnageKg = loggedSets.reduce(
      (sum, set) => sum + getSetTonnageKg(set.actualReps, set.actualWeightKg),
      0,
    );
    const exerciseBestWeight =
      weightValues.length > 0 ? Math.max(...weightValues) : null;
    const exerciseBestEstimatedOneRm = loggedSets.reduce<number | null>(
      (best, set) => {
        const nextValue = getEstimatedOneRmKg(set.actualReps, set.actualWeightKg);
        if (nextValue === null) {
          return best;
        }

        return best === null ? nextValue : Math.max(best, nextValue);
      },
      null,
    );

    exerciseStats.set(title, {
      completedSets: current.completedSets + loggedSets.length,
      repsTotal: current.repsTotal + repsTotal,
      repsSamples: current.repsSamples + repsSamples,
      weightTotal: current.weightTotal + weightTotal,
      weightSamples: current.weightSamples + weightSamples,
      rpeTotal: current.rpeTotal + rpeTotal,
      rpeSamples: current.rpeSamples + rpeSamples,
      tonnageKg: current.tonnageKg + tonnageKg,
      bestSetWeightKg:
        current.bestSetWeightKg === null
          ? exerciseBestWeight
          : exerciseBestWeight === null
            ? current.bestSetWeightKg
            : Math.max(current.bestSetWeightKg, exerciseBestWeight),
      bestEstimatedOneRmKg:
        current.bestEstimatedOneRmKg === null
          ? exerciseBestEstimatedOneRm
          : exerciseBestEstimatedOneRm === null
            ? current.bestEstimatedOneRmKg
            : Math.max(current.bestEstimatedOneRmKg, exerciseBestEstimatedOneRm),
      latestLoggedAt:
        !current.latestLoggedAt ||
        new Date(row.updated_at).getTime() > new Date(current.latestLoggedAt).getTime()
          ? row.updated_at
          : current.latestLoggedAt,
      recentCompletedSets:
        current.recentCompletedSets + (isRecentWindow ? repsSamples : 0),
      previousCompletedSets:
        current.previousCompletedSets + (isRecentWindow ? 0 : repsSamples),
      recentRepsTotal: current.recentRepsTotal + (isRecentWindow ? repsTotal : 0),
      recentRepsSamples:
        current.recentRepsSamples + (isRecentWindow ? repsSamples : 0),
      previousRepsTotal:
        current.previousRepsTotal + (isRecentWindow ? 0 : repsTotal),
      previousRepsSamples:
        current.previousRepsSamples + (isRecentWindow ? 0 : repsSamples),
      recentWeightTotal:
        current.recentWeightTotal + (isRecentWindow ? weightTotal : 0),
      recentWeightSamples:
        current.recentWeightSamples + (isRecentWindow ? weightSamples : 0),
      previousWeightTotal:
        current.previousWeightTotal + (isRecentWindow ? 0 : weightTotal),
      previousWeightSamples:
        current.previousWeightSamples + (isRecentWindow ? 0 : weightSamples),
      recentTonnageKg:
        current.recentTonnageKg + (isRecentWindow ? tonnageKg : 0),
      previousTonnageKg:
        current.previousTonnageKg + (isRecentWindow ? 0 : tonnageKg),
    });
    totalLoggedReps += repsTotal;
    totalLoggedRepSamples += repsSamples;
    totalLoggedWeight += weightTotal;
    totalLoggedWeightSamples += weightSamples;
    totalLoggedRpe += rpeTotal;
    totalLoggedRpeSamples += rpeSamples;
    if (isRecentWindow) {
      recentWindowCompletedSets += loggedSets.length;
      recentWindowTonnageKg += tonnageKg;
      recentWindowWeightTotal += weightTotal;
      recentWindowWeightSamples += weightSamples;
    } else {
      previousWindowCompletedSets += loggedSets.length;
      previousWindowTonnageKg += tonnageKg;
      previousWindowWeightTotal += weightTotal;
      previousWindowWeightSamples += weightSamples;
    }
    bestSetWeightKg =
      bestSetWeightKg === null
        ? exerciseBestWeight
        : exerciseBestWeight === null
          ? bestSetWeightKg
          : Math.max(bestSetWeightKg, exerciseBestWeight);
    bestEstimatedOneRmKg =
      bestEstimatedOneRmKg === null
        ? exerciseBestEstimatedOneRm
        : exerciseBestEstimatedOneRm === null
          ? bestEstimatedOneRmKg
          : Math.max(bestEstimatedOneRmKg, exerciseBestEstimatedOneRm);
  }

  const topExercises = Array.from(exerciseStats.entries())
    .map(([exerciseTitle, stats]) => {
      const recentAvgActualReps = stats.recentRepsSamples
        ? roundToSingleDecimal(stats.recentRepsTotal / stats.recentRepsSamples)
        : null;
      const previousAvgActualReps = stats.previousRepsSamples
        ? roundToSingleDecimal(stats.previousRepsTotal / stats.previousRepsSamples)
        : null;
      const repsDelta =
        recentAvgActualReps !== null && previousAvgActualReps !== null
          ? roundToSingleDecimal(recentAvgActualReps - previousAvgActualReps)
          : null;
      const recentAvgActualWeightKg = stats.recentWeightSamples
        ? roundToSingleDecimal(stats.recentWeightTotal / stats.recentWeightSamples)
        : null;
      const previousAvgActualWeightKg = stats.previousWeightSamples
        ? roundToSingleDecimal(stats.previousWeightTotal / stats.previousWeightSamples)
        : null;
      const weightDeltaKg =
        recentAvgActualWeightKg !== null && previousAvgActualWeightKg !== null
          ? roundToSingleDecimal(recentAvgActualWeightKg - previousAvgActualWeightKg)
          : null;

      return {
        exerciseTitle,
        completedSets: stats.completedSets,
        avgActualReps: stats.repsSamples
          ? roundToSingleDecimal(stats.repsTotal / stats.repsSamples)
          : null,
        avgActualWeightKg: stats.weightSamples
          ? roundToSingleDecimal(stats.weightTotal / stats.weightSamples)
          : null,
        avgActualRpe: stats.rpeSamples
          ? roundToSingleDecimal(stats.rpeTotal / stats.rpeSamples)
          : null,
        bestSetWeightKg: stats.bestSetWeightKg,
        bestEstimatedOneRmKg:
          stats.bestEstimatedOneRmKg !== null
            ? roundToSingleDecimal(stats.bestEstimatedOneRmKg)
            : null,
        latestLoggedAt: stats.latestLoggedAt,
        recentCompletedSets: stats.recentCompletedSets,
        previousCompletedSets: stats.previousCompletedSets,
        recentAvgActualReps,
        previousAvgActualReps,
        repsDelta,
        recentAvgActualWeightKg,
        previousAvgActualWeightKg,
        weightDeltaKg,
        recentTonnageKg: roundToSingleDecimal(stats.recentTonnageKg),
        previousTonnageKg: roundToSingleDecimal(stats.previousTonnageKg),
        tonnageDeltaKg: roundToSingleDecimal(
          stats.recentTonnageKg - stats.previousTonnageKg,
        ),
        momentum: getMomentum(
          stats.recentCompletedSets,
          stats.previousCompletedSets,
          repsDelta,
        ),
      };
    })
    .sort((left, right) => {
      if (right.completedSets !== left.completedSets) {
        return right.completedSets - left.completedSets;
      }

      return (
        new Date(right.latestLoggedAt ?? 0).getTime() -
        new Date(left.latestLoggedAt ?? 0).getTime()
      );
    })
    .slice(0, 6);

  const recentDays =
    ((recentDaysResult.data as WorkoutDayAnalyticsRow[] | null) ?? []).map((row) => {
      const exercises = row.workout_exercises ?? [];
      const exerciseDetails = exercises
        .map((exercise) => {
          const loggedSets = (exercise.workout_sets ?? []).flatMap((set) =>
            typeof set.actual_reps === "number"
              ? [
                {
                  setNumber: set.set_number ?? 0,
                  actualReps: set.actual_reps,
                  actualWeightKg: toOptionalNumber(set.actual_weight_kg),
                  actualRpe: toOptionalNumber(set.actual_rpe),
                  plannedRepTarget: formatPlannedRepTarget(set),
                },
              ]
              : [],
          );
          const representativeSet =
            exercise.workout_sets?.find(
              (set) =>
                set.planned_reps > 0 ||
                set.planned_reps_min !== null ||
                set.planned_reps_max !== null,
            ) ?? null;
          const weightValues = loggedSets.flatMap((set) =>
            set.actualWeightKg !== null ? [set.actualWeightKg] : [],
          );
          const rpeValues = loggedSets.flatMap((set) =>
            set.actualRpe !== null ? [set.actualRpe] : [],
          );
          const tonnageKg = loggedSets.reduce(
            (sum, set) => sum + getSetTonnageKg(set.actualReps, set.actualWeightKg),
            0,
          );

          return {
            exerciseTitle: exercise.exercise_title_snapshot.trim() || "Без названия",
            loggedSets: loggedSets.length,
            avgActualReps: loggedSets.length
              ? roundToSingleDecimal(
                  loggedSets.reduce((sum, set) => sum + set.actualReps, 0) /
                    loggedSets.length,
                )
              : null,
            avgActualWeightKg: weightValues.length
              ? roundToSingleDecimal(
                  weightValues.reduce((sum, value) => sum + value, 0) /
                    weightValues.length,
                )
              : null,
            avgActualRpe: rpeValues.length
              ? roundToSingleDecimal(
                  rpeValues.reduce((sum, value) => sum + value, 0) / rpeValues.length,
                )
              : null,
            bestSetWeightKg: weightValues.length ? Math.max(...weightValues) : null,
            plannedRepTarget: representativeSet
              ? formatPlannedRepTarget(representativeSet)
              : null,
            tonnageKg: roundToSingleDecimal(tonnageKg),
            setNotes: loggedSets.map((set) => {
              const weightLabel =
                set.actualWeightKg !== null
                  ? `${set.actualWeightKg.toLocaleString("ru-RU", {
                      minimumFractionDigits: set.actualWeightKg % 1 === 0 ? 0 : 1,
                      maximumFractionDigits: 2,
                    })} кг`
                  : "без веса";
              const rpeLabel =
                set.actualRpe !== null
                  ? ` · RPE ${set.actualRpe.toLocaleString("ru-RU", {
                      minimumFractionDigits: set.actualRpe % 1 === 0 ? 0 : 1,
                      maximumFractionDigits: 1,
                    })}`
                  : "";

              return `Сет ${set.setNumber}: ${set.actualReps} повт. · ${weightLabel}${rpeLabel} · план ${set.plannedRepTarget}`;
            }),
          };
        })
        .filter((exercise) => exercise.loggedSets > 0 || exercise.exerciseTitle.length > 0)
        .sort((left, right) => right.tonnageKg - left.tonnageKg);
      const loggedSets = exercises.flatMap((exercise) =>
        (exercise.workout_sets ?? []).flatMap((set) =>
          typeof set.actual_reps === "number"
            ? [
                {
                  actualReps: set.actual_reps,
                  actualWeightKg: toOptionalNumber(set.actual_weight_kg),
                  actualRpe: toOptionalNumber(set.actual_rpe),
                },
              ]
            : [],
        ),
      );
      const weightValues = loggedSets.flatMap((set) =>
        set.actualWeightKg !== null ? [set.actualWeightKg] : [],
      );
      const rpeValues = loggedSets.flatMap((set) =>
        set.actualRpe !== null ? [set.actualRpe] : [],
      );

      return {
        id: row.id,
        dayOfWeek: row.day_of_week,
        completedAt: row.updated_at,
        exerciseCount: exercises.length,
        loggedSets: loggedSets.length,
        avgActualReps: loggedSets.length
          ? roundToSingleDecimal(
              loggedSets.reduce((sum, set) => sum + set.actualReps, 0) /
                loggedSets.length,
            )
          : null,
        avgActualWeightKg: weightValues.length
          ? roundToSingleDecimal(
              weightValues.reduce((sum, value) => sum + value, 0) /
                weightValues.length,
            )
          : null,
        avgActualRpe: rpeValues.length
          ? roundToSingleDecimal(
              rpeValues.reduce((sum, value) => sum + value, 0) / rpeValues.length,
            )
          : null,
        bestSetWeightKg: weightValues.length ? Math.max(...weightValues) : null,
        tonnageKg: roundToSingleDecimal(
          loggedSets.reduce(
            (sum, set) => sum + getSetTonnageKg(set.actualReps, set.actualWeightKg),
            0,
          ),
        ),
        bodyWeightKg: toOptionalNumber(row.body_weight_kg),
        sessionNote: row.session_note,
        exerciseTitles: exerciseDetails.map((exercise) => exercise.exerciseTitle).slice(0, 4),
        exerciseDetails,
      };
    }) ?? [];

  const totalCompletedDays = weeklyTrend.reduce(
    (sum, bucket) => sum + bucket.completedDays,
    0,
  );
  const totalLoggedSets = weeklyTrend.reduce((sum, bucket) => sum + bucket.loggedSets, 0);
  const totalTonnageKg = weeklyTrend.reduce((sum, bucket) => sum + bucket.tonnageKg, 0);
  const activeWeeks = weeklyTrend.filter(
    (bucket) =>
      bucket.completedDays > 0 || bucket.loggedSets > 0 || bucket.tonnageKg > 0,
  ).length;
  const completedDayTimestamps = (completedDaysResult.data ?? [])
    .map((row) => row.updated_at)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());
  const loggedSetTimestamps = loggedSetRows
    .map((row) => row.updated_at)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());
  const recoveryGaps = completedDayTimestamps.slice(0, -1).map((value, index) =>
    getDaysBetween(value, completedDayTimestamps[index + 1]),
  );
  const completedDaysLast14 = completedDayTimestamps.filter(
    (value) => new Date(value).getTime() >= new Date(recoveryWindowStart).getTime(),
  ).length;
  const loggedSetsLast14 = loggedSetTimestamps.filter(
    (value) => new Date(value).getTime() >= new Date(recoveryWindowStart).getTime(),
  ).length;
  const rpeValuesLast14 = loggedSetRows
    .filter(
      (row) =>
        new Date(row.updated_at).getTime() >= new Date(recoveryWindowStart).getTime(),
    )
    .flatMap((row) => {
      const value = toOptionalNumber(row.actual_rpe);
      return value !== null ? [value] : [];
    });
  const avgActualRpeLast14 = rpeValuesLast14.length
    ? roundToSingleDecimal(
        rpeValuesLast14.reduce((sum, value) => sum + value, 0) /
          rpeValuesLast14.length,
      )
    : null;
  const hardSetShareLast14 = rpeValuesLast14.length
    ? roundToSingleDecimal(
        rpeValuesLast14.filter((value) => value >= 8.5).length /
          rpeValuesLast14.length,
      )
    : null;
  const goalDaysPerWeek =
    (goalResult.data as GoalAnalyticsRow | null)?.weekly_training_days ?? null;
  const consistencyRatio =
    goalDaysPerWeek && goalDaysPerWeek > 0
      ? roundToSingleDecimal(completedDaysLast14 / (goalDaysPerWeek * 2))
      : null;
  const daysSinceLastWorkout = getDaysSince(completedDayTimestamps[0] ?? null);
  const recoveryStatus: DashboardWorkoutRecovery["status"] =
    daysSinceLastWorkout === null
      ? "needs_attention"
      : consistencyRatio !== null
        ? daysSinceLastWorkout <= 2 && consistencyRatio >= 0.9
          ? "fresh"
          : daysSinceLastWorkout <= 4 && consistencyRatio >= 0.55
            ? "steady"
            : "needs_attention"
        : daysSinceLastWorkout <= 3
          ? "steady"
          : "needs_attention";
  const recovery: DashboardWorkoutRecovery = {
    status: recoveryStatus,
    summary: buildRecoverySummary({
      consistencyRatio,
      daysSinceLastWorkout,
      loggedSetsLast14,
      goalDaysPerWeek,
      status: recoveryStatus,
    }),
    daysSinceLastWorkout,
    avgRecoveryDays: recoveryGaps.length
      ? roundToSingleDecimal(
          recoveryGaps.reduce((sum, value) => sum + value, 0) / recoveryGaps.length,
        )
      : null,
    longestGapDays: recoveryGaps.length ? Math.max(...recoveryGaps) : null,
    completedDaysLast14,
    loggedSetsLast14,
    avgActualRpeLast14,
    goalDaysPerWeek,
    consistencyRatio,
  };
  const recentAvgActualWeightKg = recentWindowWeightSamples
    ? roundToSingleDecimal(recentWindowWeightTotal / recentWindowWeightSamples)
    : null;
  const previousAvgActualWeightKg = previousWindowWeightSamples
    ? roundToSingleDecimal(previousWindowWeightTotal / previousWindowWeightSamples)
    : null;
  const focusExercise =
    [...topExercises]
      .filter(
        (exercise) =>
          exercise.recentCompletedSets > 0 || exercise.previousCompletedSets > 0,
      )
      .sort((left, right) => {
        const leftPriority =
          left.momentum === "down" ? 3 : left.momentum === "up" ? 2 : 1;
        const rightPriority =
          right.momentum === "down" ? 3 : right.momentum === "up" ? 2 : 1;

        if (rightPriority !== leftPriority) {
          return rightPriority - leftPriority;
        }

        return (
          Math.abs(right.tonnageDeltaKg) - Math.abs(left.tonnageDeltaKg)
        );
      })
      .at(0) ?? null;
  const coachingSignals = buildWorkoutCoachingSignals({
    recentCompletedDays: completedDaysLast14,
    recentCompletedSets: recentWindowCompletedSets,
    previousCompletedSets: previousWindowCompletedSets,
    recentTonnageKg: roundToSingleDecimal(recentWindowTonnageKg),
    previousTonnageKg: roundToSingleDecimal(previousWindowTonnageKg),
    recentAvgActualWeightKg,
    previousAvgActualWeightKg,
    avgActualRpeRecent: avgActualRpeLast14,
    hardSetShareRecent: hardSetShareLast14,
    avgRestSecondsRecent: null,
    notedSetsRecent: 0,
    daysSinceLastWorkout,
    consistencyRatio,
    goalDaysPerWeek,
    focusExercise: focusExercise
      ? {
          exerciseTitle: focusExercise.exerciseTitle,
          momentum: focusExercise.momentum,
          tonnageDeltaKg: focusExercise.tonnageDeltaKg,
          weightDeltaKg: focusExercise.weightDeltaKg,
          recentCompletedSets: focusExercise.recentCompletedSets,
          previousCompletedSets: focusExercise.previousCompletedSets,
        }
      : null,
  });

  return {
    weeklyTrend: weeklyTrend.map((bucket) => ({
      label: bucket.label,
      rangeLabel: bucket.rangeLabel,
      completedDays: bucket.completedDays,
      loggedSets: bucket.loggedSets,
      tonnageKg: roundToSingleDecimal(bucket.tonnageKg),
    })),
    totals: {
      completedDays: totalCompletedDays,
      loggedSets: totalLoggedSets,
      tonnageKg: roundToSingleDecimal(totalTonnageKg),
    },
    highlights: {
      activeWeeks,
      avgActualReps: totalLoggedRepSamples
        ? roundToSingleDecimal(totalLoggedReps / totalLoggedRepSamples)
        : null,
      avgActualWeightKg: totalLoggedWeightSamples
        ? roundToSingleDecimal(totalLoggedWeight / totalLoggedWeightSamples)
        : null,
      avgActualRpe: totalLoggedRpeSamples
        ? roundToSingleDecimal(totalLoggedRpe / totalLoggedRpeSamples)
        : null,
      avgCompletedDaysPerWeek: activeWeeks
        ? roundToSingleDecimal(totalCompletedDays / activeWeeks)
        : 0,
      avgLoggedSetsPerWorkout: totalCompletedDays
        ? roundToSingleDecimal(totalLoggedSets / totalCompletedDays)
        : 0,
      hardSetShareLast14,
      bestSetWeightKg,
      bestEstimatedOneRmKg:
        bestEstimatedOneRmKg !== null
          ? roundToSingleDecimal(bestEstimatedOneRmKg)
          : null,
      latestWorkoutAt: recentDays[0]?.completedAt ?? null,
    },
    recovery,
    coachingSignals,
    topExercises,
    recentDays,
  };
}

export async function getDashboardNutritionCharts(
  supabase: SupabaseClient,
  userId: string,
  days: number,
): Promise<DashboardNutritionCharts> {
  const dailyTrend = Array.from({ length: days }, (_, index) => {
    const date = getDateDaysAgo(days - index - 1);
    const summaryDate = toUtcDateString(date);

    return {
      summaryDate,
      label: dayLabelFormatter.format(date),
      tracked: false,
      kcal: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    };
  });

  const summariesByDate = new Map(
    dailyTrend.map((point) => [point.summaryDate, point]),
  );

  const oldestDate = dailyTrend[0]?.summaryDate;

  if (!oldestDate) {
    return {
      dailyTrend: [],
      totals: { kcal: 0, protein: 0, fat: 0, carbs: 0 },
      averages: { kcal: 0, protein: 0, fat: 0, carbs: 0 },
      targets: { kcal: null, protein: null, fat: null, carbs: null },
      highlights: {
        trackedDays: 0,
        targetAlignedDays: 0,
        latestTrackedAt: null,
        avgKcalDelta: null,
        avgProteinDelta: null,
      },
      bodyMetrics: {
        latestWeightKg: null,
        previousWeightKg: null,
        deltaKg: null,
        latestMeasuredAt: null,
        bodyFatPct: null,
      },
      coachingSignals: [],
      mealPatterns: buildNutritionMealPatternStats([]),
      strategy: [],
      recentDays: [],
    };
  }

  const mealPatternWindowStart = getIsoTimestampDaysAgo(14);
  const [summariesResult, targetsResult, bodyMetricsResult, goalResult, mealsResult] =
    await Promise.all([
    supabase
      .from("daily_nutrition_summaries")
      .select("summary_date, kcal, protein, fat, carbs")
      .eq("user_id", userId)
      .gte("summary_date", oldestDate)
      .lt("summary_date", getTomorrowDateString()),
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
      .limit(2),
    supabase
      .from("goals")
      .select("goal_type, target_weight_kg")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("meals")
      .select("id, eaten_at")
      .eq("user_id", userId)
      .gte("eaten_at", mealPatternWindowStart)
      .order("eaten_at", { ascending: false }),
  ]);

  if (summariesResult.error) {
    throw summariesResult.error;
  }

  if (targetsResult.error) {
    throw targetsResult.error;
  }

  if (bodyMetricsResult.error) {
    throw bodyMetricsResult.error;
  }

  if (goalResult.error) {
    throw goalResult.error;
  }

  if (mealsResult.error) {
    throw mealsResult.error;
  }

  const summaryRows = (summariesResult.data as NutritionSummaryRow[] | null) ?? [];
  const mealRows = (mealsResult.data as NutritionMealAnalyticsRow[] | null) ?? [];
  const mealItemsResult = mealRows.length
    ? await supabase
        .from("meal_items")
        .select(
          "meal_id, food_name_snapshot, servings, kcal, protein, fat, carbs",
        )
        .eq("user_id", userId)
        .in(
          "meal_id",
          mealRows.map((meal) => meal.id),
        )
    : { data: [], error: null };

  if (mealItemsResult.error) {
    throw mealItemsResult.error;
  }

  const mealItemsRows =
    (mealItemsResult.data as NutritionMealItemAnalyticsRow[] | null) ?? [];

  for (const row of summaryRows) {
    const point = summariesByDate.get(row.summary_date);

    if (!point) {
      continue;
    }

    point.tracked = true;
    point.kcal = row.kcal ?? 0;
    point.protein = toSafeNumber(row.protein);
    point.fat = toSafeNumber(row.fat);
    point.carbs = toSafeNumber(row.carbs);
  }

  const trackedPoints = dailyTrend.filter((point) => point.tracked);
  const totals = trackedPoints.reduce(
    (accumulator, point) => ({
      kcal: accumulator.kcal + point.kcal,
      protein: accumulator.protein + point.protein,
      fat: accumulator.fat + point.fat,
      carbs: accumulator.carbs + point.carbs,
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );
  const trackedDays = trackedPoints.length;
  const targets = (targetsResult.data as NutritionTargetsRow | null) ?? null;

  const recentDays = [...dailyTrend]
    .reverse()
    .map((point) => {
      const kcalDelta =
        point.tracked && targets?.kcal_target !== null && targets?.kcal_target !== undefined
          ? point.kcal - targets.kcal_target
          : null;
      const proteinDelta =
        point.tracked &&
        targets?.protein_target !== null &&
        targets?.protein_target !== undefined
          ? point.protein - targets.protein_target
          : null;
      const isTargetAligned =
        point.tracked && (kcalDelta !== null || proteinDelta !== null)
          ? (kcalDelta === null || Math.abs(kcalDelta) <= 200) &&
            (proteinDelta === null || proteinDelta >= -10)
          : null;

      return {
        summaryDate: point.summaryDate,
        label: point.label,
        tracked: point.tracked,
        kcal: point.kcal,
        protein: point.protein,
        fat: point.fat,
        carbs: point.carbs,
        kcalDelta,
        proteinDelta,
        isTargetAligned,
      };
    });

  const bodyMetricsRows = (bodyMetricsResult.data as BodyMetricRow[] | null) ?? [];
  const latestBodyMetric = bodyMetricsRows[0] ?? null;
  const previousBodyMetric = bodyMetricsRows[1] ?? null;
  const latestWeightKg =
    latestBodyMetric?.weight_kg !== null && latestBodyMetric?.weight_kg !== undefined
      ? toSafeNumber(latestBodyMetric.weight_kg)
      : null;
  const previousWeightKg =
    previousBodyMetric?.weight_kg !== null && previousBodyMetric?.weight_kg !== undefined
      ? toSafeNumber(previousBodyMetric.weight_kg)
      : null;

  const avgKcalDelta =
    trackedDays && targets?.kcal_target !== null && targets?.kcal_target !== undefined
      ? Math.round(
          trackedPoints.reduce((sum, point) => sum + (point.kcal - targets.kcal_target!), 0) /
            trackedDays,
        )
      : null;
  const avgProteinDelta =
    trackedDays &&
    targets?.protein_target !== null &&
    targets?.protein_target !== undefined
      ? roundToSingleDecimal(
          trackedPoints.reduce(
            (sum, point) => sum + (point.protein - targets.protein_target!),
            0,
          ) / trackedDays,
        )
      : null;
  const latestGoal =
    (goalResult.data as GoalNutritionAnalyticsRow | null) ?? null;
  const coachingSignals = buildNutritionCoachingSignals({
    trackedDays,
    targetAlignedDays: recentDays.filter((point) => point.isTargetAligned).length,
    avgKcalDelta,
    avgProteinDelta,
    latestWeightKg,
    previousWeightKg,
    deltaKg:
      latestWeightKg !== null && previousWeightKg !== null
        ? roundToSingleDecimal(latestWeightKg - previousWeightKg)
        : null,
    goalType: latestGoal?.goal_type ?? null,
    targetWeightKg: latestGoal?.target_weight_kg ?? null,
  });
  const deltaKg =
    latestWeightKg !== null && previousWeightKg !== null
      ? roundToSingleDecimal(latestWeightKg - previousWeightKg)
      : null;
  const targetAlignedDays = recentDays.filter((point) => point.isTargetAligned).length;
  const mealItemsByMealId = new Map<string, NutritionMealItemAnalyticsRow[]>();

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
          kcal: items.reduce((sum, item) => sum + toSafeNumber(item.kcal), 0),
          protein: items.reduce((sum, item) => sum + toSafeNumber(item.protein), 0),
          fat: items.reduce((sum, item) => sum + toSafeNumber(item.fat), 0),
          carbs: items.reduce((sum, item) => sum + toSafeNumber(item.carbs), 0),
        },
        items: items.map((item) => ({
          foodNameSnapshot: item.food_name_snapshot,
          servings: toSafeNumber(item.servings),
          kcal: toSafeNumber(item.kcal),
          protein: toSafeNumber(item.protein),
          fat: toSafeNumber(item.fat),
          carbs: toSafeNumber(item.carbs),
        })),
      };
    }),
  );
  const strategy = buildNutritionStrategyRecommendations({
    coachingSignals,
    mealPatterns: mealPatterns.patterns,
    topFoods: mealPatterns.topFoods,
    trackedDays,
  });

  return {
    dailyTrend: dailyTrend.map((point) => ({
      label: point.label,
      kcal: point.kcal,
      protein: point.protein,
      fat: point.fat,
      carbs: point.carbs,
    })),
    totals,
    averages: {
      kcal: trackedDays ? Math.round(totals.kcal / trackedDays) : 0,
      protein: trackedDays ? roundToSingleDecimal(totals.protein / trackedDays) : 0,
      fat: trackedDays ? roundToSingleDecimal(totals.fat / trackedDays) : 0,
      carbs: trackedDays ? roundToSingleDecimal(totals.carbs / trackedDays) : 0,
    },
    targets: {
      kcal: targets?.kcal_target ?? null,
      protein: targets?.protein_target ?? null,
      fat: targets?.fat_target ?? null,
      carbs: targets?.carbs_target ?? null,
    },
    highlights: {
      trackedDays,
      targetAlignedDays,
      latestTrackedAt: recentDays.find((point) => point.tracked)?.summaryDate ?? null,
      avgKcalDelta,
      avgProteinDelta,
    },
    bodyMetrics: {
      latestWeightKg,
      previousWeightKg,
      deltaKg,
      latestMeasuredAt: latestBodyMetric?.measured_at ?? null,
      bodyFatPct:
        latestBodyMetric?.body_fat_pct !== null &&
        latestBodyMetric?.body_fat_pct !== undefined
          ? roundToSingleDecimal(toSafeNumber(latestBodyMetric.body_fat_pct))
          : null,
    },
    coachingSignals,
    mealPatterns,
    strategy,
    recentDays,
  };
}

async function getCaloriesForPeriod(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string,
) {
  const { data, error } = await supabase
    .from("daily_nutrition_summaries")
    .select("kcal")
    .eq("user_id", userId)
    .gte("summary_date", startDate)
    .lt("summary_date", endDate);

  if (error) {
    throw error;
  }

  return (data ?? []).reduce((sum, row) => sum + (row.kcal ?? 0), 0);
}

export async function getDashboardPeriodComparison(
  supabase: SupabaseClient,
  userId: string,
  periodDays: number,
  baselineDays: number,
): Promise<DashboardPeriodComparison> {
  const totalWindowDays = periodDays + baselineDays;

  if (totalWindowDays <= DASHBOARD_AGGREGATE_LOOKBACK_DAYS) {
    try {
      const aggregate = await getDashboardAggregateBundle(supabase, userId, {
        lookbackDays: DASHBOARD_AGGREGATE_LOOKBACK_DAYS,
      });
      const currentDateStart = toUtcDateString(getDateDaysAgo(periodDays));
      const previousDateStart = toUtcDateString(
        getDateDaysAgo(periodDays + baselineDays),
      );
      const tomorrowDate = getTomorrowDateString();
      const currentWindow = aggregate.bundle.days.filter(
        (day) => day.date >= currentDateStart && day.date < tomorrowDate,
      );
      const previousWindow = aggregate.bundle.days.filter(
        (day) => day.date >= previousDateStart && day.date < currentDateStart,
      );
      const workoutsCurrent = currentWindow.reduce(
        (sum, day) => sum + day.workoutsCompleted,
        0,
      );
      const workoutsPrevious = previousWindow.reduce(
        (sum, day) => sum + day.workoutsCompleted,
        0,
      );
      const currentCalories = currentWindow.reduce((sum, day) => sum + day.kcal, 0);
      const previousCalories = previousWindow.reduce(
        (sum, day) => sum + day.kcal,
        0,
      );
      const aiCurrent = currentWindow.reduce((sum, day) => sum + day.aiSessions, 0);
      const aiPrevious = previousWindow.reduce(
        (sum, day) => sum + day.aiSessions,
        0,
      );

      return {
        workoutsCompleted: {
          current: workoutsCurrent,
          previous: workoutsPrevious,
          delta: workoutsCurrent - workoutsPrevious,
        },
        caloriesTracked: {
          current: currentCalories,
          previous: previousCalories,
          delta: currentCalories - previousCalories,
        },
        aiSessions: {
          current: aiCurrent,
          previous: aiPrevious,
          delta: aiCurrent - aiPrevious,
        },
      };
    } catch {
      // Fall back to live queries if aggregate snapshot is unavailable.
    }
  }

  const currentPeriodStart = getIsoTimestampDaysAgo(periodDays);
  const previousPeriodStart = getIsoTimestampDaysAgo(periodDays + baselineDays);
  const currentDateStart = toUtcDateString(getDateDaysAgo(periodDays));
  const previousDateStart = toUtcDateString(getDateDaysAgo(periodDays + baselineDays));
  const tomorrowDate = getTomorrowDateString();

  const [
    currentWorkoutsResult,
    previousWorkoutsResult,
    currentAiSessionsResult,
    previousAiSessionsResult,
    currentCalories,
    previousCalories,
  ] = await Promise.all([
    supabase
      .from("workout_days")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "done")
      .gte("updated_at", currentPeriodStart),
    supabase
      .from("workout_days")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "done")
      .gte("updated_at", previousPeriodStart)
      .lt("updated_at", currentPeriodStart),
    supabase
      .from("ai_chat_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", currentPeriodStart),
    supabase
      .from("ai_chat_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", previousPeriodStart)
      .lt("created_at", currentPeriodStart),
    getCaloriesForPeriod(supabase, userId, currentDateStart, tomorrowDate),
    getCaloriesForPeriod(supabase, userId, previousDateStart, currentDateStart),
  ]);

  const failedResult = [
    currentWorkoutsResult,
    previousWorkoutsResult,
    currentAiSessionsResult,
    previousAiSessionsResult,
  ].find((result) => result.error);

  if (failedResult?.error) {
    throw failedResult.error;
  }

  const workoutsCurrent = currentWorkoutsResult.count ?? 0;
  const workoutsPrevious = previousWorkoutsResult.count ?? 0;
  const aiCurrent = currentAiSessionsResult.count ?? 0;
  const aiPrevious = previousAiSessionsResult.count ?? 0;

  return {
    workoutsCompleted: {
      current: workoutsCurrent,
      previous: workoutsPrevious,
      delta: workoutsCurrent - workoutsPrevious,
    },
    caloriesTracked: {
      current: currentCalories,
      previous: previousCalories,
      delta: currentCalories - previousCalories,
    },
    aiSessions: {
      current: aiCurrent,
      previous: aiPrevious,
      delta: aiCurrent - aiPrevious,
    },
  };
}

async function getDashboardRuntimeFreshnessCursor(
  supabase: SupabaseClient,
  userId: string,
) {
  const [
    weeklyProgramsResult,
    workoutDaysResult,
    workoutSetsResult,
    exerciseLibraryResult,
    workoutTemplatesResult,
    aiChatSessionsResult,
    goalsResult,
    nutritionProfileResult,
    nutritionSummariesResult,
    bodyMetricsResult,
    mealsResult,
  ] = await Promise.all([
    supabase
      .from("weekly_programs")
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
      .from("exercise_library")
      .select("updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_templates")
      .select("updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("ai_chat_sessions")
      .select("updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("goals")
      .select("updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("nutrition_profiles")
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
      .from("body_metrics")
      .select("measured_at")
      .eq("user_id", userId)
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("meals")
      .select("eaten_at")
      .eq("user_id", userId)
      .order("eaten_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const failedResult = [
    weeklyProgramsResult,
    workoutDaysResult,
    workoutSetsResult,
    exerciseLibraryResult,
    workoutTemplatesResult,
    aiChatSessionsResult,
    goalsResult,
    nutritionProfileResult,
    nutritionSummariesResult,
    bodyMetricsResult,
    mealsResult,
  ].find((result) => result.error);

  if (failedResult?.error) {
    throw failedResult.error;
  }

  return [
    weeklyProgramsResult.data?.updated_at ?? null,
    workoutDaysResult.data?.updated_at ?? null,
    workoutSetsResult.data?.updated_at ?? null,
    exerciseLibraryResult.data?.updated_at ?? null,
    workoutTemplatesResult.data?.updated_at ?? null,
    aiChatSessionsResult.data?.updated_at ?? null,
    goalsResult.data?.updated_at ?? null,
    nutritionProfileResult.data?.updated_at ?? null,
    nutritionSummariesResult.data?.summary_date ?? null,
    bodyMetricsResult.data?.measured_at ?? null,
    mealsResult.data?.eaten_at ?? null,
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;
}

async function buildDashboardAggregateBundle(
  supabase: SupabaseClient,
  userId: string,
  lookbackDays: number,
): Promise<DashboardAggregateBundle> {
  const oldestTimestamp = getIsoTimestampDaysAgo(lookbackDays - 1);
  const oldestDate = toUtcDateString(getDateDaysAgo(lookbackDays - 1));
  const tomorrowDate = getTomorrowDateString();
  const days: DashboardAggregateDay[] = Array.from(
    { length: lookbackDays },
    (_, index) => {
      const date = toUtcDateString(getDateDaysAgo(lookbackDays - index - 1));

      return {
        aiSessions: 0,
        carbs: 0,
      date,
      fat: 0,
      kcal: 0,
      loggedSets: 0,
      protein: 0,
        tonnageKg: 0,
        trackedNutrition: false,
        workoutsCompleted: 0,
      };
    },
  );
  const dayMap = new Map(days.map((day) => [day.date, day]));

  const [
    workoutDaysResult,
    workoutSetsResult,
    nutritionSummariesResult,
    aiSessionsResult,
  ] = await Promise.all([
    supabase
      .from("workout_days")
      .select("updated_at")
      .eq("user_id", userId)
      .eq("status", "done")
      .gte("updated_at", oldestTimestamp),
    supabase
      .from("workout_sets")
      .select("updated_at, actual_reps, actual_weight_kg")
      .eq("user_id", userId)
      .not("actual_reps", "is", null)
      .gte("updated_at", oldestTimestamp),
    supabase
      .from("daily_nutrition_summaries")
      .select("summary_date, kcal, protein, fat, carbs")
      .eq("user_id", userId)
      .gte("summary_date", oldestDate)
      .lt("summary_date", tomorrowDate),
    supabase
      .from("ai_chat_sessions")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", oldestTimestamp),
  ]);

  const failedResult = [
    workoutDaysResult,
    workoutSetsResult,
    nutritionSummariesResult,
    aiSessionsResult,
  ].find((result) => result.error);

  if (failedResult?.error) {
    throw failedResult.error;
  }

  for (const row of
    (workoutDaysResult.data as DashboardWorkoutDayAggregateRow[] | null) ?? []) {
    const bucket = dayMap.get(getUtcDateStringFromTimestamp(row.updated_at));

    if (bucket) {
      bucket.workoutsCompleted += 1;
    }
  }

  for (const row of
    (workoutSetsResult.data as DashboardWorkoutSetAggregateRow[] | null) ?? []) {
    const bucket = dayMap.get(getUtcDateStringFromTimestamp(row.updated_at));

    if (!bucket) {
      continue;
    }

    bucket.loggedSets += 1;
    bucket.tonnageKg += getSetTonnageKg(
      row.actual_reps,
      toOptionalNumber(row.actual_weight_kg),
    );
  }

  for (const row of (nutritionSummariesResult.data as NutritionSummaryRow[] | null) ?? []) {
    const bucket = dayMap.get(row.summary_date);

    if (!bucket) {
      continue;
    }

    bucket.trackedNutrition = true;
    bucket.kcal = row.kcal ?? 0;
    bucket.protein = toSafeNumber(row.protein);
    bucket.fat = toSafeNumber(row.fat);
    bucket.carbs = toSafeNumber(row.carbs);
  }

  for (const row of
    (aiSessionsResult.data as DashboardAiSessionAggregateRow[] | null) ?? []) {
    const bucket = dayMap.get(getUtcDateStringFromTimestamp(row.created_at));

    if (bucket) {
      bucket.aiSessions += 1;
    }
  }

  return {
    days,
    lookbackDays,
  };
}

export async function persistDashboardAggregateSnapshot(
  supabase: SupabaseClient,
  userId: string,
  bundle: DashboardAggregateBundle,
  snapshotReason = DASHBOARD_AGGREGATE_SNAPSHOT_REASON,
) {
  const payload = createDashboardAggregateSnapshotPayload(bundle);

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

export async function getDashboardAggregateBundle(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    forceRefresh?: boolean;
    lookbackDays?: number;
    maxAgeMs?: number;
    persistSnapshot?: boolean;
    snapshotReason?: string;
  },
): Promise<DashboardAggregateBundleResult> {
  const lookbackDays = options?.lookbackDays ?? DASHBOARD_AGGREGATE_LOOKBACK_DAYS;
  const maxAgeMs = options?.maxAgeMs ?? DASHBOARD_AGGREGATE_SNAPSHOT_MAX_AGE_MS;
  const snapshotReason =
    options?.snapshotReason ?? DASHBOARD_AGGREGATE_SNAPSHOT_REASON;

  if (!options?.forceRefresh) {
    const { data, error } = await supabase
      .from("user_context_snapshots")
      .select("id, snapshot_reason, payload, created_at")
      .eq("user_id", userId)
      .eq("snapshot_reason", snapshotReason)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const parsed =
        parseDashboardAggregateSnapshotPayload<DashboardAggregateBundle>(
        (data as DashboardAggregateSnapshotRow).payload,
        );
      const ageMs = Date.now() - new Date(data.created_at).getTime();
      let hasNewerUserData = false;

      try {
        const freshnessCursor = await getDashboardRuntimeFreshnessCursor(
          supabase,
          userId,
        );
        hasNewerUserData =
          typeof freshnessCursor === "string" &&
          new Date(freshnessCursor).getTime() > new Date(data.created_at).getTime();
      } catch {
        hasNewerUserData = false;
      }

      if (
        parsed &&
        parsed.bundle.lookbackDays === lookbackDays &&
        Number.isFinite(ageMs) &&
        ageMs <= maxAgeMs &&
        !hasNewerUserData
      ) {
        return {
          cache: {
            generatedAt: parsed.generatedAt,
            snapshotCreatedAt: data.created_at,
            snapshotId: data.id,
            snapshotReason: data.snapshot_reason,
            source: "snapshot",
          },
          bundle: parsed.bundle,
        };
      }
    }
  }

  const bundle = await buildDashboardAggregateBundle(supabase, userId, lookbackDays);

  if (options?.persistSnapshot !== false) {
    try {
      const persisted = await persistDashboardAggregateSnapshot(
        supabase,
        userId,
        bundle,
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
        bundle,
      };
    } catch {
      // Fail open: aggregate consumers can still render from live data.
    }
  }

  return {
    cache: {
      generatedAt: new Date().toISOString(),
      snapshotCreatedAt: null,
      snapshotId: null,
      snapshotReason,
      source: "live",
    },
    bundle,
  };
}

export async function persistDashboardRuntimeSnapshot(
  supabase: SupabaseClient,
  userId: string,
  metrics: DashboardRuntimeMetrics,
  config: DashboardRuntimeSnapshotConfig,
  snapshotReason = DASHBOARD_RUNTIME_SNAPSHOT_REASON,
) {
  const payload = createDashboardRuntimeSnapshotPayload(metrics, config);

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

export async function getDashboardRuntimeMetrics(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    baselineDays?: number;
    days?: number;
    forceRefresh?: boolean;
    maxAgeMs?: number;
    periodDays?: number;
    persistSnapshot?: boolean;
    snapshotReason?: string;
    weeks?: number;
  },
): Promise<DashboardRuntimeMetricsResult> {
  const config = {
    weeks: options?.weeks ?? 8,
    days: options?.days ?? 7,
    periodDays: options?.periodDays ?? 30,
    baselineDays: options?.baselineDays ?? 30,
  };
  const maxAgeMs = options?.maxAgeMs ?? DASHBOARD_RUNTIME_SNAPSHOT_MAX_AGE_MS;
  const snapshotReason =
    options?.snapshotReason ?? DASHBOARD_RUNTIME_SNAPSHOT_REASON;

  if (!options?.forceRefresh) {
    const { data, error } = await supabase
      .from("user_context_snapshots")
      .select("id, snapshot_reason, payload, created_at")
      .eq("user_id", userId)
      .eq("snapshot_reason", snapshotReason)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const parsed =
        parseDashboardRuntimeSnapshotPayload<DashboardRuntimeMetrics>(
        (data as DashboardRuntimeSnapshotRow).payload,
        );
      const ageMs = Date.now() - new Date(data.created_at).getTime();
      let hasNewerUserData = false;

      try {
        const freshnessCursor = await getDashboardRuntimeFreshnessCursor(
          supabase,
          userId,
        );
        hasNewerUserData =
          typeof freshnessCursor === "string" &&
          new Date(freshnessCursor).getTime() > new Date(data.created_at).getTime();
      } catch {
        hasNewerUserData = false;
      }

      if (
        parsed &&
        parsed.config.weeks === config.weeks &&
        parsed.config.days === config.days &&
        parsed.config.periodDays === config.periodDays &&
        parsed.config.baselineDays === config.baselineDays &&
        Number.isFinite(ageMs) &&
        ageMs <= maxAgeMs &&
        !hasNewerUserData
      ) {
        return {
          cache: {
            generatedAt: parsed.generatedAt,
            snapshotCreatedAt: data.created_at,
            snapshotId: data.id,
            snapshotReason: data.snapshot_reason,
            source: "snapshot",
          },
          metrics: parsed.metrics,
        };
      }
    }
  }

  const [snapshot, periodComparison, workoutCharts, nutritionCharts] =
    await Promise.all([
      getDashboardSnapshot(supabase, userId),
      getDashboardPeriodComparison(
        supabase,
        userId,
        config.periodDays,
        config.baselineDays,
      ),
      getDashboardWorkoutCharts(supabase, userId, config.weeks),
      getDashboardNutritionCharts(supabase, userId, config.days),
    ]);

  const metrics = {
    snapshot,
    periodComparison,
    workoutCharts,
    nutritionCharts,
  };

  if (options?.persistSnapshot !== false) {
    try {
      const persisted = await persistDashboardRuntimeSnapshot(
        supabase,
        userId,
        metrics,
        config,
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
        metrics,
      };
    } catch {
      // Fail open: dashboard can still render from live metrics.
    }
  }

  return {
    cache: {
      generatedAt: new Date().toISOString(),
      snapshotCreatedAt: null,
      snapshotId: null,
      snapshotReason,
      source: "live",
    },
    metrics,
  };
}
