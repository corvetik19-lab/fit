"use client";

import { useCallback, useEffect, useState } from "react";

import { PanelCard } from "@/components/panel-card";

type AdminStatsPayload = {
  readiness: {
    supabasePublicEnv: boolean;
    aiGatewayEnv: boolean;
    serviceRoleEnv: boolean;
    sentryRuntimeEnv: boolean;
    sentryBuildEnv: boolean;
    stripeCheckoutEnv: boolean;
    stripePortalEnv: boolean;
    stripeWebhookEnv: boolean;
    vercelRuntimeEnv: boolean;
    workoutSyncPullEnv: boolean;
  };
  observability: {
    sentry: {
      runtimeMissing: string[];
      buildMissing: string[];
      org: string | null;
      project: string | null;
      environment: string | null;
    };
    stripe: {
      checkoutMissing: string[];
      portalMissing: string[];
      webhookMissing: string[];
      priceId: string | null;
    };
    vercel: {
      environment: string | null;
    };
  };
  systemHealth: {
    users: number;
    exercises: number;
    activePrograms: number;
    knowledgeChunks: number;
    knowledgeEmbeddings: number;
    latestProfileAt: string | null;
    latestProgramAt: string | null;
  };
  syncHealth: {
    workoutDaysInProgress: number;
    workoutDaysDone: number;
    loggedWorkoutSets: number;
    queuedSupportActions: number;
    completedSupportActions: number;
    failedSupportActions: number;
    queuedExportJobs: number;
    activeDeletionRequests: number;
    dueDeletionRequests: number;
    queuedAiEvalRuns: number;
    runningAiEvalRuns: number;
    failedAiEvalRuns: number;
    latestWorkoutSetAt: string | null;
    latestSupportActionAt: string | null;
    latestExportJobAt: string | null;
    latestDeletionRequestAt: string | null;
    latestAiEvalRunAt: string | null;
  };
  billingHealth: {
    stripeSubscriptions: number;
    stripeActiveSubscriptions: number;
    stripeTrialSubscriptions: number;
    stripePastDueSubscriptions: number;
    stripeLinkedCustomers: number;
    queuedBillingReviews: number;
    completedBillingReviews: number;
    recentCheckoutReturnReconciles: number;
    latestBillingReviewAt: string | null;
    latestStripeEventAt: string | null;
    latestCheckoutReturnReconcileAt: string | null;
  };
};

type AdminStatsResponse =
  | {
      data?: AdminStatsPayload;
      message?: string;
    }
  | null;

type SmokeTestResponse =
  | {
      data?: {
        eventId: string | null;
        createdAt: string;
      };
      message?: string;
    }
  | null;

type AdminHealthDashboardProps = {
  canTriggerSentrySmokeTest: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value: string | null) {
  if (!value) {
    return "нет данных";
  }

  return dateFormatter.format(new Date(value));
}

function getStatusTone(active: boolean) {
  return active
    ? "bg-emerald-50 text-emerald-700"
    : "bg-amber-50 text-amber-700";
}

function formatMissingEnv(keys: string[]) {
  return keys.length ? keys.join(", ") : "всё настроено";
}

async function readStatsJson(response: Response) {
  return (await response.json().catch(() => null)) as AdminStatsResponse;
}

async function readSmokeTestJson(response: Response) {
  return (await response.json().catch(() => null)) as SmokeTestResponse;
}

export function AdminHealthDashboard({
  canTriggerSentrySmokeTest,
}: AdminHealthDashboardProps) {
  const [stats, setStats] = useState<AdminStatsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingSmokeTest, setIsSendingSmokeTest] = useState(false);
  const [smokeTestMessage, setSmokeTestMessage] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/stats", {
        cache: "no-store",
      });
      const payload = await readStatsJson(response);

      if (!response.ok || !payload?.data) {
        setError(payload?.message ?? "Не удалось загрузить system health dashboard.");
        return;
      }

      setStats(payload.data);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  const sendSmokeTest = useCallback(async () => {
    setIsSendingSmokeTest(true);
    setSmokeTestMessage(null);

    try {
      const response = await fetch("/api/admin/observability/sentry-test", {
        method: "POST",
      });
      const payload = await readSmokeTestJson(response);

      if (!response.ok) {
        setSmokeTestMessage(
          payload?.message ?? "Не удалось отправить тестовое событие в Sentry.",
        );
        return;
      }

      setSmokeTestMessage(
        payload?.data?.eventId
          ? `Тестовое событие отправлено. Event ID: ${payload.data.eventId}`
          : "Тестовое событие отправлено.",
      );
      await refreshStats();
    } finally {
      setIsSendingSmokeTest(false);
    }
  }, [refreshStats]);

  const readiness = stats?.readiness ?? null;
  const observability = stats?.observability ?? null;
  const systemHealth = stats?.systemHealth ?? null;
  const syncHealth = stats?.syncHealth ?? null;
  const billingHealth = stats?.billingHealth ?? null;
  const hasSyncBacklog = Boolean(
    syncHealth &&
      (syncHealth.queuedSupportActions > 0 ||
        syncHealth.failedSupportActions > 0 ||
        syncHealth.queuedExportJobs > 0 ||
        syncHealth.activeDeletionRequests > 0 ||
        syncHealth.dueDeletionRequests > 0 ||
        syncHealth.queuedAiEvalRuns > 0 ||
        syncHealth.runningAiEvalRuns > 0 ||
        syncHealth.failedAiEvalRuns > 0),
  );
  const hasBillingAttention = Boolean(
    billingHealth &&
      (billingHealth.queuedBillingReviews > 0 ||
        billingHealth.stripePastDueSubscriptions > 0),
  );
  const canSendSmokeTest =
    canTriggerSentrySmokeTest &&
    Boolean(readiness?.sentryRuntimeEnv) &&
    !isSendingSmokeTest;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <PanelCard caption="System health" title="Состояние платформы и runtime">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-7 text-muted">
              Живой health snapshot для админ-панели. Здесь видно, готова ли
              runtime-конфигурация и насколько свежий operational-контур.
            </p>
            <div className="flex flex-wrap gap-2">
              {canTriggerSentrySmokeTest ? (
                <button
                  className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!canSendSmokeTest}
                  onClick={() => void sendSmokeTest()}
                  type="button"
                >
                  {isSendingSmokeTest
                    ? "Отправляю Sentry test..."
                    : "Sentry smoke test"}
                </button>
              ) : null}
              <button
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isRefreshing}
                onClick={() => void refreshStats()}
                type="button"
              >
                {isRefreshing ? "Обновляю..." : "Обновить"}
              </button>
            </div>
          </div>

          {error ? (
            <p className="rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {smokeTestMessage ? (
            <p className="rounded-2xl border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              {smokeTestMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {[
              ["Supabase public env", readiness?.supabasePublicEnv ?? false],
              ["AI Gateway env", readiness?.aiGatewayEnv ?? false],
              ["Service role", readiness?.serviceRoleEnv ?? false],
              ["Sentry runtime", readiness?.sentryRuntimeEnv ?? false],
              ["Sentry build", readiness?.sentryBuildEnv ?? false],
              ["Stripe checkout", readiness?.stripeCheckoutEnv ?? false],
              ["Stripe portal", readiness?.stripePortalEnv ?? false],
              ["Stripe webhook", readiness?.stripeWebhookEnv ?? false],
              ["Vercel runtime", readiness?.vercelRuntimeEnv ?? false],
              ["Workout sync pull", readiness?.workoutSyncPullEnv ?? false],
            ].map(([label, ready]) => (
              <span
                className={`rounded-full px-3 py-2 text-sm font-medium ${getStatusTone(Boolean(ready))}`}
                key={String(label)}
              >
                {label}: {ready ? "готово" : "не настроено"}
              </span>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Sentry config</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Org: {observability?.sentry.org ?? "не задан"}</p>
                <p>Project: {observability?.sentry.project ?? "не задан"}</p>
                <p>
                  Environment:{" "}
                  {observability?.sentry.environment ?? "не задан"}
                </p>
                <p>
                  Runtime missing:{" "}
                  {formatMissingEnv(observability?.sentry.runtimeMissing ?? [])}
                </p>
                <p>
                  Build missing:{" "}
                  {formatMissingEnv(observability?.sentry.buildMissing ?? [])}
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Stripe billing</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Price ID: {observability?.stripe.priceId ?? "не задан"}</p>
                <p>
                  Checkout missing:{" "}
                  {formatMissingEnv(observability?.stripe.checkoutMissing ?? [])}
                </p>
                <p>
                  Portal missing:{" "}
                  {formatMissingEnv(observability?.stripe.portalMissing ?? [])}
                </p>
                <p>
                  Webhook missing:{" "}
                  {formatMissingEnv(observability?.stripe.webhookMissing ?? [])}
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Deployment runtime</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>
                  Vercel env: {observability?.vercel.environment ?? "не задан"}
                </p>
                <p>
                  Sentry smoke test:{" "}
                  {canTriggerSentrySmokeTest
                    ? readiness?.sentryRuntimeEnv
                      ? "доступен"
                      : "нужен NEXT_PUBLIC_SENTRY_DSN"
                    : "только для основного super-admin"}
                </p>
              </div>
            </article>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["Пользователи", String(systemHealth?.users ?? 0)],
              ["Упражнения", String(systemHealth?.exercises ?? 0)],
              ["Активные недели", String(systemHealth?.activePrograms ?? 0)],
              ["Knowledge chunks", String(systemHealth?.knowledgeChunks ?? 0)],
              [
                "Knowledge embeddings",
                String(systemHealth?.knowledgeEmbeddings ?? 0),
              ],
            ].map(([label, value]) => (
              <article className="kpi p-4" key={label}>
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {value}
                </p>
              </article>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Последний профиль</p>
              <p className="mt-2 text-muted">
                {formatDateTime(systemHealth?.latestProfileAt ?? null)}
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Последняя программа</p>
              <p className="mt-2 text-muted">
                {formatDateTime(systemHealth?.latestProgramAt ?? null)}
              </p>
            </article>
          </div>
        </div>
      </PanelCard>

      <PanelCard caption="Ops health" title="Очереди, billing и workout sync">
        <div className="grid gap-4">
          <p
            className={`rounded-2xl border px-4 py-3 text-sm ${
              hasSyncBacklog
                ? "border-amber-300/60 bg-amber-50 text-amber-800"
                : "border-emerald-300/60 bg-emerald-50 text-emerald-700"
            }`}
          >
            {hasSyncBacklog
              ? "Есть активные или проблемные очереди. Ниже видны support/export/deletion/eval backlog и последние точки активности."
              : "Очереди сейчас чистые: критичных sync backlog по support/export/deletion и AI evals не видно."}
          </p>

          <p
            className={`rounded-2xl border px-4 py-3 text-sm ${
              hasBillingAttention
                ? "border-amber-300/60 bg-amber-50 text-amber-800"
                : "border-emerald-300/60 bg-emerald-50 text-emerald-700"
            }`}
          >
            {hasBillingAttention
              ? "В billing-контуре есть точки внимания: либо копятся self-service review, либо есть past_due Stripe-подписки."
              : "Billing-контур выглядит спокойно: новых очередей review нет, past_due Stripe-подписок не видно."}
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Workout in progress", String(syncHealth?.workoutDaysInProgress ?? 0)],
              ["Workout done", String(syncHealth?.workoutDaysDone ?? 0)],
              ["Logged sets", String(syncHealth?.loggedWorkoutSets ?? 0)],
            ].map(([label, value]) => (
              <article className="kpi p-4" key={label}>
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {value}
                </p>
              </article>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Support queue</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Queued: {syncHealth?.queuedSupportActions ?? 0}</p>
                <p>Completed: {syncHealth?.completedSupportActions ?? 0}</p>
                <p>Failed: {syncHealth?.failedSupportActions ?? 0}</p>
                <p>
                  Последняя активность:{" "}
                  {formatDateTime(syncHealth?.latestSupportActionAt ?? null)}
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">AI eval queue</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Queued: {syncHealth?.queuedAiEvalRuns ?? 0}</p>
                <p>Running: {syncHealth?.runningAiEvalRuns ?? 0}</p>
                <p>Failed: {syncHealth?.failedAiEvalRuns ?? 0}</p>
                <p>
                  Последняя активность:{" "}
                  {formatDateTime(syncHealth?.latestAiEvalRunAt ?? null)}
                </p>
              </div>
            </article>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Export queue</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Queued or processing: {syncHealth?.queuedExportJobs ?? 0}</p>
                <p>
                  Latest export activity:{" "}
                  {formatDateTime(syncHealth?.latestExportJobAt ?? null)}
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Deletion holds</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Active holds: {syncHealth?.activeDeletionRequests ?? 0}</p>
                <p>Due for purge release: {syncHealth?.dueDeletionRequests ?? 0}</p>
                <p>
                  Latest deletion activity:{" "}
                  {formatDateTime(syncHealth?.latestDeletionRequestAt ?? null)}
                </p>
              </div>
            </article>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Billing review queue</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Queued reviews: {billingHealth?.queuedBillingReviews ?? 0}</p>
                <p>Completed reviews: {billingHealth?.completedBillingReviews ?? 0}</p>
                <p>
                  Checkout return reconciles за 24ч:{" "}
                  {billingHealth?.recentCheckoutReturnReconciles ?? 0}
                </p>
                <p>
                  Latest review activity:{" "}
                  {formatDateTime(billingHealth?.latestBillingReviewAt ?? null)}
                </p>
                <p>
                  Latest checkout return:{" "}
                  {formatDateTime(
                    billingHealth?.latestCheckoutReturnReconcileAt ?? null,
                  )}
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Stripe subscriptions</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Total Stripe subscriptions: {billingHealth?.stripeSubscriptions ?? 0}</p>
                <p>Active: {billingHealth?.stripeActiveSubscriptions ?? 0}</p>
                <p>Trial: {billingHealth?.stripeTrialSubscriptions ?? 0}</p>
                <p>Past due: {billingHealth?.stripePastDueSubscriptions ?? 0}</p>
                <p>Linked customers: {billingHealth?.stripeLinkedCustomers ?? 0}</p>
                <p>
                  Latest provider event:{" "}
                  {formatDateTime(billingHealth?.latestStripeEventAt ?? null)}
                </p>
              </div>
            </article>
          </div>

          <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
            <p className="font-semibold text-foreground">Workout sync activity</p>
            <p className="mt-2 text-muted">
              Последнее сохранённое обновление `actual_reps`:{" "}
              {formatDateTime(syncHealth?.latestWorkoutSetAt ?? null)}
            </p>
          </article>
        </div>
      </PanelCard>
    </div>
  );
}
