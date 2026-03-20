import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  canAssignAdminRole,
  isPrimarySuperAdminEmail,
} from "@/lib/admin-permissions";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AdminRoleSupabase = ReturnType<typeof createAdminSupabaseClient>;

export type AdminRoleValue = "analyst" | "super_admin" | "support_admin";

type PlatformAdminRoleRow = {
  role: AdminRoleValue;
};

export async function loadAdminRoleTarget(
  adminSupabase: AdminRoleSupabase,
  userId: string,
) {
  const authUserResult = await adminSupabase.auth.admin.getUserById(userId);

  if (authUserResult.error || !authUserResult.data.user) {
    return {
      response: createApiErrorResponse({
        status: 404,
        code: "ADMIN_TARGET_NOT_FOUND",
        message: "Target user was not found.",
      }),
    };
  }

  const { data: previousRoleRow, error: previousRoleError } = await adminSupabase
    .from("platform_admins")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (previousRoleError) {
    throw previousRoleError;
  }

  return {
    previousRoleRow: (previousRoleRow as PlatformAdminRoleRow | null) ?? null,
    response: null,
    targetEmail: authUserResult.data.user.email ?? null,
  };
}

export function ensureAdminRoleAssignmentAllowed(
  nextRole: AdminRoleValue,
  targetEmail: string | null,
) {
  if (!canAssignAdminRole(nextRole, targetEmail)) {
    return createApiErrorResponse({
      status: 400,
      code: "PRIMARY_SUPER_ADMIN_EMAIL_ONLY",
      message: `Роль super_admin закреплена только за ${PRIMARY_SUPER_ADMIN_EMAIL}.`,
    });
  }

  return null;
}

export function ensurePrimarySuperAdminDowngradeAllowed(
  previousRole: AdminRoleValue | null,
  nextRole: AdminRoleValue,
  targetEmail: string | null,
) {
  if (
    previousRole === "super_admin" &&
    nextRole !== "super_admin" &&
    isPrimarySuperAdminEmail(targetEmail)
  ) {
    return createApiErrorResponse({
      status: 400,
      code: "PRIMARY_SUPER_ADMIN_DOWNGRADE_BLOCKED",
      message: "Основного super-admin нельзя понизить.",
    });
  }

  return null;
}

export function ensurePrimarySuperAdminRevokeAllowed(
  previousRole: AdminRoleValue,
  targetEmail: string | null,
) {
  if (
    previousRole === "super_admin" &&
    isPrimarySuperAdminEmail(targetEmail)
  ) {
    return createApiErrorResponse({
      status: 400,
      code: "PRIMARY_SUPER_ADMIN_REVOKE_BLOCKED",
      message: "Доступ основного super-admin нельзя отозвать.",
    });
  }

  return null;
}

export async function recordAdminRoleAudit(params: {
  action: string;
  actorUserId: string;
  nextRole?: AdminRoleValue | null;
  previousRole?: AdminRoleValue | null;
  reason: string;
  supabase: AdminRoleSupabase;
  targetUserId: string;
}) {
  const { action, actorUserId, nextRole, previousRole, reason, supabase, targetUserId } =
    params;

  const { error } = await supabase.from("admin_audit_logs").insert({
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    action,
    reason,
    payload: {
      previousRole: previousRole ?? null,
      ...(typeof nextRole === "string" ? { nextRole } : {}),
    },
  });

  if (error) {
    throw error;
  }
}
