"use client";

import { useSearchParams } from "next/navigation";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";

import {
  CHECKOUT_RETURN_RETRY_DELAYS_MS,
  formatAccessSource,
  formatActorScope,
  formatEventKind,
  formatFeatureKey,
  formatReviewStatus,
  formatSettingsDateTime,
  formatStripePaymentStatus,
  formatStripeSessionStatus,
  formatSubscriptionProvider,
  formatSubscriptionStatus,
  getStatusTone,
  getTimelineTone,
  settingsBillingInputClassName,
} from "@/components/settings-billing-center-model";
import type { UserBillingAccessSnapshot } from "@/lib/billing-access";
import type { SettingsDataSnapshot } from "@/lib/settings-data";

type SettingsBillingCenterProps = {
  access: UserBillingAccessSnapshot;
  initialSnapshot: SettingsDataSnapshot;
  stripe: {
    checkoutReady: boolean;
    portalReady: boolean;
  };
};

type SettingsBillingCenterResponseData = {
  access: UserBillingAccessSnapshot;
  checkoutReturn?: {
    checkoutSessionId: string;
    paymentStatus: string | null;
    reconciled: boolean;
    sessionStatus: string | null;
  } | null;
  snapshot: SettingsDataSnapshot;
};

type BillingReturnNotice = {
  detail: string;
  title: string;
  tone: "success" | "warning";
};

async function readJsonSafely(response: Response) {
  return (await response.json().catch(() => null)) as
    | { data?: SettingsBillingCenterResponseData; message?: string }
    | null;
}

export function SettingsBillingCenter({
  access: initialAccess,
  initialSnapshot,
  stripe,
}: SettingsBillingCenterProps) {
  const searchParams = useSearchParams();
  const [accessState, setAccessState] = useState(initialAccess);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [billingReturnNotice, setBillingReturnNotice] =
    useState<BillingReturnNotice | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isCheckoutReturnSyncing, setIsCheckoutReturnSyncing] = useState(false);
  const [hasHandledReturnState, setHasHandledReturnState] = useState(false);
  const [checkoutRetryAttempt, setCheckoutRetryAttempt] = useState(0);
  const [checkoutReturn, setCheckoutReturn] = useState<
    SettingsBillingCenterResponseData["checkoutReturn"]
  >(null);
  const featureCards = useMemo(
    () => Object.values(accessState.features),
    [accessState.features],
  );
  const blockedFeatures = useMemo(
    () => featureCards.filter((feature) => !feature.allowed),
    [featureCards],
  );
  const blockedFeatureKeys = useMemo(
    () => blockedFeatures.map((feature) => feature.featureKey),
    [blockedFeatures],
  );
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    blockedFeatureKeys,
  );
  const access = accessState;
  const billingReturnState = searchParams.get("billing");
  const checkoutSessionId = searchParams.get("session_id");
  const [returnSessionId, setReturnSessionId] = useState(checkoutSessionId);
  const checkoutRetriesRemaining =
    returnSessionId && checkoutReturn && !checkoutReturn.reconciled
      ? Math.max(
          CHECKOUT_RETURN_RETRY_DELAYS_MS.length - checkoutRetryAttempt,
          0,
        )
      : 0;
  const checkoutRetryEnabled = checkoutRetriesRemaining > 0;
  const isPrivilegedAccess = access.subscription.isPrivilegedAccess;

  const applyBillingCenterData = useCallback(
    (data: SettingsBillingCenterResponseData, successMessage?: string) => {
      setAccessState(data.access);
      setCheckoutReturn(data.checkoutReturn ?? null);
      setSnapshot(data.snapshot);

      if (successMessage) {
        setNotice(successMessage);
      }

      if (data.checkoutReturn?.reconciled) {
        setCheckoutRetryAttempt(CHECKOUT_RETURN_RETRY_DELAYS_MS.length);
      }

      if (data.checkoutReturn) {
        setBillingReturnNotice(
          data.checkoutReturn.reconciled
            ? {
                detail:
                  "Оплата подтверждена. Обновлённые функции уже отмечены в карточках ниже.",
                title: "Оплата прошла успешно",
                tone: "success",
              }
            : {
                detail:
                  "Платёж найден, но доступ ещё обновляется. Экран сам повторит проверку ещё несколько раз.",
                title: "Обновляю доступ",
                tone: "warning",
              },
        );
      }
    },
    [],
  );

  const reconcileCheckoutReturn = useCallback(
    (
      sessionId: string,
      {
        background = false,
        successMessage,
      }: {
        background?: boolean;
        successMessage?: string;
      } = {},
    ) => {
      setError(null);

      if (background) {
        setIsCheckoutReturnSyncing(true);
      } else {
        setNotice(null);
        setIsPending(true);
      }

      startTransition(async () => {
        try {
          const response = await fetch("/api/billing/checkout/reconcile", {
            method: "POST",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessionId,
            }),
          });
          const payload = await readJsonSafely(response);

          if (!response.ok || !payload?.data) {
            setError(
              payload?.message ?? "Не удалось обновить доступ после оплаты.",
            );
            return;
          }

          applyBillingCenterData(payload.data, successMessage);
        } finally {
          if (background) {
            setIsCheckoutReturnSyncing(false);
          } else {
            setIsPending(false);
          }
        }
      });
    },
    [applyBillingCenterData],
  );

  const runRequest = useCallback(
    (
      url: string,
      {
        body,
        method,
        successMessage,
      }: {
        body?: Record<string, unknown>;
        method: "GET" | "POST";
        successMessage: string;
      },
    ) => {
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
          setError(payload?.message ?? "Не удалось обновить данные по подписке.");
          return;
        }

          applyBillingCenterData(payload.data, successMessage);

          if (method === "POST") {
            setNote("");
          }
        } finally {
          setIsPending(false);
        }
      });
    },
    [applyBillingCenterData],
  );

  useEffect(() => {
    const blockedFeatureKeySet = new Set<string>(blockedFeatureKeys);

    setSelectedFeatures((current) => {
      const next = current.filter((featureKey) => blockedFeatureKeySet.has(featureKey));
      const fallback = next.length ? next : blockedFeatureKeys;

      if (
        current.length === fallback.length &&
        current.every((featureKey, index) => featureKey === fallback[index])
      ) {
        return current;
      }

      return fallback;
    });
  }, [blockedFeatureKeys]);

  useEffect(() => {
    if (!billingReturnState || hasHandledReturnState) {
      return;
    }

    setHasHandledReturnState(true);

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", `${window.location.pathname}#billing-center`);
    }

    if (billingReturnState === "success" && checkoutSessionId) {
      setBillingReturnNotice({
        detail: "Проверяю оплату и обновляю доступ после возврата из платёжной формы.",
        title: "Оплата завершена",
        tone: "warning",
      });
      setReturnSessionId(checkoutSessionId);
      setCheckoutRetryAttempt(0);
      reconcileCheckoutReturn(checkoutSessionId, {
        successMessage: "Оплата завершена. Обновляю данные по подписке.",
      });
      return;
    }

    if (billingReturnState === "portal_return") {
      setBillingReturnNotice({
        detail: "Обновляю текущее состояние подписки после возврата из управления оплатой.",
        title: "Возврат к подписке",
        tone: "success",
      });
      setCheckoutReturn(null);
      setReturnSessionId(null);
      setCheckoutRetryAttempt(0);
    } else if (billingReturnState === "canceled") {
      setBillingReturnNotice({
        detail: "Оплата была отменена. Подписка не изменилась, можно попробовать позже.",
        title: "Оплата отменена",
        tone: "warning",
      });
      setCheckoutReturn(null);
      setReturnSessionId(null);
      setCheckoutRetryAttempt(0);
    }

    const successMessage =
      billingReturnState === "success"
        ? "Оплата завершена. Обновляю статус подписки."
        : billingReturnState === "portal_return"
          ? "Возврат из управления оплатой. Обновляю статус подписки."
          : "Оплата отменена. Обновляю статус подписки.";

    runRequest("/api/settings/billing", {
      method: "GET",
      successMessage,
    });
  }, [
    billingReturnState,
    checkoutSessionId,
    hasHandledReturnState,
    reconcileCheckoutReturn,
    runRequest,
  ]);

  useEffect(() => {
    if (
      !returnSessionId ||
      !checkoutReturn ||
      checkoutReturn.reconciled ||
      isCheckoutReturnSyncing ||
      checkoutRetryAttempt >= CHECKOUT_RETURN_RETRY_DELAYS_MS.length
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCheckoutRetryAttempt((current) => current + 1);
      reconcileCheckoutReturn(returnSessionId, {
        background: true,
      });
    }, CHECKOUT_RETURN_RETRY_DELAYS_MS[checkoutRetryAttempt]);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    checkoutReturn,
    checkoutRetryAttempt,
    isCheckoutReturnSyncing,
    reconcileCheckoutReturn,
    returnSessionId,
  ]);

  const activeReviewRequest =
    snapshot.billingReviewRequest?.status === "queued"
      ? snapshot.billingReviewRequest
      : null;

  function toggleFeature(featureKey: string) {
    setSelectedFeatures((current) =>
      current.includes(featureKey)
        ? current.filter((item) => item !== featureKey)
        : [...current, featureKey],
    );
  }

  function startStripeFlow(
    url: string,
    successMessage: string,
  ) {
    setError(null);
    setNotice(null);
    setCheckoutRetryAttempt(0);
    setIsPending(true);

    startTransition(async () => {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const payload = (await response.json().catch(() => null)) as
          | { data?: { url?: string | null }; message?: string }
          | null;

        if (!response.ok || !payload?.data?.url) {
          setError(payload?.message ?? "Не удалось открыть страницу оплаты.");
          return;
        }

        setNotice(successMessage);
        window.location.assign(payload.data.url);
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <section className="card p-6" id="billing-center">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Доступ и оплата
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Подписка, функции и история доступа
          </h2>
        </div>
        <button
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={() =>
            runRequest("/api/settings/billing", {
              method: "GET",
              successMessage: "Данные по подписке обновлены.",
            })
          }
          type="button"
        >
          {isPending ? "Обновление..." : "Обновить"}
        </button>
      </div>

      {billingReturnNotice ? (
        <div
          className={`mb-5 rounded-3xl border px-4 py-4 text-sm ${
            billingReturnNotice.tone === "success"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
              : "border-amber-300/60 bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-semibold">{billingReturnNotice.title}</p>
          <p className="mt-1 leading-6">{billingReturnNotice.detail}</p>

          {checkoutReturn ? (
            <div className="mt-3 grid gap-1 text-xs">
              <p>
                Состояние оплаты: <span className="font-semibold">{formatStripeSessionStatus(checkoutReturn.sessionStatus)}</span>
              </p>
              <p>
                Платёж: <span className="font-semibold">{formatStripePaymentStatus(checkoutReturn.paymentStatus)}</span>
              </p>
              <p>
                Обновление доступа:{" "}
                <span className="font-semibold">
                  {checkoutReturn.reconciled
                    ? "подтверждено"
                    : isCheckoutReturnSyncing
                      ? "проверяю сейчас"
                      : checkoutRetryEnabled
                        ? `осталось попыток: ${checkoutRetriesRemaining}`
                        : "нужна ручная проверка"}
                </span>
              </p>
            </div>
          ) : null}

          {returnSessionId && checkoutReturn && !checkoutReturn.reconciled ? (
            <button
              className="mt-3 rounded-full border border-amber-400/70 bg-white/80 px-4 py-2 font-semibold text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending || isCheckoutReturnSyncing}
              onClick={() => {
                setCheckoutRetryAttempt(0);
                reconcileCheckoutReturn(returnSessionId, {
                  successMessage: "Повторно проверяю оплату.",
                });
              }}
              type="button"
            >
              {isCheckoutReturnSyncing
                ? "Проверяю оплату..."
                : "Проверить оплату ещё раз"}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          <article className="rounded-[28px] border border-border bg-white/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Текущий план</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Текущее состояние подписки, доступов и месячных лимитов без
                  лишних переходов.
                </p>
              </div>
              <span className="pill">
                {isPrivilegedAccess
                  ? "super-admin"
                  : access.subscription.isActive
                    ? "активен"
                    : "без подписки"}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
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
              <div className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
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

            <div className="mt-4 flex flex-wrap gap-3">
              {isPrivilegedAccess ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
                  Для основного super-admin все AI и premium-функции платформы
                  открыты постоянно и не зависят от подписки.
                </div>
              ) : access.subscription.isActive ? (
                <button
                  className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!stripe.portalReady || isPending}
                  onClick={() =>
                    startStripeFlow(
                      "/api/billing/portal",
                      "Открываю управление подпиской...",
                    )
                  }
                  type="button"
                >
                  Управлять подпиской
                </button>
              ) : (
                <button
                  className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!stripe.checkoutReady || isPending}
                  onClick={() =>
                    startStripeFlow(
                      "/api/billing/checkout",
                      "Открываю оплату...",
                    )
                  }
                  type="button"
                >
                  Оформить подписку
                </button>
              )}

              {!isPrivilegedAccess && !access.subscription.isActive ? (
                <span className="rounded-full border border-border px-4 py-3 text-xs font-semibold text-muted">
                  Расширенный доступ нужен для AI-плана питания, AI-плана тренировок
                  и анализа фото еды.
                </span>
              ) : null}
            </div>

            {!isPrivilegedAccess && (!stripe.checkoutReady || !stripe.portalReady) ? (
              <div className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Платёжный модуль ещё не настроен полностью, поэтому оплата или
                управление подпиской могут быть временно недоступны.
              </div>
            ) : null}

            <div className="mt-4 grid gap-3">
              {featureCards.map((feature) => (
                <article
                  className="rounded-2xl border border-border/70 bg-white/80 p-4 text-sm"
                  key={feature.featureKey}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{feature.label}</p>
                      <p className="mt-1 leading-6 text-muted">
                        {feature.description}
                      </p>
                    </div>
                    <span className="pill">
                      {feature.allowed ? "доступно" : "закрыто"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-1 text-muted">
                    <p>Источник доступа: {formatAccessSource(feature.source)}</p>
                    <p>
                      Использовано: {feature.usage.count}
                      {typeof feature.usage.limit === "number"
                        ? ` / ${feature.usage.limit}`
                        : ""}
                    </p>
                    <p>Следующее обновление лимита: {formatSettingsDateTime(feature.usage.resetAt)}</p>
                    {feature.reason ? (
                      <p className="text-amber-700">{feature.reason}</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>

        <div className="grid gap-4">
          <article className="rounded-[28px] border border-border bg-white/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Запросить доступ
                </p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Если функция закрыта, можно отправить запрос на пробный или
                  ручной доступ.
                </p>
              </div>
              {activeReviewRequest ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(activeReviewRequest.status)}`}
                >
                  {formatReviewStatus(activeReviewRequest.status)}
                </span>
              ) : null}
            </div>

            {activeReviewRequest ? (
              <div className="mt-4 rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
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
                <div className="mt-4 grid gap-3">
                  {blockedFeatures.map((feature) => {
                    const checked = selectedFeatures.includes(feature.featureKey);

                    return (
                      <label
                        className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted"
                        key={feature.featureKey}
                      >
                        <input
                          checked={checked}
                          className="mt-1 h-4 w-4 rounded border-border text-accent"
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

                <label className="mt-4 grid gap-2 text-sm text-muted">
                  Комментарий
                  <textarea
                    className={`${settingsBillingInputClassName} min-h-24 resize-y`}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Например: нужен доступ к AI-плану тренировок для следующей недели"
                    value={note}
                  />
                </label>

                <button
                  className="mt-4 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    isPending ||
                    selectedFeatures.length === 0 ||
                    Boolean(activeReviewRequest)
                  }
                  onClick={() =>
                    runRequest("/api/settings/billing", {
                      body: {
                        action: "request_access_review",
                        feature_keys: selectedFeatures,
                        note: note.trim() || undefined,
                      },
                      method: "POST",
                      successMessage:
                        "Запрос на доступ отправлен в поддержку.",
                    })
                  }
                  type="button"
                >
                  Отправить запрос на доступ
                </button>
              </>
            ) : (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
                Сейчас все AI-функции доступны по твоему текущему плану.
              </div>
            )}
          </article>

          <article className="rounded-[28px] border border-border bg-white/70 p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold text-foreground">
                История доступа
              </p>
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
                <div className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-4 text-sm text-muted">
                  История доступа пока пуста.
                </div>
              )}
            </div>
          </article>
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
