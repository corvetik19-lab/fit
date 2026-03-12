import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  updateWorkoutDayExecution,
  updateWorkoutDayStatus,
  updateWorkoutSetActualReps,
} from "@/lib/workout/execution";

const workoutDayStatusMutationSchema = z.object({
  id: z.string().min(1),
  entity: z.literal("workout_day_status"),
  op: z.literal("update"),
  payload: z.object({
    dayId: z.string().uuid(),
    status: z.enum(["planned", "in_progress", "done"]),
  }),
  createdAt: z.string().min(1),
});

const workoutDayExecutionMutationSchema = z.object({
  id: z.string().min(1),
  entity: z.literal("workout_day_execution"),
  op: z.literal("update"),
  payload: z.object({
    dayId: z.string().uuid(),
    status: z.enum(["planned", "in_progress", "done"]),
    bodyWeightKg: z.number().min(0).max(500).nullable(),
    sessionNote: z.string().max(4000).nullable(),
    sessionDurationSeconds: z.number().int().min(0).max(43200).nullable(),
  }),
  createdAt: z.string().min(1),
});

const workoutSetActualRepsMutationSchema = z.object({
  id: z.string().min(1),
  entity: z.literal("workout_set_actual_reps"),
  op: z.literal("update"),
  payload: z.object({
    dayId: z.string().uuid(),
    setId: z.string().uuid(),
    actualReps: z.number().int().min(0).max(500).nullable(),
    actualWeightKg: z.number().min(0).max(1000).nullable(),
    actualRpe: z.number().min(1).max(10).nullable(),
    restSeconds: z.number().int().min(0).max(3600).nullable(),
    setNote: z.string().max(1000).nullable(),
  }),
  createdAt: z.string().min(1),
});

const syncMutationSchema = z.discriminatedUnion("entity", [
  workoutDayStatusMutationSchema,
  workoutDayExecutionMutationSchema,
  workoutSetActualRepsMutationSchema,
]);

const syncPushSchema = z.object({
  mutations: z.array(syncMutationSchema).max(100),
});

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
        message: "Sign in before pushing offline mutations.",
      });
    }

    const body = syncPushSchema.parse(await request.json());
    const processed: Array<{
      id: string;
      status: "applied" | "rejected";
      code?: string;
      message?: string;
    }> = [];

    for (const mutation of body.mutations) {
      try {
        if (mutation.entity === "workout_day_status") {
          const result = await updateWorkoutDayStatus(
            supabase,
            user.id,
            mutation.payload.dayId,
            mutation.payload.status,
          );

          if (result.error) {
            processed.push({
              id: mutation.id,
              status: "rejected",
              code: result.error.code,
              message: result.error.message,
            });
            continue;
          }
        }

        if (mutation.entity === "workout_day_execution") {
          const result = await updateWorkoutDayStatus(
            supabase,
            user.id,
            mutation.payload.dayId,
            mutation.payload.status,
          );

          if (result.error) {
            processed.push({
              id: mutation.id,
              status: "rejected",
              code: result.error.code,
              message: result.error.message,
            });
            continue;
          }

          const executionResult = await updateWorkoutDayExecution(
            supabase,
            user.id,
            mutation.payload.dayId,
            {
              bodyWeightKg: mutation.payload.bodyWeightKg,
              sessionNote: mutation.payload.sessionNote,
              sessionDurationSeconds: mutation.payload.sessionDurationSeconds,
            },
          );

          if (executionResult.error) {
            processed.push({
              id: mutation.id,
              status: "rejected",
              code: executionResult.error.code,
              message: executionResult.error.message,
            });
            continue;
          }
        }

        if (mutation.entity === "workout_set_actual_reps") {
          const result = await updateWorkoutSetActualReps(
            supabase,
            user.id,
            mutation.payload.setId,
            mutation.payload.actualReps,
            mutation.payload.actualWeightKg,
            mutation.payload.actualRpe,
            mutation.payload.restSeconds,
            mutation.payload.setNote,
          );

          if (result.error) {
            processed.push({
              id: mutation.id,
              status: "rejected",
              code: result.error.code,
              message: result.error.message,
            });
            continue;
          }
        }

        processed.push({
          id: mutation.id,
          status: "applied",
        });
      } catch (error) {
        logger.warn("sync push mutation failed", {
          error,
          mutationId: mutation.id,
          mutationEntity: mutation.entity,
        });
        processed.push({
          id: mutation.id,
          status: "rejected",
          code: "SYNC_MUTATION_FAILED",
          message: "Unable to apply offline mutation.",
        });
      }
    }

    return Response.json({
      data: {
        accepted: body.mutations.length,
        applied: processed.filter((entry) => entry.status === "applied").length,
        rejected: processed.filter((entry) => entry.status === "rejected").length,
        processed,
        cursor: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "SYNC_PUSH_INVALID",
        message: "Unable to accept the sync push payload.",
        details: error.flatten(),
      });
    }

    logger.error("sync push route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "SYNC_PUSH_FAILED",
      message: "Unable to process offline mutations.",
    });
  }
}
