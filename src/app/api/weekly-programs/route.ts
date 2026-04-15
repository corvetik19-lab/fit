import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { withTransientRetry } from "@/lib/runtime-retry";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  defaultRepRangePresetKey,
  getRepRangePreset,
  isRepRangePresetKey,
} from "@/lib/workout/rep-ranges";
import { insertWorkoutSetsWithRepRangeFallback } from "@/lib/workout/workout-sets";
import { listWeeklyPrograms } from "@/lib/workout/weekly-programs";

const weeklyProgramExerciseSchema = z.object({
  exerciseLibraryId: z.string().uuid(),
  setsCount: z.number().int().min(1).max(12),
  repRangeKey: z.string().refine(isRepRangePresetKey),
});

const weeklyProgramDaySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  exercises: z.array(weeklyProgramExerciseSchema).min(1).max(12),
});

const weeklyProgramCreateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.array(weeklyProgramDaySchema).min(1).max(7),
});

function computeWeekEndDate(weekStartDate: string) {
  const [year, month, day] = weekStartDate.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day));
  nextDate.setUTCDate(nextDate.getUTCDate() + 6);
  return nextDate.toISOString().slice(0, 10);
}

function buildExerciseTitleMap(rows: Array<{ id: string; title: string }>) {
  const titleMap = new Map<string, string>();

  for (const row of rows) {
    titleMap.set(row.id, row.title);
  }

  return titleMap;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withTransientRetry(async () => await supabase.auth.getUser());

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы открыть недельные программы.",
      });
    }

    const data = await withTransientRetry(async () =>
      await listWeeklyPrograms(supabase, user.id),
    );

    return Response.json({ data });
  } catch (error) {
    logger.error("weekly program list route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "WEEKLY_PROGRAM_LIST_FAILED",
      message: "Не удалось загрузить недельные программы.",
    });
  }
}

export async function POST(request: Request) {
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
        message: "Нужно войти в аккаунт, чтобы создавать недельные программы.",
      });
    }

    const payload = weeklyProgramCreateSchema.parse(await request.json());
    const uniqueDays = new Set<number>();

    for (const day of payload.days) {
      if (uniqueDays.has(day.dayOfWeek)) {
        return createApiErrorResponse({
          status: 400,
          code: "WEEKLY_PROGRAM_DUPLICATE_DAY",
          message: "Каждый тренировочный день можно добавить только один раз.",
        });
      }

      uniqueDays.add(day.dayOfWeek);
    }

    const exerciseIds = Array.from(
      new Set(
        payload.days.flatMap((day) =>
          day.exercises.map((exercise) => exercise.exerciseLibraryId),
        ),
      ),
    );

    const { data: exerciseRows, error: exerciseRowsError } =
      await withTransientRetry(async () =>
        await supabase
          .from("exercise_library")
          .select("id, title")
          .in("id", exerciseIds)
          .eq("is_archived", false),
      );

    if (exerciseRowsError) {
      throw exerciseRowsError;
    }

    if ((exerciseRows?.length ?? 0) !== exerciseIds.length) {
      return createApiErrorResponse({
        status: 400,
        code: "WEEKLY_PROGRAM_EXERCISE_INVALID",
        message: "Одно или несколько упражнений не найдены в активной библиотеке.",
      });
    }

    const exerciseTitleMap = buildExerciseTitleMap(exerciseRows ?? []);
    const weekEndDate = computeWeekEndDate(payload.weekStartDate);

    const { data: programRow, error: programError } = await withTransientRetry(
      async () =>
        await supabase
          .from("weekly_programs")
          .insert({
            user_id: user.id,
            title: payload.title,
            status: "draft",
            week_start_date: payload.weekStartDate,
            week_end_date: weekEndDate,
            is_locked: false,
          })
          .select(
            "id, title, status, week_start_date, week_end_date, is_locked, created_at",
          )
          .single(),
      {
        attempts: 4,
        delaysMs: [500, 1_500, 3_000, 5_000],
      },
    );

    if (programError) {
      throw programError;
    }

    createdProgramId = programRow.id;

    for (const day of payload.days) {
      const { data: dayRow, error: dayError } = await withTransientRetry(
        async () =>
          await supabase
            .from("workout_days")
            .insert({
              user_id: user.id,
              weekly_program_id: createdProgramId,
              day_of_week: day.dayOfWeek,
              status: "planned",
            })
            .select("id")
            .single(),
        {
          attempts: 4,
          delaysMs: [500, 1_500, 3_000, 5_000],
        },
      );

      if (dayError) {
        throw dayError;
      }

      for (const [index, exercise] of day.exercises.entries()) {
        const repRangePreset =
          getRepRangePreset(exercise.repRangeKey) ??
          getRepRangePreset(defaultRepRangePresetKey);

        if (!repRangePreset) {
          return createApiErrorResponse({
            status: 400,
            code: "WEEKLY_PROGRAM_REP_RANGE_INVALID",
            message: "Диапазон повторений заполнен некорректно.",
          });
        }

        const { data: workoutExerciseRow, error: workoutExerciseError } =
          await withTransientRetry(
            async () =>
              await supabase
            .from("workout_exercises")
            .insert({
              user_id: user.id,
              workout_day_id: dayRow.id,
              exercise_library_id: exercise.exerciseLibraryId,
              exercise_title_snapshot:
                exerciseTitleMap.get(exercise.exerciseLibraryId) ??
                "Неизвестное упражнение",
              sets_count: exercise.setsCount,
              sort_order: index,
            })
            .select("id")
            .single(),
            {
              attempts: 4,
              delaysMs: [500, 1_500, 3_000, 5_000],
            },
          );

        if (workoutExerciseError) {
          throw workoutExerciseError;
        }

        const setsPayload = Array.from(
          { length: exercise.setsCount },
          (_, setIndex) => ({
            user_id: user.id,
            workout_exercise_id: workoutExerciseRow.id,
            set_number: setIndex + 1,
            planned_reps: repRangePreset.max,
            planned_reps_min: repRangePreset.min,
            planned_reps_max: repRangePreset.max,
            actual_reps: null,
            actual_weight_kg: null,
            actual_rpe: null,
          }),
        );

        await insertWorkoutSetsWithRepRangeFallback(supabase, setsPayload);
      }
    }

    return Response.json({
      data: programRow,
    });
  } catch (error) {
    if (createdProgramId) {
      const supabase = await createServerSupabaseClient();
      const rollbackResult = await withTransientRetry(async () =>
        await supabase.from("weekly_programs").delete().eq("id", createdProgramId),
      );

      if (rollbackResult.error) {
        logger.warn("weekly program rollback failed", {
          error: rollbackResult.error,
          createdProgramId,
        });
      }
    }

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "WEEKLY_PROGRAM_CREATE_INVALID",
        message: "Параметры недельной программы заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("weekly program create route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "WEEKLY_PROGRAM_CREATE_FAILED",
      message: "Не удалось создать недельную программу.",
    });
  }
}
