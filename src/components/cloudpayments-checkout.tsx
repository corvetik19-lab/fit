"use client";

import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { CloudpaymentsCheckoutIntent } from "@/lib/cloudpayments-billing";

declare global {
  interface Window {
    cp?: {
      CloudPayments: new () => {
        start: (options: CloudpaymentsCheckoutIntent) => Promise<unknown>;
      };
    };
  }
}

type CheckoutState = "idle" | "loading" | "ready" | "running";

function getCheckoutStatusLabel(state: CheckoutState, isReady: boolean) {
  if (state === "loading") {
    return "Готовим оплату";
  }

  if (state === "running") {
    return "Форма открыта";
  }

  if (isReady) {
    return "Готово";
  }

  return "Ожидание";
}

export function CloudpaymentsCheckout() {
  const searchParams = useSearchParams();
  const [intent, setIntent] = useState<CloudpaymentsCheckoutIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("loading");
  const hasAutoOpenedRef = useRef(false);
  const requestedReferenceId = searchParams.get("reference");

  const referenceId = intent?.externalId ?? null;
  const isReady = Boolean(
    scriptReady && intent && checkoutState !== "loading",
  );

  const successUrl = useMemo(() => {
    if (!referenceId) {
      return "/settings?section=billing&billing=success";
    }

    return `/settings?section=billing&billing=success&reference_id=${encodeURIComponent(referenceId)}`;
  }, [referenceId]);

  const canceledUrl = "/settings?section=billing&billing=canceled";

  const openWidget = useCallback(async () => {
    if (!intent || !window.cp?.CloudPayments) {
      return;
    }

    setCheckoutState("running");
    setError(null);

    try {
      const widget = new window.cp.CloudPayments();
      await widget.start(intent);
      window.location.assign(successUrl);
    } catch (widgetError) {
      const message =
        widgetError instanceof Error ? widgetError.message : String(widgetError);

      if (message.toLowerCase().includes("cancel")) {
        window.location.assign(canceledUrl);
        return;
      }

      setError(
        "Форма оплаты не завершилась. Проверь подключение и попробуй еще раз.",
      );
      setCheckoutState("ready");
    }
  }, [intent, successUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadIntent() {
      setCheckoutState("loading");
      setError(null);

      const query = requestedReferenceId
        ? `?reference=${encodeURIComponent(requestedReferenceId)}`
        : "";
      const response = await fetch(`/api/billing/cloudpayments/intent${query}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            data?: CloudpaymentsCheckoutIntent;
            message?: string;
          }
        | null;

      if (cancelled) {
        return;
      }

      if (!response.ok || !payload?.data) {
        setError(
          payload?.message ?? "Не удалось подготовить форму оплаты CloudPayments.",
        );
        setCheckoutState("ready");
        return;
      }

      setIntent(payload.data);
      setCheckoutState("ready");
    }

    void loadIntent();

    return () => {
      cancelled = true;
    };
  }, [requestedReferenceId]);

  useEffect(() => {
    if (!scriptReady || !intent || hasAutoOpenedRef.current) {
      return;
    }

    hasAutoOpenedRef.current = true;
    const timeoutId = window.setTimeout(() => {
      void openWidget();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [intent, openWidget, scriptReady]);

  return (
    <section
      className="surface-panel surface-panel--accent mx-auto max-w-2xl p-6 sm:p-7"
      data-testid="cloudpayments-checkout-page"
    >
      <Script
        onLoad={() => setScriptReady(true)}
        src="https://widget.cloudpayments.ru/bundles/cloudpayments.js"
        strategy="afterInteractive"
      />

      <div className="space-y-3">
        <p className="workspace-kicker text-accent">CloudPayments</p>
        <h1
          className="app-display text-3xl font-black tracking-[-0.08em] text-foreground sm:text-4xl"
          data-testid="cloudpayments-checkout-heading"
        >
          Оплата подписки fit Premium
        </h1>
        <p className="max-w-xl text-sm leading-7 text-muted">
          Откроем безопасную форму оплаты и после завершения вернем тебя в
          центр управления доступом.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <article className="metric-tile p-4 text-sm text-muted">
          <p className="workspace-kicker">Статус формы</p>
          <p className="mt-3 text-base font-semibold text-foreground">
            {getCheckoutStatusLabel(checkoutState, isReady)}
          </p>
        </article>

        <article className="metric-tile p-4 text-sm text-muted">
          <p className="workspace-kicker">Сумма</p>
          <p className="mt-3 text-base font-semibold text-foreground">
            {intent ? `${intent.amount.toLocaleString("ru-RU")} ₽` : "Ожидание"}
          </p>
        </article>

        <article className="metric-tile p-4 text-sm text-muted">
          <p className="workspace-kicker">Тариф</p>
          <p className="mt-3 text-base font-semibold text-foreground">
            {intent?.description ?? "fit Premium"}
          </p>
        </article>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="action-button action-button--primary"
          data-testid="cloudpayments-checkout-open"
          disabled={!isReady || checkoutState === "running"}
          onClick={() => void openWidget()}
          type="button"
        >
          {checkoutState === "running" ? "Открываю форму..." : "Открыть оплату"}
        </button>

        <a
          className="action-button action-button--secondary"
          data-testid="cloudpayments-checkout-back"
          href="/settings?section=billing"
        >
          Вернуться в настройки
        </a>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </section>
  );
}
