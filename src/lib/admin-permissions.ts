export type PlatformAdminRole = "super_admin" | "support_admin" | "analyst";

export const PRIMARY_SUPER_ADMIN_EMAIL = "corvetik1@yandex.ru";

export type AdminCapability =
  | "view_admin_dashboard"
  | "view_admin_users"
  | "view_admin_user_details"
  | "view_admin_audit"
  | "view_ai_usage"
  | "manage_admin_roles"
  | "manage_billing"
  | "bulk_manage_users"
  | "queue_support_actions"
  | "run_knowledge_reindex"
  | "run_admin_jobs"
  | "queue_ai_eval_runs";

const CAPABILITY_MATRIX: Record<PlatformAdminRole, readonly AdminCapability[]> = {
  super_admin: [
    "view_admin_dashboard",
    "view_admin_users",
    "view_admin_user_details",
    "view_admin_audit",
    "view_ai_usage",
    "manage_admin_roles",
    "manage_billing",
    "bulk_manage_users",
    "queue_support_actions",
    "run_knowledge_reindex",
    "run_admin_jobs",
    "queue_ai_eval_runs",
  ],
  support_admin: [
    "view_admin_dashboard",
    "view_admin_users",
    "view_admin_user_details",
    "view_admin_audit",
    "view_ai_usage",
    "queue_support_actions",
    "run_knowledge_reindex",
  ],
  analyst: [
    "view_admin_dashboard",
    "view_admin_users",
    "view_admin_user_details",
    "view_admin_audit",
    "view_ai_usage",
    "queue_ai_eval_runs",
  ],
};

export function normalizeAdminEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? null;
}

export function isPrimarySuperAdminEmail(email: string | null | undefined) {
  return normalizeAdminEmail(email) === PRIMARY_SUPER_ADMIN_EMAIL;
}

export function canUseRootAdminControls(
  role: PlatformAdminRole | null | undefined,
  email: string | null | undefined,
) {
  return role === "super_admin" && isPrimarySuperAdminEmail(email);
}

export function canAssignAdminRole(
  role: PlatformAdminRole,
  email: string | null | undefined,
) {
  if (role !== "super_admin") {
    return true;
  }

  return isPrimarySuperAdminEmail(email);
}

export function hasAdminCapability(
  role: PlatformAdminRole | null | undefined,
  capability: AdminCapability,
) {
  if (!role) {
    return false;
  }

  return CAPABILITY_MATRIX[role].includes(capability);
}

export function getAdminRoleLabel(role: PlatformAdminRole | null | undefined) {
  switch (role) {
    case "super_admin":
      return "Супер-админ";
    case "support_admin":
      return "Поддержка";
    case "analyst":
      return "Аналитик";
    default:
      return "Пользователь";
  }
}

export function getAdminCapabilityErrorMessage(capability: AdminCapability) {
  switch (capability) {
    case "manage_admin_roles":
      return "Only super admins can manage admin roles.";
    case "manage_billing":
      return "Only the primary super admin can manage billing and entitlements.";
    case "bulk_manage_users":
      return "Only the primary super admin can run bulk user actions.";
    case "queue_support_actions":
      return "This admin role cannot queue support actions.";
    case "run_knowledge_reindex":
      return "This admin role cannot run knowledge reindex.";
    case "run_admin_jobs":
      return "Only the primary super admin can run admin jobs.";
    case "queue_ai_eval_runs":
      return "This admin role cannot queue AI eval runs.";
    default:
      return "This admin role cannot access the requested admin resource.";
  }
}
