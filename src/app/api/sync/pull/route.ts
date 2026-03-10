import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkoutDayDetail } from "@/lib/workout/weekly-programs";

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
    const scope = searchParams.get("scope");
    const cursor = searchParams.get("cursor");
    const nextCursor = new Date().toISOString();

    if (scope !== "workout_day") {
      return createApiErrorResponse({
        status: 400,
        code: "SYNC_PULL_SCOPE_INVALID",
        message: "The requested sync scope is not supported yet.",
      });
    }

    const dayId = searchParams.get("dayId");

    if (!dayId) {
      return createApiErrorResponse({
        status: 400,
        code: "SYNC_PULL_DAY_ID_REQUIRED",
        message: "Workout day sync requires a dayId.",
      });
    }

    const snapshot = await getWorkoutDayDetail(supabase, user.id, dayId);

    if (!snapshot) {
      return createApiErrorResponse({
        status: 404,
        code: "WORKOUT_DAY_NOT_FOUND",
        message: "Workout day not found.",
      });
    }

    return Response.json({
      data: {
        scope,
        cursor,
        nextCursor,
        snapshot,
      },
    });
  } catch (error) {
    logger.error("sync pull route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "SYNC_PULL_FAILED",
      message: "Unable to load sync changes.",
    });
  }
}
