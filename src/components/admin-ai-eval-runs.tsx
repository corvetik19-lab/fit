"use client";

import { useState } from "react";

import {
  getAdminRoleLabel,
  hasAdminCapability,
  type PlatformAdminRole,
} from "@/lib/admin-permissions";

type AdminAiEvalRun = {
  id: string;
  label: string;
  model_id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatStatus(status: string) {
  switch (status) {
    case "queued":
      return "в очереди";
    case "running":
      return "в работе";
    case "completed":
      return "завершено";
    case "failed":
      return "ошибка";
    default:
      return status;
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Нет данных";
  }

  return dateFormatter.format(new Date(value));
}

async function readJsonSafely(response: Response) {
  return (await response.json().catch(() => null)) as
    | {
        message?: string;
        data?: AdminAiEvalRun[] | (AdminAiEvalRun & { message?: string });
      }
    | null;
}

export function AdminAiEvalRuns({
  currentAdminRole,
  initialRuns,
}: {
  currentAdminRole: PlatformAdminRole;
  initialRuns: AdminAiEvalRun[];
}) {
  const [runs, setRuns] = useState(initialRuns);
  const [label, setLabel] = useState("");
  const [modelId, setModelId] = useState("google/gemini-3.1-pro-preview");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canQueueAiEvalRuns = hasAdminCapability(
    currentAdminRole,
    "queue_ai_eval_runs",
  );

  async function refreshRuns() {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/ai-evals", {
        cache: "no-store",
      });
      const payload = await readJsonSafely(response);

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось обновить список AI eval runs.");
        return;
      }

      setRuns(Array.isArray(payload?.data) ? payload.data : []);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function queueRun() {
    if (isSubmitting || !canQueueAiEvalRuns) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/ai-evals/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: label.trim() || undefined,
          modelId: modelId.trim() || undefined,
        }),
      });

      const payload = await readJsonSafely(response);

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось поставить AI eval run в очередь.");
        return;
      }

      const queuedRun =
        payload?.data && !Array.isArray(payload.data) ? payload.data : null;

      if (queuedRun) {
        setRuns((current) => [queuedRun, ...current].slice(0, 20));
      }

      setNotice(
        queuedRun?.message ?? "AI eval run поставлен в очередь и добавлен в список.",
      );
      setLabel("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            AI-оценки
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Живой контур AI eval runs
          </h2>
        </div>
        <button
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isRefreshing}
          onClick={() => void refreshRuns()}
          type="button"
        >
          {isRefreshing ? "Обновляю..." : "Обновить"}
        </button>
      </div>

      <div className="grid gap-4">
        {!canQueueAiEvalRuns ? (
          <p className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Роль {getAdminRoleLabel(currentAdminRole)} не может ставить eval runs в очередь.
            Для этого нужен `super_admin` или `analyst`.
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-2 text-sm text-muted">
            Label
            <input
              className={inputClassName}
              disabled={!canQueueAiEvalRuns || isSubmitting}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Например: weekly admin benchmark"
              value={label}
            />
          </label>

          <label className="grid gap-2 text-sm text-muted">
            Model
            <input
              className={inputClassName}
              disabled={!canQueueAiEvalRuns || isSubmitting}
              onChange={(event) => setModelId(event.target.value)}
              value={modelId}
            />
          </label>

          <div className="flex items-end">
            <button
              className="inline-flex w-full justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
              disabled={!canQueueAiEvalRuns || isSubmitting}
              onClick={() => void queueRun()}
              type="button"
            >
              {isSubmitting ? "Ставлю..." : "Запустить eval"}
            </button>
          </div>
        </div>

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

        <div className="grid gap-3">
          {runs.length ? (
            runs.map((run) => (
              <article
                className="rounded-2xl border border-border bg-white/60 p-4 text-sm"
                key={run.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{run.label}</p>
                    <p className="mt-1 break-all text-muted">{run.model_id}</p>
                  </div>
                  <div className="pill">{formatStatus(run.status)}</div>
                </div>
                <div className="mt-3 grid gap-1 text-muted">
                  <p>Создан: {formatDateTime(run.created_at)}</p>
                  <p>Старт: {formatDateTime(run.started_at)}</p>
                  <p>Завершён: {formatDateTime(run.completed_at)}</p>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm leading-7 text-muted">
              AI eval runs пока не запускались.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
