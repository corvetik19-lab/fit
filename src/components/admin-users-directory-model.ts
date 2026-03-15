export type AdminRole = "super_admin" | "support_admin" | "analyst" | null;
export type ActivityBucket =
  | "today"
  | "seven_days"
  | "thirty_days"
  | "stale"
  | "never";
export type ActivitySource =
  | "workout"
  | "nutrition"
  | "ai"
  | "auth"
  | "profile"
  | null;
export type ActivityFilter =
  | "all"
  | "active_7d"
  | "idle_30d"
  | "never_signed_in"
  | "backlog"
  | "paid";
export type AdminRoleFilter =
  | "all"
  | "super_admin"
  | "support_admin"
  | "analyst"
  | "user";
export type AdminUsersSortKey =
  | "created_desc"
  | "activity_desc"
  | "sign_in_desc"
  | "workout_desc"
  | "ai_desc"
  | "backlog_desc";
export type BulkAction =
  | "queue_export"
  | "queue_resync"
  | "queue_suspend"
  | "grant_trial"
  | "enable_entitlement";

export type AdminUserRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  admin_role: AdminRole;
  activity: {
    bucket: ActivityBucket;
    last_activity_at: string | null;
    source: ActivitySource;
  };
  workout: {
    active_programs: number;
    completed_days: number;
    in_progress_days: number;
    logged_sets: number;
    last_workout_at: string | null;
  };
  nutrition: {
    meals: number;
    last_meal_at: string | null;
  };
  ai: {
    messages: number;
    last_ai_at: string | null;
  };
  operations: {
    pending_support_actions: number;
    export_status: string | null;
    export_updated_at: string | null;
    deletion_status: string | null;
    deletion_hold_until: string | null;
    deletion_updated_at: string | null;
    has_backlog: boolean;
  };
  billing: {
    subscription_status: string | null;
    subscription_provider: string | null;
    current_period_end: string | null;
    is_active: boolean;
  };
  flags: {
    has_profile: boolean;
    never_signed_in: boolean;
    is_primary_super_admin: boolean;
  };
};

export type AdminUsersSummary = {
  totalUsers: number;
  filteredUsers: number;
  adminCounts: {
    superAdmins: number;
    supportAdmins: number;
    analysts: number;
  };
  activityBuckets: {
    today: number;
    sevenDays: number;
    thirtyDays: number;
    stale: number;
    never: number;
  };
  operations: {
    usersWithBacklog: number;
    pendingSupportActions: number;
    queuedExports: number;
    activeDeletionHolds: number;
  };
  billing: {
    activeSubscriptions: number;
    paidButStale: number;
  };
  hygiene: {
    neverSignedIn: number;
    withoutProfile: number;
    rootPolicyViolations: number;
  };
};

export type AdminUsersSegments = {
  priorityQueue: Array<{
    user_id: string;
    display_name: string;
    email: string | null;
    admin_role: NonNullable<AdminRole> | "user";
    activity_bucket: ActivityBucket;
    pending_support_actions: number;
    export_status: string | null;
    deletion_status: string | null;
    subscription_status: string | null;
  }>;
  inactivePaid: Array<{
    user_id: string;
    display_name: string;
    email: string | null;
    activity_bucket: ActivityBucket;
    last_activity_at: string | null;
    subscription_status: string | null;
    current_period_end: string | null;
  }>;
  newestUsers: Array<{
    user_id: string;
    display_name: string;
    email: string | null;
    created_at: string;
    never_signed_in: boolean;
    has_profile: boolean;
  }>;
  topWorkoutUsers: Array<{
    user_id: string;
    display_name: string;
    email: string | null;
    logged_sets: number;
    completed_days: number;
    active_programs: number;
  }>;
};

export type RecentBulkWave = {
  action: string;
  actor_user_id: string | null;
  batch_id: string | null;
  created_at: string;
  failed: number;
  id: string;
  processed: number;
  reason: string | null;
  succeeded: number;
  user_count: number;
};

export type AdminUsersFetchResponse = {
  data?: AdminUserRow[];
  message?: string;
  meta?: {
    degraded?: boolean;
  };
  recentBulkWaves?: RecentBulkWave[];
  segments?: AdminUsersSegments;
  summary?: AdminUsersSummary;
} | null;

export type AdminUsersBulkResponse = {
  data?: {
    failed?: number;
    succeeded?: number;
  };
  message?: string;
} | null;

export const emptySummary: AdminUsersSummary = {
  totalUsers: 0,
  filteredUsers: 0,
  adminCounts: {
    superAdmins: 0,
    supportAdmins: 0,
    analysts: 0,
  },
  activityBuckets: {
    today: 0,
    sevenDays: 0,
    thirtyDays: 0,
    stale: 0,
    never: 0,
  },
  operations: {
    usersWithBacklog: 0,
    pendingSupportActions: 0,
    queuedExports: 0,
    activeDeletionHolds: 0,
  },
  billing: {
    activeSubscriptions: 0,
    paidButStale: 0,
  },
  hygiene: {
    neverSignedIn: 0,
    withoutProfile: 0,
    rootPolicyViolations: 0,
  },
};

export const emptySegments: AdminUsersSegments = {
  priorityQueue: [],
  inactivePaid: [],
  newestUsers: [],
  topWorkoutUsers: [],
};

const createdAtFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export const roleLabels: Record<NonNullable<AdminRole> | "user", string> = {
  super_admin: "Супер-админ",
  support_admin: "Поддержка",
  analyst: "Аналитик",
  user: "Пользователь",
};

export const activityLabels: Record<ActivityBucket, string> = {
  today: "Активен сегодня",
  seven_days: "Активен 7 дней",
  thirty_days: "Активен 30 дней",
  stale: "Тишина 30+ дней",
  never: "Нет сигналов",
};

export const activitySourceLabels: Record<
  Exclude<ActivitySource, null>,
  string
> = {
  workout: "тренировки",
  nutrition: "питание",
  ai: "ИИ",
  auth: "авторизация",
  profile: "профиль",
};

export const activityToneClasses: Record<ActivityBucket, string> = {
  today: "border-emerald-300/70 bg-emerald-50 text-emerald-800",
  seven_days: "border-sky-300/70 bg-sky-50 text-sky-800",
  thirty_days: "border-amber-300/70 bg-amber-50 text-amber-800",
  stale: "border-rose-300/70 bg-rose-50 text-rose-800",
  never: "border-slate-300/70 bg-slate-100 text-slate-700",
};

export function formatDate(value: string | null) {
  if (!value) {
    return "Нет данных";
  }

  return createdAtFormatter.format(new Date(value));
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "Нет данных";
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatStatus(value: string | null) {
  if (!value) {
    return "нет";
  }

  return value.replaceAll("_", " ");
}

export function formatBulkAction(value: string) {
  switch (value) {
    case "queue_export":
      return "Поставить выгрузку";
    case "queue_resync":
      return "Пересобрать контекст";
    case "queue_suspend":
      return "Ограничить аккаунт";
    case "grant_trial":
      return "Выдать пробный доступ";
    case "enable_entitlement":
      return "Открыть доступ к функции";
    default:
      return value.replaceAll("_", " ");
  }
}

export function buildVisibleUsersSummary(
  users: AdminUserRow[],
  catalogSummary: AdminUsersSummary,
) {
  return {
    total: users.length,
    superAdmins: catalogSummary.adminCounts.superAdmins,
    supportAdmins: catalogSummary.adminCounts.supportAdmins,
    analysts: catalogSummary.adminCounts.analysts,
    active7d: users.filter(
      (user) =>
        user.activity.bucket === "today" || user.activity.bucket === "seven_days",
    ).length,
    backlog: users.filter((user) => user.operations.has_backlog).length,
    neverSignedIn: users.filter((user) => user.flags.never_signed_in).length,
    paid: users.filter((user) => user.billing.is_active).length,
  };
}

export function buildActiveFilterSummary(input: {
  searchQuery: string;
  canViewRoleDetails: boolean;
  roleFilter: AdminRoleFilter;
  activityFilter: ActivityFilter;
  sortKey: AdminUsersSortKey;
}) {
  return [
    input.searchQuery.trim() ? `Поиск: ${input.searchQuery.trim()}` : null,
    input.canViewRoleDetails && input.roleFilter !== "all"
      ? `Роль: ${roleLabels[input.roleFilter] ?? input.roleFilter}`
      : null,
    input.activityFilter !== "all"
      ? `Активность: ${input.activityFilter.replaceAll("_", " ")}`
      : null,
    input.sortKey !== "created_desc"
      ? `Сортировка: ${input.sortKey.replaceAll("_", " ")}`
      : null,
  ].filter((item): item is string => Boolean(item));
}

export function buildAdminUsersSearchParams(input: {
  activityFilter: ActivityFilter;
  roleFilter: AdminRoleFilter;
  searchQuery: string;
  sortKey: AdminUsersSortKey;
}) {
  const searchParams = new URLSearchParams();

  if (input.searchQuery.trim()) {
    searchParams.set("q", input.searchQuery.trim());
  }

  if (input.roleFilter !== "all") {
    searchParams.set("role", input.roleFilter);
  }

  if (input.activityFilter !== "all") {
    searchParams.set("activity", input.activityFilter);
  }

  if (input.sortKey !== "created_desc") {
    searchParams.set("sort", input.sortKey);
  }

  return searchParams;
}

export function filterSelectedUserIdsForVisibleUsers(
  selectedUserIds: string[],
  users: AdminUserRow[],
) {
  return selectedUserIds.filter((id) => users.some((user) => user.user_id === id));
}

export function buildVisibleUserIds(users: AdminUserRow[]) {
  return users.map((user) => user.user_id);
}

export function areAllVisibleUsersSelected(
  selectedUserIds: string[],
  visibleUserIds: string[],
) {
  return (
    visibleUserIds.length > 0 &&
    visibleUserIds.every((id) => selectedUserIds.includes(id))
  );
}

export function toggleSelectedUserId(selectedUserIds: string[], userId: string) {
  return selectedUserIds.includes(userId)
    ? selectedUserIds.filter((value) => value !== userId)
    : [...selectedUserIds, userId];
}

export function toggleVisibleUserSelection(
  selectedUserIds: string[],
  visibleUserIds: string[],
) {
  if (areAllVisibleUsersSelected(selectedUserIds, visibleUserIds)) {
    return selectedUserIds.filter((id) => !visibleUserIds.includes(id));
  }

  return Array.from(new Set([...selectedUserIds, ...visibleUserIds]));
}

export function buildBulkActionRequest(input: {
  bulkAction: BulkAction;
  bulkFeatureKey: string;
  bulkLimitValue: string;
  bulkReason: string;
  bulkTrialDays: string;
  selectedUserIds: string[];
}) {
  const body: Record<string, unknown> = {
    action: input.bulkAction,
    reason: input.bulkReason.trim() || undefined,
    user_ids: input.selectedUserIds,
  };

  if (input.bulkAction === "grant_trial") {
    body.duration_days = Number(input.bulkTrialDays) || 14;
  }

  if (input.bulkAction === "enable_entitlement") {
    body.feature_key = input.bulkFeatureKey.trim();
    body.limit_value =
      input.bulkLimitValue.trim() === "" ? null : Number(input.bulkLimitValue);
  }

  return body;
}

export function buildBulkActionNotice(payload: AdminUsersBulkResponse) {
  return `Готово: ${payload?.data?.succeeded ?? 0} успешно, ${payload?.data?.failed ?? 0} с ошибкой.`;
}
