import type { Route } from "next";
import Link from "next/link";

import { AppShell, toAppShellViewer } from "@/components/app-shell";
import { CompactDisclosure } from "@/components/compact-disclosure";
import { SettingsBillingCenter } from "@/components/settings-billing-center";
import { SettingsDataCenter } from "@/components/settings-data-center";
import { SignOutButton } from "@/components/sign-out-button";
import {
  getActiveBillingProvider,
  hasActiveBillingCheckoutEnv,
  hasActiveBillingManagementEnv,
} from "@/lib/billing-provider";
import {
  createFallbackUserBillingAccessSnapshot,
  readUserBillingAccessOrFallback,
} from "@/lib/billing-access";
import { withTransientRetry } from "@/lib/runtime-retry";
import { createEmptySettingsDataSnapshot } from "@/lib/settings-data-server-model";
import { loadSettingsDataSnapshotOrFallback } from "@/lib/settings-data-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireReadyViewer } from "@/lib/viewer";

const IS_PLAYWRIGHT_RUNTIME = process.env.PLAYWRIGHT_TEST_HOOKS === "1";

type SettingsPageProps = {
  searchParams?: Promise<{
    e2eBillingReview?: string | string[];
    section?: string | string[];
  }>;
};

function readFirstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function createPlaywrightSettingsDataSnapshot() {
  return {
    ...createEmptySettingsDataSnapshot(),
    billingReviewRequest: {
      createdAt: new Date().toISOString(),
      id: "e2e-billing-review",
      note: "E2E запрос на проверку доступа",
      requestedFeatures: ["meal_plan"],
      status: "queued" as const,
      updatedAt: new Date().toISOString(),
    },
  };
}

const goalTypeLabels: Record<string, string> = {
  fat_loss: "Снижение веса",
  maintenance: "Поддержание формы",
  muscle_gain: "Набор мышц",
  performance: "Результат и выносливость",
};

function formatMetricValue(
  value: number | null | undefined,
  suffix?: string,
  fallback = "Нет данных",
) {
  if (value === null || value === undefined) {
    return fallback;
  }

  return `${value.toLocaleString("ru-RU", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  })}${suffix ? ` ${suffix}` : ""}`;
}

function formatUppercaseName(name: string | null | undefined) {
  const trimmed = name?.trim();

  if (!trimmed) {
    return "FIT";
  }

  return trimmed.toUpperCase();
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const shouldUsePlaywrightBillingReview =
    IS_PLAYWRIGHT_RUNTIME &&
    readFirstSearchParam(resolvedSearchParams.e2eBillingReview) === "1";
  const requestedSection = readFirstSearchParam(resolvedSearchParams.section);
  const [dataSnapshot, access, latestBodyMetric] = await Promise.all([
    shouldUsePlaywrightBillingReview
      ? createPlaywrightSettingsDataSnapshot()
      : IS_PLAYWRIGHT_RUNTIME
        ? createEmptySettingsDataSnapshot()
        : loadSettingsDataSnapshotOrFallback(supabase, viewer.user.id),
    IS_PLAYWRIGHT_RUNTIME
      ? createFallbackUserBillingAccessSnapshot({
          email: viewer.user.email,
          role: viewer.platformAdminRole,
        })
      : readUserBillingAccessOrFallback(supabase, viewer.user.id, {
          email: viewer.user.email,
          role: viewer.platformAdminRole,
        }),
    IS_PLAYWRIGHT_RUNTIME
      ? { data: null }
      : withTransientRetry(
          async () =>
            await supabase
              .from("body_metrics")
              .select("weight_kg, body_fat_pct, measured_at")
              .eq("user_id", viewer.user.id)
              .order("measured_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
          {
            attempts: 3,
            delaysMs: [500, 1_500, 3_000],
          },
        ),
  ]);
  const billingProvider = getActiveBillingProvider();

  const currentWeightKg =
    latestBodyMetric.data?.weight_kg ?? viewer.onboarding?.weight_kg ?? null;
  const bodyFatPct = latestBodyMetric.data?.body_fat_pct ?? null;
  const profileName = viewer.profile?.full_name ?? viewer.user.email ?? "fit";
  const goalLabel = viewer.goal?.goal_type
    ? goalTypeLabels[viewer.goal.goal_type] ?? viewer.goal.goal_type
    : "Поддержание формы";
  const weeklyTrainingDays = viewer.goal?.weekly_training_days ?? null;
  const accessStatus = viewer.adminState?.is_suspended
    ? "Ограничен"
    : access.subscription.isActive
      ? "Премиум активен"
      : "Базовый доступ";

  return (
    <AppShell
      eyebrow="Настройки"
      title="Профиль и доступ"
      viewer={toAppShellViewer(viewer)}
    >
      <div className="grid gap-3.5">
        <section className="grid gap-3">
          <div className="grid gap-2.5">
            <p className="workspace-kicker text-accent">Личный контур</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {formatUppercaseName(profileName)}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Быстрый контроль профиля, доступа, оплаты и личных данных без
              лишних промежуточных экранов.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            <article className="metric-tile p-3">
              <p className="workspace-kicker">Текущий вес</p>
              <p className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">
                {formatMetricValue(currentWeightKg, "кг")}
              </p>
            </article>

            <article className="metric-tile p-3">
              <p className="workspace-kicker">
                {bodyFatPct !== null ? "Жировая масса" : "Ритм недели"}
              </p>
              <p className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">
                {bodyFatPct !== null
                  ? formatMetricValue(bodyFatPct, "%")
                  : weeklyTrainingDays !== null
                    ? `${weeklyTrainingDays} дн.`
                    : "Не задан"}
              </p>
            </article>

            <article className="metric-tile p-3">
              <p className="workspace-kicker">Статус доступа</p>
              <p className="mt-1.5 text-base font-semibold tracking-tight text-foreground">
                {accessStatus}
              </p>
              <p className="mt-1 text-sm text-muted">{goalLabel}</p>
            </article>
          </div>
        </section>

        <section className="surface-panel surface-panel--accent p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="pill">{accessStatus}</span>
                <span className="pill">{goalLabel}</span>
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                fitora access
              </h2>
              <p className="max-w-2xl text-sm leading-5 text-muted">
                Быстрые действия сверху, подробные сценарии оплаты и данных ниже.
              </p>
            </div>

            <div className="grid w-full gap-2.5 sm:w-auto sm:grid-cols-2">
              <a className="action-button action-button--primary w-full" href="#billing-center">
                Открыть доступ
              </a>
              <a className="action-button action-button--secondary w-full" href="#data-center">
                Мои данные
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-2.5">
          <CompactDisclosure
            badge="быстро"
            defaultOpen
            eyebrow="Профиль"
            summary="Анкета, рекомендации и действия с данными."
            title="Контекст и основные параметры"
          >
            <div className="grid gap-2.5">
            <div className="mb-5">
              <p className="workspace-kicker">Профиль</p>
              <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Контекст и основные параметры
              </h2>
            </div>

            <div className="grid gap-3">
              <Link
                className="metric-tile flex items-center justify-between gap-3 p-3.5 text-left"
                href={"/onboarding" as Route}
              >
                <span>
                  <span className="block text-base font-semibold text-foreground">
                    Обновить анкету
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-muted">
                    Рост, вес, цели, оборудование и ограничения.
                  </span>
                </span>
                <span className="text-lg text-muted">›</span>
              </Link>

              <a
                className="metric-tile flex items-center justify-between gap-3 p-3.5 text-left"
                href="#profile-context"
              >
                <span>
                  <span className="block text-base font-semibold text-foreground">
                    Контекст для рекомендаций
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-muted">
                    То, на чём держатся программы, питание и AI-подсказки.
                  </span>
                </span>
                <span className="text-lg text-muted">›</span>
              </a>

              <a
                className="metric-tile flex items-center justify-between gap-3 p-3.5 text-left"
                href="#data-center"
              >
                <span>
                  <span className="block text-base font-semibold text-foreground">
                    Экспорт и удаление данных
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-muted">
                    В очереди выгрузок: {dataSnapshot.exportJobs.length}
                  </span>
                </span>
                <span className="text-lg text-muted">›</span>
              </a>
            </div>
            </div>
          </CompactDisclosure>

          <CompactDisclosure
            eyebrow="Профиль"
            id="profile-context"
            summary="Email, цель, ограничения и вводные для AI-рекомендаций."
            title="Сессия и тренерский контекст"
          >
            <div className="grid gap-2.5">
            <div className="mb-5">
              <p className="workspace-kicker">Профиль</p>
              <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Сессия и тренерский контекст
              </h2>
            </div>

            <div className="grid gap-3 text-sm leading-7 text-muted">
              <div className="metric-tile p-4">
                <p>
                  <span className="font-semibold text-foreground">Email:</span>{" "}
                  {viewer.user.email ?? "Неизвестно"}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-foreground">Имя:</span>{" "}
                  {viewer.profile?.full_name ?? "Пока не заполнено"}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-foreground">Цель:</span>{" "}
                  {goalLabel}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-foreground">Статус:</span>{" "}
                  {viewer.adminState?.is_suspended ? "Ограничен" : "Активен"}
                </p>
              </div>

              <div className="metric-tile p-4">
                <p>
                  <span className="font-semibold text-foreground">Оборудование:</span>{" "}
                  {viewer.onboarding?.equipment?.join(", ") || "Не указано"}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-foreground">Питание:</span>{" "}
                  {viewer.onboarding?.dietary_preferences?.join(", ") ||
                    "Не указано"}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-foreground">Ограничения:</span>{" "}
                  {viewer.onboarding?.injuries?.join(", ") || "Не указано"}
                </p>
              </div>
            </div>
            </div>
          </CompactDisclosure>
        </section>

        <section className="grid gap-2.5">
          <CompactDisclosure
            badge={access.subscription.isActive ? "активно" : "база"}
            defaultOpen={requestedSection === "billing"}
            eyebrow="Доступ"
            id="billing-center"
            summary="Оплата, premium-доступ и сервисные заявки."
            title="Оплата и подписка"
          >
            <SettingsBillingCenter
              access={access}
              billing={{
                provider: billingProvider,
                checkoutReady: hasActiveBillingCheckoutEnv(),
                managementReady: hasActiveBillingManagementEnv(),
              }}
              initialSnapshot={dataSnapshot}
            />
          </CompactDisclosure>

          <CompactDisclosure
            badge={String(dataSnapshot.exportJobs.length)}
            defaultOpen={requestedSection === "data"}
            eyebrow="Данные"
            id="data-center"
            summary="Экспорт, удаление и контроль личных данных."
            title="Мои данные"
          >
            <SettingsDataCenter initialSnapshot={dataSnapshot} />
          </CompactDisclosure>
        </section>

        <CompactDisclosure
          eyebrow="Сессия"
          summary="Выход с текущего устройства без влияния на данные."
          title="Завершить сеанс"
        >
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="workspace-kicker">Сессия</p>
              <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Завершить сеанс
              </h2>
              <p className="mt-1.5 max-w-xl text-sm leading-5 text-muted">
                Если нужно выйти с этого устройства, сделай это здесь. После
                выхода форма входа снова откроется как стартовый экран.
              </p>
            </div>

              <SignOutButton className="w-full justify-center sm:w-auto sm:min-w-[12rem]" />
          </div>
        </CompactDisclosure>
      </div>
    </AppShell>
  );
}
