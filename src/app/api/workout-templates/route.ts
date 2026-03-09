import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listWorkoutTemplates } from "@/lib/workout/templates";

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
        message: "Sign in before loading workout templates.",
      });
    }

    const data = await listWorkoutTemplates(supabase, user.id);
    return Response.json({ data });
  } catch (error) {
    logger.error("workout template list route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "WORKOUT_TEMPLATE_LIST_FAILED",
      message: "Unable to load workout templates.",
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
        message: "Sign in before saving workout templates.",
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
        message: "Source weekly program was not found.",
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
    const { data: setRows, error: setRowsError } = exerciseIds.length
      ? await supabase
          .from("workout_sets")
          .select("workout_exercise_id, set_number, planned_reps")
          .eq("user_id", user.id)
          .in("workout_exercise_id", exerciseIds)
          .order("set_number", { ascending: true })
      : { data: [], error: null };

    if (setRowsError) {
      throw setRowsError;
    }

    const firstPlannedRepsByExerciseId = new Map<string, number>();

    for (const setRow of setRows ?? []) {
      if (!firstPlannedRepsByExerciseId.has(setRow.workout_exercise_id)) {
        firstPlannedRepsByExerciseId.set(
          setRow.workout_exercise_id,
          setRow.planned_reps,
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
      }>
    >();

    for (const exerciseRow of exerciseRows ?? []) {
      const currentExercises = exercisesByDayId.get(exerciseRow.workout_day_id) ?? [];
      currentExercises.push({
        exerciseLibraryId: exerciseRow.exercise_library_id,
        exerciseTitleSnapshot: exerciseRow.exercise_title_snapshot,
        setsCount: exerciseRow.sets_count,
        plannedReps:
          firstPlannedRepsByExerciseId.get(exerciseRow.id) ?? exerciseRow.sets_count,
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
        message: "Workout template payload is invalid.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "WORKOUT_TEMPLATE_CREATE_FAILED",
      message: "Unable to save workout template.",
    });
  }
}
