import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import {
  buildNutritionCoachingSignals,
} from "@/lib/nutrition/coaching-signals";
import { buildNutritionMealPatternStats } from "@/lib/nutrition/meal-patterns";
import { buildNutritionStrategyRecommendations } from "@/lib/nutrition/strategy-recommendations";

import {
  getDateDaysAgo,
  getIsoTimestampDaysAgo,
  getTomorrowDateString,
  roundToSingleDecimal,
  toSafeNumber,
  toUtcDateString,
} from "@/lib/dashboard/dashboard-utils";
import type { DashboardNutritionCharts } from "@/lib/dashboard/metrics";

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

type NutritionDailyPoint = {
  summaryDate: string;
  label: string;
  tracked: boolean;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
};

type DashboardNutritionSourceData = {
  bodyMetricsRows: BodyMetricRow[];
  goal: GoalNutritionAnalyticsRow | null;
  mealItemsRows: NutritionMealItemAnalyticsRow[];
  mealRows: NutritionMealAnalyticsRow[];
  summaryRows: NutritionSummaryRow[];
  targets: NutritionTargetsRow | null;
};

const dayLabelFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

export function createEmptyDashboardNutritionCharts(): DashboardNutritionCharts {
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

function buildNutritionDailyTrend(days: number): NutritionDailyPoint[] {
  return Array.from({ length: days }, (_, index) => {
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
}

async function loadDashboardNutritionSourceData(
  supabase: SupabaseClient,
  userId: string,
  oldestDate: string,
): Promise<DashboardNutritionSourceData> {
  const mealPatternWindowStart = getIsoTimestampDaysAgo(14);
  const [
    summariesResult,
    targetsResult,
    bodyMetricsResult,
    goalResult,
    mealsResult,
  ] = await Promise.all([
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

  return {
    bodyMetricsRows: (bodyMetricsResult.data as BodyMetricRow[] | null) ?? [],
    goal: (goalResult.data as GoalNutritionAnalyticsRow | null) ?? null,
    mealItemsRows:
      (mealItemsResult.data as NutritionMealItemAnalyticsRow[] | null) ?? [],
    mealRows,
    summaryRows,
    targets: (targetsResult.data as NutritionTargetsRow | null) ?? null,
  };
}

function buildRecentNutritionDays(
  dailyTrend: NutritionDailyPoint[],
  targets: NutritionTargetsRow | null,
): DashboardNutritionCharts["recentDays"] {
  return [...dailyTrend].reverse().map((point) => {
    const kcalDelta =
      point.tracked &&
      targets?.kcal_target !== null &&
      targets?.kcal_target !== undefined
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
}

function buildMealPatterns(
  mealRows: NutritionMealAnalyticsRow[],
  mealItemsRows: NutritionMealItemAnalyticsRow[],
) {
  const mealItemsByMealId = new Map<string, NutritionMealItemAnalyticsRow[]>();

  for (const item of mealItemsRows) {
    const bucket = mealItemsByMealId.get(item.meal_id) ?? [];
    bucket.push(item);
    mealItemsByMealId.set(item.meal_id, bucket);
  }

  return buildNutritionMealPatternStats(
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
}

function buildDashboardNutritionChartsFromSource(
  dailyTrend: NutritionDailyPoint[],
  source: DashboardNutritionSourceData,
): DashboardNutritionCharts {
  const summariesByDate = new Map(
    dailyTrend.map((point) => [point.summaryDate, point]),
  );

  for (const row of source.summaryRows) {
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
  const trackedDays = trackedPoints.length;
  const totals = trackedPoints.reduce(
    (accumulator, point) => ({
      kcal: accumulator.kcal + point.kcal,
      protein: accumulator.protein + point.protein,
      fat: accumulator.fat + point.fat,
      carbs: accumulator.carbs + point.carbs,
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );
  const recentDays = buildRecentNutritionDays(dailyTrend, source.targets);
  const latestBodyMetric = source.bodyMetricsRows[0] ?? null;
  const previousBodyMetric = source.bodyMetricsRows[1] ?? null;
  const latestWeightKg =
    latestBodyMetric?.weight_kg !== null && latestBodyMetric?.weight_kg !== undefined
      ? toSafeNumber(latestBodyMetric.weight_kg)
      : null;
  const previousWeightKg =
    previousBodyMetric?.weight_kg !== null && previousBodyMetric?.weight_kg !== undefined
      ? toSafeNumber(previousBodyMetric.weight_kg)
      : null;
  const deltaKg =
    latestWeightKg !== null && previousWeightKg !== null
      ? roundToSingleDecimal(latestWeightKg - previousWeightKg)
      : null;
  const avgKcalDelta =
    trackedDays &&
    source.targets?.kcal_target !== null &&
    source.targets?.kcal_target !== undefined
      ? Math.round(
          trackedPoints.reduce(
            (sum, point) => sum + (point.kcal - source.targets!.kcal_target!),
            0,
          ) / trackedDays,
        )
      : null;
  const avgProteinDelta =
    trackedDays &&
    source.targets?.protein_target !== null &&
    source.targets?.protein_target !== undefined
      ? roundToSingleDecimal(
          trackedPoints.reduce(
            (sum, point) =>
              sum + (point.protein - source.targets!.protein_target!),
            0,
          ) / trackedDays,
        )
      : null;
  const targetAlignedDays = recentDays.filter(
    (point) => point.isTargetAligned,
  ).length;
  const coachingSignals = buildNutritionCoachingSignals({
    trackedDays,
    targetAlignedDays,
    avgKcalDelta,
    avgProteinDelta,
    latestWeightKg,
    previousWeightKg,
    deltaKg,
    goalType: source.goal?.goal_type ?? null,
    targetWeightKg: source.goal?.target_weight_kg ?? null,
  });
  const mealPatterns = buildMealPatterns(source.mealRows, source.mealItemsRows);
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
      kcal: source.targets?.kcal_target ?? null,
      protein: source.targets?.protein_target ?? null,
      fat: source.targets?.fat_target ?? null,
      carbs: source.targets?.carbs_target ?? null,
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

export async function getDashboardNutritionCharts(
  supabase: SupabaseClient,
  userId: string,
  days: number,
  options?: {
    failOpen?: boolean;
  },
): Promise<DashboardNutritionCharts> {
  const dailyTrend = buildNutritionDailyTrend(days);
  const oldestDate = dailyTrend[0]?.summaryDate;

  if (!oldestDate) {
    return createEmptyDashboardNutritionCharts();
  }

  try {
    const source = await loadDashboardNutritionSourceData(
      supabase,
      userId,
      oldestDate,
    );

    return buildDashboardNutritionChartsFromSource(dailyTrend, source);
  } catch (error) {
    if (!options?.failOpen) {
      throw error;
    }

    logger.warn("dashboard nutrition charts degraded", {
      days,
      error,
      userId,
    });

    return createEmptyDashboardNutritionCharts();
  }
}
