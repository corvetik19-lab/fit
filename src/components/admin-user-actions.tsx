"use client";

import { startTransition, useState } from "react";

import {
  canUseRootAdminControls,
  getAdminRoleLabel,
  hasAdminCapability,
  type PlatformAdminRole,
} from "@/lib/admin-permissions";

type AdminUserActionsProps = {
  currentAdminRole: PlatformAdminRole;
  currentUserEmail: string | null;
  userId: string;
  onUpdated: () => void;
};

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

export function AdminUserActions({
  currentAdminRole,
  currentUserEmail,
  userId,
  onUpdated,
}: AdminUserActionsProps) {
  const [reason, setReason] = useState("");
  const [customAction, setCustomAction] = useState("");
  const [exportFormat, setExportFormat] = useState("json_csv_zip");
  const [subscriptionAction, setSubscriptionAction] = useState("grant_trial");
  const [subscriptionDays, setSubscriptionDays] = useState("14");
  const [provider, setProvider] = useState("admin_console");
  const [entitlementAction, setEntitlementAction] =
    useState("enable_entitlement");
  const [featureKey, setFeatureKey] = useState("ai_chat");
  const [limitValue, setLimitValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const canQueueSupportActions = hasAdminCapability(
    currentAdminRole,
    "queue_support_actions",
  );
  const canManageBilling = canUseRootAdminControls(
    currentAdminRole,
    currentUserEmail,
  );

  function submitJsonAction(
    endpoint: string,
    body: Record<string, unknown>,
    successMessage: string,
    method = "POST",
  ) {
    setError(null);
    setNotice(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setError(payload?.message ?? "Не удалось выполнить admin-действие.");
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
          Support, billing и lifecycle операции
        </h2>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-4">
          {!canQueueSupportActions ? (
            <p className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Роль {getAdminRoleLabel(currentAdminRole)} не может менять состояние
              пользователя. Для support actions нужен `support_admin` или
              `super_admin`.
            </p>
          ) : null}

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
              disabled={!canQueueSupportActions || isPending}
              onClick={() =>
                submitJsonAction(
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
              disabled={!canQueueSupportActions || isPending}
              onClick={() =>
                submitJsonAction(
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
              disabled={!canQueueSupportActions || isPending}
              onClick={() =>
                submitJsonAction(
                  `/api/admin/users/${userId}/export`,
                  { format: exportFormat, reason },
                  "Экспорт данных поставлен в очередь.",
                )
              }
              type="button"
            >
              Поставить экспорт в очередь
            </button>

            <button
              className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canQueueSupportActions || isPending}
              onClick={() =>
                submitJsonAction(
                  `/api/admin/users/${userId}/deletion`,
                  { reason },
                  "Deletion request переведён в hold.",
                )
              }
              type="button"
            >
              Поставить deletion на hold
            </button>

            <button
              className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canQueueSupportActions || isPending}
              onClick={() =>
                submitJsonAction(
                  `/api/admin/users/${userId}/deletion`,
                  { reason },
                  "Deletion request отменён.",
                  "DELETE",
                )
              }
              type="button"
            >
              Отменить deletion request
            </button>

            <button
              className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canQueueSupportActions || isPending}
              onClick={() =>
                submitJsonAction(
                  `/api/admin/users/${userId}/support-action`,
                  {
                    action: "resync_user_context",
                    reason,
                    payload: {
                      source: "admin-user-actions",
                    },
                  },
                  "Пересинхронизация поставлена в очередь.",
                )
              }
              type="button"
            >
              Поставить пересинхронизацию в очередь
            </button>
          </div>

          <label className="grid gap-2 text-sm text-muted">
            Формат экспорта
            <select
              className={inputClassName}
              disabled={!canQueueSupportActions || isPending}
              onChange={(event) => setExportFormat(event.target.value)}
              value={exportFormat}
            >
              <option value="json_csv_zip">json_csv_zip</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm text-muted">
            Кастомное действие поддержки
            <input
              className={inputClassName}
              disabled={!canQueueSupportActions || isPending}
              onChange={(event) => setCustomAction(event.target.value)}
              placeholder="Например: recompute_nutrition_summaries"
              type="text"
              value={customAction}
            />
          </label>

          <button
            className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canQueueSupportActions || isPending || !customAction.trim()}
            onClick={() =>
              submitJsonAction(
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

        <div className="rounded-3xl border border-border bg-white/60 p-5">
          <div className="mb-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Billing access
            </p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              Подписка и entitlements
            </h3>
          </div>

          {!canManageBilling ? (
            <p className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Billing и entitlement действия доступны только root super-admin
              `corvetik1@yandex.ru`.
            </p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm text-muted">
                Действие с подпиской
                <select
                  className={inputClassName}
                  disabled={!canManageBilling || isPending}
                  onChange={(event) => setSubscriptionAction(event.target.value)}
                  value={subscriptionAction}
                >
                  <option value="grant_trial">grant_trial</option>
                  <option value="activate_subscription">activate_subscription</option>
                  <option value="mark_past_due">mark_past_due</option>
                  <option value="cancel_subscription">cancel_subscription</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm text-muted">
                Провайдер
                <input
                  className={inputClassName}
                  disabled={!canManageBilling || isPending}
                  onChange={(event) => setProvider(event.target.value)}
                  placeholder="admin_console"
                  type="text"
                  value={provider}
                />
              </label>

              <label className="grid gap-2 text-sm text-muted">
                Период, дней
                <input
                  className={inputClassName}
                  disabled={!canManageBilling || isPending}
                  onChange={(event) => setSubscriptionDays(event.target.value)}
                  placeholder="14"
                  type="number"
                  value={subscriptionDays}
                />
              </label>

              <button
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canManageBilling || isPending}
                onClick={() =>
                  submitJsonAction(
                    `/api/admin/users/${userId}/billing`,
                    {
                      action: subscriptionAction,
                      duration_days: Number(subscriptionDays) || undefined,
                      provider: provider.trim() || undefined,
                      reason,
                    },
                    "Subscription state обновлён.",
                  )
                }
                type="button"
              >
                Обновить подписку
              </button>

              <button
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canManageBilling || isPending}
                onClick={() =>
                  submitJsonAction(
                    `/api/admin/users/${userId}/billing/reconcile`,
                    {},
                    "Stripe subscription state synchronized.",
                  )
                }
                type="button"
              >
                Синхронизировать Stripe
              </button>
            </div>

            <div className="grid gap-3">
              <label className="grid gap-2 text-sm text-muted">
                Действие с entitlement
                <select
                  className={inputClassName}
                  disabled={!canManageBilling || isPending}
                  onChange={(event) => setEntitlementAction(event.target.value)}
                  value={entitlementAction}
                >
                  <option value="enable_entitlement">enable_entitlement</option>
                  <option value="disable_entitlement">disable_entitlement</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm text-muted">
                Feature key
                <input
                  className={inputClassName}
                  disabled={!canManageBilling || isPending}
                  onChange={(event) => setFeatureKey(event.target.value)}
                  placeholder="ai_chat"
                  type="text"
                  value={featureKey}
                />
              </label>

              <label className="grid gap-2 text-sm text-muted">
                Limit value
                <input
                  className={inputClassName}
                  disabled={!canManageBilling || isPending}
                  onChange={(event) => setLimitValue(event.target.value)}
                  placeholder="1000"
                  type="number"
                  value={limitValue}
                />
              </label>

              <button
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canManageBilling || isPending || !featureKey.trim()}
                onClick={() =>
                  submitJsonAction(
                    `/api/admin/users/${userId}/billing`,
                    {
                      action: entitlementAction,
                      feature_key: featureKey.trim(),
                      limit_value:
                        limitValue.trim() === "" ? null : Number(limitValue),
                      reason,
                    },
                    "Entitlement state обновлён.",
                  )
                }
                type="button"
              >
                Обновить entitlement
              </button>
            </div>
          </div>
        </div>
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
