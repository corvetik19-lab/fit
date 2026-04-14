import type { SupabaseClient } from "@supabase/supabase-js";

import { listWorkoutSetsWithRepRangeFallback } from "@/lib/workout/workout-sets";

export type WeeklyProgramSetSummary = {
  id: string;
  set_number: number;
  planned_reps: number;
  planned_reps_min: number | null;
  planned_reps_max: number | null;
  actual_reps: number | null;
  actual_weight_kg: number | null;
  actual_rpe: number | null;
};

export type WeeklyProgramExerciseSummary = {
  id: string;
  exercise_title_snapshot: string;
  sets_count: number;
  sort_order: number;
  sets: WeeklyProgramSetSummary[];
};

export type WeeklyProgramExerciseOverview = Omit<
  WeeklyProgramExerciseSummary,
  "sets"
>;

export type WeeklyProgramDayOverview = {
  id: string;
  day_of_week: number;
  status: string;
  exercises: WeeklyProgramExerciseOverview[];
};

export type WeeklyProgramOverviewSummary = Omit<WeeklyProgramSummary, "days"> & {
  days: WeeklyProgramDayOverview[];
};

export type WeeklyProgramDaySummary = {
  id: string;
  day_of_week: number;
  status: string;
  exercises: WeeklyProgramExerciseSummary[];
};

export type WeeklyProgramSummary = {
  id: string;
  title: string;
  status: string;
  week_start_date: string;
  week_end_date: string;
  is_locked: boolean;
  created_at: string;
  days: WeeklyProgramDaySummary[];
};

export type WorkoutDayDetail = {
  id: string;
  weekly_program_id: string;
  day_of_week: number;
  status: string;
  body_weight_kg: number | null;
  session_note: string | null;
  session_duration_seconds: number | null;
  program_title: string;
  week_start_date: string;
  week_end_date: string;
  program_status: string;
  is_locked: boolean;
  exercises: WeeklyProgramExerciseSummary[];
};

type WeeklyProgramRow = Omit<WeeklyProgramSummary, "days">;

type WorkoutDayRow = {
  id: string;
  weekly_program_id: string;
  day_of_week: number;
  status: string;
  body_weight_kg?: number | null;
  session_note?: string | null;
  session_duration_seconds?: number | null;
};

type WorkoutExerciseRow = Omit<WeeklyProgramExerciseSummary, "sets"> & {
  workout_day_id: string;
};

export async function listWeeklyPrograms(
  supabase: SupabaseClient,
  userId: string,
  limit = 6,
) {
  const { data: programs, error: programsError } = await supabase
    .from("weekly_programs")
    .select(
      "id, title, status, week_start_date, week_end_date, is_locked, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (programsError) {
    throw programsError;
  }

  const weeklyPrograms = (programs as WeeklyProgramRow[] | null) ?? [];

  if (!weeklyPrograms.length) {
    return [];
  }

  const programIds = weeklyPrograms.map((program) => program.id);
  const { data: days, error: daysError } = await supabase
    .from("workout_days")
    .select("id, weekly_program_id, day_of_week, status")
    .eq("user_id", userId)
    .in("weekly_program_id", programIds)
    .order("day_of_week", { ascending: true });

  if (daysError) {
    throw daysError;
  }

  const workoutDays = (days as WorkoutDayRow[] | null) ?? [];

  if (!workoutDays.length) {
    return weeklyPrograms.map((program) => ({
      ...program,
      days: [],
    }));
  }

  const dayIds = workoutDays.map((day) => day.id);
  const { data: exercises, error: exercisesError } = await supabase
    .from("workout_exercises")
    .select(
      "id, workout_day_id, exercise_title_snapshot, sets_count, sort_order",
    )
    .eq("user_id", userId)
    .in("workout_day_id", dayIds)
    .order("sort_order", { ascending: true });

  if (exercisesError) {
    throw exercisesError;
  }

  const workoutExercises = (exercises as WorkoutExerciseRow[] | null) ?? [];

  if (!workoutExercises.length) {
    const daysByProgram = new Map<string, WeeklyProgramDaySummary[]>();

    for (const day of workoutDays) {
      const nextDay: WeeklyProgramDaySummary = {
        id: day.id,
        day_of_week: day.day_of_week,
        status: day.status,
        exercises: [],
      };
      const currentDays = daysByProgram.get(day.weekly_program_id) ?? [];
      currentDays.push(nextDay);
      daysByProgram.set(day.weekly_program_id, currentDays);
    }

    return weeklyPrograms.map((program) => ({
      ...program,
      days: daysByProgram.get(program.id) ?? [],
    }));
  }

  const exerciseIds = workoutExercises.map((exercise) => exercise.id);
  const workoutSets = await listWorkoutSetsWithRepRangeFallback(
    supabase,
    userId,
    exerciseIds,
  );
  const setsByExerciseId = new Map<string, WeeklyProgramSetSummary[]>();

  for (const workoutSet of workoutSets) {
    const currentSets = setsByExerciseId.get(workoutSet.workout_exercise_id) ?? [];
    currentSets.push({
      id: workoutSet.id,
      set_number: workoutSet.set_number,
      planned_reps: workoutSet.planned_reps,
      planned_reps_min: workoutSet.planned_reps_min,
      planned_reps_max: workoutSet.planned_reps_max,
      actual_reps: workoutSet.actual_reps,
      actual_weight_kg: workoutSet.actual_weight_kg,
      actual_rpe: workoutSet.actual_rpe,
    });
    setsByExerciseId.set(workoutSet.workout_exercise_id, currentSets);
  }

  const exercisesByDayId = new Map<string, WeeklyProgramExerciseSummary[]>();

  for (const exercise of workoutExercises) {
    const currentExercises = exercisesByDayId.get(exercise.workout_day_id) ?? [];
    currentExercises.push({
      id: exercise.id,
      exercise_title_snapshot: exercise.exercise_title_snapshot,
      sets_count: exercise.sets_count,
      sort_order: exercise.sort_order,
      sets: setsByExerciseId.get(exercise.id) ?? [],
    });
    exercisesByDayId.set(exercise.workout_day_id, currentExercises);
  }

  const daysByProgramId = new Map<string, WeeklyProgramDaySummary[]>();

  for (const day of workoutDays) {
    const currentDays = daysByProgramId.get(day.weekly_program_id) ?? [];
    currentDays.push({
      id: day.id,
      day_of_week: day.day_of_week,
      status: day.status,
      exercises: exercisesByDayId.get(day.id) ?? [],
    });
    daysByProgramId.set(day.weekly_program_id, currentDays);
  }

  return weeklyPrograms.map((program) => ({
    ...program,
    days: daysByProgramId.get(program.id) ?? [],
  }));
}

export async function listWeeklyProgramsOverview(
  supabase: SupabaseClient,
  userId: string,
  limit = 6,
) {
  const { data: programs, error: programsError } = await supabase
    .from("weekly_programs")
    .select(
      "id, title, status, week_start_date, week_end_date, is_locked, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (programsError) {
    throw programsError;
  }

  const weeklyPrograms = (programs as WeeklyProgramRow[] | null) ?? [];

  if (!weeklyPrograms.length) {
    return [];
  }

  const programIds = weeklyPrograms.map((program) => program.id);
  const { data: days, error: daysError } = await supabase
    .from("workout_days")
    .select("id, weekly_program_id, day_of_week, status")
    .eq("user_id", userId)
    .in("weekly_program_id", programIds)
    .order("day_of_week", { ascending: true });

  if (daysError) {
    throw daysError;
  }

  const workoutDays = (days as WorkoutDayRow[] | null) ?? [];

  if (!workoutDays.length) {
    return weeklyPrograms.map((program) => ({
      ...program,
      days: [],
    })) satisfies WeeklyProgramOverviewSummary[];
  }

  const dayIds = workoutDays.map((day) => day.id);
  const { data: exercises, error: exercisesError } = await supabase
    .from("workout_exercises")
    .select(
      "id, workout_day_id, exercise_title_snapshot, sets_count, sort_order",
    )
    .eq("user_id", userId)
    .in("workout_day_id", dayIds)
    .order("sort_order", { ascending: true });

  if (exercisesError) {
    throw exercisesError;
  }

  const workoutExercises = (exercises as WorkoutExerciseRow[] | null) ?? [];
  const exercisesByDayId = new Map<string, WeeklyProgramExerciseOverview[]>();

  for (const exercise of workoutExercises) {
    const currentExercises = exercisesByDayId.get(exercise.workout_day_id) ?? [];
    currentExercises.push({
      id: exercise.id,
      exercise_title_snapshot: exercise.exercise_title_snapshot,
      sets_count: exercise.sets_count,
      sort_order: exercise.sort_order,
    });
    exercisesByDayId.set(exercise.workout_day_id, currentExercises);
  }

  const daysByProgramId = new Map<string, WeeklyProgramDayOverview[]>();

  for (const day of workoutDays) {
    const currentDays = daysByProgramId.get(day.weekly_program_id) ?? [];
    currentDays.push({
      id: day.id,
      day_of_week: day.day_of_week,
      status: day.status,
      exercises: exercisesByDayId.get(day.id) ?? [],
    });
    daysByProgramId.set(day.weekly_program_id, currentDays);
  }

  return weeklyPrograms.map((program) => ({
    ...program,
    days: daysByProgramId.get(program.id) ?? [],
  })) satisfies WeeklyProgramOverviewSummary[];
}

export async function getWorkoutDayDetail(
  supabase: SupabaseClient,
  userId: string,
  dayId: string,
) {
  const { data: dayRow, error: dayError } = await supabase
    .from("workout_days")
    .select(
      "id, weekly_program_id, day_of_week, status, body_weight_kg, session_note, session_duration_seconds",
    )
    .eq("id", dayId)
    .eq("user_id", userId)
    .maybeSingle();

  if (dayError) {
    throw dayError;
  }

  if (!dayRow) {
    return null;
  }

  const { data: programRow, error: programError } = await supabase
    .from("weekly_programs")
    .select("id, title, status, week_start_date, week_end_date, is_locked")
    .eq("id", dayRow.weekly_program_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (programError) {
    throw programError;
  }

  if (!programRow) {
    return null;
  }

  const { data: exercises, error: exercisesError } = await supabase
    .from("workout_exercises")
    .select(
      "id, exercise_title_snapshot, sets_count, sort_order",
    )
    .eq("user_id", userId)
    .eq("workout_day_id", dayId)
    .order("sort_order", { ascending: true });

  if (exercisesError) {
    throw exercisesError;
  }

  const workoutExercises = (exercises as Array<
    Omit<WeeklyProgramExerciseSummary, "sets">
  > | null) ?? [];

  if (!workoutExercises.length) {
    return {
      id: dayRow.id,
      weekly_program_id: dayRow.weekly_program_id,
      day_of_week: dayRow.day_of_week,
      status: dayRow.status,
      body_weight_kg: dayRow.body_weight_kg ?? null,
      session_note: dayRow.session_note ?? null,
      session_duration_seconds: dayRow.session_duration_seconds ?? null,
      program_title: programRow.title,
      week_start_date: programRow.week_start_date,
      week_end_date: programRow.week_end_date,
      program_status: programRow.status,
      is_locked: programRow.is_locked,
      exercises: [],
    } satisfies WorkoutDayDetail;
  }

  const exerciseIds = workoutExercises.map((exercise) => exercise.id);
  const workoutSets = await listWorkoutSetsWithRepRangeFallback(
    supabase,
    userId,
    exerciseIds,
  );
  const setsByExerciseId = new Map<string, WeeklyProgramSetSummary[]>();

  for (const workoutSet of workoutSets) {
    const currentSets = setsByExerciseId.get(workoutSet.workout_exercise_id) ?? [];
    currentSets.push({
      id: workoutSet.id,
      set_number: workoutSet.set_number,
      planned_reps: workoutSet.planned_reps,
      planned_reps_min: workoutSet.planned_reps_min,
      planned_reps_max: workoutSet.planned_reps_max,
      actual_reps: workoutSet.actual_reps,
      actual_weight_kg: workoutSet.actual_weight_kg,
      actual_rpe: workoutSet.actual_rpe,
    });
    setsByExerciseId.set(workoutSet.workout_exercise_id, currentSets);
  }

  return {
    id: dayRow.id,
    weekly_program_id: dayRow.weekly_program_id,
    day_of_week: dayRow.day_of_week,
    status: dayRow.status,
    body_weight_kg: dayRow.body_weight_kg ?? null,
    session_note: dayRow.session_note ?? null,
    session_duration_seconds: dayRow.session_duration_seconds ?? null,
    program_title: programRow.title,
    week_start_date: programRow.week_start_date,
    week_end_date: programRow.week_end_date,
    program_status: programRow.status,
    is_locked: programRow.is_locked,
    exercises: workoutExercises.map((exercise) => ({
      ...exercise,
      sets: setsByExerciseId.get(exercise.id) ?? [],
    })),
  } satisfies WorkoutDayDetail;
}
