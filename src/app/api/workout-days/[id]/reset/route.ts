import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resetWorkoutDayExecution } from "@/lib/workout/execution";

export async function POST(
  _request: Request,
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
        message: "Sign in before resetting workout day progress.",
      });
    }

    const { id } = await params;
    const result = await resetWorkoutDayExecution(supabase, user.id, id);

    if (result.error) {
      return createApiErrorResponse(result.error);
    }

    return Response.json({ data: result.data });
  } catch (error) {
    logger.error("workout day reset route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "WORKOUT_DAY_RESET_FAILED",
      message: "Unable to reset workout day progress.",
    });
  }
}
