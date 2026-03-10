"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PanelCard } from "@/components/panel-card";
import {
  getAdminRoleLabel,
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
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "нет данных";
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
      return "bg-emerald-50 text-emerald-700";
    case "failed":
      return "bg-red-50 text-red-700";
    case "holding":
      return "bg-amber-50 text-amber-700";
    case "processing":
      return "bg-sky-50 text-sky-700";
    case "canceled":
      return "bg-stone-100 text-stone-700";
    default:
      return "bg-white/70 text-foreground";
  }
}

function formatKind(kind: AdminOperationItem["kind"]) {
  switch (kind) {
    case "support_action":
      return "Support";
    case "export_job":
      return "Export";
    case "deletion_request":
      return "Deletion";
    default:
      return kind;
  }
}

function formatSupportAction(action: string | null | undefined) {
  switch (action) {
    case "billing_access_review":
      return "billing access review";
    case "purge_user_data":
      return "purge user data";
    case "resync_user_context":
      return "resync user context";
    case "restore_user":
      return "restore user";
    case "suspend_user":
      return "suspend user";
    default:
      return action ?? "support action";
  }
}

function formatTitle(item: AdminOperationItem) {
  if (item.kind === "support_action") {
    return formatSupportAction(item.meta.action ?? item.title);
  }

  if (item.kind === "export_job") {
    return item.meta.format
      ? `user data export (${item.meta.format})`
      : item.title;
  }

  return item.title;
}

function formatActionLabel(action: AdminOperationAction) {
  switch (action) {
    case "mark_processing":
      return "В работу";
    case "mark_completed":
      return "Завершить";
    case "mark_failed":
      return "Ошибка";
    case "mark_holding":
      return "Продлить hold";
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
  return user?.full_name ?? user?.email ?? user?.id ?? "не указан";
}

async function readJsonSafely(response: Response) {
  return (await response.json().catch(() => null)) as
    | { data?: AdminOperationsPayload; message?: string }
    | null;
}

export function AdminOperationsInbox({
  currentAdminRole,
}: {
  currentAdminRole: PlatformAdminRole;
}) {
  const [payload, setPayload] = useState<AdminOperationsPayload | null>(null);
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

    try {
      const response = await fetch("/api/admin/operations", {
        cache: "no-store",
      });
      const nextPayload = await readJsonSafely(response);

      if (!response.ok || !nextPayload?.data) {
        setError(nextPayload?.message ?? "Не удалось загрузить operations inbox.");
        return;
      }

      setPayload(nextPayload.data);
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
        setError(
          result?.message ?? "Не удалось прогнать queue processor по admin-очередям.",
        );
        return;
      }

      setNotice(
        `Wave завершен: export completed ${result.data.exports.completed}, export failed ${result.data.exports.failed}, deletion normalized ${result.data.deletions.normalizedToHold}, released to purge ${result.data.deletions.releasedToPurge}, support completed ${result.data.support.completed}, support failed ${result.data.support.failed}.`,
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

      setNotice(`Операция ${formatActionLabel(action).toLowerCase()} применена.`);
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
      <PanelCard caption="Operations" title="Inbox очередей и ручные статусы">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-7 text-muted">
              Единый inbox по support actions, export jobs и deletion requests.
              Support-admin и super-admin могут вручную разбирать хвосты и запускать
              queue wave без похода в SQL.
            </p>
            <div className="flex flex-wrap gap-2">
              {canManageOperations ? (
                <button
                  className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isRefreshing || isProcessingWave}
                  onClick={() => void processWave()}
                  type="button"
                >
                  {isProcessingWave ? "Прогоняю wave..." : "Прогнать wave"}
                </button>
              ) : null}
              <button
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isRefreshing || isProcessingWave}
                onClick={() => void refreshInbox()}
                type="button"
              >
                {isRefreshing ? "Обновляю..." : "Обновить"}
              </button>
            </div>
          </div>

          {!canManageOperations ? (
            <p className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Роль {getAdminRoleLabel(currentAdminRole)} видит inbox только в режиме
              просмотра.
            </p>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {notice ? (
            <p className="rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Open queue", String(payload?.summary.pending.total ?? 0)],
              ["Support", String(payload?.summary.pending.supportActions ?? 0)],
              ["Exports", String(payload?.summary.pending.exportJobs ?? 0)],
              ["Deletion", String(payload?.summary.pending.deletionRequests ?? 0)],
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
                    className="rounded-3xl border border-border bg-white/60 p-4 text-sm"
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
                          Открыть пользователя
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
                          Hold until:{" "}
                          <span className="text-foreground">
                            {formatDateTime(item.meta.hold_until)}
                          </span>
                        </p>
                      ) : null}
                      {item.detail ? (
                        <p>
                          Деталь:{" "}
                          <span className="text-foreground">{item.detail}</span>
                        </p>
                      ) : null}
                    </div>

                    {item.available_actions.length ? (
                      <div className="mt-4 grid gap-3">
                        <label className="grid gap-2 text-sm text-muted">
                          Комментарий оператора
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
                              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={!canManageOperations || isPending}
                              key={action}
                              onClick={() => void updateItem(item, action)}
                              type="button"
                            >
                              {isPending
                                ? "Сохраняю..."
                                : formatActionLabel(action)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <p className="rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Открытых операций в очередях сейчас нет.
              </p>
            )}
          </div>
        </div>
      </PanelCard>

      <PanelCard caption="Recent" title="Последние разобранные операции">
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Completed", String(payload?.summary.recent.completed ?? 0)],
              ["Failed", String(payload?.summary.recent.failed ?? 0)],
              ["Canceled", String(payload?.summary.recent.canceled ?? 0)],
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
                  className="rounded-3xl border border-border bg-white/60 p-4 text-sm"
                  key={getItemKey(item)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {formatTitle(item)}
                      </p>
                      <p className="mt-1 text-muted">
                        {formatKind(item.kind)} · {formatStatus(item.status)}
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
                История ручных статусов пока не накопилась.
              </p>
            )}
          </div>
        </div>
      </PanelCard>
    </div>
  );
}
