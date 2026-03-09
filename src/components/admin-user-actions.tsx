"use client";

import { startTransition, useState } from "react";

type AdminUserActionsProps = {
  userId: string;
  onUpdated: () => void;
};

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

export function AdminUserActions({
  userId,
  onUpdated,
}: AdminUserActionsProps) {
  const [reason, setReason] = useState("");
  const [customAction, setCustomAction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function queueAction(
    endpoint: string,
    body: Record<string, unknown>,
    successMessage: string,
  ) {
    setError(null);
    setNotice(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setError(payload?.message ?? "Не удалось поставить действие администратора в очередь.");
          return;
        }

        setNotice(successMessage);
        onUpdated();
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <section className="card p-6">
        <div className="mb-5">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Действия админа
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Операции поддержки и жизненного цикла
          </h2>
        </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm text-muted">
          Причина или комментарий
          <textarea
            className={`${inputClassName} min-h-24 resize-y`}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Например: ручная проверка профиля или запрос пользователя"
            value={reason}
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={() =>
              queueAction(
                `/api/admin/users/${userId}/suspend`,
                { reason },
                "Действие блокировки поставлено в очередь.",
              )
            }
            type="button"
          >
            Заблокировать
          </button>

          <button
            className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={() =>
              queueAction(
                `/api/admin/users/${userId}/restore`,
                { reason },
                "Действие восстановления поставлено в очередь.",
              )
            }
            type="button"
          >
            Восстановить
          </button>

          <button
            className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={() =>
              queueAction(
                `/api/admin/users/${userId}/support-action`,
                {
                  action: "resync_user_context",
                  reason,
                  payload: {
                    source: "admin-user-actions",
                  },
                },
                "Действие пересинхронизации поставлено в очередь.",
              )
            }
            type="button"
          >
            Поставить пересинхронизацию в очередь
          </button>
        </div>

        <label className="grid gap-2 text-sm text-muted">
          Кастомное действие поддержки
          <input
            className={inputClassName}
            onChange={(event) => setCustomAction(event.target.value)}
            placeholder="Например: recompute_nutrition_summaries"
            type="text"
            value={customAction}
          />
        </label>

        <button
          className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending || !customAction.trim()}
          onClick={() =>
            queueAction(
              `/api/admin/users/${userId}/support-action`,
              {
                action: customAction.trim(),
                reason,
                payload: {
                  source: "admin-user-actions",
                },
              },
              "Кастомное действие поддержки поставлено в очередь.",
            )
          }
          type="button"
        >
          {isPending ? "Обработка..." : "Запустить кастомное действие"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="mt-4 rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
