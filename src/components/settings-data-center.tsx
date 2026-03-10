"use client";

import { startTransition, useState } from "react";

import type { SettingsDataSnapshot } from "@/lib/settings-data";

type SettingsDataCenterProps = {
  initialSnapshot: SettingsDataSnapshot;
};

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "нет данных";
  }

  return dateFormatter.format(new Date(value));
}

function getExportStatusLabel(
  status: SettingsDataSnapshot["exportJobs"][number]["status"],
) {
  switch (status) {
    case "queued":
      return "в очереди";
    case "processing":
      return "собирается";
    case "completed":
      return "готов";
    case "failed":
      return "ошибка";
    default:
      return status;
  }
}

function getDeletionStatusLabel(
  status: NonNullable<SettingsDataSnapshot["deletionRequest"]>["status"],
) {
  switch (status) {
    case "queued":
      return "в очереди";
    case "holding":
      return "на удержании";
    case "completed":
      return "завершен";
    case "canceled":
      return "отменен";
    default:
      return status;
  }
}

function getStatusTone(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700";
    case "failed":
      return "bg-red-50 text-red-700";
    case "holding":
      return "bg-amber-50 text-amber-700";
    case "processing":
      return "bg-sky-50 text-sky-700";
    case "queued":
      return "bg-stone-100 text-stone-700";
    case "canceled":
      return "bg-white/80 text-muted";
    default:
      return "bg-white/80 text-foreground";
  }
}

function getTimelineTone(tone: SettingsDataSnapshot["privacyEvents"][number]["tone"]) {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50/70";
    case "warning":
      return "border-amber-200 bg-amber-50/70";
    case "danger":
      return "border-red-200 bg-red-50/70";
    default:
      return "border-border/70 bg-white/80";
  }
}

function getActorLabel(
  actorScope: SettingsDataSnapshot["privacyEvents"][number]["actorScope"],
) {
  switch (actorScope) {
    case "you":
      return "Вы";
    case "support":
      return "Поддержка";
    case "system":
      return "Система";
    default:
      return actorScope;
  }
}

function getKindLabel(kind: SettingsDataSnapshot["privacyEvents"][number]["kind"]) {
  return kind === "export" ? "Export" : "Deletion";
}

function getHoldRemainingLabel(holdUntil: string | null | undefined) {
  if (!holdUntil) {
    return "Срок hold пока не определён.";
  }

  const diff = new Date(holdUntil).getTime() - Date.now();

  if (diff <= 0) {
    return "Срок hold уже истёк, ожидается следующий шаг обработки.";
  }

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `До следующего шага остаётся примерно ${days} дн.`;
}

function getExportNextStep(snapshot: SettingsDataSnapshot) {
  const latestExport = snapshot.exportJobs[0];

  if (!latestExport) {
    return "Когда понадобится архив, запроси выгрузку и система соберёт ZIP автоматически.";
  }

  if (latestExport.status === "queued") {
    return "Запрос стоит в очереди. Следующий шаг: сервер начнёт собирать архив.";
  }

  if (latestExport.status === "processing") {
    return "Архив сейчас собирается. После завершения появится кнопка скачивания ZIP.";
  }

  if (latestExport.status === "completed") {
    return "Архив готов. Его можно скачать прямо на это устройство.";
  }

  return "Последняя сборка завершилась ошибкой. Можно повторно запросить новый экспорт.";
}

function getDeletionNextStep(snapshot: SettingsDataSnapshot) {
  const deletionRequest = snapshot.deletionRequest;

  if (!deletionRequest) {
    return "Если потребуется удалить аккаунт, сначала будет создан hold-период на 14 дней.";
  }

  if (deletionRequest.status === "holding") {
    return getHoldRemainingLabel(deletionRequest.holdUntil);
  }

  if (deletionRequest.status === "queued") {
    return "Запрос ожидает перевода в hold или следующий этап обработки.";
  }

  if (deletionRequest.status === "completed") {
    return "Deletion workflow уже продвинулся дальше удержания. Детали смотри в timeline ниже.";
  }

  return "Активный deletion workflow остановлен. При необходимости можно создать новый запрос.";
}

async function readJsonSafely(response: Response) {
  return (await response.json().catch(() => null)) as
    | { data?: SettingsDataSnapshot; message?: string }
    | null;
}

export function SettingsDataCenter({
  initialSnapshot,
}: SettingsDataCenterProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [deletionReason, setDeletionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const latestExport = snapshot.exportJobs[0] ?? null;
  const hasActiveExport = snapshot.exportJobs.some(
    (job) => job.status === "queued" || job.status === "processing",
  );
  const hasActiveDeletion =
    snapshot.deletionRequest?.status === "queued" ||
    snapshot.deletionRequest?.status === "holding";

  function runRequest(
    url: string,
    {
      body,
      method,
      successMessage,
    }: {
      body?: Record<string, unknown>;
      method: "DELETE" | "GET" | "POST";
      successMessage: string;
    },
  ) {
    setError(null);
    setNotice(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        const response = await fetch(url, {
          method,
          cache: "no-store",
          body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
          headers:
            method === "POST"
              ? {
                  "Content-Type": "application/json",
                }
              : undefined,
        });

        const payload = await readJsonSafely(response);

        if (!response.ok || !payload?.data) {
          setError(payload?.message ?? "Не удалось обновить data center.");
          return;
        }

        setSnapshot(payload.data);
        setNotice(successMessage);

        if (body?.action === "request_deletion") {
          setDeletionReason("");
        }
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <section className="card p-6 lg:col-span-2">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Data Center
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Выгрузка данных и удаление аккаунта
          </h2>
        </div>
        <button
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={() =>
            runRequest("/api/settings/data", {
              method: "GET",
              successMessage: "Статусы синхронизированы.",
            })
          }
          type="button"
        >
          {isPending ? "Обновление..." : "Обновить статус"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] border border-border bg-white/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Архив данных
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Полный ZIP-архив с `export.json`, `summary.csv` и CSV-срезами
                по тренировкам, питанию, AI и privacy-данным.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(latestExport?.status ?? "queued")}`}
            >
              {latestExport
                ? getExportStatusLabel(latestExport.status)
                : "нет запросов"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-muted">
            <div className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3">
              <p>Последнее обновление: {formatDateTime(latestExport?.updatedAt)}</p>
              <p className="mt-1">{getExportNextStep(snapshot)}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending || hasActiveExport}
                onClick={() =>
                  runRequest("/api/settings/data", {
                    body: {
                      action: "queue_export",
                    },
                    method: "POST",
                    successMessage: "Запрос на выгрузку поставлен в очередь.",
                  })
                }
                type="button"
              >
                {hasActiveExport ? "Выгрузка уже идет" : "Запросить выгрузку"}
              </button>

              {latestExport?.status === "completed" ? (
                <a
                  className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70"
                  href={`/api/settings/data/export/${latestExport.id}/download`}
                >
                  Скачать ZIP
                </a>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {snapshot.exportJobs.length ? (
              snapshot.exportJobs.map((job) => (
                <div
                  className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3"
                  key={job.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Экспорт {job.id.slice(0, 8)}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(job.status)}`}
                    >
                      {getExportStatusLabel(job.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Создан: {formatDateTime(job.createdAt)}
                  </p>
                  {job.status === "completed" ? (
                    <a
                      className="mt-3 inline-flex rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-white/70"
                      href={`/api/settings/data/export/${job.id}/download`}
                    >
                      Открыть ZIP-архив
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-4 text-sm text-muted">
                Выгрузок пока не было.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-white/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Удаление аккаунта
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                После запроса аккаунт уходит в hold на 14 дней. В этот период
                удаление можно отменить прямо из приложения.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(snapshot.deletionRequest?.status ?? "canceled")}`}
            >
              {snapshot.deletionRequest
                ? getDeletionStatusLabel(snapshot.deletionRequest.status)
                : "не запрошено"}
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
            <p>
              Активный hold до:{" "}
              {formatDateTime(snapshot.deletionRequest?.holdUntil)}
            </p>
            <p className="mt-1">{getDeletionNextStep(snapshot)}</p>
          </div>

          <label className="mt-4 grid gap-2 text-sm text-muted">
            Причина удаления
            <textarea
              className={`${inputClassName} min-h-24 resize-y`}
              onChange={(event) => setDeletionReason(event.target.value)}
              placeholder="Например: хочу полностью удалить все данные из сервиса"
              value={deletionReason}
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending || hasActiveDeletion}
              onClick={() =>
                runRequest("/api/settings/data", {
                  body: {
                    action: "request_deletion",
                    reason: deletionReason.trim() || undefined,
                  },
                  method: "POST",
                  successMessage:
                    "Запрос на удаление отправлен и переведен в hold.",
                })
              }
              type="button"
            >
              {hasActiveDeletion
                ? "Удаление уже ожидает"
                : "Запросить удаление"}
            </button>

            {hasActiveDeletion ? (
              <button
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
                onClick={() =>
                  runRequest("/api/settings/data", {
                    method: "DELETE",
                    successMessage: "Запрос на удаление отменен.",
                  })
                }
                type="button"
              >
                Отменить удаление
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[28px] border border-border bg-white/70 p-5">
        <div className="mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Privacy Timeline
          </p>
          <h3 className="mt-2 text-xl font-semibold text-foreground">
            История export и deletion операций
          </h3>
        </div>

        <div className="grid gap-3">
          {snapshot.privacyEvents.length ? (
            snapshot.privacyEvents.map((event) => (
              <div
                className={`rounded-2xl border px-4 py-3 ${getTimelineTone(event.tone)}`}
                key={event.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                      {getKindLabel(event.kind)}
                    </span>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-foreground">
                      {getActorLabel(event.actorScope)}
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    {formatDateTime(event.createdAt)}
                  </span>
                </div>

                <p className="mt-3 text-sm font-semibold text-foreground">
                  {event.title}
                </p>
                {event.detail ? (
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {event.detail}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-4 text-sm text-muted">
              История privacy-операций пока пустая.
            </div>
          )}
        </div>
      </div>

      {notice ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
