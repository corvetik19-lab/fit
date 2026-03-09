import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const workoutSetUpdateSchema = z.object({
  actualReps: z.number().int().min(0).max(500).nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Sign in before updating actual reps.",
      });
    }

    const { id } = await params;
    const payload = workoutSetUpdateSchema.parse(await request.json());

    const { data: workoutSetRow, error: workoutSetError } = await supabase
      .from("workout_sets")
      .select("id, workout_exercise_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (workoutSetError) {
      throw workoutSetError;
    }

    if (!workoutSetRow) {
      return createApiErrorResponse({
        status: 404,
        code: "WORKOUT_SET_NOT_FOUND",
        message: "Workout set was not found.",
      });
    }

    const { data: workoutExerciseRow, error: workoutExerciseError } =
      await supabase
        .from("workout_exercises")
        .select("id, workout_day_id")
        .eq("id", workoutSetRow.workout_exercise_id)
        .eq("user_id", user.id)
        .maybeSingle();

    if (workoutExerciseError) {
      throw workoutExerciseError;
    }

    if (!workoutExerciseRow) {
      return createApiErrorResponse({
        status: 404,
        code: "WORKOUT_EXERCISE_NOT_FOUND",
        message: "Workout exercise was not found.",
      });
    }

    const { data: workoutDayRow, error: workoutDayError } = await supabase
      .from("workout_days")
      .select("id, weekly_program_id")
      .eq("id", workoutExerciseRow.workout_day_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (workoutDayError) {
      throw workoutDayError;
    }

    if (!workoutDayRow) {
      return createApiErrorResponse({
        status: 404,
        code: "WORKOUT_DAY_NOT_FOUND",
        message: "Workout day was not found.",
      });
    }

    const { data: programRow, error: programError } = await supabase
      .from("weekly_programs")
      .select("id, is_locked")
      .eq("id", workoutDayRow.weekly_program_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (programError) {
      throw programError;
    }

    if (!programRow?.is_locked) {
      return createApiErrorResponse({
        status: 400,
        code: "WORKOUT_SET_REQUIRES_LOCKED_PROGRAM",
        message: "Actual reps can be saved only for locked weeks.",
      });
    }

    const { data, error } = await supabase
      .from("workout_sets")
      .update({
        actual_reps: payload.actualReps,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, actual_reps")
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ data });
  } catch (error) {
    logger.error("workout set update route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "WORKOUT_SET_UPDATE_INVALID",
        message: "Workout set payload is invalid.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "WORKOUT_SET_UPDATE_FAILED",
      message: "Unable to save actual reps.",
    });
  }
}
