"use client";

import { useState } from "react";

import {
  AI_EVAL_SUITES,
  AI_EVAL_SUITE_LABELS,
  type AiEvalSuite,
} from "@/lib/ai/eval-suites";
import {
  hasAdminCapability,
  type PlatformAdminRole,
} from "@/lib/admin-permissions";

type AdminAiEvalRun = {
  completed_at: string | null;
  created_at: string;
  id: string;
  label: string;
  model_id: string;
  started_at: string | null;
  status: string;
  summary?: {
    isScheduled?: boolean;
    qualityGatePassed?: boolean;
    suite?: string;
    trigger?: string;
  } | null;
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
      return "В очереди";
    case "running":
      return "В работе";
    case "completed":
      return "Завершено";
    case "failed":
      return "Ошибка";
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

function getSuiteLabel(value: string | null | undefined) {
  if (!value) {
    return AI_EVAL_SUITE_LABELS.all;
  }

  return AI_EVAL_SUITE_LABELS[value as AiEvalSuite] ?? value;
}

async function readJsonSafely(response: Response) {
  return (await response.json().catch(() => null)) as
    | {
        data?: AdminAiEvalRun[] | (AdminAiEvalRun & { message?: string });
        message?: string;
      }
    | null;
}

export function AdminAiEvalRuns({
  canRunScheduledJobs = false,
  currentAdminRole,
  initialRuns,
}: {
  canRunScheduledJobs?: boolean;
  currentAdminRole: PlatformAdminRole;
  initialRuns: AdminAiEvalRun[];
}) {
  const [runs, setRuns] = useState(initialRuns);
  const [label, setLabel] = useState("");
  const [modelId, setModelId] = useState("google/gemini-3.1-pro-preview");
  const [suite, setSuite] = useState<AiEvalSuite>("all");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

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
        setError(payload?.message ?? "Не удалось обновить список AI-проверок.");
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
          suite,
        }),
      });

      const payload = await readJsonSafely(response);

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось поставить AI-проверку в очередь.");
        return;
      }

      const queuedRun =
        payload?.data && !Array.isArray(payload.data) ? payload.data : null;

      if (queuedRun) {
        setRuns((current) => [queuedRun, ...current].slice(0, 20));
      }

      setNotice(
        queuedRun?.message ??
          "AI-проверка поставлена в очередь и добавлена в историю запусков.",
      );
      setLabel("");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function queueScheduledSmokeRun() {
    if (isScheduling || !canRunScheduledJobs) {
      return;
    }

    setIsScheduling(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(
        "/api/internal/jobs/ai-evals-schedule?suite=tool_calls",
        {
          method: "POST",
        },
      );
      const payload = await readJsonSafely(response);

      if (!response.ok) {
        setError(
          payload?.message ??
            "Не удалось поставить плановую AI-проверку в очередь.",
        );
        return;
      }

      const queuedRun =
        payload?.data && !Array.isArray(payload.data) ? payload.data : null;

      if (queuedRun) {
        setRuns((current) => {
          const withoutDuplicate = current.filter((run) => run.id !== queuedRun.id);
          return [queuedRun, ...withoutDuplicate].slice(0, 20);
        });
      }

      setNotice(payload?.message ?? "Плановая AI-проверка добавлена в очередь.");
    } finally {
      setIsScheduling(false);
    }
  }

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Качество AI
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Проверки качества AI и история запусков
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
            Для этого аккаунта в разделе качества доступен только просмотр.
          </p>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_220px_auto]">
          <label className="grid gap-2 text-sm text-muted">
            Название проверки
            <input
              className={inputClassName}
              disabled={!canQueueAiEvalRuns || isSubmitting}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Например: еженедельная проверка помощника"
              value={label}
            />
          </label>

          <label className="grid gap-2 text-sm text-muted">
            Модель AI
            <input
              className={inputClassName}
              disabled={!canQueueAiEvalRuns || isSubmitting}
              onChange={(event) => setModelId(event.target.value)}
              value={modelId}
            />
          </label>

          <label className="grid gap-2 text-sm text-muted">
            Набор проверок
            <select
              className={inputClassName}
              disabled={!canQueueAiEvalRuns || isSubmitting}
              onChange={(event) => setSuite(event.target.value as AiEvalSuite)}
              value={suite}
            >
              {AI_EVAL_SUITES.map((option) => (
                <option key={option} value={option}>
                  {AI_EVAL_SUITE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              className="inline-flex w-full justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
              disabled={!canQueueAiEvalRuns || isSubmitting}
              onClick={() => void queueRun()}
              type="button"
            >
              {isSubmitting ? "Запускаю..." : "Запустить проверку"}
            </button>
          </div>
        </div>

        {canRunScheduledJobs ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/60 px-4 py-4 text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                Плановая быстрая проверка
              </p>
              <p className="text-muted">
                Быстрый контроль ключевых функций AI, который можно запускать
                вручную или по расписанию.
              </p>
            </div>
            <button
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isScheduling}
              onClick={() => void queueScheduledSmokeRun()}
              type="button"
            >
              {isScheduling ? "Ставлю в очередь..." : "Запустить быстро"}
            </button>
          </div>
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

        <div className="grid gap-3">
          {runs.length ? (
            runs.map((run) => (
              <article
                className="rounded-2xl border border-border bg-white/60 p-4 text-sm"
                key={run.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{run.label}</p>
                    <p className="text-muted">
                      Набор: {getSuiteLabel(run.summary?.suite)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="pill">{formatStatus(run.status)}</span>
                    {run.summary?.isScheduled ? (
                      <span className="pill bg-sky-100 text-sky-700">
                        по расписанию
                      </span>
                    ) : null}
                    {run.summary?.qualityGatePassed === true ? (
                      <span className="pill bg-emerald-100 text-emerald-700">
                        порог пройден
                      </span>
                    ) : null}
                    {run.summary?.qualityGatePassed === false ? (
                      <span className="pill bg-red-100 text-red-700">
                        нужен разбор
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 grid gap-1 text-muted">
                  <p>Создано: {formatDateTime(run.created_at)}</p>
                  <p>Старт: {formatDateTime(run.started_at)}</p>
                  <p>Завершено: {formatDateTime(run.completed_at)}</p>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm leading-7 text-muted">
              Проверки качества AI пока не запускались.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
