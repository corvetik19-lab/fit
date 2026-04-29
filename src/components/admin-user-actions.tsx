"use client";

import { startTransition, useState } from "react";

import {
  canUseRootAdminControls,
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
  "w-full rounded-2xl border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_92%,var(--surface))] px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

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
  const [provider, setProvider] = useState("admin_trial");
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
  const usesSubscriptionDuration =
    subscriptionAction === "grant_trial" ||
    subscriptionAction === "activate_subscription";
  const parsedSubscriptionDays = Number(subscriptionDays);
  const isSubscriptionDaysInvalid =
    usesSubscriptionDuration &&
    (!Number.isInteger(parsedSubscriptionDays) ||
      parsedSubscriptionDays < 1 ||
      parsedSubscriptionDays > 365);

  function handleSubscriptionActionChange(nextAction: string) {
    setSubscriptionAction(nextAction);

    if (nextAction === "grant_trial" && provider.trim() === "admin_console") {
      setProvider("admin_trial");
    }

    if (
      nextAction === "activate_subscription" &&
      provider.trim() === "admin_trial"
    ) {
      setProvider("admin_console");
    }
  }

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
          setError(payload?.message ?? "Не удалось выполнить действие.");
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
    <section className="surface-panel p-4 sm:p-5">
      <div className="mb-4">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
          Действия
        </p>
        <h2 className="mt-1.5 text-lg font-semibold text-foreground">
          Поддержка, данные и доступы
        </h2>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4">
          {!canQueueSupportActions ? (
            <p className="rounded-2xl border border-amber-500/25 bg-amber-500/12 px-4 py-3 text-sm text-amber-900">
              Для этого аккаунта доступен только просмотр этого блока.
            </p>
          ) : null}

          <label className="grid gap-2 text-sm text-muted">
            Комментарий
            <textarea
              className={`${inputClassName} min-h-24 resize-y`}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Например: запрос пользователя или ручная проверка"
              value={reason}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="action-button action-button--primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canQueueSupportActions || isPending}
              onClick={() =>
                submitJsonAction(
                  `/api/admin/users/${userId}/suspend`,
                  { reason },
                  "Ограничение доступа поставлено в очередь.",
                )
              }
              type="button"
            >
              Ограничить доступ
            </button>

            <button
              className="action-button action-button--secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canQueueSupportActions || isPending}
              onClick={() =>
                submitJsonAction(
                  `/api/admin/users/${userId}/restore`,
                  { reason },
                  "Восстановление доступа поставлено в очередь.",
                )
              }
              type="button"
            >
              Восстановить доступ
            </button>

            <button
              className="action-button action-button--secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canQueueSupportActions || isPending}
              onClick={() =>
                submitJsonAction(
                  `/api/admin/users/${userId}/export`,
                  { format: exportFormat, reason },
                  "Выгрузка данных поставлена в очередь.",
                )
              }
              type="button"
            >
              Запросить выгрузку
            </button>

            <button
              className="action-button action-button--secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canQueueSupportActions || isPending}
              onClick={() =>
                submitJsonAction(
                  `/api/admin/users/${userId}/deletion`,
                  { reason },
                  "Запрос на удаление переведён на удержание.",
                )
              }
              type="button"
            >
              Запросить удаление
            </button>

            <button
              className="action-button action-button--secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canQueueSupportActions || isPending}
              onClick={() =>
                submitJsonAction(
                  `/api/admin/users/${userId}/deletion`,
                  { reason },
                  "Запрос на удаление отменён.",
                  "DELETE",
                )
              }
              type="button"
            >
              Отменить удаление
            </button>

            <button
              className="action-button action-button--secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
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
                  "Данные пользователя поставлены на обновление.",
                )
              }
              type="button"
            >
              Обновить данные пользователя
            </button>
          </div>

          <label className="grid gap-2 text-sm text-muted">
            Формат выгрузки
            <select
              className={inputClassName}
              disabled={!canQueueSupportActions || isPending}
              onChange={(event) => setExportFormat(event.target.value)}
              value={exportFormat}
            >
              <option value="json_csv_zip">Архив с данными</option>
            </select>
          </label>

          {canManageBilling ? (
            <>
              <label className="grid gap-2 text-sm text-muted">
                Дополнительная команда
                <input
                  className={inputClassName}
                  disabled={isPending}
                  onChange={(event) => setCustomAction(event.target.value)}
                  placeholder="Например: recompute_nutrition_summaries"
                  type="text"
                  value={customAction}
                />
              </label>

              <button
                className="action-button action-button--secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending || !customAction.trim()}
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
                    "Дополнительная команда поставлена в очередь.",
                  )
                }
                type="button"
              >
                {isPending ? "Обрабатываю..." : "Запустить команду"}
              </button>
            </>
          ) : null}
        </div>

        <div
          className="surface-panel p-5"
          data-testid="admin-user-actions-billing-panel"
        >
          <div className="mb-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Оплата и доступ
            </p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              Подписка и открытые функции
            </h3>
          </div>

          {!canManageBilling ? (
            <p className="rounded-2xl border border-amber-500/25 bg-amber-500/12 px-4 py-3 text-sm text-amber-900">
              Управление оплатой и доступами доступно только корневому администратору.
            </p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm text-muted">
                Действие с подпиской
                <select
                  className={inputClassName}
                  data-testid="admin-user-actions-subscription-action"
                  disabled={!canManageBilling || isPending}
                  onChange={(event) =>
                    handleSubscriptionActionChange(event.target.value)
                  }
                  value={subscriptionAction}
                >
                  <option value="grant_trial">
                    Выдать / продлить тестовый доступ
                  </option>
                  <option value="activate_subscription">Включить подписку</option>
                  <option value="mark_past_due">Отметить как неоплаченную</option>
                  <option value="cancel_subscription">Отменить подписку</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm text-muted">
                Источник
                <input
                  className={inputClassName}
                  disabled={!canManageBilling || isPending}
                  onChange={(event) => setProvider(event.target.value)}
                  placeholder="admin_trial"
                  type="text"
                  value={provider}
                />
                <span className="text-xs leading-5 text-muted">
                  Для тестового доступа используй `admin_trial`; для ручной подписки -
                  `admin_console`.
                </span>
              </label>

              <label className="grid gap-2 text-sm text-muted">
                Дней добавить
                <input
                  className={inputClassName}
                  disabled={
                    !canManageBilling || isPending || !usesSubscriptionDuration
                  }
                  max={365}
                  min={1}
                  onChange={(event) => setSubscriptionDays(event.target.value)}
                  placeholder="14"
                  step={1}
                  type="number"
                  value={subscriptionDays}
                />
                <span className="text-xs leading-5 text-muted">
                  Повторная выдача тестового доступа добавит дни к текущей будущей
                  дате окончания.
                </span>
              </label>

              <button
                className="action-button action-button--secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                data-testid="admin-user-actions-billing-reconcile"
                disabled={
                  !canManageBilling || isPending || isSubscriptionDaysInvalid
                }
                onClick={() =>
                  submitJsonAction(
                    `/api/admin/users/${userId}/billing`,
                    {
                      action: subscriptionAction,
                      duration_days: usesSubscriptionDuration
                        ? parsedSubscriptionDays
                        : undefined,
                      provider: provider.trim() || undefined,
                      reason,
                    },
                    "Состояние подписки обновлено.",
                  )
                }
                type="button"
              >
                Сохранить подписку
              </button>

              <button
                className="action-button action-button--secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canManageBilling || isPending}
                onClick={() =>
                  submitJsonAction(
                    `/api/admin/users/${userId}/billing/reconcile`,
                    {},
                    "Состояние оплаты синхронизировано.",
                  )
                }
                type="button"
              >
                Сверить оплату
              </button>
            </div>

            <div className="grid gap-3">
              <label className="grid gap-2 text-sm text-muted">
                Действие с доступом
                <select
                  className={inputClassName}
                  disabled={!canManageBilling || isPending}
                  onChange={(event) => setEntitlementAction(event.target.value)}
                  value={entitlementAction}
                >
                  <option value="enable_entitlement">Открыть функцию</option>
                  <option value="disable_entitlement">Закрыть функцию</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm text-muted">
                Код функции
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
                Лимит
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
                className="action-button action-button--secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
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
                    "Доступ к функции обновлён.",
                  )
                }
                type="button"
              >
                Сохранить доступ
              </button>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/12 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-900">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
