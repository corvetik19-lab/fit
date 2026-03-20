"use client";

import { useSearchParams } from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { CHECKOUT_RETURN_RETRY_DELAYS_MS } from "@/components/settings-billing-center-model";
import type { UserBillingAccessSnapshot } from "@/lib/billing-access";
import type { SettingsDataSnapshot } from "@/lib/settings-data";

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

type SettingsBillingCenterResponse = {
  data?: SettingsBillingCenterResponseData;
  message?: string;
} | null;

type SettingsBillingRequestConfig = {
  body?: Record<string, unknown>;
  method: "GET" | "POST";
  successMessage: string;
};

async function readJsonSafely(response: Response) {
  return (await response.json().catch(() => null)) as SettingsBillingCenterResponse;
}

export function useSettingsBillingCenterState(input: {
  initialAccess: UserBillingAccessSnapshot;
  initialSnapshot: SettingsDataSnapshot;
}) {
  const searchParams = useSearchParams();
  const [accessState, setAccessState] = useState(input.initialAccess);
  const [snapshot, setSnapshot] = useState(input.initialSnapshot);
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
  const [returnSessionId, setReturnSessionId] = useState(
    searchParams.get("session_id"),
  );

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
  const billingReturnState = searchParams.get("billing");
  const checkoutSessionId = searchParams.get("session_id");
  const checkoutRetriesRemaining =
    returnSessionId && checkoutReturn && !checkoutReturn.reconciled
      ? Math.max(
          CHECKOUT_RETURN_RETRY_DELAYS_MS.length - checkoutRetryAttempt,
          0,
        )
      : 0;
  const checkoutRetryEnabled = checkoutRetriesRemaining > 0;
  const isPrivilegedAccess = accessState.subscription.isPrivilegedAccess;
  const activeReviewRequest = useMemo(
    () =>
      snapshot.billingReviewRequest?.status === "queued"
        ? snapshot.billingReviewRequest
        : null,
    [snapshot],
  );

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
                  "Оплата подтверждена. Обновленные функции уже отмечены в карточках ниже.",
                title: "Оплата прошла успешно",
                tone: "success",
              }
            : {
                detail:
                  "Платеж найден, но доступ еще обновляется. Экран сам повторит проверку еще несколько раз.",
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
    (url: string, { body, method, successMessage }: SettingsBillingRequestConfig) => {
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
      const next = current.filter((featureKey) =>
        blockedFeatureKeySet.has(featureKey),
      );
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
        detail:
          "Проверяю оплату и обновляю доступ после возврата из платежной формы.",
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
        detail:
          "Обновляю текущее состояние подписки после возврата из управления оплатой.",
        title: "Возврат к подписке",
        tone: "success",
      });
      setCheckoutReturn(null);
      setReturnSessionId(null);
      setCheckoutRetryAttempt(0);
    } else if (billingReturnState === "canceled") {
      setBillingReturnNotice({
        detail:
          "Оплата была отменена. Подписка не изменилась, можно попробовать позже.",
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

  const toggleFeature = useCallback((featureKey: string) => {
    setSelectedFeatures((current) =>
      current.includes(featureKey)
        ? current.filter((item) => item !== featureKey)
        : [...current, featureKey],
    );
  }, []);

  const startStripeFlow = useCallback((url: string, successMessage: string) => {
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
  }, []);

  const refreshBilling = useCallback(() => {
    runRequest("/api/settings/billing", {
      method: "GET",
      successMessage: "Данные по подписке обновлены.",
    });
  }, [runRequest]);

  const requestAccessReview = useCallback(() => {
    runRequest("/api/settings/billing", {
      body: {
        action: "request_access_review",
        feature_keys: selectedFeatures,
        note: note.trim() || undefined,
      },
      method: "POST",
      successMessage: "Запрос на доступ отправлен в поддержку.",
    });
  }, [note, runRequest, selectedFeatures]);

  const retryCheckoutSync = useCallback(() => {
    if (!returnSessionId) {
      return;
    }

    setCheckoutRetryAttempt(0);
    reconcileCheckoutReturn(returnSessionId, {
      successMessage: "Повторно проверяю оплату.",
    });
  }, [reconcileCheckoutReturn, returnSessionId]);

  return {
    access: accessState,
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
    startStripeFlow,
    toggleFeature,
  };
}
