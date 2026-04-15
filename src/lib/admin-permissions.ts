export type PlatformAdminRole = "super_admin" | "support_admin" | "analyst";

// Legacy compatibility export for old snapshots/docs. Runtime authorization is role-based.
export const PRIMARY_SUPER_ADMIN_EMAIL = "corvetik1@yandex.ru";

export type AdminCapability =
  | "view_admin_dashboard"
  | "view_admin_users"
  | "view_admin_user_details"
  | "view_admin_audit"
  | "view_ai_usage"
  | "manage_admin_roles"
  | "manage_user_content_assets"
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
    "manage_user_content_assets",
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
  _email: string | null | undefined,
) {
  void _email;
  return role === "super_admin";
}

export function canAssignAdminRole(
  _role: PlatformAdminRole,
  _email: string | null | undefined,
) {
  void _role;
  void _email;
  return true;
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
      return "Управлять ролями может только super-admin.";
    case "manage_user_content_assets":
      return "Редактировать изображения в пользовательском контенте может только super-admin.";
    case "manage_billing":
      return "Управлять оплатой и доступами может только super-admin.";
    case "bulk_manage_users":
      return "Массовые действия по пользователям доступны только super-admin.";
    case "queue_support_actions":
      return "Для этой роли недоступны действия по поддержке.";
    case "run_knowledge_reindex":
      return "Для этой роли недоступно обновление базы знаний.";
    case "run_admin_jobs":
      return "Внутренние задачи может запускать только super-admin.";
    case "queue_ai_eval_runs":
      return "Для этой роли недоступен запуск проверок ИИ.";
    default:
      return "Для этой роли этот раздел недоступен.";
  }
}
