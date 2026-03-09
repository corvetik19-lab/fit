import type { SupabaseClient } from "@supabase/supabase-js";

export type WorkoutDayStatus = "planned" | "in_progress" | "done";

export async function updateWorkoutDayStatus(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
  nextStatus: WorkoutDayStatus,
) {
  const { data: dayRow, error: dayError } = await supabase
    .from("workout_days")
    .select("id, weekly_program_id, status")
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
      status: nextStatus,
    })
    .eq("id", dayId)
    .eq("user_id", userId)
    .select("id, status")
    .single();

  if (error) {
    throw error;
  }

  return {
    error: null,
    data,
  } as const;
}

export async function updateWorkoutSetActualReps(
  supabase: SupabaseClient,
  userId: string,
  setId: string,
  actualReps: number | null,
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
        message: "Actual reps can be saved only for locked weeks.",
      },
      data: null,
    } as const;
  }

  const { data, error } = await supabase
    .from("workout_sets")
    .update({
      actual_reps: actualReps,
    })
    .eq("id", setId)
    .eq("user_id", userId)
    .select("id, actual_reps")
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
