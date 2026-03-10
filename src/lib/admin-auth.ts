import type { AdminCapability, PlatformAdminRole } from "@/lib/admin-permissions";
import {
  canUseRootAdminControls,
  getAdminCapabilityErrorMessage,
  hasAdminCapability,
} from "@/lib/admin-permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export class AdminAccessError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AdminAccessError";
    this.status = status;
    this.code = code;
  }
}

export function isAdminAccessError(error: unknown): error is AdminAccessError {
  return error instanceof AdminAccessError;
}

function getRootOnlyCapabilityMessage(capability: AdminCapability) {
  switch (capability) {
    case "manage_billing":
      return "Управлять billing и entitlements может только основной super-admin.";
    case "bulk_manage_users":
      return "Запускать bulk-операции по пользователям может только основной super-admin.";
    case "manage_admin_roles":
    default:
      return "Управлять admin-ролями может только основной super-admin.";
  }
}

export async function requireAdminRouteAccess(capability?: AdminCapability) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AdminAccessError(401, "ADMIN_AUTH_REQUIRED", "Admin auth required.");
  }

  const { data: platformAdmin, error } = await supabase
    .from("platform_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!platformAdmin) {
    throw new AdminAccessError(403, "ADMIN_REQUIRED", "Admin access denied.");
  }

  const role = platformAdmin.role as PlatformAdminRole;

  if (
    capability &&
    ["manage_admin_roles", "manage_billing", "bulk_manage_users"].includes(
      capability,
    ) &&
    !canUseRootAdminControls(role, user.email ?? null)
  ) {
    throw new AdminAccessError(
      403,
      "PRIMARY_SUPER_ADMIN_REQUIRED",
      getRootOnlyCapabilityMessage(capability),
    );
  }

  if (capability && !hasAdminCapability(role, capability)) {
    throw new AdminAccessError(
      403,
      "ADMIN_CAPABILITY_REQUIRED",
      getAdminCapabilityErrorMessage(capability),
    );
  }

  return {
    user,
    role,
  };
}
