import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateWorkoutDayStatus } from "@/lib/workout/execution";

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

    const result = await updateWorkoutDayStatus(
      supabase,
      user.id,
      id,
      payload.status,
    );

    if (result.error) {
      return createApiErrorResponse(result.error);
    }

    return Response.json({ data: result.data });
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
