import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { withTransientRetry } from "@/lib/runtime-retry";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  insertWorkoutSetWithRepRangeFallback,
  listWorkoutSetsWithRepRangeFallback,
} from "@/lib/workout/workout-sets";

const weeklyProgramCloneSchema = z.object({
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const paramsSchema = z.object({
  id: z.string().uuid(),
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
    } = await withTransientRetry(async () => await supabase.auth.getUser());

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы копировать недельные программы.",
      });
    }

    const { id } = paramsSchema.parse(await params);
    const payload = weeklyProgramCloneSchema.parse(await request.json());

    const { data: sourceProgram, error: sourceProgramError } =
      await withTransientRetry(async () =>
        await supabase
          .from("weekly_programs")
          .select("id, title, week_start_date")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle(),
      );

    if (sourceProgramError) {
      throw sourceProgramError;
    }

    if (!sourceProgram) {
      return createApiErrorResponse({
        status: 404,
        code: "WEEKLY_PROGRAM_NOT_FOUND",
        message: "Исходная недельная программа не найдена.",
      });
    }

    const { data: sourceDays, error: sourceDaysError } = await withTransientRetry(
      async () =>
        await supabase
          .from("workout_days")
          .select("id, day_of_week")
          .eq("user_id", user.id)
          .eq("weekly_program_id", sourceProgram.id)
          .order("day_of_week", { ascending: true }),
    );

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
    const sourceSets = await listWorkoutSetsWithRepRangeFallback(
      supabase,
      user.id,
      sourceExerciseIds,
    );

    const weekEndDate = computeWeekEndDate(payload.weekStartDate);
    const { data: createdProgram, error: createdProgramError } = await supabase
      .from("weekly_programs")
      .insert({
        user_id: user.id,
        title: `${sourceProgram.title} (копия)`,
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

    for (const sourceSet of sourceSets) {
      const nextWorkoutExerciseId = createdExerciseIdsBySourceId.get(
        sourceSet.workout_exercise_id,
      );

      if (!nextWorkoutExerciseId) {
        continue;
      }

      await insertWorkoutSetWithRepRangeFallback(supabase, {
        user_id: user.id,
        workout_exercise_id: nextWorkoutExerciseId,
        set_number: sourceSet.set_number,
        planned_reps: sourceSet.planned_reps,
        planned_reps_min: sourceSet.planned_reps_min,
        planned_reps_max: sourceSet.planned_reps_max,
        actual_reps: null,
        actual_weight_kg: null,
        actual_rpe: null,
      });
    }

    return Response.json({
      data: createdProgram,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "WEEKLY_PROGRAM_CLONE_INVALID",
        message: "Параметры копирования недельной программы заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("weekly program clone route failed", { error });

    if (createdProgramId) {
      const supabase = await createServerSupabaseClient();
      const rollbackResult = await withTransientRetry(async () =>
        await supabase.from("weekly_programs").delete().eq("id", createdProgramId),
      );

      if (rollbackResult.error) {
        logger.warn("weekly program clone rollback failed", {
          error: rollbackResult.error,
          createdProgramId,
        });
      }
    }

    return createApiErrorResponse({
      status: 500,
      code: "WEEKLY_PROGRAM_CLONE_FAILED",
      message: "Не удалось скопировать недельную программу.",
    });
  }
}
