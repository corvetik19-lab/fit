import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const weeklyProgramCloneSchema = z.object({
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function computeWeekEndDate(weekStartDate: string) {
  const [year, month, day] = weekStartDate.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day));
  nextDate.setUTCDate(nextDate.getUTCDate() + 6);
  return nextDate.toISOString().slice(0, 10);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let createdProgramId: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Sign in before cloning weekly programs.",
      });
    }

    const { id } = await params;
    const payload = weeklyProgramCloneSchema.parse(await request.json());

    const { data: sourceProgram, error: sourceProgramError } = await supabase
      .from("weekly_programs")
      .select("id, title, week_start_date")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (sourceProgramError) {
      throw sourceProgramError;
    }

    if (!sourceProgram) {
      return createApiErrorResponse({
        status: 404,
        code: "WEEKLY_PROGRAM_NOT_FOUND",
        message: "Source weekly program was not found.",
      });
    }

    const { data: sourceDays, error: sourceDaysError } = await supabase
      .from("workout_days")
      .select("id, day_of_week")
      .eq("user_id", user.id)
      .eq("weekly_program_id", sourceProgram.id)
      .order("day_of_week", { ascending: true });

    if (sourceDaysError) {
      throw sourceDaysError;
    }

    const sourceDayRows = sourceDays ?? [];
    const sourceDayIds = sourceDayRows.map((day) => day.id);

    const { data: sourceExercises, error: sourceExercisesError } =
      sourceDayIds.length
        ? await supabase
            .from("workout_exercises")
            .select(
              "id, workout_day_id, exercise_library_id, exercise_title_snapshot, sets_count, sort_order",
            )
            .eq("user_id", user.id)
            .in("workout_day_id", sourceDayIds)
            .order("sort_order", { ascending: true })
        : { data: [], error: null };

    if (sourceExercisesError) {
      throw sourceExercisesError;
    }

    const sourceExerciseRows = sourceExercises ?? [];
    const sourceExerciseIds = sourceExerciseRows.map((exercise) => exercise.id);

    const { data: sourceSets, error: sourceSetsError } = sourceExerciseIds.length
      ? await supabase
          .from("workout_sets")
          .select(
            "id, workout_exercise_id, set_number, planned_reps, planned_reps_min, planned_reps_max",
          )
          .eq("user_id", user.id)
          .in("workout_exercise_id", sourceExerciseIds)
          .order("set_number", { ascending: true })
      : { data: [], error: null };

    if (sourceSetsError) {
      throw sourceSetsError;
    }

    const weekEndDate = computeWeekEndDate(payload.weekStartDate);
    const { data: createdProgram, error: createdProgramError } = await supabase
      .from("weekly_programs")
      .insert({
        user_id: user.id,
        title: `${sourceProgram.title} (copy)`,
        status: "draft",
        week_start_date: payload.weekStartDate,
        week_end_date: weekEndDate,
        is_locked: false,
        source_program_id: sourceProgram.id,
      })
      .select("id, title, status, week_start_date, week_end_date, is_locked, created_at")
      .single();

    if (createdProgramError) {
      throw createdProgramError;
    }

    createdProgramId = createdProgram.id;
    const createdDayIdsBySourceId = new Map<string, string>();
    const createdExerciseIdsBySourceId = new Map<string, string>();

    for (const sourceDay of sourceDayRows) {
      const { data: createdDay, error: createdDayError } = await supabase
        .from("workout_days")
        .insert({
          user_id: user.id,
          weekly_program_id: createdProgram.id,
          day_of_week: sourceDay.day_of_week,
          status: "planned",
        })
        .select("id")
        .single();

      if (createdDayError) {
        throw createdDayError;
      }

      createdDayIdsBySourceId.set(sourceDay.id, createdDay.id);
    }

    for (const sourceExercise of sourceExerciseRows) {
      const nextWorkoutDayId = createdDayIdsBySourceId.get(sourceExercise.workout_day_id);

      if (!nextWorkoutDayId) {
        continue;
      }

      const { data: createdExercise, error: createdExerciseError } =
        await supabase
          .from("workout_exercises")
          .insert({
            user_id: user.id,
            workout_day_id: nextWorkoutDayId,
            exercise_library_id: sourceExercise.exercise_library_id,
            exercise_title_snapshot: sourceExercise.exercise_title_snapshot,
            sets_count: sourceExercise.sets_count,
            sort_order: sourceExercise.sort_order,
          })
          .select("id")
          .single();

      if (createdExerciseError) {
        throw createdExerciseError;
      }

      createdExerciseIdsBySourceId.set(sourceExercise.id, createdExercise.id);
    }

    for (const sourceSet of sourceSets ?? []) {
      const nextWorkoutExerciseId = createdExerciseIdsBySourceId.get(
        sourceSet.workout_exercise_id,
      );

      if (!nextWorkoutExerciseId) {
        continue;
      }

      const { error: createdSetError } = await supabase
        .from("workout_sets")
        .insert({
          user_id: user.id,
          workout_exercise_id: nextWorkoutExerciseId,
          set_number: sourceSet.set_number,
          planned_reps: sourceSet.planned_reps,
          planned_reps_min: sourceSet.planned_reps_min,
          planned_reps_max: sourceSet.planned_reps_max,
          actual_reps: null,
        });

      if (createdSetError) {
        throw createdSetError;
      }
    }

    return Response.json({
      data: createdProgram,
    });
  } catch (error) {
    logger.error("weekly program clone route failed", { error });

    if (createdProgramId) {
      const supabase = await createServerSupabaseClient();
      const rollbackResult = await supabase
        .from("weekly_programs")
        .delete()
        .eq("id", createdProgramId);

      if (rollbackResult.error) {
        logger.warn("weekly program clone rollback failed", {
          error: rollbackResult.error,
          createdProgramId,
        });
      }
    }

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "WEEKLY_PROGRAM_CLONE_INVALID",
        message: "Weekly program clone payload is invalid.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "WEEKLY_PROGRAM_CLONE_FAILED",
      message: "Unable to clone weekly program.",
    });
  }
}
