import type { Route } from "next";
import Link from "next/link";

import { AppShell, toAppShellViewer } from "@/components/app-shell";
import { SettingsBillingCenter } from "@/components/settings-billing-center";
import { SettingsDataCenter } from "@/components/settings-data-center";
import { SignOutButton } from "@/components/sign-out-button";
import {
  getActiveBillingProvider,
  hasActiveBillingCheckoutEnv,
  hasActiveBillingManagementEnv,
} from "@/lib/billing-provider";
import { readUserBillingAccessOrFallback } from "@/lib/billing-access";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loadSettingsDataSnapshotOrFallback } from "@/lib/settings-data-server";
import { requireReadyViewer } from "@/lib/viewer";

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
    return "FIT ATHLETE";
  }

  return trimmed.toUpperCase();
}

export default async function SettingsPage() {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const [dataSnapshot, access, latestBodyMetric] = await Promise.all([
    loadSettingsDataSnapshotOrFallback(supabase, viewer.user.id),
    readUserBillingAccessOrFallback(supabase, viewer.user.id, {
      email: viewer.user.email,
    }),
    supabase
      .from("body_metrics")
      .select("weight_kg, body_fat_pct, measured_at")
      .eq("user_id", viewer.user.id)
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
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
  const premiumStatus = viewer.adminState?.is_suspended
    ? "Ограничен"
    : access.subscription.isActive
      ? "Активен"
      : "Базовый";

  return (
    <AppShell
      eyebrow="Настройки"
      title="Профиль, доступ и управление личными данными"
      viewer={toAppShellViewer(viewer)}
    >
      <div className="grid gap-6">
        <section className="grid gap-5">
          <div className="space-y-3">
            <p className="workspace-kicker text-accent">Персональный контур</p>
            <h1 className="app-display text-4xl font-black tracking-[-0.08em] text-foreground sm:text-5xl">
              {formatUppercaseName(profileName)}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
              Один экран для профиля, подписки и приватности. На мобильном он
              должен работать как компактный центр управления без ощущения
              “сжатой веб-панели”.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <article className="surface-panel p-5">
              <p className="workspace-kicker">Текущий вес</p>
              <p className="mt-4 text-4xl font-black tracking-tight text-foreground">
                {formatMetricValue(currentWeightKg, "кг")}
              </p>
            </article>

            <article className="surface-panel p-5">
              <p className="workspace-kicker">
                {bodyFatPct !== null ? "Жировая масса" : "Ритм недели"}
              </p>
              <p className="mt-4 text-4xl font-black tracking-tight text-foreground">
                {bodyFatPct !== null
                  ? formatMetricValue(bodyFatPct, "%")
                  : weeklyTrainingDays !== null
                    ? `${weeklyTrainingDays} дн.`
                    : "Не задан"}
              </p>
            </article>
          </div>
        </section>

        <section className="athletic-hero-card p-6 sm:p-7">
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="athletic-hero-chip">{premiumStatus}</span>
                <span className="athletic-hero-chip">{goalLabel}</span>
              </div>
              <h2 className="app-display text-4xl font-black tracking-[-0.08em] text-white">
                fit access
              </h2>
              <p className="max-w-xl text-sm leading-7 text-white/78 sm:text-base">
                Здесь собран доступ к AI, истории оплаты и личным данным. Быстрые
                действия вынесены наверх, а детальные billing/data сценарии
                остаются ниже без отдельной перегруженной панели.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                className="action-button action-button--secondary bg-white text-accent"
                href="#billing-center"
              >
                Управлять доступом
              </a>
              <a
                className="action-button action-button--soft border-white/20 bg-white/12 text-white"
                href="#billing-center"
              >
                История доступа
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <article className="surface-panel p-5 sm:p-6">
            <div className="mb-5">
              <p className="workspace-kicker">Информация</p>
              <h2 className="app-display mt-2 text-3xl font-semibold text-foreground">
                Личный профиль
              </h2>
            </div>

            <div className="grid gap-3">
              <Link
                className="flex items-center justify-between rounded-[1.7rem] bg-white/78 px-4 py-4 text-left text-foreground transition hover:bg-white"
                href={"/onboarding" as Route}
              >
                <span>
                  <span className="block text-base font-semibold">
                    Обновить анкету
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    Рост, вес, цели, оборудование и ограничения.
                  </span>
                </span>
                <span className="text-xl text-muted">›</span>
              </Link>

              <a
                className="flex items-center justify-between rounded-[1.7rem] bg-white/78 px-4 py-4 text-left text-foreground transition hover:bg-white"
                href="#profile-context"
              >
                <span>
                  <span className="block text-base font-semibold">
                    Контекст для рекомендаций
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    То, на чём держатся программы, питание и AI-подсказки.
                  </span>
                </span>
                <span className="text-xl text-muted">›</span>
              </a>
            </div>
          </article>

          <article className="surface-panel p-5 sm:p-6">
            <div className="mb-5">
              <p className="workspace-kicker">Данные и приватность</p>
              <h2 className="app-display mt-2 text-3xl font-semibold text-foreground">
                Быстрые действия
              </h2>
            </div>

            <div className="grid gap-3">
              <a
                className="flex items-center justify-between rounded-[1.7rem] bg-white/78 px-4 py-4 text-left text-foreground transition hover:bg-white"
                href="#data-center"
              >
                <span>
                  <span className="block text-base font-semibold">
                    Экспортировать мои данные
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    История выгрузок: {dataSnapshot.exportJobs.length}
                  </span>
                </span>
                <span className="text-xl text-muted">›</span>
              </a>

              <a
                className="flex items-center justify-between rounded-[1.7rem] bg-[color-mix(in_srgb,#ffe7e4_78%,white)] px-4 py-4 text-left text-red-700 transition hover:bg-[color-mix(in_srgb,#ffe1dd_82%,white)]"
                href="#data-center"
              >
                <span>
                  <span className="block text-base font-semibold">
                    Удалить аккаунт
                  </span>
                  <span className="mt-1 block text-sm text-red-600/85">
                    Приватность и контроль над личными данными.
                  </span>
                </span>
                <span className="text-xl text-red-400">›</span>
              </a>
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <article className="surface-panel p-5 sm:p-6" id="profile-context">
            <div className="mb-4">
              <p className="workspace-kicker">Профиль</p>
              <h2 className="app-display mt-2 text-3xl font-semibold text-foreground">
                Сессия и контекст
              </h2>
            </div>

            <div className="grid gap-3 text-sm leading-7 text-muted">
              <div className="rounded-[1.5rem] bg-white/78 px-4 py-4">
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

              <div className="rounded-[1.5rem] bg-white/78 px-4 py-4">
                <p>
                  <span className="font-semibold text-foreground">
                    Оборудование:
                  </span>{" "}
                  {viewer.onboarding?.equipment?.join(", ") || "Не указано"}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-foreground">Питание:</span>{" "}
                  {viewer.onboarding?.dietary_preferences?.join(", ") ||
                    "Не указано"}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-foreground">
                    Ограничения:
                  </span>{" "}
                  {viewer.onboarding?.injuries?.join(", ") || "Не указано"}
                </p>
              </div>
            </div>
          </article>

          <div className="grid gap-6">
            <div id="billing-center">
              <SettingsBillingCenter
                access={access}
                billing={{
                  provider: billingProvider,
                  checkoutReady: hasActiveBillingCheckoutEnv(),
                  managementReady: hasActiveBillingManagementEnv(),
                }}
                initialSnapshot={dataSnapshot}
              />
            </div>

            <div id="data-center">
              <SettingsDataCenter initialSnapshot={dataSnapshot} />
            </div>
          </div>
        </section>

        <section className="flex flex-col items-center gap-4 py-4">
          <SignOutButton className="min-w-[15rem] justify-center bg-white" />
          <div className="text-center">
            <p className="app-display text-3xl font-black tracking-[-0.08em] text-accent/22">
              fit
            </p>
            <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-muted">
              mobile first fitness workspace
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
