"use client";

import { useCallback, useEffect, useState } from "react";

import { PanelCard } from "@/components/panel-card";

type AdminStatsPayload = {
  readiness: {
    supabasePublicEnv: boolean;
    aiGatewayEnv: boolean;
    aiRuntimeEnv: boolean;
    aiEmbeddingEnv: boolean;
    openRouterEnv: boolean;
    voyageEnv: boolean;
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
    ai: {
      gatewayEnabled: boolean;
      runtimeEnabled: boolean;
      embeddingEnabled: boolean;
      openRouterEnabled: boolean;
      voyageEnabled: boolean;
      openRouterBaseUrl: string | null;
      openRouterModel: string | null;
      voyageModel: string | null;
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
  knowledgeHealth: {
    runtimeSnapshots: number;
    structuredFactSheets: number;
    structuredFacts: number;
    recentReindexes24h: number;
    embeddingCoverageRatio: number | null;
    latestRuntimeSnapshotAt: string | null;
    latestReindexAt: string | null;
    latestReindexMode: "embeddings" | "full" | null;
    latestReindexSearchMode: "text" | "vector" | null;
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
    recentBillingReconciles: number;
    failedBillingReconciles: number;
    recentCheckoutReturnReconciles: number;
    latestBillingReviewAt: string | null;
    latestBillingReconcileAt: string | null;
    latestStripeEventAt: string | null;
    latestCheckoutReturnReconcileAt: string | null;
  };
};

type AdminStatsResponse =
  | {
      data?: AdminStatsPayload;
      meta?: {
        degraded?: boolean;
      };
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

type DashboardWarmJobResponse =
  | {
      data?: {
        errorCount: number;
        processedUsers: number;
        successCount: number;
      };
      message?: string;
    }
  | null;

type NutritionSummariesJobResponse =
  | {
      data?: {
        days: number;
        errorCount: number;
        processedUsers: number;
        successCount: number;
      };
      message?: string;
    }
  | null;

type KnowledgeReindexJobResponse =
  | {
      data?: {
        errorCount: number;
        mode: "embeddings" | "full";
        processedUsers: number;
        successCount: number;
      };
      message?: string;
    }
  | null;

type BillingReconcileJobResponse =
  | {
      data?: {
        errorCount: number;
        processedUsers: number;
        skippedCount: number;
        successCount: number;
      };
      message?: string;
    }
  | null;

type AdminHealthDashboardProps = {
  canRunAdminJobs: boolean;
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
    return "Нет данных";
  }

  return dateFormatter.format(new Date(value));
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "Нет данных";
  }

  return `${Math.round(value * 100)}%`;
}

function getStatusTone(active: boolean) {
  return active
    ? "bg-emerald-50 text-emerald-700"
    : "bg-amber-50 text-amber-700";
}

function formatConfigState(missingKeys: string[]) {
  return missingKeys.length ? `Требует настройки (${missingKeys.length})` : "Готово";
}

function formatReindexMode(value: "embeddings" | "full" | null) {
  if (value === "embeddings") {
    return "Быстрое обновление поиска";
  }

  if (value === "full") {
    return "Полное обновление базы знаний";
  }

  return "Нет данных";
}

function formatSearchMode(value: "text" | "vector" | null) {
  if (value === "text") {
    return "Резервный поиск по тексту";
  }

  if (value === "vector") {
    return "Векторный поиск";
  }

  return "Нет данных";
}

function formatEnvironment(value: string | null) {
  if (!value) {
    return "Не указано";
  }

  if (value === "production") {
    return "Продакшн";
  }

  if (value === "preview") {
    return "Предпросмотр";
  }

  if (value === "development") {
    return "Разработка";
  }

  return value;
}

async function readStatsJson(response: Response) {
  return (await response.json().catch(() => null)) as AdminStatsResponse;
}

async function readSmokeTestJson(response: Response) {
  return (await response.json().catch(() => null)) as SmokeTestResponse;
}

async function readDashboardWarmJobJson(response: Response) {
  return (await response.json().catch(() => null)) as DashboardWarmJobResponse;
}

async function readNutritionSummariesJobJson(response: Response) {
  return (await response.json().catch(() => null)) as NutritionSummariesJobResponse;
}

async function readKnowledgeReindexJobJson(response: Response) {
  return (await response.json().catch(() => null)) as KnowledgeReindexJobResponse;
}

async function readBillingReconcileJobJson(response: Response) {
  return (await response.json().catch(() => null)) as BillingReconcileJobResponse;
}

export function AdminHealthDashboard({
  canRunAdminJobs,
  canTriggerSentrySmokeTest,
}: AdminHealthDashboardProps) {
  const [stats, setStats] = useState<AdminStatsPayload | null>(null);
  const [isDegraded, setIsDegraded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingSmokeTest, setIsSendingSmokeTest] = useState(false);
  const [isWarmingSnapshots, setIsWarmingSnapshots] = useState(false);
  const [isRefreshingNutritionSummaries, setIsRefreshingNutritionSummaries] =
    useState(false);
  const [isRefreshingKnowledge, setIsRefreshingKnowledge] = useState(false);
  const [isRefreshingBilling, setIsRefreshingBilling] = useState(false);
  const [smokeTestMessage, setSmokeTestMessage] = useState<string | null>(null);
  const [dashboardWarmMessage, setDashboardWarmMessage] = useState<string | null>(null);
  const [nutritionSummariesMessage, setNutritionSummariesMessage] = useState<
    string | null
  >(null);
  const [knowledgeReindexMessage, setKnowledgeReindexMessage] = useState<
    string | null
  >(null);
  const [billingReconcileMessage, setBillingReconcileMessage] = useState<
    string | null
  >(null);

  const refreshStats = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    setIsDegraded(false);

    try {
      const response = await fetch("/api/admin/stats", {
        cache: "no-store",
      });
      const payload = await readStatsJson(response);

      if (!response.ok || !payload?.data) {
        setError(payload?.message ?? "Не удалось загрузить сводку по состоянию платформы.");
        return;
      }

      setStats(payload.data);
      setIsDegraded(Boolean(payload.meta?.degraded));
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
          payload?.message ?? "Не удалось отправить тестовое событие мониторинга.",
        );
        return;
      }

      setSmokeTestMessage(
        payload?.data?.eventId
          ? `Тестовая проверка отправлена. Код события: ${payload.data.eventId}.`
          : "Тестовая проверка отправлена.",
      );
      await refreshStats();
    } finally {
      setIsSendingSmokeTest(false);
    }
  }, [refreshStats]);

  const runDashboardWarmJob = useCallback(async () => {
    setIsWarmingSnapshots(true);
    setDashboardWarmMessage(null);

    try {
      const response = await fetch("/api/internal/jobs/dashboard-warm?limit=25", {
        method: "POST",
      });
      const payload = await readDashboardWarmJobJson(response);

      if (!response.ok) {
        setDashboardWarmMessage(
          payload?.message ?? "Не удалось обновить подготовленные сводки дашборда.",
        );
        return;
      }

      setDashboardWarmMessage(
        payload?.data
          ? `Сводки обновлены для ${payload.data.successCount} из ${payload.data.processedUsers} пользователей.`
          : "Сводки дашборда обновлены.",
      );
      await refreshStats();
    } finally {
      setIsWarmingSnapshots(false);
    }
  }, [refreshStats]);

  const runNutritionSummariesJob = useCallback(async () => {
    setIsRefreshingNutritionSummaries(true);
    setNutritionSummariesMessage(null);

    try {
      const response = await fetch(
        "/api/internal/jobs/nutrition-summaries?limit=25&days=3",
        {
          method: "POST",
        },
      );
      const payload = await readNutritionSummariesJobJson(response);

      if (!response.ok) {
        setNutritionSummariesMessage(
          payload?.message ?? "Не удалось пересчитать сводки по питанию.",
        );
        return;
      }

      setNutritionSummariesMessage(
        payload?.data
          ? `Сводки по питанию обновлены для ${payload.data.successCount} из ${payload.data.processedUsers} пользователей за ${payload.data.days} дня.`
          : "Сводки по питанию обновлены.",
      );
      await refreshStats();
    } finally {
      setIsRefreshingNutritionSummaries(false);
    }
  }, [refreshStats]);

  const runKnowledgeReindexJob = useCallback(async () => {
    setIsRefreshingKnowledge(true);
    setKnowledgeReindexMessage(null);

    try {
      const response = await fetch(
        "/api/internal/jobs/knowledge-reindex?limit=20&mode=embeddings",
        {
          method: "POST",
        },
      );
      const payload = await readKnowledgeReindexJobJson(response);

      if (!response.ok) {
        setKnowledgeReindexMessage(
          payload?.message ?? "Не удалось обновить базу знаний ИИ.",
        );
        return;
      }

      setKnowledgeReindexMessage(
        payload?.data
          ? `База знаний обновлена для ${payload.data.successCount} из ${payload.data.processedUsers} пользователей. Режим: ${payload.data.mode === "full" ? "полный" : "быстрый"}.`
          : "База знаний обновлена.",
      );
      await refreshStats();
    } finally {
      setIsRefreshingKnowledge(false);
    }
  }, [refreshStats]);

  const runBillingReconcileJob = useCallback(async () => {
    setIsRefreshingBilling(true);
    setBillingReconcileMessage(null);

    try {
      const response = await fetch("/api/internal/jobs/billing-reconcile?limit=20", {
        method: "POST",
      });
      const payload = await readBillingReconcileJobJson(response);

      if (!response.ok) {
        setBillingReconcileMessage(
          payload?.message ?? "Не удалось сверить состояние оплат.",
        );
        return;
      }

      setBillingReconcileMessage(
        payload?.data
          ? `Оплаты сверены: обновлено ${payload.data.successCount} из ${payload.data.processedUsers}, пропущено ${payload.data.skippedCount}, ошибок ${payload.data.errorCount}.`
          : "Состояние оплат обновлено.",
      );
      await refreshStats();
    } finally {
      setIsRefreshingBilling(false);
    }
  }, [refreshStats]);

  const readiness = stats?.readiness ?? null;
  const observability = stats?.observability ?? null;
  const systemHealth = stats?.systemHealth ?? null;
  const knowledgeHealth = stats?.knowledgeHealth ?? null;
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
        billingHealth.stripePastDueSubscriptions > 0 ||
        billingHealth.failedBillingReconciles > 0),
  );
  const canSendSmokeTest =
    canTriggerSentrySmokeTest &&
    Boolean(readiness?.sentryRuntimeEnv) &&
    !isSendingSmokeTest;
  const canRunDashboardWarm = canRunAdminJobs && !isWarmingSnapshots;
  const canRunNutritionSummaryRefresh =
    canRunAdminJobs && !isRefreshingNutritionSummaries;
  const canRunKnowledgeRefresh = canRunAdminJobs && !isRefreshingKnowledge;
  const canRunBillingReconcile = canRunAdminJobs && !isRefreshingBilling;

  const readinessCards: Array<[string, boolean]> = [
    [
      "База данных",
      Boolean(readiness?.supabasePublicEnv && readiness?.serviceRoleEnv),
    ],
    [
      "Ответы ИИ",
      Boolean(
        readiness?.aiRuntimeEnv || readiness?.openRouterEnv || readiness?.aiGatewayEnv,
      ),
    ],
    [
      "Поиск ИИ",
      Boolean(readiness?.aiEmbeddingEnv || readiness?.voyageEnv),
    ],
    ["Мониторинг", Boolean(readiness?.sentryRuntimeEnv)],
    [
      "Оплата",
      Boolean(
        readiness?.stripeCheckoutEnv &&
          readiness?.stripePortalEnv &&
          readiness?.stripeWebhookEnv,
      ),
    ],
    ["Синхронизация", Boolean(readiness?.workoutSyncPullEnv)],
    ["Развёртывание", Boolean(readiness?.vercelRuntimeEnv)],
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <PanelCard caption="Контроль" title="Состояние платформы">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-7 text-muted">
              Здесь собрана главная сводка по работе приложения: доступность сервисов,
              свежесть данных, очереди обработки и ключевые обновления.
            </p>
            <div className="flex flex-wrap gap-2">
              {canRunAdminJobs ? (
                <button className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canRunDashboardWarm} onClick={() => void runDashboardWarmJob()} type="button">
                  {isWarmingSnapshots ? "Обновляю дашборд..." : "Обновить дашборд"}
                </button>
              ) : null}
              {canRunAdminJobs ? (
                <button className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canRunNutritionSummaryRefresh} onClick={() => void runNutritionSummariesJob()} type="button">
                  {isRefreshingNutritionSummaries ? "Обновляю питание..." : "Обновить питание"}
                </button>
              ) : null}
              {canRunAdminJobs ? (
                <button className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canRunKnowledgeRefresh} onClick={() => void runKnowledgeReindexJob()} type="button">
                  {isRefreshingKnowledge ? "Обновляю базу ИИ..." : "Обновить базу ИИ"}
                </button>
              ) : null}
              {canRunAdminJobs ? (
                <button className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canRunBillingReconcile} onClick={() => void runBillingReconcileJob()} type="button">
                  {isRefreshingBilling ? "Сверяю оплаты..." : "Сверить оплаты"}
                </button>
              ) : null}
              {canTriggerSentrySmokeTest ? (
                <button className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canSendSmokeTest} onClick={() => void sendSmokeTest()} type="button">
                  {isSendingSmokeTest ? "Проверяю мониторинг..." : "Проверить мониторинг"}
                </button>
              ) : null}
              <button className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60" disabled={isRefreshing} onClick={() => void refreshStats()} type="button">
                {isRefreshing ? "Обновляю..." : "Обновить"}
              </button>
            </div>
          </div>

          {error ? <p className="rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          {isDegraded ? (
            <p className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Часть служебных источников сейчас недоступна. Панель показывает безопасный резервный снимок и может временно не отражать последние изменения.
            </p>
          ) : null}
          {smokeTestMessage ? <p className="rounded-2xl border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-800">{smokeTestMessage}</p> : null}
          {dashboardWarmMessage ? <p className="rounded-2xl border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-800">{dashboardWarmMessage}</p> : null}
          {nutritionSummariesMessage ? <p className="rounded-2xl border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-800">{nutritionSummariesMessage}</p> : null}
          {knowledgeReindexMessage ? <p className="rounded-2xl border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-800">{knowledgeReindexMessage}</p> : null}
          {billingReconcileMessage ? <p className="rounded-2xl border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-800">{billingReconcileMessage}</p> : null}

          <div className="flex flex-wrap gap-2">
            {readinessCards.map(([label, ready]) => (
              <span className={`rounded-full px-3 py-2 text-sm font-medium ${getStatusTone(ready)}`} key={label}>
                {label}: {ready ? "готово" : "требует настройки"}
              </span>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Мониторинг</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Сбор ошибок: {readiness?.sentryRuntimeEnv ? "включён" : "не готов"}</p>
                <p>Настройка приложения: {formatConfigState(observability?.sentry.runtimeMissing ?? [])}</p>
                <p>Настройка сборки: {formatConfigState(observability?.sentry.buildMissing ?? [])}</p>
                <p>Среда: {formatEnvironment(observability?.sentry.environment ?? null)}</p>
                <p>
                  Проверка вручную:{" "}
                  {canTriggerSentrySmokeTest
                    ? readiness?.sentryRuntimeEnv
                      ? "доступна"
                      : "появится после настройки"
                    : "доступна только основному администратору"}
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Подключение ИИ</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Ответы ИИ: {observability?.ai.runtimeEnabled ? "готовы" : "не готовы"}</p>
                <p>Поиск по базе знаний: {observability?.ai.embeddingEnabled ? "готов" : "не готов"}</p>
                <p>Основной канал ИИ: {observability?.ai.openRouterEnabled ? "подключён" : "не подключён"}</p>
                <p>Провайдер поиска: {observability?.ai.voyageEnabled ? "подключён" : "не подключён"}</p>
                <p>Резервный канал: {observability?.ai.gatewayEnabled ? "подключён" : "выключен"}</p>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Оплата и подписки</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Оформление оплаты: {formatConfigState(observability?.stripe.checkoutMissing ?? [])}</p>
                <p>Управление подпиской: {formatConfigState(observability?.stripe.portalMissing ?? [])}</p>
                <p>Сверка платежей: {formatConfigState(observability?.stripe.webhookMissing ?? [])}</p>
                <p>Премиум-тариф: {observability?.stripe.priceId ? "задан" : "не задан"}</p>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Развёртывание</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Среда: {formatEnvironment(observability?.vercel.environment ?? null)}</p>
                <p>Серверная часть: {readiness?.vercelRuntimeEnv ? "готова" : "не настроена"}</p>
                <p>Синхронизация тренировок: {readiness?.workoutSyncPullEnv ? "готова" : "не настроена"}</p>
              </div>
            </article>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["Пользователи", String(systemHealth?.users ?? 0)],
              ["Упражнения", String(systemHealth?.exercises ?? 0)],
              ["Активные программы", String(systemHealth?.activePrograms ?? 0)],
              ["Материалы ИИ", String(systemHealth?.knowledgeChunks ?? 0)],
              ["Поисковые векторы", String(systemHealth?.knowledgeEmbeddings ?? 0)],
            ].map(([label, value]) => (
              <article className="kpi p-4" key={label}>
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Последнее обновление профиля</p>
              <p className="mt-2 text-muted">{formatDateTime(systemHealth?.latestProfileAt ?? null)}</p>
            </article>
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Последняя программа</p>
              <p className="mt-2 text-muted">{formatDateTime(systemHealth?.latestProgramAt ?? null)}</p>
            </article>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Контекст ИИ</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Готовые снимки: {knowledgeHealth?.runtimeSnapshots ?? 0}</p>
                <p>Покрытие базы знаний: {formatPercent(knowledgeHealth?.embeddingCoverageRatio ?? null)}</p>
                <p>Карточки фактов: {knowledgeHealth?.structuredFactSheets ?? 0}</p>
                <p>Факты: {knowledgeHealth?.structuredFacts ?? 0}</p>
                <p>Последнее обновление: {formatDateTime(knowledgeHealth?.latestRuntimeSnapshotAt ?? null)}</p>
              </div>
            </article>
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Обновление базы знаний</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Обновлений за сутки: {knowledgeHealth?.recentReindexes24h ?? 0}</p>
                <p>Последний режим: {formatReindexMode(knowledgeHealth?.latestReindexMode ?? null)}</p>
                <p>Последний тип поиска: {formatSearchMode(knowledgeHealth?.latestReindexSearchMode ?? null)}</p>
                <p>Последнее обновление: {formatDateTime(knowledgeHealth?.latestReindexAt ?? null)}</p>
              </div>
            </article>
          </div>
        </div>
      </PanelCard>

      <PanelCard caption="Операции" title="Очереди и действия">
        <div className="grid gap-4">
          <p className={`rounded-2xl border px-4 py-3 text-sm ${hasSyncBacklog ? "border-amber-300/60 bg-amber-50 text-amber-800" : "border-emerald-300/60 bg-emerald-50 text-emerald-700"}`}>
            {hasSyncBacklog
              ? "Есть незавершённые операции. Ниже видно, где именно накопилась очередь."
              : "Критичных очередей сейчас нет. Основные процессы проходят штатно."}
          </p>
          <p className={`rounded-2xl border px-4 py-3 text-sm ${hasBillingAttention ? "border-amber-300/60 bg-amber-50 text-amber-800" : "border-emerald-300/60 bg-emerald-50 text-emerald-700"}`}>
            {hasBillingAttention
              ? "В оплатах есть задачи, которым нужен контроль: просрочки, ручные проверки или ошибки сверки."
              : "По оплатам всё спокойно: критичных просрочек и ручных хвостов не видно."}
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Тренировки в процессе", String(syncHealth?.workoutDaysInProgress ?? 0)],
              ["Завершённые тренировки", String(syncHealth?.workoutDaysDone ?? 0)],
              ["Сохранённые подходы", String(syncHealth?.loggedWorkoutSets ?? 0)],
            ].map(([label, value]) => (
              <article className="kpi p-4" key={label}>
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Поддержка пользователей</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Ждут обработки: {syncHealth?.queuedSupportActions ?? 0}</p>
                <p>Завершено: {syncHealth?.completedSupportActions ?? 0}</p>
                <p>С ошибкой: {syncHealth?.failedSupportActions ?? 0}</p>
                <p>Последняя активность: {formatDateTime(syncHealth?.latestSupportActionAt ?? null)}</p>
              </div>
            </article>
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Проверка качества ИИ</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Ждут запуска: {syncHealth?.queuedAiEvalRuns ?? 0}</p>
                <p>Выполняются: {syncHealth?.runningAiEvalRuns ?? 0}</p>
                <p>С ошибкой: {syncHealth?.failedAiEvalRuns ?? 0}</p>
                <p>Последняя активность: {formatDateTime(syncHealth?.latestAiEvalRunAt ?? null)}</p>
              </div>
            </article>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Выгрузка данных</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Ждут или обрабатываются: {syncHealth?.queuedExportJobs ?? 0}</p>
                <p>Последняя активность: {formatDateTime(syncHealth?.latestExportJobAt ?? null)}</p>
              </div>
            </article>
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Удаление данных</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Активные удержания: {syncHealth?.activeDeletionRequests ?? 0}</p>
                <p>Готовы к следующему шагу: {syncHealth?.dueDeletionRequests ?? 0}</p>
                <p>Последняя активность: {formatDateTime(syncHealth?.latestDeletionRequestAt ?? null)}</p>
              </div>
            </article>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Проверка оплат</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Ждут ручной проверки: {billingHealth?.queuedBillingReviews ?? 0}</p>
                <p>Проверено: {billingHealth?.completedBillingReviews ?? 0}</p>
                <p>Сверок за сутки: {billingHealth?.recentBillingReconciles ?? 0}</p>
                <p>Ошибок сверки: {billingHealth?.failedBillingReconciles ?? 0}</p>
                <p>Последняя ручная проверка: {formatDateTime(billingHealth?.latestBillingReviewAt ?? null)}</p>
                <p>Последняя автоматическая сверка: {formatDateTime(billingHealth?.latestBillingReconcileAt ?? null)}</p>
              </div>
            </article>
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Подписки</p>
              <div className="mt-3 grid gap-1 text-muted">
                <p>Всего подписок: {billingHealth?.stripeSubscriptions ?? 0}</p>
                <p>Активные: {billingHealth?.stripeActiveSubscriptions ?? 0}</p>
                <p>Пробный период: {billingHealth?.stripeTrialSubscriptions ?? 0}</p>
                <p>Нужна оплата: {billingHealth?.stripePastDueSubscriptions ?? 0}</p>
                <p>Связанные клиенты: {billingHealth?.stripeLinkedCustomers ?? 0}</p>
                <p>Последнее событие: {formatDateTime(billingHealth?.latestStripeEventAt ?? null)}</p>
              </div>
            </article>
          </div>

          <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
            <p className="font-semibold text-foreground">Синхронизация тренировок</p>
            <p className="mt-2 text-muted">Последнее обновление подходов: {formatDateTime(syncHealth?.latestWorkoutSetAt ?? null)}</p>
            <p className="mt-1 text-muted">Возврат из оплаты обработан: {formatDateTime(billingHealth?.latestCheckoutReturnReconcileAt ?? null)}</p>
          </article>
        </div>
      </PanelCard>
    </div>
  );
}
