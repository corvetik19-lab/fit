import type { SupabaseClient } from "@supabase/supabase-js";

export type WorkoutDayStatus = "planned" | "in_progress" | "done";

export type WorkoutDayExecutionInput = {
  status?: WorkoutDayStatus;
  bodyWeightKg?: number | null;
  sessionNote?: string | null;
  sessionDurationSeconds?: number | null;
};

export async function updateWorkoutDayExecution(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
  input: WorkoutDayExecutionInput,
) {
  if (
    input.status === undefined &&
    input.bodyWeightKg === undefined &&
    input.sessionNote === undefined &&
    input.sessionDurationSeconds === undefined
  ) {
    return {
      error: {
        status: 400,
        code: "WORKOUT_DAY_EXECUTION_EMPTY",
        message: "Workout day execution update requires at least one field.",
      },
      data: null,
    } as const;
  }

  const { data: dayRow, error: dayError } = await supabase
    .from("workout_days")
    .select(
      "id, weekly_program_id, status, body_weight_kg, session_note, session_duration_seconds",
    )
    .eq("id", dayId)
    .eq("user_id", userId)
    .maybeSingle();

  if (dayError) {
    throw dayError;
  }

  if (!dayRow) {
    return {
      error: {
        status: 404,
        code: "WORKOUT_DAY_NOT_FOUND",
        message: "Workout day was not found.",
      },
      data: null,
    } as const;
  }

  const { data: programRow, error: programError } = await supabase
    .from("weekly_programs")
    .select("id, is_locked")
    .eq("id", dayRow.weekly_program_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (programError) {
    throw programError;
  }

  if (!programRow?.is_locked) {
    return {
      error: {
        status: 400,
        code: "WORKOUT_DAY_REQUIRES_LOCKED_PROGRAM",
        message: "Workout day execution is available only for locked weeks.",
      },
      data: null,
    } as const;
  }

  const { data, error } = await supabase
    .from("workout_days")
    .update({
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.bodyWeightKg !== undefined
        ? { body_weight_kg: input.bodyWeightKg }
        : {}),
      ...(input.sessionNote !== undefined
        ? { session_note: input.sessionNote }
        : {}),
      ...(input.sessionDurationSeconds !== undefined
        ? { session_duration_seconds: input.sessionDurationSeconds }
        : {}),
    })
    .eq("id", dayId)
    .eq("user_id", userId)
    .select(
      "id, status, body_weight_kg, session_note, session_duration_seconds",
    )
    .single();

  if (error) {
    throw error;
  }

  return {
    error: null,
    data,
  } as const;
}

export async function updateWorkoutDayStatus(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
  nextStatus: WorkoutDayStatus,
) {
  return updateWorkoutDayExecution(supabase, userId, dayId, {
    status: nextStatus,
  });
}

export async function updateWorkoutSetActualReps(
  supabase: SupabaseClient,
  userId: string,
  setId: string,
  actualReps: number | null,
  actualWeightKg: number | null,
  actualRpe: number | null,
) {
  const { data: workoutSetRow, error: workoutSetError } = await supabase
    .from("workout_sets")
    .select("id, workout_exercise_id")
    .eq("id", setId)
    .eq("user_id", userId)
    .maybeSingle();

  if (workoutSetError) {
    throw workoutSetError;
  }

  if (!workoutSetRow) {
    return {
      error: {
        status: 404,
        code: "WORKOUT_SET_NOT_FOUND",
        message: "Workout set was not found.",
      },
      data: null,
    } as const;
  }

  const { data: workoutExerciseRow, error: workoutExerciseError } =
    await supabase
      .from("workout_exercises")
      .select("id, workout_day_id")
      .eq("id", workoutSetRow.workout_exercise_id)
      .eq("user_id", userId)
      .maybeSingle();

  if (workoutExerciseError) {
    throw workoutExerciseError;
  }

  if (!workoutExerciseRow) {
    return {
      error: {
        status: 404,
        code: "WORKOUT_EXERCISE_NOT_FOUND",
        message: "Workout exercise was not found.",
      },
      data: null,
    } as const;
  }

  const { data: workoutDayRow, error: workoutDayError } = await supabase
    .from("workout_days")
    .select("id, weekly_program_id")
    .eq("id", workoutExerciseRow.workout_day_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (workoutDayError) {
    throw workoutDayError;
  }

  if (!workoutDayRow) {
    return {
      error: {
        status: 404,
        code: "WORKOUT_DAY_NOT_FOUND",
        message: "Workout day was not found.",
      },
      data: null,
    } as const;
  }

  const { data: programRow, error: programError } = await supabase
    .from("weekly_programs")
    .select("id, is_locked")
    .eq("id", workoutDayRow.weekly_program_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (programError) {
    throw programError;
  }

  if (!programRow?.is_locked) {
    return {
      error: {
        status: 400,
        code: "WORKOUT_SET_REQUIRES_LOCKED_PROGRAM",
        message: "Workout set performance can be saved only for locked weeks.",
      },
      data: null,
    } as const;
  }

  const { data, error } = await supabase
    .from("workout_sets")
    .update({
      actual_reps: actualReps,
      actual_weight_kg: actualWeightKg,
      actual_rpe: actualRpe,
    })
    .eq("id", setId)
    .eq("user_id", userId)
    .select("id, actual_reps, actual_weight_kg, actual_rpe")
    .single();

  if (error) {
    throw error;
  }

  return {
    error: null,
    data: {
      ...data,
      workoutDayId: workoutDayRow.id,
    },
  } as const;
}
