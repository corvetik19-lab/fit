import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateWorkoutDayExecution } from "@/lib/workout/execution";

const workoutDayUpdateSchema = z
  .object({
    status: z.enum(["planned", "in_progress", "done"]).optional(),
    bodyWeightKg: z.number().min(0).max(500).nullable().optional(),
    sessionNote: z.string().max(4000).nullable().optional(),
    sessionDurationSeconds: z.number().int().min(0).max(43200).nullable().optional(),
  })
  .refine(
    (value) =>
      value.status !== undefined ||
      value.bodyWeightKg !== undefined ||
      value.sessionNote !== undefined ||
      value.sessionDurationSeconds !== undefined,
    {
      message: "At least one workout day field is required.",
      path: ["status"],
    },
  );

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

    const result = await updateWorkoutDayExecution(
      supabase,
      user.id,
      id,
      {
        status: payload.status,
        bodyWeightKg: payload.bodyWeightKg,
        sessionNote: payload.sessionNote,
        sessionDurationSeconds: payload.sessionDurationSeconds,
      },
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
