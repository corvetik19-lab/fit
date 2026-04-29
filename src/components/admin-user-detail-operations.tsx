"use client";

import {
  formatAuditAction,
  formatDateTime,
  formatSnakeLabel,
  formatStatus,
  formatSupportAction,
  getPayloadBoolean,
  getPayloadString,
  getPayloadStringList,
  getUserLabel,
  type AdminUserDetailData,
} from "@/components/admin-user-detail-model";
import { EmptyState } from "@/components/admin-user-detail-primitives";

function TimelineCard({
  children,
  count,
  description,
  title,
}: {
  children: React.ReactNode;
  count: number;
  description: string;
  title: string;
}) {
  return (
    <article className="surface-panel p-4 text-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted">{description}</p>
        </div>
        <div className="pill">{count}</div>
      </div>
      <div className="grid gap-3">{children}</div>
    </article>
  );
}

function TimelineEntry({ children }: { children: React.ReactNode }) {
  return (
    <div className="surface-panel surface-panel--soft px-4 py-3">
      {children}
    </div>
  );
}

export function AdminUserExportHistoryCard({
  detail,
}: {
  detail: AdminUserDetailData;
}) {
  return (
    <TimelineCard
      count={detail.recentExportJobs.length}
      description="Последние выгрузки данных и их текущий статус."
      title="История выгрузок"
    >
      {detail.recentExportJobs.length ? (
        detail.recentExportJobs.map((job) => (
          <TimelineEntry key={job.id}>
              <p className="font-medium text-foreground">
                {job.format} • {formatStatus(job.status)}
              </p>
            <p className="mt-1 text-muted">
              Запросил:{" "}
              <span className="text-foreground">
                {getUserLabel(job.requested_by_user, job.requested_by)}
              </span>
            </p>
            <p className="mt-1 text-muted">
              Создано:{" "}
              <span className="text-foreground">
                {formatDateTime(job.created_at)}
              </span>
            </p>
            <p className="mt-1 text-muted">
              Обновлено:{" "}
              <span className="text-foreground">
                {formatDateTime(job.updated_at)}
              </span>
            </p>
            {job.artifact_path ? (
              <p className="mt-1 break-all text-muted">
                Файл: <span className="text-foreground">{job.artifact_path}</span>
              </p>
            ) : null}
          </TimelineEntry>
        ))
      ) : (
        <EmptyState>Экспортов по этому пользователю пока не было.</EmptyState>
      )}
    </TimelineCard>
  );
}

export function AdminUserSupportActionsCard({
  detail,
}: {
  detail: AdminUserDetailData;
}) {
  return (
    <TimelineCard
      count={detail.recentSupportActions.length}
      description="Очередь, решения и комментарии по ручным служебным действиям."
      title="Служебные действия"
    >
      {detail.recentSupportActions.length ? (
        detail.recentSupportActions.map((action) => {
          const resolutionNote = getPayloadString(
            action.payload,
            "resolutionNote",
          );
          const resolvedAt = getPayloadString(action.payload, "resolvedAt");

          return (
            <TimelineEntry key={action.id}>
              <p className="font-medium text-foreground">
                {formatSupportAction(action.action)}
              </p>
              <p className="mt-1 text-muted">
                Статус:{" "}
                <span className="text-foreground">
                  {formatStatus(action.status)}
                </span>
              </p>
              <p className="mt-1 text-muted">
                Инициатор:{" "}
                <span className="text-foreground">
                  {getUserLabel(action.actor_user, action.actor_user_id)}
                </span>
              </p>
              {action.resolved_by_user ? (
                <p className="mt-1 text-muted">
                  Закрыл:{" "}
                  <span className="text-foreground">
                    {getUserLabel(action.resolved_by_user)}
                  </span>
                </p>
              ) : null}
              {resolutionNote ? (
                <p className="mt-1 text-muted">
                  Комментарий:{" "}
                  <span className="text-foreground">{resolutionNote}</span>
                </p>
              ) : null}
              <p className="mt-1 text-muted">
                Создано:{" "}
                <span className="text-foreground">
                  {formatDateTime(action.created_at)}
                </span>
              </p>
              <p className="mt-1 text-muted">
                Обновлено:{" "}
                <span className="text-foreground">
                  {formatDateTime(action.updated_at)}
                </span>
              </p>
              {resolvedAt ? (
                <p className="mt-1 text-muted">
                  Решено:{" "}
                  <span className="text-foreground">
                    {formatDateTime(resolvedAt)}
                  </span>
                </p>
              ) : null}
            </TimelineEntry>
          );
        })
      ) : (
        <EmptyState>
          Для этого пользователя пока не запускались служебные действия.
        </EmptyState>
      )}
    </TimelineCard>
  );
}

export function AdminUserOperationAuditSection({
  detail,
}: {
  detail: AdminUserDetailData;
}) {
  return (
    <section className="surface-panel p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            История операций
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-foreground">
            Выгрузка данных и удаление аккаунта
          </h2>
        </div>
        <div className="pill">{detail.recentOperationAuditLogs.length}</div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {detail.recentOperationAuditLogs.length ? (
          detail.recentOperationAuditLogs.map((entry) => {
            const fromStatus = getPayloadString(entry.payload, "fromStatus");
            const toStatus = getPayloadString(entry.payload, "toStatus");
            const holdUntil = getPayloadString(entry.payload, "holdUntil");
            const format = getPayloadString(entry.payload, "format");
            const note = getPayloadString(entry.payload, "note");

            return (
              <article
                className="surface-panel p-4 text-sm"
                key={entry.id}
              >
                <p className="font-semibold text-foreground">
                  {formatAuditAction(entry.action)}
                </p>
                <p className="mt-1 text-muted">
                  Оператор:{" "}
                  <span className="text-foreground">
                    {getUserLabel(entry.actor_user, entry.actor_user_id)}
                  </span>
                </p>
                <p className="mt-1 text-muted">
                  Когда:{" "}
                  <span className="text-foreground">
                    {formatDateTime(entry.created_at)}
                  </span>
                </p>
                {fromStatus || toStatus ? (
                  <p className="mt-1 text-muted">
                    Переход:{" "}
                    <span className="text-foreground">
                      {formatStatus(fromStatus)}
                      {" -> "}
                      {formatStatus(toStatus)}
                    </span>
                  </p>
                ) : null}
                {format ? (
                  <p className="mt-1 text-muted">
                    Формат: <span className="text-foreground">{format}</span>
                  </p>
                ) : null}
                {holdUntil ? (
                  <p className="mt-1 text-muted">
                    Удержание до:{" "}
                    <span className="text-foreground">
                      {formatDateTime(holdUntil)}
                    </span>
                  </p>
                ) : null}
                <p className="mt-1 text-muted">
                  Причина:{" "}
                  <span className="text-foreground">
                    {entry.reason ?? "Без пояснения"}
                  </span>
                </p>
                {note ? (
                  <p className="mt-1 text-muted">
                    Комментарий: <span className="text-foreground">{note}</span>
                  </p>
                ) : null}
              </article>
            );
          })
        ) : (
          <EmptyState>
            История выгрузок и удаления для этого пользователя пока пуста.
          </EmptyState>
        )}
      </div>
    </section>
  );
}

export function AdminUserAdminAuditSection({
  detail,
}: {
  detail: AdminUserDetailData;
}) {
  return (
    <section className="surface-panel p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Аудит
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-foreground">
            Последние административные изменения
          </h2>
        </div>
        <div className="pill">{detail.recentAdminAuditLogs.length}</div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {detail.recentAdminAuditLogs.length ? (
          detail.recentAdminAuditLogs.map((entry) => (
            <article
              className="surface-panel p-4 text-sm"
              key={entry.id}
            >
              <p className="font-semibold text-foreground">
                {formatAuditAction(entry.action)}
              </p>
              <p className="mt-1 text-muted">
                Оператор:{" "}
                <span className="text-foreground">
                  {getUserLabel(entry.actor_user, entry.actor_user_id)}
                </span>
              </p>
              <p className="mt-1 text-muted">
                Причина:{" "}
                <span className="text-foreground">
                  {entry.reason ?? "Без пояснения"}
                </span>
              </p>
              <p className="mt-1 text-muted">
                Когда:{" "}
                <span className="text-foreground">
                  {formatDateTime(entry.created_at)}
                </span>
              </p>
              {getPayloadStringList(entry.payload, "requestedFeatures").length ? (
                <p className="mt-1 text-muted">
                  Запрошенные функции:{" "}
                  <span className="text-foreground">
                    {getPayloadStringList(entry.payload, "requestedFeatures")
                      .map(formatSnakeLabel)
                      .join(", ")}
                  </span>
                </p>
              ) : null}
              {getPayloadString(entry.payload, "paymentStatus") ? (
                <p className="mt-1 text-muted">
                  Статус оплаты:{" "}
                  <span className="text-foreground">
                    {getPayloadString(entry.payload, "paymentStatus")}
                  </span>
                </p>
              ) : null}
              {getPayloadString(entry.payload, "sessionStatus") ? (
                <p className="mt-1 text-muted">
                  Статус сессии:{" "}
                  <span className="text-foreground">
                    {getPayloadString(entry.payload, "sessionStatus")}
                  </span>
                </p>
              ) : null}
              {getPayloadBoolean(entry.payload, "reconciled") !== null ? (
                <p className="mt-1 text-muted">
                  Синхронизировано:{" "}
                  <span className="text-foreground">
                    {getPayloadBoolean(entry.payload, "reconciled") ? "да" : "нет"}
                  </span>
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <EmptyState>
            Для этого пользователя пока нет административных изменений и смен
            ролей.
          </EmptyState>
        )}
      </div>
    </section>
  );
}
