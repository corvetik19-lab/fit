"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PanelCard } from "@/components/panel-card";
import {
  hasAdminCapability,
  type PlatformAdminRole,
} from "@/lib/admin-permissions";

type AdminOperationAction =
  | "mark_processing"
  | "mark_completed"
  | "mark_failed"
  | "mark_holding"
  | "mark_canceled";

type AdminOperationItem = {
  actor_user: {
    email: string | null;
    full_name: string | null;
    id: string;
  } | null;
  available_actions: AdminOperationAction[];
  created_at: string;
  detail: string | null;
  id: string;
  kind: "support_action" | "export_job" | "deletion_request";
  meta: {
    action?: string | null;
    format?: string | null;
    hold_until?: string | null;
  };
  status: string;
  target_user: {
    email: string | null;
    full_name: string | null;
    id: string;
  } | null;
  title: string;
  updated_at: string | null;
};

type AdminOperationsPayload = {
  inbox: AdminOperationItem[];
  recent: AdminOperationItem[];
  summary: {
    pending: {
      deletionRequests: number;
      exportJobs: number;
      supportActions: number;
      total: number;
    };
    recent: {
      canceled: number;
      completed: number;
      failed: number;
    };
  };
};

type QueueProcessingSummary = {
  deletions: {
    failed: number;
    normalizedToHold: number;
    releasedToPurge: number;
    skippedActiveHold: number;
  };
  exports: {
    completed: number;
    failed: number;
    processingTransitions: number;
  };
  support: {
    completed: number;
    failed: number;
    purgeManifestsCreated: number;
    restored: number;
    skipped: number;
    snapshotsCreated: number;
    suspended: number;
  };
  supportActionsQueued: number;
};

const inputClassName =
  "w-full rounded-2xl border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_92%,var(--surface))] px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

const adminSecondaryButtonClassName =
  "action-button action-button--secondary disabled:cursor-not-allowed disabled:opacity-60";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Нет данных";
  }

  return dateFormatter.format(new Date(value));
}

function formatStatus(value: string) {
  switch (value) {
    case "queued":
      return "в очереди";
    case "processing":
      return "в обработке";
    case "completed":
      return "завершено";
    case "failed":
      return "ошибка";
    case "holding":
      return "на удержании";
    case "canceled":
      return "отменено";
    default:
      return value;
  }
}

function getStatusTone(value: string) {
  switch (value) {
    case "completed":
      return "border border-emerald-500/25 bg-emerald-500/12 text-emerald-900";
    case "failed":
      return "border border-red-500/25 bg-red-500/12 text-red-900";
    case "holding":
      return "border border-amber-500/25 bg-amber-500/12 text-amber-900";
    case "processing":
      return "border border-sky-500/25 bg-sky-500/12 text-sky-900";
    case "canceled":
      return "border border-slate-300 bg-slate-100 text-slate-700";
    default:
      return "border border-slate-300 bg-slate-100 text-slate-700";
  }
}

function formatKind(kind: AdminOperationItem["kind"]) {
  switch (kind) {
    case "support_action":
      return "Поддержка";
    case "export_job":
      return "Выгрузка";
    case "deletion_request":
      return "Удаление";
    default:
      return kind;
  }
}

function formatSupportAction(action: string | null | undefined) {
  switch (action) {
    case "billing_access_review":
      return "Проверка доступа к оплате";
    case "purge_user_data":
      return "Очистка данных";
    case "resync_user_context":
      return "Обновление контекста пользователя";
    case "restore_user":
      return "Восстановление доступа";
    case "suspend_user":
      return "Ограничение доступа";
    default:
      return action ?? "Операция поддержки";
  }
}

function formatTitle(item: AdminOperationItem) {
  if (item.kind === "support_action") {
    return formatSupportAction(item.meta.action ?? item.title);
  }

  if (item.kind === "export_job") {
    return item.meta.format ? `Выгрузка данных (${item.meta.format})` : item.title;
  }

  return item.title;
}

function formatActionLabel(action: AdminOperationAction) {
  switch (action) {
    case "mark_processing":
      return "Взять в работу";
    case "mark_completed":
      return "Завершить";
    case "mark_failed":
      return "Отметить ошибку";
    case "mark_holding":
      return "Продлить удержание";
    case "mark_canceled":
      return "Отменить";
    default:
      return action;
  }
}

function getItemKey(item: AdminOperationItem) {
  return `${item.kind}:${item.id}`;
}

function getUserLabel(
  user: {
    email: string | null;
    full_name: string | null;
    id: string;
  } | null,
) {
  return user?.full_name ?? user?.email ?? user?.id ?? "Не указано";
}

async function readJsonSafely(response: Response) {
  return (await response.json().catch(() => null)) as
    | {
        data?: AdminOperationsPayload;
        meta?: {
          degraded?: boolean;
        };
        message?: string;
      }
    | null;
}

export function AdminOperationsInbox({
  currentAdminRole,
}: {
  currentAdminRole: PlatformAdminRole;
}) {
  const [payload, setPayload] = useState<AdminOperationsPayload | null>(null);
  const [isDegraded, setIsDegraded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessingWave, setIsProcessingWave] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const canManageOperations = hasAdminCapability(
    currentAdminRole,
    "queue_support_actions",
  );

  const refreshInbox = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    setIsDegraded(false);

    try {
      const response = await fetch("/api/admin/operations", {
        cache: "no-store",
      });
      const nextPayload = await readJsonSafely(response);

      if (!response.ok || !nextPayload?.data) {
        setError(nextPayload?.message ?? "Не удалось загрузить очередь операций.");
        return;
      }

      setPayload(nextPayload.data);
      setIsDegraded(Boolean(nextPayload.meta?.degraded));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshInbox();
  }, [refreshInbox]);

  async function processWave() {
    if (!canManageOperations) {
      return;
    }

    setIsProcessingWave(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/operations/process", {
        body: JSON.stringify({
          deletionLimit: 5,
          exportLimit: 5,
          supportLimit: 8,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as
        | { data?: QueueProcessingSummary; message?: string }
        | null;

      if (!response.ok || !result?.data) {
        setError(result?.message ?? "Не удалось обработать очередь операций.");
        return;
      }

      setNotice(
        `Обработка завершена: выгрузок завершено ${result.data.exports.completed}, ошибок ${result.data.exports.failed}; удалений подготовлено ${result.data.deletions.releasedToPurge}; операций поддержки завершено ${result.data.support.completed}, ошибок ${result.data.support.failed}.`,
      );
      await refreshInbox();
    } finally {
      setIsProcessingWave(false);
    }
  }

  async function updateItem(
    item: AdminOperationItem,
    action: AdminOperationAction,
  ) {
    if (!canManageOperations) {
      return;
    }

    const itemKey = getItemKey(item);
    setPendingKey(itemKey);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/admin/operations/${item.kind}/${item.id}`, {
        body: JSON.stringify({
          action,
          note: notes[itemKey]?.trim() || undefined,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const nextPayload = await readJsonSafely(response);

      if (!response.ok) {
        setError(nextPayload?.message ?? "Не удалось обновить статус операции.");
        return;
      }

      setNotice(`Действие «${formatActionLabel(action)}» применено.`);
      setNotes((current) => ({
        ...current,
        [itemKey]: "",
      }));
      await refreshInbox();
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <PanelCard caption="Операции" title="Очередь и ручная обработка">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-7 text-muted">
              Здесь видны запросы на поддержку, выгрузку и удаление данных.
              Нужные действия можно выполнить прямо из панели.
            </p>
            <div className="flex flex-wrap gap-2">
              {canManageOperations ? (
                <button
                    className="action-button action-button--primary disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isRefreshing || isProcessingWave}
                  onClick={() => void processWave()}
                  type="button"
                >
                  {isProcessingWave ? "Обрабатываю..." : "Обработать очередь"}
                </button>
              ) : null}
              <button
                    className={adminSecondaryButtonClassName}
                disabled={isRefreshing || isProcessingWave}
                onClick={() => void refreshInbox()}
                type="button"
              >
                {isRefreshing ? "Обновляю..." : "Обновить"}
              </button>
            </div>
          </div>

          {!canManageOperations ? (
            <p className="rounded-2xl border border-amber-500/25 bg-amber-500/12 px-4 py-3 text-sm text-amber-900">
              Для этого аккаунта в этом разделе доступен только просмотр.
            </p>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-red-500/25 bg-red-500/12 px-4 py-3 text-sm text-red-900">
              {error}
            </p>
          ) : null}

          {isDegraded ? (
            <p className="rounded-2xl border border-amber-500/25 bg-amber-500/12 px-4 py-3 text-sm text-amber-900">
              Очередь операций показана из резервного снимка. Часть фоновых данных
              сейчас недоступна, поэтому обновления могут появляться с задержкой.
            </p>
          ) : null}

          {notice ? (
            <p className="rounded-2xl border border-emerald-500/25 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-900">
              {notice}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Всего задач", String(payload?.summary.pending.total ?? 0)],
              ["Поддержка", String(payload?.summary.pending.supportActions ?? 0)],
              ["Выгрузки", String(payload?.summary.pending.exportJobs ?? 0)],
              ["Удаление", String(payload?.summary.pending.deletionRequests ?? 0)],
            ].map(([label, value]) => (
              <article className="kpi p-4" key={label}>
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-3">
            {payload?.inbox.length ? (
              payload.inbox.map((item) => {
                const itemKey = getItemKey(item);
                const isPending = pendingKey === itemKey;

                return (
                  <article
                    className="surface-panel text-sm"
                    key={itemKey}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {formatTitle(item)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="pill">{formatKind(item.kind)}</span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(item.status)}`}
                          >
                            {formatStatus(item.status)}
                          </span>
                        </div>
                      </div>

                      {item.target_user ? (
                        <Link
                          className="text-sm font-semibold text-accent transition hover:opacity-80"
                          href={`/admin/users/${item.target_user.id}`}
                        >
                          Открыть профиль
                        </Link>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-2 text-muted md:grid-cols-2">
                      <p>
                        Пользователь:{" "}
                        <span className="text-foreground">
                          {getUserLabel(item.target_user)}
                        </span>
                      </p>
                      <p>
                        Инициатор:{" "}
                        <span className="text-foreground">
                          {getUserLabel(item.actor_user)}
                        </span>
                      </p>
                      <p>
                        Создано:{" "}
                        <span className="text-foreground">
                          {formatDateTime(item.created_at)}
                        </span>
                      </p>
                      <p>
                        Обновлено:{" "}
                        <span className="text-foreground">
                          {formatDateTime(item.updated_at)}
                        </span>
                      </p>
                      {item.meta.hold_until ? (
                        <p>
                          Удержание до:{" "}
                          <span className="text-foreground">
                            {formatDateTime(item.meta.hold_until)}
                          </span>
                        </p>
                      ) : null}
                      {item.detail ? (
                        <p>
                          Подробности:{" "}
                          <span className="text-foreground">{item.detail}</span>
                        </p>
                      ) : null}
                    </div>

                    {item.available_actions.length ? (
                      <div className="mt-4 grid gap-3">
                        <label className="grid gap-2 text-sm text-muted">
                          Комментарий
                          <input
                            className={inputClassName}
                            disabled={!canManageOperations || isPending}
                            onChange={(event) =>
                              setNotes((current) => ({
                                ...current,
                                [itemKey]: event.target.value,
                              }))
                            }
                            placeholder="Например: проверено вручную"
                            value={notes[itemKey] ?? ""}
                          />
                        </label>

                        <div className="flex flex-wrap gap-2">
                          {item.available_actions.map((action) => (
                            <button
                              className={adminSecondaryButtonClassName}
                              disabled={!canManageOperations || isPending}
                              key={action}
                              onClick={() => void updateItem(item, action)}
                              type="button"
                            >
                              {isPending ? "Сохраняю..." : formatActionLabel(action)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <p className="rounded-2xl border border-emerald-500/25 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-900">
                Открытых операций в очередях сейчас нет.
              </p>
            )}
          </div>
        </div>
      </PanelCard>

      <PanelCard caption="История" title="Недавно завершённые операции">
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Завершено", String(payload?.summary.recent.completed ?? 0)],
              ["С ошибкой", String(payload?.summary.recent.failed ?? 0)],
              ["Отменено", String(payload?.summary.recent.canceled ?? 0)],
            ].map(([label, value]) => (
              <article className="kpi p-4" key={label}>
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-3">
            {payload?.recent.length ? (
              payload.recent.map((item) => (
                <article
                  className="surface-panel text-sm"
                  key={getItemKey(item)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {formatTitle(item)}
                      </p>
                      <p className="mt-1 text-muted">
                        {formatKind(item.kind)} • {formatStatus(item.status)}
                      </p>
                    </div>
                    {item.target_user ? (
                      <Link
                        className="text-sm font-semibold text-accent transition hover:opacity-80"
                        href={`/admin/users/${item.target_user.id}`}
                      >
                        {getUserLabel(item.target_user)}
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-1 text-muted">
                    <p>Обновлено: {formatDateTime(item.updated_at)}</p>
                    <p>
                      Инициатор:{" "}
                      <span className="text-foreground">
                        {getUserLabel(item.actor_user)}
                      </span>
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm leading-7 text-muted">
                Недавно завершённых операций ещё не накопилось.
              </p>
            )}
          </div>
        </div>
      </PanelCard>
    </div>
  );
}
