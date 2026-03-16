"use client";

import {
  formatDateTime,
  formatSnakeLabel,
  formatStatus,
  getPayloadString,
  getUserLabel,
  type AdminUserDetailData,
} from "@/components/admin-user-detail-model";
import { EmptyState } from "@/components/admin-user-detail-primitives";

function BillingEntry({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-white/80 px-4 py-3">
      {children}
    </div>
  );
}

export function AdminUserEntitlementsCard({
  detail,
}: {
  detail: AdminUserDetailData;
}) {
  return (
    <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm md:col-span-2">
      <p className="font-semibold text-foreground">Открытые функции</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {detail.stats.lifecycle.recentEntitlements.length ? (
          detail.stats.lifecycle.recentEntitlements.map((entitlement) => (
            <BillingEntry key={entitlement.id}>
              <p className="font-medium text-foreground">
                {formatSnakeLabel(entitlement.feature_key)}
              </p>
              <p className="mt-1 text-muted">
                Статус:{" "}
                <span className="text-foreground">
                  {entitlement.is_enabled ? "включено" : "выключено"}
                </span>
              </p>
              <p className="mt-1 text-muted">
                Лимит:{" "}
                <span className="text-foreground">
                  {entitlement.limit_value ?? "без лимита"}
                </span>
              </p>
              <p className="mt-1 text-muted">
                Обновлено:{" "}
                <span className="text-foreground">
                  {formatDateTime(entitlement.updated_at)}
                </span>
              </p>
            </BillingEntry>
          ))
        ) : (
          <EmptyState>
            Для этого пользователя пока нет настроенных доступов.
          </EmptyState>
        )}
      </div>
    </article>
  );
}

export function AdminUserUsageCountersCard({
  detail,
}: {
  detail: AdminUserDetailData;
}) {
  return (
    <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
      <p className="font-semibold text-foreground">Счётчики использования</p>
      <div className="mt-3 grid gap-3">
        {detail.stats.lifecycle.recentUsageCounters.length ? (
          detail.stats.lifecycle.recentUsageCounters.map((counter) => (
            <BillingEntry key={counter.id}>
              <p className="font-medium text-foreground">
                {formatSnakeLabel(counter.metric_key)}
              </p>
              <p className="mt-1 text-muted">
                Период:{" "}
                <span className="text-foreground">
                  {formatSnakeLabel(counter.metric_window)}
                </span>
              </p>
              <p className="mt-1 text-muted">
                Использовано:{" "}
                <span className="text-foreground">{counter.usage_count}</span>
              </p>
              <p className="mt-1 text-muted">
                Сброс:{" "}
                <span className="text-foreground">
                  {formatDateTime(counter.reset_at)}
                </span>
              </p>
            </BillingEntry>
          ))
        ) : (
          <EmptyState>Счётчики использования пока не созданы.</EmptyState>
        )}
      </div>
    </article>
  );
}

export function AdminUserSubscriptionEventsCard({
  detail,
}: {
  detail: AdminUserDetailData;
}) {
  return (
    <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
      <p className="font-semibold text-foreground">История подписки</p>
      <div className="mt-3 grid gap-3">
        {detail.stats.lifecycle.recentSubscriptionEvents.length ? (
          detail.stats.lifecycle.recentSubscriptionEvents.map((event) => (
            <BillingEntry key={event.id}>
              <p className="font-medium text-foreground">
                {formatSnakeLabel(event.event_type)}
              </p>
              <p className="mt-1 text-muted">
                Когда:{" "}
                <span className="text-foreground">
                  {formatDateTime(event.created_at)}
                </span>
              </p>
              <p className="mt-1 text-muted">
                Кто изменил:{" "}
                <span className="text-foreground">
                  {getUserLabel(event.actor_user, event.actor_user_id)}
                </span>
              </p>
              <p className="mt-1 text-muted">
                Статус:{" "}
                <span className="text-foreground">
                  {formatStatus(getPayloadString(event.payload, "status"))}
                </span>
              </p>
              {getPayloadString(event.payload, "provider") ? (
                <p className="mt-1 text-muted">
                  Провайдер:{" "}
                  <span className="text-foreground">
                    {getPayloadString(event.payload, "provider")}
                  </span>
                </p>
              ) : null}
              {getPayloadString(event.payload, "batchId") ? (
                <p className="mt-1 text-muted">
                  Пакет:{" "}
                  <span className="text-foreground">
                    {getPayloadString(event.payload, "batchId")}
                  </span>
                </p>
              ) : null}
              {getPayloadString(event.payload, "providerSubscriptionId") ? (
                <p className="mt-1 break-all text-muted">
                  ID подписки:{" "}
                  <span className="text-foreground">
                    {getPayloadString(event.payload, "providerSubscriptionId")}
                  </span>
                </p>
              ) : null}
              {getPayloadString(event.payload, "providerCustomerId") ? (
                <p className="mt-1 break-all text-muted">
                  ID клиента:{" "}
                  <span className="text-foreground">
                    {getPayloadString(event.payload, "providerCustomerId")}
                  </span>
                </p>
              ) : null}
              {event.provider_event_id ? (
                <p className="mt-1 break-all text-muted">
                  ID события:{" "}
                  <span className="text-foreground">
                    {event.provider_event_id}
                  </span>
                </p>
              ) : null}
            </BillingEntry>
          ))
        ) : (
          <EmptyState>События по подписке пока не зафиксированы.</EmptyState>
        )}
      </div>
    </article>
  );
}
