"use client";

import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  type LucideIcon,
  Sparkles,
} from "lucide-react";

import { DashboardNutritionCharts } from "@/components/dashboard-nutrition-charts";
import { DashboardPeriodComparison } from "@/components/dashboard-period-comparison";
import { DashboardWorkoutCharts } from "@/components/dashboard-workout-charts";
import type { AiUserContext } from "@/lib/ai/user-context";
import type {
  DashboardNutritionCharts as DashboardNutritionChartsData,
  DashboardPeriodComparison as DashboardPeriodComparisonData,
  DashboardSnapshot,
  DashboardWorkoutCharts as DashboardWorkoutChartsData,
} from "@/lib/dashboard/metrics";

type DashboardWorkspaceProps = {
  aiContext: AiUserContext;
  dashboardSourceLabel: string;
  dashboardUpdatedAt: string | null;
  nutritionCharts: DashboardNutritionChartsData;
  periodComparison: DashboardPeriodComparisonData;
  snapshot: DashboardSnapshot;
  viewerEmail: string | null;
  viewerName: string | null;
  workoutCharts: DashboardWorkoutChartsData;
};

type DashboardSectionKey = "summary" | "workouts" | "nutrition" | "ai";

type DashboardSectionOption = {
  description: string;
  icon: LucideIcon;
  key: DashboardSectionKey;
  label: string;
};

const dashboardDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
});

const sectionOptions: DashboardSectionOption[] = [
  {
    key: "summary",
    label: "Сегодня",
    description: "Главный статус дня и ближайшие действия.",
    icon: BarChart3,
  },
  {
    key: "workouts",
    label: "Тренировки",
    description: "Нагрузка, восстановление и ритм.",
    icon: Dumbbell,
  },
  {
    key: "nutrition",
    label: "Питание",
    description: "Баланс, белок и динамика рациона.",
    icon: Activity,
  },
  {
    key: "ai",
    label: "AI",
    description: "Контекст, советы и планирование.",
    icon: Sparkles,
  },
];

function formatCount(value: number) {
  return value.toLocaleString("ru-RU");
}

function formatNumber(value: number | null, suffix?: string) {
  if (value === null) {
    return "нет данных";
  }

  const formatted = value.toLocaleString("ru-RU", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  });

  return suffix ? `${formatted} ${suffix}` : formatted;
}

function getWeekCycleLabel(activePrograms: number) {
  if (activePrograms <= 0) {
    return "Пора собрать первый цикл";
  }

  return activePrograms === 1
    ? "Активен один цикл"
    : `Активны ${activePrograms} цикла`;
}

function DashboardSurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`surface-panel p-3 sm:p-4 ${className}`.trim()}>
      {children}
    </article>
  );
}

function DashboardStatPlate({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[0.78rem] border border-border/80 bg-white/84 px-2.5 py-2 shadow-[0_16px_32px_-30px_rgba(15,23,42,0.18)]">
      <span className="block truncate text-base font-semibold tracking-tight text-foreground sm:text-xl">
        {value}
      </span>
      <span className="mt-0.5 block truncate text-[0.58rem] uppercase tracking-[0.15em] text-muted sm:text-[0.68rem]">
        {label}
      </span>
    </div>
  );
}

export function DashboardWorkspace({
  aiContext,
  dashboardSourceLabel,
  dashboardUpdatedAt,
  nutritionCharts,
  periodComparison,
  snapshot,
  viewerEmail,
  viewerName,
  workoutCharts,
}: DashboardWorkspaceProps) {
  const [activeSection, setActiveSection] =
    useState<DashboardSectionKey>("summary");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const workoutPrioritySignal =
    aiContext.workoutInsights.coachingSignals[0] ?? null;
  const nutritionPrioritySignal =
    aiContext.nutritionInsights.strategy[0] ??
    aiContext.nutritionInsights.coachingSignals[0] ??
    null;

  const heroStats = useMemo(
    () => [
      {
        label: "тренировок",
        value: formatCount(snapshot.completedDays),
      },
      {
        label: "подходов",
        value: formatCount(snapshot.loggedSets),
      },
      {
        label: "дней питания",
        value: formatCount(snapshot.nutritionDays),
      },
    ],
    [snapshot.completedDays, snapshot.loggedSets, snapshot.nutritionDays],
  );

  const latestSignals = useMemo(
    () =>
      [
        workoutPrioritySignal?.action,
        nutritionPrioritySignal?.action,
        aiContext.latestBodyMetrics.weightKg === null
          ? null
          : `Последний вес: ${formatNumber(aiContext.latestBodyMetrics.weightKg, "кг")}`,
      ].filter((value): value is string => Boolean(value)),
    [
      aiContext.latestBodyMetrics.weightKg,
      nutritionPrioritySignal?.action,
      workoutPrioritySignal?.action,
    ],
  );

  const activeSectionMeta =
    sectionOptions.find((section) => section.key === activeSection) ??
    sectionOptions[0];

  const summaryIntro =
    snapshot.activePrograms > 0
      ? `Сейчас в работе ${formatCount(snapshot.activePrograms)} программ и ${formatCount(
          snapshot.completedDays,
        )} завершенных тренировок.`
      : "Пока нет активного цикла. Лучше начать с короткой недели и первого рабочего ритма.";

  function handleSectionSelect(nextSection: DashboardSectionKey) {
    setActiveSection(nextSection);
    setIsMobileMenuOpen(false);
  }

  return (
    <div className="grid gap-3 sm:gap-4">
      <section className="grid gap-3 xl:grid-cols-[1.12fr_0.88fr]">
        <DashboardSurfaceCard className="surface-panel--accent">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <span className="pill">
                {viewerName ?? "пользователь fitora"}
              </span>
              <span className="pill">
                {dashboardSourceLabel}
                {dashboardUpdatedAt
                  ? ` · ${dashboardDateFormatter.format(
                      new Date(dashboardUpdatedAt),
                    )}`
                  : ""}
              </span>
              {viewerEmail ? <span className="pill">{viewerEmail}</span> : null}
            </div>

            <div className="space-y-1.5">
              <p className="workspace-kicker text-accent-strong">
                Сегодня в фокусе
              </p>
              <h2 className="app-display text-[1.18rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[1.65rem]">
                {getWeekCycleLabel(snapshot.activePrograms)}
              </h2>
              <p className="max-w-xl text-[0.78rem] leading-5 text-foreground/75 sm:text-sm sm:leading-6">
                Короткий срез по ритму: тренировки, питание и AI-подсказка без
                лишней аналитической тяжести.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-3">
              {heroStats.map((stat) => (
                <DashboardStatPlate
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                />
              ))}
            </div>
          </div>
        </DashboardSurfaceCard>

        <div className="grid gap-4">
          <DashboardSurfaceCard>
            <p className="workspace-kicker">Следующее действие</p>
            <p className="mt-3 text-base font-semibold leading-7 text-foreground">
              {workoutPrioritySignal?.action ??
                nutritionPrioritySignal?.action ??
                "Открой тренировки и продолжай текущую неделю."}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">{summaryIntro}</p>
          </DashboardSurfaceCard>

          <DashboardSurfaceCard>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="workspace-kicker">Средняя энергия</p>
                <p className="mt-3 text-2xl font-black tracking-tight text-accent-strong">
                  {formatNumber(aiContext.nutritionInsights.avgKcalLast7)}
                  <span className="ml-2 text-lg font-medium text-muted">
                    ккал
                  </span>
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  За 7 дней. Белок:{" "}
                  {formatNumber(
                    aiContext.nutritionInsights.avgProteinLast7,
                    "г",
                  )}
                </p>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-[color-mix(in_srgb,var(--accent-soft)_26%,white)] text-accent-strong">
                <Sparkles size={18} strokeWidth={2.1} />
              </span>
            </div>
          </DashboardSurfaceCard>
        </div>
      </section>

      <section className="surface-panel surface-panel--soft p-2.5 sm:p-3">
        <div className="hidden flex-col gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <p className="workspace-kicker">Разделы обзора</p>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              Открой только нужный слой аналитики
            </h2>
          </div>

          <Link
            className="action-button action-button--primary px-4 py-2.5 text-sm"
            href={"/ai" as Route}
          >
            Открыть AI
            <ArrowRight size={16} strokeWidth={2.1} />
          </Link>
        </div>

        <div className="md:hidden">
          <button
            aria-expanded={isMobileMenuOpen}
            className="section-chip flex w-full items-center justify-between gap-2.5 px-3 py-2.5 text-left"
            data-testid="dashboard-workspace-mobile-trigger"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            type="button"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">
                Текущий раздел
              </span>
              <span className="mt-0.5 block text-sm font-semibold text-foreground">
                {activeSectionMeta.label}
              </span>
            </span>
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-soft)_24%,var(--surface-elevated))] text-accent-strong">
              {isMobileMenuOpen ? (
                <ChevronUp size={18} strokeWidth={2.1} />
              ) : (
                <ChevronDown size={18} strokeWidth={2.1} />
              )}
            </span>
          </button>

          {isMobileMenuOpen ? (
            <div className="mt-2 grid gap-1.5">
              {sectionOptions.map((section) => {
                const isActive = activeSection === section.key;
                const Icon = section.icon;

                return (
                  <button
                    aria-pressed={isActive}
                    className={`section-chip flex w-full items-start justify-between gap-2.5 px-3 py-2.5 text-left ${
                      isActive ? "section-chip--active" : ""
                    }`}
                    data-testid={`dashboard-workspace-option-${section.key}`}
                    key={section.key}
                    onClick={() => handleSectionSelect(section.key)}
                    type="button"
                  >
                    <span className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.8rem] ${
                          isActive
                            ? "bg-accent text-white"
                            : "bg-[color-mix(in_srgb,var(--accent-soft)_24%,var(--surface-elevated))] text-accent-strong"
                        }`}
                      >
                        <Icon size={17} strokeWidth={2.1} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">
                          {section.label}
                        </span>
                        <span className="mt-0.5 hidden text-xs leading-5 text-muted min-[390px]:block">
                          {section.description}
                        </span>
                      </span>
                    </span>
                    {isActive ? (
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-soft)_24%,var(--surface-elevated))] text-accent-strong">
                        <Check size={16} strokeWidth={2.1} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mt-0 hidden flex-wrap gap-2 md:flex">
          {sectionOptions.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.key;

            return (
              <button
                aria-pressed={isActive}
                className={`section-chip w-full px-3.5 py-2.5 text-left md:min-w-[11rem] md:w-auto ${
                  isActive ? "section-chip--active" : ""
                }`}
                key={section.key}
                onClick={() => handleSectionSelect(section.key)}
                type="button"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-[0.95rem] ${
                      isActive
                        ? "bg-accent text-white"
                        : "bg-[color-mix(in_srgb,var(--accent-soft)_24%,white)] text-accent-strong"
                    }`}
                  >
                    <Icon size={18} strokeWidth={2.1} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {section.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted">
                      {section.description}
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {activeSection === "summary" ? (
        <div className="grid gap-4 sm:gap-5">
          <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <DashboardSurfaceCard>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="workspace-kicker">Активный план</p>
                  <h3 className="app-display mt-2 text-xl font-semibold text-foreground sm:text-2xl">
                    {snapshot.activePrograms > 0
                      ? "План уже в работе"
                      : "Время собрать первую неделю"}
                  </h3>
                </div>
                <span className="pill">
                  {workoutCharts.recovery.goalDaysPerWeek === null
                    ? "цель не задана"
                    : `${workoutCharts.recovery.goalDaysPerWeek} дня в неделю`}
                </span>
              </div>

              <p className="mt-5 text-sm leading-7 text-muted">
                {summaryIntro}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="athletic-module-card">
                  <p className="workspace-kicker">Следующий фокус</p>
                  <p className="mt-3 text-base font-semibold text-foreground">
                    {workoutPrioritySignal?.action ??
                      "Открой программу и продолжай рабочую неделю."}
                  </p>
                </div>
                <div className="athletic-module-card">
                  <p className="workspace-kicker">Recovery</p>
                  <p className="mt-3 text-base font-semibold text-foreground">
                    {formatNumber(workoutCharts.recovery.consistencyRatio, "%")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Доля недель, где тренировочный ритм совпадает с целью.
                  </p>
                </div>
              </div>

              <Link
                className="action-button action-button--primary mt-5 w-full justify-center px-4 py-3 text-sm sm:w-auto"
                href={"/workouts" as Route}
              >
                Открыть тренировки
                <ArrowRight size={16} strokeWidth={2.1} />
              </Link>
            </DashboardSurfaceCard>

            <DashboardSurfaceCard>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="workspace-kicker">Короткие сигналы</p>
                  <h3 className="app-display mt-2 text-xl font-semibold text-foreground sm:text-2xl">
                    Что важно не потерять сегодня
                  </h3>
                </div>
                <span className="pill">
                  {latestSignals.length > 0
                    ? `${latestSignals.length} сигнала`
                    : "ожидаются"}
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                {latestSignals.length > 0 ? (
                  latestSignals.map((signal) => (
                    <div className="athletic-note-row" key={signal}>
                      {signal}
                    </div>
                  ))
                ) : (
                  <div className="athletic-note-row">
                    Как только появятся новые логи и свежие записи, здесь будет
                    короткая сводка по нагрузке и питанию.
                  </div>
                )}
              </div>
            </DashboardSurfaceCard>
          </section>

          <DashboardPeriodComparison
            initialMetrics={periodComparison}
            initialPeriod="30d"
          />
        </div>
      ) : null}

      {activeSection === "workouts" ? (
        <DashboardWorkoutCharts charts={workoutCharts} />
      ) : null}

      {activeSection === "nutrition" ? (
        <DashboardNutritionCharts charts={nutritionCharts} />
      ) : null}

      {activeSection === "ai" ? (
        <section className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
          <DashboardSurfaceCard className="border-l-4 border-l-accent">
            <p className="workspace-kicker text-accent-strong">AI-коуч</p>
            <h3 className="app-display mt-3 text-xl font-semibold text-foreground sm:text-2xl">
              Контекст уже собран для следующего решения
            </h3>
            <p className="mt-4 text-base leading-8 text-foreground sm:text-lg">
              {nutritionPrioritySignal?.summary ??
                workoutPrioritySignal?.summary ??
                "Открой AI, чтобы получить короткий разбор или новый черновик плана."}
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="athletic-module-card">
                <p className="workspace-kicker">Что учитывается</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Тоннаж, рабочие веса, RPE, питание, белок, замеры тела и
                  персональные ограничения.
                </p>
              </div>
              <div className="athletic-module-card">
                <p className="workspace-kicker">Что можно сделать</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Собрать новый план, запросить совет или применить
                  подтвержденное предложение внутри приложения.
                </p>
              </div>
            </div>
          </DashboardSurfaceCard>

          <DashboardSurfaceCard>
            <p className="workspace-kicker">Следующий шаг</p>
            <h3 className="app-display mt-3 text-xl font-semibold text-foreground sm:text-2xl">
              Перейти в AI и довести решение до применения
            </h3>

            <div className="mt-5 grid gap-3">
              <div className="athletic-note-row">
                Тренировочный и пищевой контекст уже в системе, поэтому не
                нужно заново объяснять базу.
              </div>
              <div className="athletic-note-row">
                Если нужен новый план, используй чат и proposal flow. Черновик
                появится в рабочем сценарии.
              </div>
            </div>

            <Link
              className="action-button action-button--primary mt-5 w-full justify-center px-4 py-3 text-sm"
              href={"/ai" as Route}
            >
              Открыть AI-коуча
              <ArrowRight size={16} strokeWidth={2.1} />
            </Link>
          </DashboardSurfaceCard>
        </section>
      ) : null}
    </div>
  );
}
