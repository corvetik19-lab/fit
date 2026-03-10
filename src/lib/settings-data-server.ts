import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import type {
  SettingsBillingEvent,
  SettingsBillingReviewRequest,
  SettingsDataSnapshot,
  SettingsDeletionRequest,
  SettingsExportJob,
  SettingsPrivacyEvent,
} from "@/lib/settings-data";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const SETTINGS_PRIVACY_AUDIT_ACTIONS = [
  "user_requested_export",
  "user_downloaded_export",
  "user_requested_deletion",
  "user_canceled_deletion",
  "queue_deletion_request",
  "cancel_deletion_request",
  "queue_deletion_purge_action",
  "export_job_status_updated",
  "deletion_request_status_updated",
  "support_action_status_updated",
] as const;

const SETTINGS_BILLING_AUDIT_ACTIONS = [
  "user_requested_billing_access_review",
  "support_action_status_updated",
] as const;

const SETTINGS_BILLING_EVENT_TYPES = [
  "admin_grant_trial",
  "admin_activate_subscription",
  "admin_mark_past_due",
  "admin_cancel_subscription",
  "admin_enable_entitlement",
  "admin_disable_entitlement",
] as const;

function mapExportJob(row: {
  artifact_path: string | null;
  created_at: string;
  format: string;
  id: string;
  status: SettingsExportJob["status"];
  updated_at: string | null;
}): SettingsExportJob {
  return {
    artifactPath: row.artifact_path,
    createdAt: row.created_at,
    format: row.format,
    id: row.id,
    status: row.status,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

function mapDeletionRequest(row: {
  created_at: string;
  hold_until: string | null;
  id: string;
  status: SettingsDeletionRequest["status"];
  updated_at: string | null;
}): SettingsDeletionRequest {
  return {
    createdAt: row.created_at,
    holdUntil: row.hold_until,
    id: row.id,
    status: row.status,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(
  record: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = record?.[key];
  return typeof value === "string" ? value : null;
}

function readStringArray(
  record: Record<string, unknown> | null,
  key: string,
): string[] {
  const value = record?.[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function readNullableBoolean(
  record: Record<string, unknown> | null,
  key: string,
) {
  const value = record?.[key];
  return typeof value === "boolean" ? value : null;
}

function readNullableNumber(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getBillingFeatureLabel(featureKey: string) {
  switch (featureKey) {
    case "ai_chat":
      return "AI-чат";
    case "meal_plan":
      return "AI-план питания";
    case "workout_plan":
      return "AI-план тренировок";
    case "meal_photo":
      return "AI-анализ фото еды";
    default:
      return featureKey.replaceAll("_", " ");
  }
}

function joinRequestedFeatures(features: string[]) {
  if (!features.length) {
    return null;
  }

  return features.map(getBillingFeatureLabel).join(", ");
}

function getActorScope(actorUserId: string | null, userId: string) {
  if (!actorUserId) {
    return "system" as const;
  }

  if (actorUserId === userId) {
    return "you" as const;
  }

  return "support" as const;
}

function buildHoldDetail(holdUntil: string | null) {
  if (!holdUntil) {
    return null;
  }

  return `Hold до ${new Date(holdUntil).toLocaleString("ru-RU")}.`;
}

function mapBillingReviewRequest(row: {
  created_at: string;
  id: string;
  payload: unknown;
  status: SettingsBillingReviewRequest["status"];
  updated_at: string | null;
}): SettingsBillingReviewRequest {
  const payload = asRecord(row.payload);

  return {
    createdAt: row.created_at,
    id: row.id,
    note: readString(payload, "note"),
    requestedFeatures:
      readStringArray(payload, "requestedFeatures").length > 0
        ? readStringArray(payload, "requestedFeatures")
        : readStringArray(payload, "requested_features"),
    status: row.status,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

function mapBillingSubscriptionEvent(
  row: {
    created_at: string;
    event_type: string;
    id: string;
    payload: unknown;
  },
  userId: string,
): SettingsBillingEvent | null {
  const payload = asRecord(row.payload);
  const actorScope = getActorScope(readString(payload, "actorUserId"), userId);
  const status = readString(payload, "status");
  const periodEnd = readString(payload, "currentPeriodEnd");
  const provider = readString(payload, "provider");
  const featureKey = readString(payload, "featureKey");
  const isEnabled = readNullableBoolean(payload, "isEnabled");
  const limitValue = readNullableNumber(payload, "limitValue");
  const featureLabel = featureKey ? getBillingFeatureLabel(featureKey) : null;
  const periodDetail = periodEnd
    ? `Действует до ${new Date(periodEnd).toLocaleString("ru-RU")}.`
    : null;
  const providerDetail = provider ? `Провайдер: ${provider}.` : null;
  const subscriptionDetail = [status ? `Статус: ${status}.` : null, providerDetail, periodDetail]
    .filter(Boolean)
    .join(" ");

  switch (row.event_type) {
    case "admin_grant_trial":
      return {
        actorScope,
        createdAt: row.created_at,
        detail: subscriptionDetail || "Для аккаунта включён trial-период.",
        id: row.id,
        kind: "subscription",
        title: "Выдан trial",
        tone: "success",
      };
    case "admin_activate_subscription":
      return {
        actorScope,
        createdAt: row.created_at,
        detail: subscriptionDetail || "Подписка активирована.",
        id: row.id,
        kind: "subscription",
        title: "Подписка активирована",
        tone: "success",
      };
    case "admin_mark_past_due":
      return {
        actorScope,
        createdAt: row.created_at,
        detail:
          subscriptionDetail || "Подписка требует оплаты или ручной проверки.",
        id: row.id,
        kind: "subscription",
        title: "Подписка требует оплаты",
        tone: "warning",
      };
    case "admin_cancel_subscription":
      return {
        actorScope,
        createdAt: row.created_at,
        detail: subscriptionDetail || "Подписка переведена в отменённое состояние.",
        id: row.id,
        kind: "subscription",
        title: "Подписка отменена",
        tone: "warning",
      };
    case "admin_enable_entitlement":
      return {
        actorScope,
        createdAt: row.created_at,
        detail: [
          featureLabel ? `Функция: ${featureLabel}.` : null,
          typeof limitValue === "number" ? `Лимит: ${limitValue}.` : null,
          isEnabled === true ? "Доступ включён." : null,
        ]
          .filter(Boolean)
          .join(" "),
        id: row.id,
        kind: "entitlement",
        title: "Доступ расширен",
        tone: "success",
      };
    case "admin_disable_entitlement":
      return {
        actorScope,
        createdAt: row.created_at,
        detail: [
          featureLabel ? `Функция: ${featureLabel}.` : null,
          isEnabled === false ? "Доступ отключён." : null,
        ]
          .filter(Boolean)
          .join(" "),
        id: row.id,
        kind: "entitlement",
        title: "Доступ ограничен",
        tone: "warning",
      };
    default:
      return null;
  }
}

function mapBillingAuditEvent(
  row: {
    action: string;
    actor_user_id: string | null;
    created_at: string;
    id: string;
    payload: unknown;
    reason: string | null;
  },
  userId: string,
): SettingsBillingEvent | null {
  const payload = asRecord(row.payload);
  const actorScope = getActorScope(row.actor_user_id, userId);
  const requestedFeatures =
    readStringArray(payload, "requestedFeatures").length > 0
      ? readStringArray(payload, "requestedFeatures")
      : readStringArray(payload, "requested_features");
  const requestedFeaturesLabel = joinRequestedFeatures(requestedFeatures);
  const note = readString(payload, "note") ?? row.reason;
  const supportAction = readString(payload, "action");
  const toStatus = readString(payload, "toStatus");

  if (row.action === "user_requested_billing_access_review") {
    return {
      actorScope,
      createdAt: row.created_at,
      detail: [
        requestedFeaturesLabel ? `Запрошены функции: ${requestedFeaturesLabel}.` : null,
        note ? `Комментарий: ${note}` : null,
      ]
        .filter(Boolean)
        .join(" "),
      id: row.id,
      kind: "request",
      title: "Запрошен billing review",
      tone: "neutral",
    };
  }

  if (row.action === "support_action_status_updated" && supportAction === "billing_access_review") {
    if (toStatus === "completed") {
      return {
        actorScope,
        createdAt: row.created_at,
        detail: note ?? "Запрос обработан поддержкой.",
        id: row.id,
        kind: "request",
        title: "Billing review обработан",
        tone: "success",
      };
    }

    if (toStatus === "failed") {
      return {
        actorScope,
        createdAt: row.created_at,
        detail: note ?? "Запрос завершился ошибкой и требует повторной проверки.",
        id: row.id,
        kind: "request",
        title: "Ошибка billing review",
        tone: "danger",
      };
    }
  }

  return null;
}

function mapPrivacyEvent(
  row: {
    action: string;
    actor_user_id: string | null;
    created_at: string;
    id: string;
    payload: unknown;
    reason: string | null;
  },
  userId: string,
): SettingsPrivacyEvent | null {
  const payload = asRecord(row.payload);
  const actorScope = getActorScope(row.actor_user_id, userId);
  const toStatus = readString(payload, "toStatus");
  const supportAction = readString(payload, "action");
  const holdUntil = readString(payload, "holdUntil");
  const note = readString(payload, "note") ?? row.reason;

  switch (row.action) {
    case "user_requested_export":
      return {
        actorScope,
        createdAt: row.created_at,
        detail: "Архив поставлен в очередь на сборку.",
        id: row.id,
        kind: "export",
        title: "Запрошена выгрузка данных",
        tone: "neutral",
      };
    case "user_downloaded_export":
      return {
        actorScope,
        createdAt: row.created_at,
        detail: "Готовый архив был скачан на устройство.",
        id: row.id,
        kind: "export",
        title: "Архив скачан",
        tone: "success",
      };
    case "export_job_status_updated":
      if (toStatus === "processing") {
        return {
          actorScope,
          createdAt: row.created_at,
          detail: "Система начала собирать ZIP-архив.",
          id: row.id,
          kind: "export",
          title: "Сборка архива началась",
          tone: "neutral",
        };
      }

      if (toStatus === "completed") {
        return {
          actorScope,
          createdAt: row.created_at,
          detail: "Архив готов к скачиванию в разделе выше.",
          id: row.id,
          kind: "export",
          title: "Архив готов",
          tone: "success",
        };
      }

      if (toStatus === "failed") {
        return {
          actorScope,
          createdAt: row.created_at,
          detail: note ?? "Сборка завершилась ошибкой.",
          id: row.id,
          kind: "export",
          title: "Ошибка сборки архива",
          tone: "danger",
        };
      }

      return null;
    case "user_requested_deletion":
      return {
        actorScope,
        createdAt: row.created_at,
        detail: buildHoldDetail(holdUntil),
        id: row.id,
        kind: "deletion",
        title: "Запрошено удаление аккаунта",
        tone: "warning",
      };
    case "queue_deletion_request":
      return {
        actorScope,
        createdAt: row.created_at,
        detail: buildHoldDetail(holdUntil),
        id: row.id,
        kind: "deletion",
        title: "Удаление переведено в hold",
        tone: "warning",
      };
    case "user_canceled_deletion":
    case "cancel_deletion_request":
      return {
        actorScope,
        createdAt: row.created_at,
        detail: "Удаление аккаунта больше не будет продолжено по текущему запросу.",
        id: row.id,
        kind: "deletion",
        title: "Запрос на удаление отменен",
        tone: "success",
      };
    case "deletion_request_status_updated":
      if (toStatus === "holding") {
        return {
          actorScope,
          createdAt: row.created_at,
          detail: buildHoldDetail(holdUntil),
          id: row.id,
          kind: "deletion",
          title: "Запрос удерживается перед удалением",
          tone: "warning",
        };
      }

      if (toStatus === "completed") {
        return {
          actorScope,
          createdAt: row.created_at,
          detail: note ?? "Запрос прошел следующий этап обработки.",
          id: row.id,
          kind: "deletion",
          title: "Deletion workflow продвинулся",
          tone: "neutral",
        };
      }

      if (toStatus === "canceled") {
        return {
          actorScope,
          createdAt: row.created_at,
          detail: note ?? null,
          id: row.id,
          kind: "deletion",
          title: "Запрос на удаление остановлен",
          tone: "success",
        };
      }

      return null;
    case "queue_deletion_purge_action":
      return {
        actorScope,
        createdAt: row.created_at,
        detail: "Hold завершен, операция передана в финальную очередь очистки данных.",
        id: row.id,
        kind: "deletion",
        title: "Данные переданы в purge workflow",
        tone: "warning",
      };
    case "support_action_status_updated":
      if (supportAction === "purge_user_data" && toStatus === "completed") {
        return {
          actorScope,
          createdAt: row.created_at,
          detail: "Сформирован purge manifest для следующего шага очистки данных.",
          id: row.id,
          kind: "deletion",
          title: "Подготовлена финальная очистка данных",
          tone: "warning",
        };
      }

      if (supportAction === "purge_user_data" && toStatus === "failed") {
        return {
          actorScope,
          createdAt: row.created_at,
          detail: note ?? "Подготовка purge workflow завершилась ошибкой.",
          id: row.id,
          kind: "deletion",
          title: "Ошибка подготовки purge workflow",
          tone: "danger",
        };
      }

      return null;
    default:
      return null;
  }
}

async function loadSettingsPrivacyEvents(userId: string) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from("admin_audit_logs")
      .select("id, actor_user_id, action, reason, payload, created_at")
      .eq("target_user_id", userId)
      .in("action", [...SETTINGS_PRIVACY_AUDIT_ACTIONS])
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return (data ?? [])
      .map((row) => mapPrivacyEvent(row, userId))
      .filter((event): event is SettingsPrivacyEvent => Boolean(event));
  } catch (error) {
    logger.warn("settings privacy events load failed", { error, userId });
    return [];
  }
}

async function loadSettingsBillingReviewRequest(userId: string) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from("support_actions")
      .select("id, status, payload, created_at, updated_at")
      .eq("target_user_id", userId)
      .eq("action", "billing_access_review")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapBillingReviewRequest(data) : null;
  } catch (error) {
    logger.warn("settings billing review request load failed", { error, userId });
    return null;
  }
}

async function loadSettingsBillingEvents(
  supabase: SupabaseClient,
  userId: string,
) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    const [subscriptionEventsResult, auditEventsResult] = await Promise.all([
      supabase
        .from("subscription_events")
        .select("id, event_type, payload, created_at")
        .eq("user_id", userId)
        .in("event_type", [...SETTINGS_BILLING_EVENT_TYPES])
        .order("created_at", { ascending: false })
        .limit(12),
      adminSupabase
        .from("admin_audit_logs")
        .select("id, actor_user_id, action, reason, payload, created_at")
        .eq("target_user_id", userId)
        .in("action", [...SETTINGS_BILLING_AUDIT_ACTIONS])
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    if (subscriptionEventsResult.error) {
      throw subscriptionEventsResult.error;
    }

    if (auditEventsResult.error) {
      throw auditEventsResult.error;
    }

    return [
      ...((subscriptionEventsResult.data ?? [])
        .map((row) => mapBillingSubscriptionEvent(row, userId))
        .filter((event): event is SettingsBillingEvent => Boolean(event))),
      ...((auditEventsResult.data ?? [])
        .map((row) => mapBillingAuditEvent(row, userId))
        .filter((event): event is SettingsBillingEvent => Boolean(event))),
    ]
      .sort((left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      .slice(0, 12);
  } catch (error) {
    logger.warn("settings billing events load failed", { error, userId });
    return [];
  }
}

export async function loadSettingsDataSnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<SettingsDataSnapshot> {
  const [
    exportJobsResult,
    deletionRequestResult,
    privacyEvents,
    billingReviewRequest,
    billingEvents,
  ] =
    await Promise.all([
      supabase
        .from("export_jobs")
        .select("id, format, status, artifact_path, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("deletion_requests")
        .select("id, status, hold_until, created_at, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
      loadSettingsPrivacyEvents(userId),
      loadSettingsBillingReviewRequest(userId),
      loadSettingsBillingEvents(supabase, userId),
    ]);

  if (exportJobsResult.error) {
    throw exportJobsResult.error;
  }

  if (deletionRequestResult.error) {
    throw deletionRequestResult.error;
  }

  return {
    billingEvents,
    billingReviewRequest,
    deletionRequest: deletionRequestResult.data
      ? mapDeletionRequest(deletionRequestResult.data)
      : null,
    exportJobs: (exportJobsResult.data ?? []).map(mapExportJob),
    privacyEvents,
  };
}

export async function buildUserDataExportBundle(
  supabase: SupabaseClient,
  {
    userEmail,
    userId,
  }: {
    userEmail: string | null;
    userId: string;
  },
) {
  const [
    profileResult,
    onboardingResult,
    goalsResult,
    nutritionGoalsResult,
    exerciseLibraryResult,
    workoutTemplatesResult,
    weeklyProgramsResult,
    workoutDaysResult,
    workoutSetsResult,
    foodsResult,
    mealsResult,
    mealTemplatesResult,
    recipesResult,
    recipeItemsResult,
    bodyMetricsResult,
    aiChatSessionsResult,
    aiChatMessagesResult,
    memoryFactsResult,
    contextSnapshotsResult,
    exportJobsResult,
    deletionRequestsResult,
    subscriptionsResult,
    entitlementsResult,
    usageCountersResult,
    adminStateResult,
    platformAdminsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("onboarding_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("nutrition_goals")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("exercise_library")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("workout_templates")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("weekly_programs")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("workout_days")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("workout_sets")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("foods")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false }),
    supabase
      .from("meal_templates")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("recipes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("recipe_items")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("body_metrics")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_memory_facts")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("user_context_snapshots")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("export_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("deletion_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("entitlements")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("usage_counters")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("user_admin_states")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("platform_admins")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const failedResult = [
    profileResult,
    onboardingResult,
    goalsResult,
    nutritionGoalsResult,
    exerciseLibraryResult,
    workoutTemplatesResult,
    weeklyProgramsResult,
    workoutDaysResult,
    workoutSetsResult,
    foodsResult,
    mealsResult,
    mealTemplatesResult,
    recipesResult,
    recipeItemsResult,
    bodyMetricsResult,
    aiChatSessionsResult,
    aiChatMessagesResult,
    memoryFactsResult,
    contextSnapshotsResult,
    exportJobsResult,
    deletionRequestsResult,
    subscriptionsResult,
    entitlementsResult,
    usageCountersResult,
    adminStateResult,
    platformAdminsResult,
  ].find((result) => result.error);

  if (failedResult?.error) {
    throw failedResult.error;
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    user: {
      adminState: adminStateResult.data ?? null,
      email: userEmail,
      id: userId,
      onboarding: onboardingResult.data ?? null,
      platformAdmin: platformAdminsResult.data ?? null,
      profile: profileResult.data ?? null,
    },
    goals: {
      history: goalsResult.data ?? [],
      nutrition: nutritionGoalsResult.data ?? [],
      primary: goalsResult.data?.[0] ?? null,
    },
    workouts: {
      exerciseLibrary: exerciseLibraryResult.data ?? [],
      weeklyPrograms: weeklyProgramsResult.data ?? [],
      workoutDays: workoutDaysResult.data ?? [],
      workoutSets: workoutSetsResult.data ?? [],
      workoutTemplates: workoutTemplatesResult.data ?? [],
    },
    nutrition: {
      bodyMetrics: bodyMetricsResult.data ?? [],
      foods: foodsResult.data ?? [],
      mealTemplates: mealTemplatesResult.data ?? [],
      meals: mealsResult.data ?? [],
      recipeItems: recipeItemsResult.data ?? [],
      recipes: recipesResult.data ?? [],
    },
    ai: {
      chatMessages: aiChatMessagesResult.data ?? [],
      chatSessions: aiChatSessionsResult.data ?? [],
      contextSnapshots: contextSnapshotsResult.data ?? [],
      memoryFacts: memoryFactsResult.data ?? [],
    },
    billing: {
      entitlements: entitlementsResult.data ?? [],
      subscriptions: subscriptionsResult.data ?? [],
      usageCounters: usageCountersResult.data ?? [],
    },
    privacy: {
      deletionRequests: deletionRequestsResult.data ?? [],
      exportJobs: exportJobsResult.data ?? [],
    },
    summary: {
      aiChatMessages: aiChatMessagesResult.data?.length ?? 0,
      aiChatSessions: aiChatSessionsResult.data?.length ?? 0,
      bodyMetrics: bodyMetricsResult.data?.length ?? 0,
      entitlements: entitlementsResult.data?.length ?? 0,
      exportJobs: exportJobsResult.data?.length ?? 0,
      foods: foodsResult.data?.length ?? 0,
      goals: goalsResult.data?.length ?? 0,
      mealTemplates: mealTemplatesResult.data?.length ?? 0,
      meals: mealsResult.data?.length ?? 0,
      nutritionGoals: nutritionGoalsResult.data?.length ?? 0,
      recipes: recipesResult.data?.length ?? 0,
      subscriptions: subscriptionsResult.data?.length ?? 0,
      usageCounters: usageCountersResult.data?.length ?? 0,
      weeklyPrograms: weeklyProgramsResult.data?.length ?? 0,
      workoutDays: workoutDaysResult.data?.length ?? 0,
      workoutSets: workoutSetsResult.data?.length ?? 0,
      workoutTemplates: workoutTemplatesResult.data?.length ?? 0,
    },
  };
}

export type UserDataExportBundle = Awaited<
  ReturnType<typeof buildUserDataExportBundle>
>;
