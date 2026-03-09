import type { SupabaseClient } from "@supabase/supabase-js";

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
};

export type DashboardWorkoutCharts = {
  weeklyTrend: DashboardWorkoutChartPoint[];
  totals: {
    completedDays: number;
    loggedSets: number;
  };
};

export type DashboardNutritionChartPoint = {
  label: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
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
};

export type DashboardPeriodComparison = {
  workoutsCompleted: DashboardMetricComparison;
  caloriesTracked: DashboardMetricComparison;
  aiSessions: DashboardMetricComparison;
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

function toUtcDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateDaysAgo(daysAgo: number) {
  const nextDate = new Date();
  nextDate.setUTCDate(nextDate.getUTCDate() - daysAgo);
  return nextDate;
}

function getIsoTimestampDaysAgo(daysAgo: number) {
  return getDateDaysAgo(daysAgo).toISOString();
}

function getTomorrowDateString() {
  const nextDate = new Date();
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  return toUtcDateString(nextDate);
}

function getUtcWeekStart(date: Date) {
  const nextDate = new Date(date);
  const offset = (nextDate.getUTCDay() + 6) % 7;
  nextDate.setUTCHours(0, 0, 0, 0);
  nextDate.setUTCDate(nextDate.getUTCDate() - offset);
  return nextDate;
}

function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
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
      },
    };
  }

  const [completedDaysResult, loggedSetsResult] = await Promise.all([
    supabase
      .from("workout_days")
      .select("updated_at")
      .eq("user_id", userId)
      .eq("status", "done")
      .gte("updated_at", oldestWeekStart.toISOString()),
    supabase
      .from("workout_sets")
      .select("updated_at")
      .eq("user_id", userId)
      .not("actual_reps", "is", null)
      .gte("updated_at", oldestWeekStart.toISOString()),
  ]);

  if (completedDaysResult.error) {
    throw completedDaysResult.error;
  }

  if (loggedSetsResult.error) {
    throw loggedSetsResult.error;
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

  for (const row of loggedSetsResult.data ?? []) {
    const weekIndex = getWeeklyTrendIndex(
      getUtcWeekStart(new Date(row.updated_at)),
      oldestWeekStart,
      weeklyTrend.length,
    );

    if (weekIndex == null) {
      continue;
    }

    weeklyTrend[weekIndex].loggedSets += 1;
  }

  return {
    weeklyTrend: weeklyTrend.map((bucket) => ({
      label: bucket.label,
      rangeLabel: bucket.rangeLabel,
      completedDays: bucket.completedDays,
      loggedSets: bucket.loggedSets,
    })),
    totals: {
      completedDays: weeklyTrend.reduce(
        (sum, bucket) => sum + bucket.completedDays,
        0,
      ),
      loggedSets: weeklyTrend.reduce((sum, bucket) => sum + bucket.loggedSets, 0),
    },
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
    };
  }

  const { data, error } = await supabase
    .from("daily_nutrition_summaries")
    .select("summary_date, kcal, protein, fat, carbs")
    .eq("user_id", userId)
    .gte("summary_date", oldestDate)
    .lt("summary_date", getTomorrowDateString());

  if (error) {
    throw error;
  }

  for (const row of data ?? []) {
    const point = summariesByDate.get(row.summary_date);

    if (!point) {
      continue;
    }

    point.kcal = row.kcal ?? 0;
    point.protein = Number(row.protein ?? 0);
    point.fat = Number(row.fat ?? 0);
    point.carbs = Number(row.carbs ?? 0);
  }

  const totals = dailyTrend.reduce(
    (accumulator, point) => ({
      kcal: accumulator.kcal + point.kcal,
      protein: accumulator.protein + point.protein,
      fat: accumulator.fat + point.fat,
      carbs: accumulator.carbs + point.carbs,
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );

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
      kcal: Math.round(totals.kcal / dailyTrend.length),
      protein: Number((totals.protein / dailyTrend.length).toFixed(1)),
      fat: Number((totals.fat / dailyTrend.length).toFixed(1)),
      carbs: Number((totals.carbs / dailyTrend.length).toFixed(1)),
    },
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
