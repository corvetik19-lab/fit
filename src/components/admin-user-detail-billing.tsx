"use client";

import {
  formatBillingProvider,
  formatDateTime,
  formatSnakeLabel,
  formatStatus,
  getPayloadString,
  getUserLabel,
  type AdminUserDetailData,
} from "@/components/admin-user-detail-model";
import { EmptyState, KeyValueCard } from "@/components/admin-user-detail-primitives";

function BillingEntry({ children }: { children: React.ReactNode }) {
  return <div className="surface-panel surface-panel--soft px-4 py-3">{children}</div>;
}

export function AdminUserEntitlementsCard({
  detail,
}: {
  detail: AdminUserDetailData;
}) {
  return (
    <article
      className="surface-panel p-4 text-sm md:col-span-2"
      data-testid="admin-user-detail-billing-entitlements-card"
    >
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
          <EmptyState>Для этого пользователя пока нет настроенных доступов.</EmptyState>
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
    <article className="surface-panel p-4 text-sm">
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
                Сброс: <span className="text-foreground">{formatDateTime(counter.reset_at)}</span>
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
    <article
      className="surface-panel p-4 text-sm"
      data-testid="admin-user-detail-billing-history-card"
    >
      <p className="font-semibold text-foreground">История подписки</p>
      <div className="mt-3 grid gap-3">
        {detail.stats.lifecycle.recentSubscriptionEvents.length ? (
          detail.stats.lifecycle.recentSubscriptionEvents.map((event) => (
            <BillingEntry key={event.id}>
              <p className="font-medium text-foreground">
                {formatSnakeLabel(event.event_type)}
              </p>
              <p className="mt-1 text-muted">
                Когда: <span className="text-foreground">{formatDateTime(event.created_at)}</span>
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
                    {formatBillingProvider(getPayloadString(event.payload, "provider"))}
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
                  ID события: <span className="text-foreground">{event.provider_event_id}</span>
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

export function AdminUserBillingSection({
  detail,
}: {
  detail: AdminUserDetailData;
}) {
  return (
    <section className="card p-6" data-testid="admin-user-detail-billing-section">
      <div className="mb-5">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
          Оплата и доступ
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">
          Подписка, лимиты и история доступа
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KeyValueCard
          rows={[
            {
              label: "Статус",
              value: formatStatus(detail.stats.lifecycle.latestSubscription?.status),
            },
            {
              label: "Провайдер",
              value: formatBillingProvider(detail.stats.lifecycle.latestSubscription?.provider),
            },
            {
              label: "Период до",
              value: formatDateTime(
                detail.stats.lifecycle.latestSubscription?.current_period_end,
              ),
            },
            {
              label: "Обновлено",
              value: formatDateTime(detail.stats.lifecycle.latestSubscription?.updated_at),
            },
          ]}
          testId="admin-user-detail-billing-current-subscription-card"
          title="Текущая подписка"
        />

        <KeyValueCard
          rows={[
            {
              label: "Клиент",
              value:
                detail.stats.lifecycle.latestSubscription?.provider_customer_id ??
                "Нет данных",
            },
            {
              label: "Подписка",
              value:
                detail.stats.lifecycle.latestSubscription?.provider_subscription_id ??
                "Нет данных",
            },
            {
              label: "Период с",
              value: formatDateTime(
                detail.stats.lifecycle.latestSubscription?.current_period_start,
              ),
            },
            {
              label: "Способ оплаты",
              value: formatBillingProvider(detail.stats.lifecycle.latestSubscription?.provider),
            },
          ]}
          testId="admin-user-detail-billing-profile-card"
          title="Платёжный профиль"
        />

        <KeyValueCard
          rows={[
            {
              label: "Доступы",
              value: String(detail.stats.lifecycle.entitlements),
            },
            {
              label: "Счётчики использования",
              value: String(detail.stats.lifecycle.usageCounters),
            },
            {
              label: "Выгрузки",
              value: String(detail.stats.lifecycle.exportJobs),
            },
            {
              label: "Удаления",
              value: String(detail.stats.lifecycle.deletionRequests),
            },
          ]}
          title="Доступы и лимиты"
        />

        <AdminUserEntitlementsCard detail={detail} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <AdminUserUsageCountersCard detail={detail} />
        <AdminUserSubscriptionEventsCard detail={detail} />
      </div>
    </section>
  );
}
