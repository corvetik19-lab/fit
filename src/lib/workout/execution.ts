import type { SupabaseClient } from "@supabase/supabase-js";

import { getWorkoutDayDetail } from "@/lib/workout/weekly-programs";

export type WorkoutDayStatus = "planned" | "in_progress" | "done";

export type WorkoutDayExecutionInput = {
  status?: WorkoutDayStatus;
  bodyWeightKg?: number | null;
  sessionNote?: string | null;
  sessionDurationSeconds?: number | null;
};

type WorkoutDayContext = {
  id: string;
  weekly_program_id: string;
  status: WorkoutDayStatus;
  body_weight_kg: number | null;
  session_note: string | null;
  session_duration_seconds: number | null;
};

type LockedWorkoutDayContext = {
  day: WorkoutDayContext;
  programId: string;
};

function createExecutionError(
  status: number,
  code: string,
  message: string,
) {
  return {
    error: {
      status,
      code,
      message,
    },
    data: null,
  } as const;
}

function isSetPerformanceEmpty(input: {
  actualReps: number | null;
  actualWeightKg: number | null;
  actualRpe: number | null;
}) {
  return (
    input.actualReps === null &&
    input.actualWeightKg === null &&
    input.actualRpe === null
  );
}

function isSetPerformanceComplete(input: {
  actualReps: number | null;
  actualWeightKg: number | null;
  actualRpe: number | null;
}) {
  return (
    input.actualReps !== null &&
    input.actualWeightKg !== null &&
    input.actualRpe !== null
  );
}

async function getLockedWorkoutDayContext(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
) {
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
    return createExecutionError(
      404,
      "WORKOUT_DAY_NOT_FOUND",
      "Workout day was not found.",
    );
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
    return createExecutionError(
      400,
      "WORKOUT_DAY_REQUIRES_LOCKED_PROGRAM",
      "Workout day execution is available only for locked weeks.",
    );
  }

  return {
    error: null,
    data: {
      day: dayRow as WorkoutDayContext,
      programId: programRow.id,
    } satisfies LockedWorkoutDayContext,
  } as const;
}

async function ensureWorkoutDayCanBeCompleted(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
) {
  const { data: exerciseRows, error: exerciseError } = await supabase
    .from("workout_exercises")
    .select("id")
    .eq("workout_day_id", dayId)
    .eq("user_id", userId);

  if (exerciseError) {
    throw exerciseError;
  }

  const exerciseIds = (exerciseRows ?? []).map((exercise) => exercise.id);

  if (!exerciseIds.length) {
    return createExecutionError(
      400,
      "WORKOUT_DAY_CANNOT_COMPLETE_EMPTY",
      "Workout day cannot be marked as done without exercises.",
    );
  }

  const { data: setRows, error: setError } = await supabase
    .from("workout_sets")
    .select("id, actual_reps, actual_weight_kg, actual_rpe")
    .eq("user_id", userId)
    .in("workout_exercise_id", exerciseIds);

  if (setError) {
    throw setError;
  }

  const sets = setRows ?? [];

  if (!sets.length) {
    return createExecutionError(
      400,
      "WORKOUT_DAY_CANNOT_COMPLETE_EMPTY",
      "Workout day cannot be marked as done without exercise sets.",
    );
  }

  const hasIncompleteSet = sets.some(
    (set) =>
      !isSetPerformanceComplete({
        actualReps: set.actual_reps,
        actualWeightKg: set.actual_weight_kg,
        actualRpe: set.actual_rpe,
      }),
  );

  if (hasIncompleteSet) {
    return createExecutionError(
      400,
      "WORKOUT_DAY_INCOMPLETE",
      "Complete and save every exercise before finishing the workout day.",
    );
  }

  return {
    error: null,
    data: {
      completedSets: sets.length,
    },
  } as const;
}

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

  const lockedDayContext = await getLockedWorkoutDayContext(
    supabase,
    userId,
    dayId,
  );

  if (lockedDayContext.error) {
    return lockedDayContext;
  }

  if (input.status === "done") {
    const completionCheck = await ensureWorkoutDayCanBeCompleted(
      supabase,
      userId,
      dayId,
    );

    if (completionCheck.error) {
      return completionCheck;
    }
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

export async function resetWorkoutDayExecution(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
) {
  const lockedDayContext = await getLockedWorkoutDayContext(
    supabase,
    userId,
    dayId,
  );

  if (lockedDayContext.error) {
    return lockedDayContext;
  }

  const { data: exerciseRows, error: exerciseError } = await supabase
    .from("workout_exercises")
    .select("id")
    .eq("workout_day_id", dayId)
    .eq("user_id", userId);

  if (exerciseError) {
    throw exerciseError;
  }

  const exerciseIds = (exerciseRows ?? []).map((exercise) => exercise.id);

  if (exerciseIds.length) {
    const { error: resetSetsError } = await supabase
      .from("workout_sets")
      .update({
        actual_reps: null,
        actual_weight_kg: null,
        actual_rpe: null,
      })
      .eq("user_id", userId)
      .in("workout_exercise_id", exerciseIds);

    if (resetSetsError) {
      throw resetSetsError;
    }
  }

  const { error: resetDayError } = await supabase
    .from("workout_days")
    .update({
      status: "planned",
      body_weight_kg: null,
      session_note: null,
      session_duration_seconds: 0,
    })
    .eq("id", dayId)
    .eq("user_id", userId);

  if (resetDayError) {
    throw resetDayError;
  }

  const resetDay = await getWorkoutDayDetail(supabase, userId, dayId);

  if (!resetDay) {
    return {
      error: {
        status: 404,
        code: "WORKOUT_DAY_NOT_FOUND",
        message: "Workout day was not found.",
      },
      data: null,
    } as const;
  }

  return {
    error: null,
    data: resetDay,
  } as const;
}

export async function updateWorkoutSetActualReps(
  supabase: SupabaseClient,
  userId: string,
  setId: string,
  actualReps: number | null,
  actualWeightKg: number | null,
  actualRpe: number | null,
) {
  if (
    !isSetPerformanceEmpty({
      actualReps,
      actualWeightKg,
      actualRpe,
    }) &&
    !isSetPerformanceComplete({
      actualReps,
      actualWeightKg,
      actualRpe,
    })
  ) {
    return createExecutionError(
      400,
      "WORKOUT_SET_INCOMPLETE",
      "A workout set can be saved only when reps, weight and RPE are all filled.",
    );
  }

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

  const lockedDayContext = await getLockedWorkoutDayContext(
    supabase,
    userId,
    workoutExerciseRow.workout_day_id,
  );

  if (lockedDayContext.error) {
    return lockedDayContext;
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
      workoutDayId: lockedDayContext.data.day.id,
    },
  } as const;
}
