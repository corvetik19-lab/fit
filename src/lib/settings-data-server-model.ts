import type {
  SettingsBillingEvent,
  SettingsBillingReviewRequest,
  SettingsDataSnapshot,
  SettingsDeletionRequest,
  SettingsExportJob,
  SettingsPrivacyEvent,
} from "@/lib/settings-data";

export const SETTINGS_PRIVACY_AUDIT_ACTIONS = [
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

export const SETTINGS_BILLING_AUDIT_ACTIONS = [
  "user_requested_billing_access_review",
  "support_action_status_updated",
] as const;

export const SETTINGS_BILLING_EVENT_TYPES = [
  "admin_grant_trial",
  "admin_activate_subscription",
  "admin_mark_past_due",
  "admin_cancel_subscription",
  "admin_enable_entitlement",
  "admin_disable_entitlement",
] as const;

export function createEmptySettingsDataSnapshot(): SettingsDataSnapshot {
  return {
    billingEvents: [],
    billingReviewRequest: null,
    deletionRequest: null,
    exportJobs: [],
    privacyEvents: [],
  };
}

export function mapExportJob(row: {
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

export function mapDeletionRequest(row: {
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

export function mapBillingReviewRequest(row: {
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

export function mapBillingSubscriptionEvent(
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
  const durationDays = readNullableNumber(payload, "durationDays");
  const previousPeriodEnd = readString(payload, "previousPeriodEnd");
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
  const subscriptionExtensionDetail = [
    subscriptionDetail,
    typeof durationDays === "number" ? `Добавлено дней: ${durationDays}.` : null,
    previousPeriodEnd
      ? `Предыдущий срок: ${new Date(previousPeriodEnd).toLocaleString("ru-RU")}.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  switch (row.event_type) {
    case "admin_grant_trial":
      return {
        actorScope,
        createdAt: row.created_at,
        detail: subscriptionDetail || "Для аккаунта включён trial-период.",
        id: row.id,
        ...(subscriptionExtensionDetail
          ? { detail: subscriptionExtensionDetail }
          : {}),
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

export function mapBillingAuditEvent(
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

  if (
    row.action === "support_action_status_updated" &&
    supportAction === "billing_access_review"
  ) {
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

export function mapPrivacyEvent(
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
