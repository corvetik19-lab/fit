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

export function CloudpaymentsCheckout() {
  const searchParams = useSearchParams();
  const [intent, setIntent] = useState<CloudpaymentsCheckoutIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("loading");
  const hasAutoOpenedRef = useRef(false);
  const requestedReferenceId = searchParams.get("reference");

  const referenceId = intent?.externalId ?? null;
  const isReady = scriptReady && intent && checkoutState !== "loading";

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
        "Форма оплаты не завершилась. Проверь подключение и попробуй ещё раз.",
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
      className="card card--hero mx-auto max-w-2xl p-6 sm:p-8"
      data-testid="cloudpayments-checkout-page"
    >
      <Script
        onLoad={() => setScriptReady(true)}
        src="https://widget.cloudpayments.ru/bundles/cloudpayments.js"
        strategy="afterInteractive"
      />

      <div className="space-y-4">
        <p className="workspace-kicker">CloudPayments</p>
        <h1
          className="text-3xl font-semibold tracking-tight text-foreground"
          data-testid="cloudpayments-checkout-heading"
        >
          Оплата подписки fit Premium
        </h1>
        <p className="text-sm leading-7 text-muted">
          Мы откроем безопасную форму оплаты и после завершения вернём тебя в
          центр управления подпиской.
        </p>
      </div>

      <div className="mt-6 rounded-[2rem] border border-border bg-white/82 p-5 shadow-[0_28px_60px_-44px_rgba(20,58,160,0.22)]">
        <div className="grid gap-2 text-sm text-muted">
          <p>
            Статус формы:{" "}
            <span className="font-semibold text-foreground">
              {checkoutState === "loading"
                ? "готовлю оплату"
                : checkoutState === "running"
                  ? "форма открыта"
                  : isReady
                    ? "готово"
                    : "ожидание"}
            </span>
          </p>
          {intent ? (
            <>
              <p>
                Сумма:{" "}
                <span className="font-semibold text-foreground">
                  {intent.amount.toLocaleString("ru-RU")} ₽
                </span>
              </p>
              <p>
                Тариф:{" "}
                <span className="font-semibold text-foreground">
                  {intent.description}
                </span>
              </p>
            </>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="cloudpayments-checkout-open"
            disabled={!isReady || checkoutState === "running"}
            onClick={() => void openWidget()}
            type="button"
          >
            {checkoutState === "running" ? "Открываю форму..." : "Открыть оплату"}
          </button>

          <a
            className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70"
            data-testid="cloudpayments-checkout-back"
            href="/settings?section=billing"
          >
            Вернуться в настройки
          </a>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
