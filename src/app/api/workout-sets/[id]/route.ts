import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateWorkoutSetActualReps } from "@/lib/workout/execution";

const workoutSetUpdateSchema = z.object({
  actualReps: z.number().int().min(0).max(500).nullable(),
  actualWeightKg: z.number().min(0).max(1000).nullable(),
  actualRpe: z.number().min(1).max(10).nullable(),
  restSeconds: z.number().int().min(0).max(3600).nullable(),
  setNote: z.string().max(1000).nullable(),
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

    const result = await updateWorkoutSetActualReps(
      supabase,
      user.id,
      id,
      payload.actualReps,
      payload.actualWeightKg,
      payload.actualRpe,
      payload.restSeconds,
      payload.setNote,
    );

    if (result.error) {
      return createApiErrorResponse(result.error);
    }

    return Response.json({ data: result.data });
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
      message: "Unable to save workout set performance.",
    });
  }
}
