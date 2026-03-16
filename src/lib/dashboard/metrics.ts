import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getDashboardAggregateBundle,
} from "@/lib/dashboard/dashboard-aggregate";
import { getDashboardNutritionCharts as loadDashboardNutritionCharts } from "@/lib/dashboard/dashboard-nutrition";
import { buildLiveDashboardRuntimeMetrics } from "@/lib/dashboard/dashboard-runtime-assembly";
import {
  getCachedDashboardRuntimeMetrics,
  persistDashboardRuntimeSnapshot,
} from "@/lib/dashboard/dashboard-runtime-cache";
import {
  buildDashboardPeriodComparisonFromAggregate,
  getDashboardSnapshot,
  getLiveDashboardPeriodComparison,
} from "@/lib/dashboard/dashboard-overview";
import {
  getDaysBetween,
  getDaysSince,
  getEstimatedOneRmKg,
  getIsoTimestampDaysAgo,
  getMomentum,
  getSetTonnageKg,
  getUtcWeekStart,
  roundToSingleDecimal,
  toOptionalNumber,
} from "@/lib/dashboard/dashboard-utils";
import {
  buildRecoverySummary,
  buildWeeklyTrendSkeleton,
  getWeeklyTrendIndex,
} from "@/lib/dashboard/dashboard-workout-helpers";
import { type NutritionCoachingSignal } from "@/lib/nutrition/coaching-signals";
import { type NutritionMealPatternStats } from "@/lib/nutrition/meal-patterns";
import { type NutritionStrategyRecommendation } from "@/lib/nutrition/strategy-recommendations";
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

export {
  getDashboardAggregateBundle,
  persistDashboardAggregateSnapshot,
} from "@/lib/dashboard/dashboard-aggregate";
export { persistDashboardRuntimeSnapshot } from "@/lib/dashboard/dashboard-runtime-cache";

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
  return loadDashboardNutritionCharts(supabase, userId, days);
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
        defaultMaxAgeMs: DASHBOARD_AGGREGATE_SNAPSHOT_MAX_AGE_MS,
        defaultSnapshotReason: DASHBOARD_AGGREGATE_SNAPSHOT_REASON,
        lookbackDays: DASHBOARD_AGGREGATE_LOOKBACK_DAYS,
      });
      return buildDashboardPeriodComparisonFromAggregate(
        aggregate.bundle,
        periodDays,
        baselineDays,
      );
    } catch {
      // Fall back to live queries if aggregate snapshot is unavailable.
    }
  }

  return getLiveDashboardPeriodComparison(
    supabase,
    userId,
    periodDays,
    baselineDays,
  );
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
    const cached = await getCachedDashboardRuntimeMetrics(supabase, userId, {
      config,
      maxAgeMs,
      snapshotReason,
    });

    if (cached) {
      return cached;
    }
  }

  const metrics = await buildLiveDashboardRuntimeMetrics({
    nutritionCharts: () =>
      loadDashboardNutritionCharts(supabase, userId, config.days, {
        failOpen: true,
      }),
    periodComparison: () =>
      getDashboardPeriodComparison(
        supabase,
        userId,
        config.periodDays,
        config.baselineDays,
      ),
    snapshot: () => getDashboardSnapshot(supabase, userId),
    workoutCharts: () => getDashboardWorkoutCharts(supabase, userId, config.weeks),
  });

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
