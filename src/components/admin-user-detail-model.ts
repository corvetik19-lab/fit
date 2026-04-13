export type PlatformAdminRole = "super_admin" | "support_admin" | "analyst";
export type JsonRecord = Record<string, unknown> | null;

export type UserReference = {
  id: string;
  email: string | null;
  full_name: string | null;
};

export type AdminUserDetailData = {
  id: string;
  currentAdminRole: PlatformAdminRole;
  authUser: {
    email: string | null;
    created_at: string;
    last_sign_in_at: string | null;
  } | null;
  profile: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  onboarding: {
    age: number | null;
    sex: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    fitness_level: string | null;
    equipment: string[];
    injuries: string[];
    dietary_preferences: string[];
    created_at: string;
    updated_at: string;
  } | null;
  latestGoal: {
    goal_type: string;
    target_weight_kg: number | null;
    weekly_training_days: number | null;
    created_at: string;
    updated_at: string;
  } | null;
  adminRole: {
    role: string;
    created_at: string;
  } | null;
  adminState: {
    is_suspended: boolean;
    metadata: JsonRecord;
    restored_at: string | null;
    state_reason: string | null;
    suspended_at: string | null;
  } | null;
  superAdminPolicy: {
    primaryEmail: string;
    targetCanBeSuperAdmin: boolean;
  };
  stats: {
    workout: {
      activeExercises: number;
      activePrograms: number;
      completedDays: number;
      inProgressDays: number;
      latestWorkoutAt: string | null;
      loggedSets: number;
      programs: number;
      templates: number;
    };
    nutrition: {
      foods: number;
      latestMealAt: string | null;
      mealItems: number;
      meals: number;
      recipes: number;
      summaryDays: number;
      templates: number;
    };
    ai: {
      chatMessages: number;
      chatSessions: number;
      contextSnapshots: number;
      knowledgeChunks: number;
      latestAiAt: string | null;
      proposals: number;
      safetyEvents: number;
    };
    lifecycle: {
      bodyMetrics: number;
      deletionRequest: {
        id: string;
        requested_by: string | null;
        requested_by_user: UserReference | null;
        status: string;
        hold_until: string | null;
        created_at: string;
        updated_at: string;
      } | null;
      deletionRequests: number;
      entitlements: number;
      exportJobs: number;
      latestExportJob: {
        id: string;
        requested_by: string | null;
        requested_by_user: UserReference | null;
        format: string;
        status: string;
        artifact_path: string | null;
        created_at: string;
        updated_at: string;
      } | null;
      latestProfileUpdateAt: string | null;
      latestSubscription: {
        id: string;
        status: string;
        provider: string;
        provider_customer_id: string | null;
        provider_subscription_id: string | null;
        current_period_start: string | null;
        current_period_end: string | null;
        updated_at: string;
      } | null;
      recentEntitlements: Array<{
        id: string;
        feature_key: string;
        limit_value: number | null;
        is_enabled: boolean;
        updated_at: string;
      }>;
      recentSubscriptionEvents: Array<{
        id: string;
        event_type: string;
        provider_event_id: string | null;
        payload: JsonRecord;
        actor_user_id: string | null;
        actor_user: UserReference | null;
        created_at: string;
        updated_at: string;
      }>;
      recentUsageCounters: Array<{
        id: string;
        metric_key: string;
        metric_window: string;
        usage_count: number;
        reset_at: string | null;
        updated_at: string;
      }>;
      subscriptions: number;
      usageCounters: number;
    };
  };
  recentSupportActions: Array<{
    id: string;
    action: string;
    status: string;
    payload: JsonRecord;
    actor_user_id: string | null;
    actor_user: UserReference | null;
    resolved_by_user: UserReference | null;
    created_at: string;
    updated_at: string;
  }>;
  recentExportJobs: Array<{
    id: string;
    requested_by: string | null;
    requested_by_user: UserReference | null;
    format: string;
    status: string;
    artifact_path: string | null;
    created_at: string;
    updated_at: string;
  }>;
  recentExercises: Array<{
    id: string;
    title: string;
    muscle_group: string;
    image_url: string | null;
    is_archived: boolean;
    updated_at: string;
  }>;
  recentFoods: Array<{
    id: string;
    name: string;
    brand: string | null;
    source: string;
    image_url: string | null;
    updated_at: string;
  }>;
  recentOperationAuditLogs: Array<{
    id: string;
    action: string;
    reason: string | null;
    payload: JsonRecord;
    actor_user_id: string | null;
    actor_user: UserReference | null;
    created_at: string;
  }>;
  recentAdminAuditLogs: Array<{
    id: string;
    action: string;
    reason: string | null;
    payload: JsonRecord;
    actor_user_id: string | null;
    actor_user: UserReference | null;
    created_at: string;
  }>;
};

export type AdminUserDetailResponse =
  | {
      data?: AdminUserDetailData;
      message?: string;
      meta?: {
        degraded?: boolean;
      };
    }
  | null;

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const goalTypeLabels: Record<string, string> = {
  fat_loss: "Снижение веса",
  maintenance: "Поддержание формы",
  muscle_gain: "Набор мышц",
  performance: "Результат и выносливость",
};

export const sexLabels: Record<string, string> = {
  female: "Женщина",
  male: "Мужчина",
  other: "Другое",
  prefer_not_to_say: "Не указано",
};

export const fitnessLevelLabels: Record<string, string> = {
  beginner: "Начинающий",
  intermediate: "Средний",
  advanced: "Продвинутый",
};

export const adminRoleLabels: Record<string, string> = {
  super_admin: "Супер-админ",
  support_admin: "Поддержка",
  analyst: "Аналитик",
  user: "Пользователь",
};

export const statusLabels: Record<string, string> = {
  active: "активно",
  canceled: "отменено",
  canceled_subscription: "подписка отменена",
  completed: "завершено",
  failed: "ошибка",
  holding: "на удержании",
  past_due: "нужна оплата",
  processing: "в обработке",
  queued: "в очереди",
  trial: "пробный период",
};

export const auditActionLabels: Record<string, string> = {
  admin_update_exercise_image: "Обновлено изображение упражнения",
  admin_update_food_image: "Обновлено изображение продукта",
  admin_reconcile_cloudpayments_subscription: "Ручная сверка подписки",
  admin_reconcile_stripe_subscription: "Ручная сверка подписки",
  bulk_wave_completed: "Завершена групповая операция",
  cancel_deletion_request: "Отменён запрос на удаление",
  deletion_request_status_updated: "Изменён статус запроса на удаление",
  export_job_status_updated: "Изменён статус выгрузки данных",
  queue_deletion_purge_action: "Поставлена очистка данных",
  queue_deletion_request: "Создан запрос на удаление",
  queue_export_job: "Создана выгрузка данных",
  queue_support_action: "Создано служебное действие",
  support_action_status_updated: "Изменён статус служебного действия",
  user_reconciled_cloudpayments_checkout_return:
    "Синхронизирован возврат после оплаты",
  user_reconciled_stripe_checkout_return:
    "Синхронизирован возврат после оплаты",
  user_started_cloudpayments_checkout: "Запущено оформление оплаты",
  user_started_stripe_checkout: "Запущено оформление оплаты",
  user_requested_billing_access_review:
    "Запрошена проверка доступа к оплате",
};

export const supportActionLabels: Record<string, string> = {
  admin_purge_manifest: "Подготовка очистки данных",
  admin_support_resync: "Пересборка контекста пользователя",
  billing_access_review: "Проверка доступа к оплате",
  purge_user_data: "Очистка данных пользователя",
  resync_user_context: "Пересобрать контекст",
  restore_user: "Снять ограничение",
  suspend_user: "Ограничить аккаунт",
};

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Нет данных";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Нет данных";
  }

  return dateFormatter.format(date);
}

export function formatStatus(value: string | null | undefined) {
  if (!value) {
    return "Нет данных";
  }

  return statusLabels[value] ?? formatSnakeLabel(value);
}

export function formatSnakeLabel(value: string | null | undefined) {
  if (!value) {
    return "Нет данных";
  }

  return value.replaceAll("_", " ");
}

export function formatAuditAction(value: string) {
  return auditActionLabels[value] ?? formatSnakeLabel(value);
}

export function formatSupportAction(value: string) {
  return supportActionLabels[value] ?? formatAuditAction(value);
}

export function formatBillingProvider(value: string | null | undefined) {
  if (!value) {
    return "Нет данных";
  }

  if (value === "cloudpayments") {
    return "CloudPayments";
  }

  if (value === "stripe") {
    return "Stripe";
  }

  return formatSnakeLabel(value);
}

export function renderList(items: string[] | undefined) {
  if (!items?.length) {
    return "Не заполнено";
  }

  return items.join(", ");
}

export function getUserLabel(
  user: UserReference | null,
  fallbackId?: string | null,
) {
  return user?.full_name ?? user?.email ?? fallbackId ?? "Нет данных";
}

export function getPayloadString(payload: JsonRecord, key: string) {
  const value = payload?.[key];
  return typeof value === "string" ? value : null;
}

export function getPayloadBoolean(payload: JsonRecord, key: string) {
  const value = payload?.[key];
  return typeof value === "boolean" ? value : null;
}

export function getPayloadStringList(payload: JsonRecord, key: string) {
  const value = payload?.[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}
