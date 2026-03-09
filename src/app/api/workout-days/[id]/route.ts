import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const workoutDayUpdateSchema = z.object({
  status: z.enum(["planned", "in_progress", "done"]),
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
        message: "Sign in before updating workout day status.",
      });
    }

    const { id } = await params;
    const payload = workoutDayUpdateSchema.parse(await request.json());

    const { data: dayRow, error: dayError } = await supabase
      .from("workout_days")
      .select("id, weekly_program_id, status")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (dayError) {
      throw dayError;
    }

    if (!dayRow) {
      return createApiErrorResponse({
        status: 404,
        code: "WORKOUT_DAY_NOT_FOUND",
        message: "Workout day was not found.",
      });
    }

    const { data: programRow, error: programError } = await supabase
      .from("weekly_programs")
      .select("id, is_locked")
      .eq("id", dayRow.weekly_program_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (programError) {
      throw programError;
    }

    if (!programRow?.is_locked) {
      return createApiErrorResponse({
        status: 400,
        code: "WORKOUT_DAY_REQUIRES_LOCKED_PROGRAM",
        message: "Workout day execution is available only for locked weeks.",
      });
    }

    const { data, error } = await supabase
      .from("workout_days")
      .update({
        status: payload.status,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, status")
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ data });
  } catch (error) {
    logger.error("workout day update route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "WORKOUT_DAY_UPDATE_INVALID",
        message: "Workout day payload is invalid.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "WORKOUT_DAY_UPDATE_FAILED",
      message: "Unable to update workout day status.",
    });
  }
}
