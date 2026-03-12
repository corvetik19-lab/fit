import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";

type PostgrestLikeError = {
  code?: string;
  message?: string | null;
};

type LegacyWorkoutSetRow = {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  planned_reps: number;
  actual_reps: number | null;
};

export type WorkoutSetRow = {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  planned_reps: number;
  planned_reps_min: number | null;
  planned_reps_max: number | null;
  actual_reps: number | null;
  actual_weight_kg: number | null;
  actual_rpe: number | null;
  rest_seconds: number | null;
  set_note: string | null;
};

export type WorkoutSetInsertPayload = {
  user_id: string;
  workout_exercise_id: string;
  set_number: number;
  planned_reps: number;
  planned_reps_min: number | null;
  planned_reps_max: number | null;
  actual_reps: number | null;
  actual_weight_kg: number | null;
  actual_rpe: number | null;
  rest_seconds: number | null;
  set_note: string | null;
};

function isPostgrestLikeError(error: unknown): error is PostgrestLikeError {
  return typeof error === "object" && error !== null;
}

export function isMissingWorkoutSetColumnsError(error: unknown) {
  if (!isPostgrestLikeError(error)) {
    return false;
  }

  const message = `${error.message ?? ""}`.toLowerCase();

  return (
    (error.code === "42703" || error.code === "PGRST204") &&
    (message.includes("planned_reps_min") ||
      message.includes("planned_reps_max") ||
      message.includes("actual_weight_kg") ||
      message.includes("actual_rpe") ||
      message.includes("rest_seconds") ||
      message.includes("set_note"))
  );
}

function normalizeLegacyWorkoutSetRow(row: LegacyWorkoutSetRow): WorkoutSetRow {
  return {
    id: row.id,
    workout_exercise_id: row.workout_exercise_id,
    set_number: row.set_number,
    planned_reps: row.planned_reps,
    planned_reps_min: null,
    planned_reps_max: null,
    actual_reps: row.actual_reps,
    actual_weight_kg: null,
    actual_rpe: null,
    rest_seconds: null,
    set_note: null,
  };
}

export async function listWorkoutSetsWithRepRangeFallback(
  supabase: SupabaseClient,
  userId: string,
  exerciseIds: string[],
) {
  if (!exerciseIds.length) {
    return [] satisfies WorkoutSetRow[];
  }

  const fullResult = await supabase
    .from("workout_sets")
    .select(
      "id, workout_exercise_id, set_number, planned_reps, planned_reps_min, planned_reps_max, actual_reps, actual_weight_kg, actual_rpe, rest_seconds, set_note",
    )
    .eq("user_id", userId)
    .in("workout_exercise_id", exerciseIds)
    .order("set_number", { ascending: true });

  if (!fullResult.error) {
    return (fullResult.data as WorkoutSetRow[] | null) ?? [];
  }

  if (!isMissingWorkoutSetColumnsError(fullResult.error)) {
    throw fullResult.error;
  }

  logger.warn("workout set query fell back to legacy schema", {
    userId,
    exerciseCount: exerciseIds.length,
    error: fullResult.error,
  });

  const legacyResult = await supabase
    .from("workout_sets")
    .select("id, workout_exercise_id, set_number, planned_reps, actual_reps")
    .eq("user_id", userId)
    .in("workout_exercise_id", exerciseIds)
    .order("set_number", { ascending: true });

  if (legacyResult.error) {
    throw legacyResult.error;
  }

  return ((legacyResult.data as LegacyWorkoutSetRow[] | null) ?? []).map(
    normalizeLegacyWorkoutSetRow,
  );
}

export async function listAllWorkoutSetsWithRepRangeFallback(
  supabase: SupabaseClient,
  userId: string,
) {
  const fullResult = await supabase
    .from("workout_sets")
    .select(
      "id, workout_exercise_id, set_number, planned_reps, planned_reps_min, planned_reps_max, actual_reps, actual_weight_kg, actual_rpe, rest_seconds, set_note",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (!fullResult.error) {
    return (fullResult.data as WorkoutSetRow[] | null) ?? [];
  }

  if (!isMissingWorkoutSetColumnsError(fullResult.error)) {
    throw fullResult.error;
  }

  logger.warn("workout set history query fell back to legacy schema", {
    userId,
    error: fullResult.error,
  });

  const legacyResult = await supabase
    .from("workout_sets")
    .select("id, workout_exercise_id, set_number, planned_reps, actual_reps")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (legacyResult.error) {
    throw legacyResult.error;
  }

  return ((legacyResult.data as LegacyWorkoutSetRow[] | null) ?? []).map(
    normalizeLegacyWorkoutSetRow,
  );
}

export async function insertWorkoutSetsWithRepRangeFallback(
  supabase: SupabaseClient,
  payload: WorkoutSetInsertPayload[],
) {
  if (!payload.length) {
    return;
  }

  const fullResult = await supabase.from("workout_sets").insert(payload);

  if (!fullResult.error) {
    return;
  }

  if (!isMissingWorkoutSetColumnsError(fullResult.error)) {
    throw fullResult.error;
  }

  logger.warn("workout set insert fell back to legacy schema", {
    setCount: payload.length,
    error: fullResult.error,
  });

  const legacyPayload = payload.map((set) => ({
    user_id: set.user_id,
    workout_exercise_id: set.workout_exercise_id,
    set_number: set.set_number,
    planned_reps: set.planned_reps,
    actual_reps: set.actual_reps,
  }));

  const legacyResult = await supabase.from("workout_sets").insert(legacyPayload);

  if (legacyResult.error) {
    throw legacyResult.error;
  }
}

export async function insertWorkoutSetWithRepRangeFallback(
  supabase: SupabaseClient,
  payload: WorkoutSetInsertPayload,
) {
  await insertWorkoutSetsWithRepRangeFallback(supabase, [payload]);
}
