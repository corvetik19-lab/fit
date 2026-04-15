"use client";

import {
  formatAccessSource,
  formatActorScope,
  formatBillingManagementLabel,
  formatBillingPaymentStatus,
  formatBillingSessionStatus,
  formatEventKind,
  formatFeatureKey,
  formatReviewStatus,
  formatSettingsDateTime,
  formatSubscriptionProvider,
  formatSubscriptionStatus,
  formatUsageLimit,
  getStatusTone,
  getTimelineTone,
  settingsBillingInputClassName,
} from "@/components/settings-billing-center-model";
import { useSettingsBillingCenterState } from "@/components/use-settings-billing-center-state";
import type { BillingProvider } from "@/lib/billing-provider";
import type { UserBillingAccessSnapshot } from "@/lib/billing-access";
import type { SettingsDataSnapshot } from "@/lib/settings-data";

type SettingsBillingCenterProps = {
  access: UserBillingAccessSnapshot;
  billing: {
    checkoutReady: boolean;
    managementReady: boolean;
    provider: BillingProvider;
  };
  initialSnapshot: SettingsDataSnapshot;
};

export function SettingsBillingCenter({
  access: initialAccess,
  billing,
  initialSnapshot,
}: SettingsBillingCenterProps) {
  const {
    access,
    activeReviewRequest,
    billingReturnNotice,
    blockedFeatures,
    checkoutRetriesRemaining,
    checkoutRetryEnabled,
    checkoutReturn,
    error,
    featureCards,
    isCheckoutReturnSyncing,
    isPending,
    isPrivilegedAccess,
    note,
    notice,
    refreshBilling,
    requestAccessReview,
    retryCheckoutSync,
    selectedFeatures,
    setNote,
    snapshot,
    startBillingFlow,
    toggleFeature,
  } = useSettingsBillingCenterState({
    billingProvider: billing.provider,
    initialAccess,
    initialSnapshot,
  });

  return (
    <section className="surface-panel p-4 sm:p-5" id="billing-center">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="workspace-kicker">Доступ и оплата</p>
          <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Подписка, AI-функции и история доступа
          </h2>
        </div>
        <button
          className="action-button action-button--secondary"
          disabled={isPending}
          onClick={refreshBilling}
          type="button"
        >
          {isPending ? "Обновляю..." : "Обновить"}
        </button>
      </div>

      {billingReturnNotice ? (
        <div
          className={`mb-4 rounded-[1.05rem] border px-3.5 py-3.5 text-sm ${
            billingReturnNotice.tone === "success"
              ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-100"
              : "border-amber-400/30 bg-amber-500/10 text-amber-100"
          }`}
        >
          <p className="font-semibold">{billingReturnNotice.title}</p>
          <p className="mt-1 leading-6">{billingReturnNotice.detail}</p>

          {checkoutReturn ? (
            <div className="mt-3 grid gap-1 text-xs">
              <p>
                Статус оплаты:{" "}
                <span className="font-semibold">
                  {formatBillingSessionStatus(checkoutReturn.sessionStatus)}
                </span>
              </p>
              <p>
                Платеж:{" "}
                <span className="font-semibold">
                  {formatBillingPaymentStatus(checkoutReturn.paymentStatus)}
                </span>
              </p>
              <p>
                Обновление доступа:{" "}
                <span className="font-semibold">
                  {checkoutReturn.reconciled
                    ? "подтверждено"
                    : isCheckoutReturnSyncing
                      ? "проверяю сейчас"
                      : checkoutRetryEnabled
                        ? `попыток осталось: ${checkoutRetriesRemaining}`
                        : "нужна ручная проверка"}
                </span>
              </p>
            </div>
          ) : null}

          {checkoutReturn && !checkoutReturn.reconciled ? (
            <button
              className="action-button action-button--secondary mt-3"
              disabled={isPending || isCheckoutReturnSyncing}
              onClick={retryCheckoutSync}
              type="button"
            >
              {isCheckoutReturnSyncing
                ? "Проверяю оплату..."
                : "Проверить оплату еще раз"}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3.5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-3.5">
          <article className="metric-tile p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Текущий план</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Здесь видно состояние подписки, источник доступа и лимиты по
                  AI-функциям без лишних переходов.
                </p>
              </div>
              <span className="pill">
                {isPrivilegedAccess
                  ? "корневой доступ"
                  : access.subscription.isActive
                    ? "активен"
                    : "без подписки"}
              </span>
            </div>

            <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm text-muted">
                <p>
                  Статус:{" "}
                  <span className="text-foreground">
                    {formatSubscriptionStatus(
                      access.subscription.status,
                      isPrivilegedAccess,
                    )}
                  </span>
                </p>
                <p className="mt-1">
                  Провайдер:{" "}
                  <span className="text-foreground">
                    {formatSubscriptionProvider(
                      access.subscription.provider,
                      isPrivilegedAccess,
                    )}
                  </span>
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm text-muted">
                <p>
                  Период до:{" "}
                  <span className="text-foreground">
                    {formatSettingsDateTime(access.subscription.currentPeriodEnd)}
                  </span>
                </p>
                <p className="mt-1">
                  Обновлено:{" "}
                  <span className="text-foreground">
                    {formatSettingsDateTime(access.subscription.updatedAt)}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-2.5">
              {isPrivilegedAccess ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-100">
                  Для корневого администратора все AI и premium-функции открыты
                  постоянно и не зависят от подписки.
                </div>
              ) : access.subscription.isActive ? (
                billing.managementReady ? (
                  <button
                    className="action-button action-button--primary"
                    disabled={isPending}
                    onClick={() =>
                      startBillingFlow(
                        "/api/billing/portal",
                        "Открываю управление подпиской...",
                      )
                    }
                    type="button"
                  >
                    {formatBillingManagementLabel(billing.provider)}
                  </button>
                ) : (
                  <span className="rounded-2xl border border-border px-4 py-3 text-xs font-semibold text-muted">
                    Управление подпиской пока остается внутри fit и через поддержку.
                  </span>
                )
              ) : (
                <button
                  className="action-button action-button--primary"
                  disabled={!billing.checkoutReady || isPending}
                  onClick={() =>
                    startBillingFlow("/api/billing/checkout", "Открываю оплату...")
                  }
                  type="button"
                >
                  Оформить подписку
                </button>
              )}

              {!isPrivilegedAccess && !access.subscription.isActive ? (
                <span className="rounded-2xl border border-border px-4 py-3 text-xs font-semibold text-muted">
                  Расширенный доступ нужен для AI-плана питания, AI-плана
                  тренировок и анализа фото еды.
                </span>
              ) : null}
            </div>

            {!isPrivilegedAccess &&
            (!billing.checkoutReady ||
              (access.subscription.isActive && !billing.managementReady)) ? (
              <div className="mt-3.5 rounded-[1rem] border border-amber-400/30 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-100">
                Платежный модуль еще не настроен полностью. Часть действий по
                подписке может быть временно недоступна.
              </div>
            ) : null}
          </article>

          <article className="surface-panel surface-panel--soft p-4">
            <div className="mb-3.5">
              <p className="workspace-kicker">Функции</p>
              <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground">
                Что доступно по текущему плану
              </h3>
            </div>

            <div className="grid gap-2.5">
              {featureCards.map((feature) => (
                <article className="metric-tile p-3.5 text-sm" key={feature.featureKey}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{feature.label}</p>
                      <p className="mt-1 leading-6 text-muted">{feature.description}</p>
                    </div>
                    <span className="pill">
                      {feature.allowed ? "доступно" : "закрыто"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-1 text-muted">
                    <p>Источник доступа: {formatAccessSource(feature.source)}</p>
                    <p>
                      Использовано: {feature.usage.count}
                      {` / ${formatUsageLimit(feature.usage.limit)}`}
                    </p>
                    <p>
                      Следующий сброс лимита:{" "}
                      {formatSettingsDateTime(feature.usage.resetAt)}
                    </p>
                    {feature.reason ? (
                      <p className="text-amber-200">{feature.reason}</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>

        <div className="grid gap-3.5">
          <article className="metric-tile p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Запросить доступ</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Если функция закрыта, можно отправить запрос на ручную
                  проверку доступа.
                </p>
              </div>
              {activeReviewRequest ? (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(activeReviewRequest.status)}`}>
                  {formatReviewStatus(activeReviewRequest.status)}
                </span>
              ) : null}
            </div>

            {activeReviewRequest ? (
              <div className="mt-3.5 rounded-2xl border border-border bg-background/40 px-3.5 py-3 text-sm text-muted">
                <p>
                  Последний запрос:{" "}
                  <span className="text-foreground">
                    {formatSettingsDateTime(activeReviewRequest.createdAt)}
                  </span>
                </p>
                <p className="mt-1">
                  Функции:{" "}
                  <span className="text-foreground">
                    {activeReviewRequest.requestedFeatures
                      .map(formatFeatureKey)
                      .join(", ") || "не указаны"}
                  </span>
                </p>
                {activeReviewRequest.note ? (
                  <p className="mt-1 text-foreground">{activeReviewRequest.note}</p>
                ) : null}
              </div>
            ) : blockedFeatures.length ? (
              <>
                <div className="mt-3.5 grid gap-2.5">
                  {blockedFeatures.map((feature) => {
                    const checked = selectedFeatures.includes(feature.featureKey);

                    return (
                      <label
                        className="metric-tile flex items-start gap-3 p-4 text-sm text-muted"
                        key={feature.featureKey}
                      >
                        <input
                          checked={checked}
                          className="mt-1 h-4 w-4 rounded border-border bg-background text-accent"
                          onChange={() => toggleFeature(feature.featureKey)}
                          type="checkbox"
                        />
                        <span>
                          <span className="block font-semibold text-foreground">
                            {feature.label}
                          </span>
                          <span className="mt-1 block leading-6">
                            {feature.reason ?? feature.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                <label className="mt-3.5 grid gap-2 text-sm text-muted">
                  Комментарий
                  <textarea
                    className={`${settingsBillingInputClassName} min-h-24 resize-y`}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Например: нужен доступ к AI-плану тренировок для следующей недели"
                    value={note}
                  />
                </label>

                <button
                  className="action-button action-button--primary mt-4"
                  disabled={
                    isPending ||
                    selectedFeatures.length === 0 ||
                    Boolean(activeReviewRequest)
                  }
                  onClick={requestAccessReview}
                  type="button"
                >
                  Отправить запрос на доступ
                </button>
              </>
            ) : (
              <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-100">
                Сейчас все AI-функции доступны по твоему текущему плану.
              </div>
            )}
          </article>

          <article className="metric-tile p-4">
            <div className="mb-3.5">
              <p className="text-sm font-semibold text-foreground">История доступа</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Здесь видны изменения подписки, ручных доступов и твоих запросов.
              </p>
            </div>

            <div className="grid gap-3">
              {snapshot.billingEvents.length ? (
                snapshot.billingEvents.map((event) => (
                  <div
                    className={`rounded-2xl border px-4 py-3 ${getTimelineTone(event.tone)}`}
                    key={event.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                          {formatEventKind(event.kind)}
                        </span>
                        <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-foreground">
                          {formatActorScope(event.actorScope)}
                        </span>
                      </div>
                      <span className="text-xs text-muted">
                        {formatSettingsDateTime(event.createdAt)}
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
                <div className="rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-muted">
                  История доступа пока пустая.
                </div>
              )}
            </div>
          </article>
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
