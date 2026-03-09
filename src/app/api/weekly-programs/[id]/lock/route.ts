import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
        message: "Sign in before locking weekly programs.",
      });
    }

    const { id } = await params;
    const { data: program, error: programError } = await supabase
      .from("weekly_programs")
      .select("id, title, status, is_locked, week_start_date, week_end_date, created_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (programError) {
      throw programError;
    }

    if (!program) {
      return createApiErrorResponse({
        status: 404,
        code: "WEEKLY_PROGRAM_NOT_FOUND",
        message: "Weekly program was not found.",
      });
    }

    if (program.is_locked) {
      return createApiErrorResponse({
        status: 400,
        code: "WEEKLY_PROGRAM_ALREADY_LOCKED",
        message: "Weekly program is already locked.",
      });
    }

    const { data: lockedProgram, error: lockedProgramError } = await supabase
      .from("weekly_programs")
      .update({
        is_locked: true,
        status: "active",
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("is_locked", false)
      .select("id, title, status, is_locked, week_start_date, week_end_date, created_at")
      .single();

    if (lockedProgramError) {
      if (lockedProgramError.code === "23505") {
        return createApiErrorResponse({
          status: 409,
          code: "WEEKLY_PROGRAM_ACTIVE_WEEK_CONFLICT",
          message:
            "An active weekly program already exists for this week.",
        });
      }

      throw lockedProgramError;
    }

    return Response.json({
      data: lockedProgram,
    });
  } catch (error) {
    logger.error("weekly program lock route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "WEEKLY_PROGRAM_LOCK_FAILED",
      message: "Unable to lock weekly program.",
    });
  }
}
