import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkoutDayDetail } from "@/lib/workout/weekly-programs";

const syncPullSchema = z.object({
  scope: z.literal("workout_day"),
  dayId: z.string().uuid(),
  cursor: z.string().datetime({ offset: true }).optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Sign in before pulling sync data.",
      });
    }

    const { searchParams } = new URL(request.url);
    const parsed = syncPullSchema.parse({
      scope: searchParams.get("scope"),
      dayId: searchParams.get("dayId"),
      cursor: searchParams.get("cursor") ?? undefined,
    });
    const nextCursor = new Date().toISOString();
    const snapshot = await getWorkoutDayDetail(supabase, user.id, parsed.dayId);

    if (!snapshot) {
      return createApiErrorResponse({
        status: 404,
        code: "WORKOUT_DAY_NOT_FOUND",
        message: "Workout day not found.",
      });
    }

    return Response.json({
      data: {
        scope: parsed.scope,
        cursor: parsed.cursor ?? null,
        nextCursor,
        snapshot,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "SYNC_PULL_INVALID",
        message: "Sync pull parameters are invalid.",
        details: error.flatten(),
      });
    }

    logger.error("sync pull route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "SYNC_PULL_FAILED",
      message: "Unable to load sync changes.",
    });
  }
}
