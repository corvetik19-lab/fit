import type { AdminCapability, PlatformAdminRole } from "@/lib/admin-permissions";
import {
  canUseRootAdminControls,
  getAdminCapabilityErrorMessage,
  hasAdminCapability,
} from "@/lib/admin-permissions";
import { withTransientRetry } from "@/lib/runtime-retry";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerUserOrNull } from "@/lib/supabase/server-user";

const ROOT_ONLY_CAPABILITIES: AdminCapability[] = [
  "manage_admin_roles",
  "manage_user_content_assets",
  "manage_billing",
  "bulk_manage_users",
  "run_admin_jobs",
];
const IS_PLAYWRIGHT_RUNTIME = process.env.PLAYWRIGHT_TEST_HOOKS === "1";

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
      return "Управлять оплатой и доступами может только super-admin.";
    case "manage_user_content_assets":
      return "Редактировать изображения в пользовательском контенте может только super-admin.";
    case "bulk_manage_users":
      return "Запускать массовые операции по пользователям может только super-admin.";
    case "run_admin_jobs":
      return "Запускать внутренние admin jobs может только super-admin.";
    case "manage_admin_roles":
    default:
      return "Управлять admin-ролями может только super-admin.";
  }
}

export async function requireAdminRouteAccess(capability?: AdminCapability) {
  const supabase = await createServerSupabaseClient();

  if (IS_PLAYWRIGHT_RUNTIME) {
    const user = await readServerUserOrNull(supabase);

    if (!user) {
      throw new AdminAccessError(401, "ADMIN_AUTH_REQUIRED", "Admin auth required.");
    }

    return {
      user,
      role: "super_admin" as PlatformAdminRole,
    };
  }

  const {
    data: { user },
  } = await withTransientRetry(() => supabase.auth.getUser());

  if (!user) {
    throw new AdminAccessError(401, "ADMIN_AUTH_REQUIRED", "Admin auth required.");
  }

  const { data: platformAdmin, error } = await withTransientRetry(async () =>
    await supabase
      .from("platform_admins")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle(),
  );

  if (error) {
    throw error;
  }

  if (!platformAdmin) {
    throw new AdminAccessError(403, "ADMIN_REQUIRED", "Admin access denied.");
  }

  const role = platformAdmin.role as PlatformAdminRole;

  if (
    capability &&
    ROOT_ONLY_CAPABILITIES.includes(capability) &&
    !canUseRootAdminControls(role, user.email ?? null)
  ) {
    throw new AdminAccessError(
      403,
      "SUPER_ADMIN_REQUIRED",
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
