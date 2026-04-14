"use client";

import {
  formatSettingsDataDateTime,
  getDeletionNextStep,
  getDeletionStatusLabel,
  getExportNextStep,
  getExportStatusLabel,
  getSettingsDataActorLabel,
  getSettingsDataKindLabel,
  getSettingsDataStatusTone,
  getSettingsDataTimelineTone,
  settingsDataInputClassName,
} from "@/components/settings-data-center-model";
import { useSettingsDataCenterState } from "@/components/use-settings-data-center-state";
import type { SettingsDataSnapshot } from "@/lib/settings-data";

type SettingsDataCenterProps = {
  initialSnapshot: SettingsDataSnapshot;
};

export function SettingsDataCenter({
  initialSnapshot,
}: SettingsDataCenterProps) {
  const {
    cancelDeletion,
    deletionReason,
    error,
    hasActiveDeletion,
    hasActiveExport,
    isPending,
    latestExport,
    notice,
    queueExport,
    refreshSnapshot,
    requestDeletion,
    setDeletionReason,
    snapshot,
  } = useSettingsDataCenterState(initialSnapshot);

  return (
    <section className="surface-panel p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="workspace-kicker">Управление данными</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Выгрузка данных и удаление аккаунта
          </h2>
        </div>
        <button
          className="action-button action-button--secondary"
          disabled={isPending}
          onClick={refreshSnapshot}
          type="button"
        >
          {isPending ? "Обновление..." : "Обновить статус"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="metric-tile p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Архив данных</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Полный ZIP-архив с export JSON, summary CSV и выгрузками по
                тренировкам, питанию, AI и профилю.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getSettingsDataStatusTone(latestExport?.status ?? "queued")}`}
            >
              {latestExport ? getExportStatusLabel(latestExport.status) : "нет запросов"}
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm text-muted">
            <p>
              Последнее обновление: {formatSettingsDataDateTime(latestExport?.updatedAt)}
            </p>
            <p className="mt-1">{getExportNextStep(snapshot)}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="action-button action-button--primary"
              disabled={isPending || hasActiveExport}
              onClick={queueExport}
              type="button"
            >
              {hasActiveExport ? "Выгрузка уже идет" : "Запросить выгрузку"}
            </button>

            {latestExport?.status === "completed" ? (
              <a
                className="action-button action-button--secondary"
                href={`/api/settings/data/export/${latestExport.id}/download`}
              >
                Скачать ZIP
              </a>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3">
            {snapshot.exportJobs.length ? (
              snapshot.exportJobs.map((job) => (
                <div className="rounded-2xl border border-border bg-background/40 px-4 py-3" key={job.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Экспорт {job.id.slice(0, 8)}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getSettingsDataStatusTone(job.status)}`}
                    >
                      {getExportStatusLabel(job.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Создан: {formatSettingsDataDateTime(job.createdAt)}
                  </p>
                  {job.status === "completed" ? (
                    <a
                      className="action-button action-button--secondary mt-3 inline-flex px-4 py-2 text-xs"
                      href={`/api/settings/data/export/${job.id}/download`}
                    >
                      Открыть архив
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-muted">
                Выгрузок пока не было.
              </div>
            )}
          </div>
        </div>

        <div className="metric-tile p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Удаление аккаунта</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                После запроса аккаунт уходит в hold на 14 дней. До окончания
                hold удаление можно отменить прямо из приложения.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getSettingsDataStatusTone(snapshot.deletionRequest?.status ?? "canceled")}`}
            >
              {snapshot.deletionRequest
                ? getDeletionStatusLabel(snapshot.deletionRequest.status)
                : "не запрошено"}
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm text-muted">
            <p>
              Активный hold до:{" "}
              {formatSettingsDataDateTime(snapshot.deletionRequest?.holdUntil)}
            </p>
            <p className="mt-1">{getDeletionNextStep(snapshot)}</p>
          </div>

          <label className="mt-4 grid gap-2 text-sm text-muted">
            Причина удаления
            <textarea
              className={`${settingsDataInputClassName} min-h-24 resize-y`}
              onChange={(event) => setDeletionReason(event.target.value)}
              placeholder="Например: хочу полностью удалить все данные из сервиса"
              value={deletionReason}
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="action-button action-button--primary"
              disabled={isPending || hasActiveDeletion}
              onClick={requestDeletion}
              type="button"
            >
              {hasActiveDeletion ? "Удаление уже ожидает" : "Запросить удаление"}
            </button>

            {hasActiveDeletion ? (
              <button
                className="action-button action-button--secondary"
                disabled={isPending}
                onClick={cancelDeletion}
                type="button"
              >
                Отменить удаление
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 surface-panel surface-panel--soft p-5">
        <div className="mb-4">
          <p className="workspace-kicker">История операций</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            Выгрузка и удаление
          </h3>
        </div>

        <div className="grid gap-3">
          {snapshot.privacyEvents.length ? (
            snapshot.privacyEvents.map((event) => (
              <div
                className={`rounded-2xl border px-4 py-3 ${getSettingsDataTimelineTone(event.tone)}`}
                key={event.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                      {getSettingsDataKindLabel(event.kind)}
                    </span>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-foreground">
                      {getSettingsDataActorLabel(event.actorScope)}
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    {formatSettingsDataDateTime(event.createdAt)}
                  </span>
                </div>

                <p className="mt-3 text-sm font-semibold text-foreground">{event.title}</p>
                {event.detail ? (
                  <p className="mt-1 text-sm leading-6 text-muted">{event.detail}</p>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-muted">
              История операций с личными данными пока пустая.
            </div>
          )}
        </div>
      </div>

      {notice ? (
        <p className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </section>
  );
}
