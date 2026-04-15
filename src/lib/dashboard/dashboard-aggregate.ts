import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createDashboardAggregateSnapshotPayload,
  parseDashboardAggregateSnapshotPayload,
} from "@/lib/dashboard/dashboard-snapshot";
import { withTransientRetry } from "@/lib/runtime-retry";
import {
  getDateDaysAgo,
  getIsoTimestampDaysAgo,
  getSetTonnageKg,
  getTomorrowDateString,
  getUtcDateStringFromTimestamp,
  toOptionalNumber,
  toSafeNumber,
  toUtcDateString,
} from "@/lib/dashboard/dashboard-utils";
import type {
  DashboardAggregateBundle,
  DashboardAggregateBundleResult,
} from "@/lib/dashboard/metrics";

type DashboardAggregateSnapshotRow = {
  created_at: string;
  id: string;
  payload: unknown;
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

type NutritionSummaryRow = {
  summary_date: string;
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

export async function getDashboardRuntimeFreshnessCursor(
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
  ] = await withTransientRetry(async () =>
    await Promise.all([
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
    ]),
  );

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

  return (
    [
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
      .filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0,
      )
      .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null
  );
}

async function buildDashboardAggregateBundle(
  supabase: SupabaseClient,
  userId: string,
  lookbackDays: number,
): Promise<DashboardAggregateBundle> {
  const oldestTimestamp = getIsoTimestampDaysAgo(lookbackDays - 1);
  const oldestDate = toUtcDateString(getDateDaysAgo(lookbackDays - 1));
  const tomorrowDate = getTomorrowDateString();
  const days = Array.from({ length: lookbackDays }, (_, index) => {
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
  });
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
  snapshotReason: string,
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
  options: {
    defaultMaxAgeMs: number;
    defaultSnapshotReason: string;
    forceRefresh?: boolean;
    lookbackDays: number;
    maxAgeMs?: number;
    persistSnapshot?: boolean;
    snapshotReason?: string;
  },
): Promise<DashboardAggregateBundleResult> {
  const maxAgeMs = options.maxAgeMs ?? options.defaultMaxAgeMs;
  const snapshotReason =
    options.snapshotReason ?? options.defaultSnapshotReason;

  if (!options.forceRefresh) {
    const { data, error } = await withTransientRetry(async () =>
      await supabase
        .from("user_context_snapshots")
        .select("id, snapshot_reason, payload, created_at")
        .eq("user_id", userId)
        .eq("snapshot_reason", snapshotReason)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    );

    if (!error && data) {
      const parsed = parseDashboardAggregateSnapshotPayload<DashboardAggregateBundle>(
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
        parsed.bundle.lookbackDays === options.lookbackDays &&
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

  const bundle = await withTransientRetry(async () =>
    await buildDashboardAggregateBundle(supabase, userId, options.lookbackDays),
  );

  if (options.persistSnapshot !== false) {
    try {
      const persisted = await withTransientRetry(async () =>
        await persistDashboardAggregateSnapshot(
          supabase,
          userId,
          bundle,
          snapshotReason,
        ),
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
