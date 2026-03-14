import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getDateDaysAgo,
  getIsoTimestampDaysAgo,
  getTomorrowDateString,
  toUtcDateString,
} from "@/lib/dashboard/dashboard-utils";
import type {
  DashboardAggregateBundle,
  DashboardMetricComparison,
  DashboardPeriodComparison,
  DashboardSnapshot,
} from "@/lib/dashboard/metrics";

function buildDashboardMetricComparison(
  current: number,
  previous: number,
): DashboardMetricComparison {
  return {
    current,
    previous,
    delta: current - previous,
  };
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
    aiSessions: aiSessionsResult.count ?? 0,
    completedDays: completedDaysResult.count ?? 0,
    draftPrograms: draftProgramsResult.count ?? 0,
    exercises: exercisesResult.count ?? 0,
    loggedSets: loggedSetsResult.count ?? 0,
    nutritionDays: nutritionDaysResult.count ?? 0,
    templates: templatesResult.count ?? 0,
  };
}

export function buildDashboardPeriodComparisonFromAggregate(
  aggregate: DashboardAggregateBundle,
  periodDays: number,
  baselineDays: number,
): DashboardPeriodComparison {
  const currentDateStart = toUtcDateString(getDateDaysAgo(periodDays));
  const previousDateStart = toUtcDateString(getDateDaysAgo(periodDays + baselineDays));
  const tomorrowDate = getTomorrowDateString();
  const currentWindow = aggregate.days.filter(
    (day) => day.date >= currentDateStart && day.date < tomorrowDate,
  );
  const previousWindow = aggregate.days.filter(
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
  const previousCalories = previousWindow.reduce((sum, day) => sum + day.kcal, 0);
  const aiCurrent = currentWindow.reduce((sum, day) => sum + day.aiSessions, 0);
  const aiPrevious = previousWindow.reduce((sum, day) => sum + day.aiSessions, 0);

  return {
    workoutsCompleted: buildDashboardMetricComparison(
      workoutsCurrent,
      workoutsPrevious,
    ),
    caloriesTracked: buildDashboardMetricComparison(
      currentCalories,
      previousCalories,
    ),
    aiSessions: buildDashboardMetricComparison(aiCurrent, aiPrevious),
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

export async function getLiveDashboardPeriodComparison(
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

  return {
    workoutsCompleted: buildDashboardMetricComparison(
      currentWorkoutsResult.count ?? 0,
      previousWorkoutsResult.count ?? 0,
    ),
    caloriesTracked: buildDashboardMetricComparison(
      currentCalories,
      previousCalories,
    ),
    aiSessions: buildDashboardMetricComparison(
      currentAiSessionsResult.count ?? 0,
      previousAiSessionsResult.count ?? 0,
    ),
  };
}
