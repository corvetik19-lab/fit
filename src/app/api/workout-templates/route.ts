import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveRepRangePreset } from "@/lib/workout/rep-ranges";
import { listWorkoutTemplates } from "@/lib/workout/templates";
import { listWorkoutSetsWithRepRangeFallback } from "@/lib/workout/workout-sets";

const createWorkoutTemplateSchema = z.object({
  programId: z.string().uuid(),
  title: z.string().trim().min(2).max(120).optional(),
});

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы открыть шаблоны тренировок.",
      });
    }

    const data = await listWorkoutTemplates(supabase, user.id);
    return Response.json({ data });
  } catch (error) {
    logger.error("workout template list route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "WORKOUT_TEMPLATE_LIST_FAILED",
      message: "Не удалось загрузить шаблоны тренировок.",
    });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы сохранять шаблоны тренировок.",
      });
    }

    const payload = createWorkoutTemplateSchema.parse(await request.json());

    const { data: programRow, error: programError } = await supabase
      .from("weekly_programs")
      .select("id, title")
      .eq("id", payload.programId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (programError) {
      throw programError;
    }

    if (!programRow) {
      return createApiErrorResponse({
        status: 404,
        code: "WORKOUT_TEMPLATE_SOURCE_NOT_FOUND",
        message: "Исходная недельная программа не найдена.",
      });
    }

    const { data: dayRows, error: dayRowsError } = await supabase
      .from("workout_days")
      .select("id, day_of_week")
      .eq("user_id", user.id)
      .eq("weekly_program_id", payload.programId)
      .order("day_of_week", { ascending: true });

    if (dayRowsError) {
      throw dayRowsError;
    }

    const dayIds = (dayRows ?? []).map((day) => day.id);
    const { data: exerciseRows, error: exerciseRowsError } = dayIds.length
      ? await supabase
          .from("workout_exercises")
          .select(
            "id, workout_day_id, exercise_library_id, exercise_title_snapshot, sets_count, sort_order",
          )
          .eq("user_id", user.id)
          .in("workout_day_id", dayIds)
          .order("sort_order", { ascending: true })
      : { data: [], error: null };

    if (exerciseRowsError) {
      throw exerciseRowsError;
    }

    const exerciseIds = (exerciseRows ?? []).map((exercise) => exercise.id);
    const setRows = await listWorkoutSetsWithRepRangeFallback(
      supabase,
      user.id,
      exerciseIds,
    );

    const firstRepRangeByExerciseId = new Map<
      string,
      {
        plannedReps: number;
        plannedRepsMin: number | null;
        plannedRepsMax: number | null;
      }
    >();

    for (const setRow of setRows) {
      if (!firstRepRangeByExerciseId.has(setRow.workout_exercise_id)) {
        firstRepRangeByExerciseId.set(
          setRow.workout_exercise_id,
          {
            plannedReps: setRow.planned_reps,
            plannedRepsMin: setRow.planned_reps_min,
            plannedRepsMax: setRow.planned_reps_max,
          },
        );
      }
    }

    const exercisesByDayId = new Map<
      string,
      Array<{
        exerciseLibraryId: string | null;
        exerciseTitleSnapshot: string;
        setsCount: number;
        plannedReps: number;
        plannedRepsMin: number | null;
        plannedRepsMax: number | null;
        repRangeKey: string;
      }>
    >();

    for (const exerciseRow of exerciseRows ?? []) {
      const currentExercises = exercisesByDayId.get(exerciseRow.workout_day_id) ?? [];
      const firstRepRange = firstRepRangeByExerciseId.get(exerciseRow.id) ?? {
        plannedReps: exerciseRow.sets_count,
        plannedRepsMin: null,
        plannedRepsMax: null,
      };
      const repRangePreset = resolveRepRangePreset(firstRepRange);

      currentExercises.push({
        exerciseLibraryId: exerciseRow.exercise_library_id,
        exerciseTitleSnapshot: exerciseRow.exercise_title_snapshot,
        setsCount: exerciseRow.sets_count,
        plannedReps: firstRepRange.plannedReps,
        plannedRepsMin: firstRepRange.plannedRepsMin,
        plannedRepsMax: firstRepRange.plannedRepsMax,
        repRangeKey: repRangePreset.key,
      });
      exercisesByDayId.set(exerciseRow.workout_day_id, currentExercises);
    }

    const templatePayload = {
      days: (dayRows ?? []).map((dayRow) => ({
        dayOfWeek: dayRow.day_of_week,
        exercises: exercisesByDayId.get(dayRow.id) ?? [],
      })),
    };

    const { data, error } = await supabase
      .from("workout_templates")
      .insert({
        user_id: user.id,
        title: payload.title ?? `${programRow.title} template`,
        payload: templatePayload,
      })
      .select("id, title, payload, created_at")
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ data });
  } catch (error) {
    logger.error("workout template create route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "WORKOUT_TEMPLATE_CREATE_INVALID",
        message: "Параметры шаблона тренировки заполнены некорректно.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "WORKOUT_TEMPLATE_CREATE_FAILED",
      message: "Не удалось сохранить шаблон тренировки.",
    });
  }
}
