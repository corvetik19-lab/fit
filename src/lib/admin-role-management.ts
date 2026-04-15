import { createApiErrorResponse } from "@/lib/api/error-response";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AdminRoleSupabase = ReturnType<typeof createAdminSupabaseClient>;

export type AdminRoleValue = "analyst" | "super_admin" | "support_admin";

type PlatformAdminRoleRow = {
  user_id?: string;
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
  _nextRole: AdminRoleValue,
  _targetEmail: string | null,
) {
  void _nextRole;
  void _targetEmail;
  return null;
}

export function ensurePrimarySuperAdminDowngradeAllowed(
  _previousRole: AdminRoleValue | null,
  _nextRole: AdminRoleValue,
  _targetEmail: string | null,
) {
  void _previousRole;
  void _nextRole;
  void _targetEmail;
  return null;
}

export function ensurePrimarySuperAdminRevokeAllowed(
  _previousRole: AdminRoleValue,
  _targetEmail: string | null,
) {
  void _previousRole;
  void _targetEmail;
  return null;
}

export async function ensureSuperAdminSlotAvailable(params: {
  adminSupabase: AdminRoleSupabase;
  nextRole: AdminRoleValue;
  previousRole: AdminRoleValue | null;
  targetUserId: string;
}) {
  const { adminSupabase, nextRole, previousRole, targetUserId } = params;

  if (nextRole !== "super_admin" || previousRole === "super_admin") {
    return null;
  }

  const { data: activeSuperAdmin, error } = await adminSupabase
    .from("platform_admins")
    .select("user_id, role")
    .eq("role", "super_admin")
    .maybeSingle();

  if (error) {
    throw error;
  }

  const currentSuperAdmin = (activeSuperAdmin as PlatformAdminRoleRow | null) ?? null;

  if (currentSuperAdmin?.user_id && currentSuperAdmin.user_id !== targetUserId) {
    return createApiErrorResponse({
      status: 409,
      code: "SUPER_ADMIN_ALREADY_ASSIGNED",
      message:
        "В системе уже есть назначенный super-admin. Сначала переведи текущий аккаунт на другую роль или отзови доступ.",
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
