import { createApiErrorResponse } from "@/lib/api/error-response";
import { requireAdminRouteAccess } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentAdmin = await requireAdminRouteAccess();
    const { id } = await params;
    const adminSupabase = createAdminSupabaseClient();

    const [
      authUserResult,
      profileResult,
      onboardingResult,
      goalResult,
      adminRoleResult,
      exercisesCountResult,
      programsCountResult,
      supportActionsResult,
      auditLogsResult,
    ] = await Promise.all([
      adminSupabase.auth.admin.getUserById(id),
      adminSupabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, created_at, updated_at")
        .eq("user_id", id)
        .maybeSingle(),
      adminSupabase
        .from("onboarding_profiles")
        .select(
          "age, sex, height_cm, weight_kg, fitness_level, equipment, injuries, dietary_preferences, created_at, updated_at",
        )
        .eq("user_id", id)
        .maybeSingle(),
      adminSupabase
        .from("goals")
        .select(
          "goal_type, target_weight_kg, weekly_training_days, created_at, updated_at",
        )
        .eq("user_id", id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("platform_admins")
        .select("role, created_at")
        .eq("user_id", id)
        .maybeSingle(),
      adminSupabase
        .from("exercise_library")
        .select("*", { count: "exact", head: true })
        .eq("user_id", id)
        .eq("is_archived", false),
      adminSupabase
        .from("weekly_programs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", id),
      adminSupabase
        .from("support_actions")
        .select("id, action, status, created_at")
        .eq("target_user_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
      adminSupabase
        .from("admin_audit_logs")
        .select("id, action, reason, created_at")
        .eq("target_user_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (authUserResult.error) {
      throw authUserResult.error;
    }

    const failedResult = [
      profileResult,
      onboardingResult,
      goalResult,
      adminRoleResult,
      exercisesCountResult,
      programsCountResult,
      supportActionsResult,
      auditLogsResult,
    ].find((result) => result.error);

    if (failedResult?.error) {
      throw failedResult.error;
    }

    if (
      !profileResult.data &&
      !onboardingResult.data &&
      !goalResult.data &&
      !adminRoleResult.data
    ) {
      return createApiErrorResponse({
        status: 404,
        code: "ADMIN_USER_NOT_FOUND",
        message: "User detail was not found.",
      });
    }

    return Response.json({
      data: {
        id,
        currentAdminRole: currentAdmin.role,
        authUser: authUserResult.data.user
          ? {
              email: authUserResult.data.user.email ?? null,
              created_at: authUserResult.data.user.created_at,
              last_sign_in_at: authUserResult.data.user.last_sign_in_at ?? null,
            }
          : null,
        profile: profileResult.data,
        onboarding: onboardingResult.data,
        latestGoal: goalResult.data,
        adminRole: adminRoleResult.data,
        stats: {
          activeExercises: exercisesCountResult.count ?? 0,
          programs: programsCountResult.count ?? 0,
        },
        recentSupportActions: supportActionsResult.data ?? [],
        recentAdminAuditLogs: auditLogsResult.data ?? [],
      },
    });
  } catch (error) {
    logger.error("admin user detail route failed", { error });

    return createApiErrorResponse({
      status: 401,
      code: "ADMIN_REQUIRED",
      message: "Admin access is required.",
    });
  }
}
