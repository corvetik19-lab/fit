"use client";

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

const dashboardDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
});

const sectionOptions = [
  {
    key: "summary",
    label: "Сводка",
    description: "Главные цифры и состояние дня.",
    icon: BarChart3,
  },
  {
    key: "workouts",
    label: "Тренировки",
    description: "Силовой объём, восстановление и ритм.",
    icon: Dumbbell,
  },
  {
    key: "nutrition",
    label: "Питание",
    description: "Калории, белок и дневной контроль.",
    icon: Activity,
  },
  {
    key: "ai",
    label: "AI",
    description: "Контекст коуча и следующий шаг.",
    icon: Sparkles,
  },
] as const satisfies Array<{
  description: string;
  icon: typeof BarChart3;
  key: DashboardSectionKey;
  label: string;
}>;

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
    return "Готов к старту";
  }

  return activePrograms === 1
    ? "1 активный цикл"
    : `${activePrograms} активных цикла`;
}

function SectionButton({
  active,
  description,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  icon: typeof BarChart3;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`section-chip w-full px-4 py-3 text-left md:min-w-[12.5rem] md:w-auto ${
        active ? "section-chip--active" : ""
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
            active ? "bg-accent text-white" : "bg-[color-mix(in_srgb,var(--accent-soft)_40%,white)] text-accent"
          }`}
        >
          <Icon size={18} strokeWidth={2.1} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{label}</span>
          <span className="mt-1 block text-xs leading-5 text-muted">
            {description}
          </span>
        </span>
      </div>
    </button>
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
    <div className="athletic-data-plate">
      <span className="athletic-data-plate__value">{value}</span>
      <span className="athletic-data-plate__label">{label}</span>
    </div>
  );
}

function DashboardSurfaceCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={`surface-panel p-5 sm:p-6 ${className}`.trim()}>
      {children}
    </article>
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
    [aiContext.latestBodyMetrics.weightKg, nutritionPrioritySignal?.action, workoutPrioritySignal?.action],
  );

  const activeSectionMeta =
    sectionOptions.find((section) => section.key === activeSection) ??
    sectionOptions[0];

  function handleSectionSelect(nextSection: DashboardSectionKey) {
    setActiveSection(nextSection);
    setIsMobileMenuOpen(false);
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="athletic-hero-card p-6 sm:p-7">
          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="athletic-hero-chip">
                {viewerName ?? "fit athlete"}
              </span>
              <span className="athletic-hero-chip">
                {dashboardSourceLabel}
                {dashboardUpdatedAt
                  ? ` · ${dashboardDateFormatter.format(new Date(dashboardUpdatedAt))}`
                  : ""}
              </span>
              {viewerEmail ? (
                <span className="athletic-hero-chip">{viewerEmail}</span>
              ) : null}
            </div>

            <div className="space-y-3">
              <p className="workspace-kicker text-white/74">Статус прогресса</p>
              <h2 className="athletic-hero-title">
                Текущий цикл:
                <br />
                {getWeekCycleLabel(snapshot.activePrograms)}
              </h2>
              <p className="max-w-xl text-sm leading-7 text-white/78 sm:text-base">
                В одном экране собраны тренировочный темп, питание и AI-контекст.
                Никакого лишнего шума — только то, что помогает держать ритм.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {heroStats.map((stat) => (
                <DashboardStatPlate
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                />
              ))}
            </div>
          </div>
        </article>

        <div className="grid gap-5">
          <DashboardSurfaceCard className="flex items-center justify-between gap-4">
            <div>
              <p className="workspace-kicker">Энергия</p>
              <p className="mt-3 text-5xl font-black tracking-tight text-accent">
                {formatNumber(aiContext.nutritionInsights.avgKcalLast7)}
                <span className="ml-2 text-xl font-medium text-muted">ккал</span>
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">
                Средняя энергия за последние 7 дней. Белок:{" "}
                {formatNumber(aiContext.nutritionInsights.avgProteinLast7, "г")}
              </p>
            </div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent-soft)_48%,white)] text-accent">
              <Sparkles size={22} strokeWidth={2.1} />
            </div>
          </DashboardSurfaceCard>

          <DashboardSurfaceCard className="relative overflow-hidden border-l-4 border-l-accent">
            <p className="workspace-kicker text-accent">Интеллект fit</p>
            <p className="mt-4 text-lg leading-9 text-foreground sm:text-2xl sm:leading-11">
              “
              {workoutPrioritySignal?.summary ??
                nutritionPrioritySignal?.summary ??
                "AI уже готов собрать первую рекомендацию по нагрузке и восстановлению."}
              ”
            </p>
          </DashboardSurfaceCard>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="workspace-kicker">Разделы обзора</p>
            <h2 className="app-display mt-2 text-2xl font-semibold text-foreground">
              Открывай только тот слой аналитики, который нужен прямо сейчас
            </h2>
          </div>

          <Link
            className="action-button action-button--primary px-4 py-3 text-sm"
            href={"/ai" as Route}
          >
            Открыть AI
            <ArrowRight size={16} strokeWidth={2.1} />
          </Link>
        </div>

        <div className="mt-4 md:hidden">
          <button
            aria-expanded={isMobileMenuOpen}
            className="section-chip flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            data-testid="dashboard-workspace-mobile-trigger"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            type="button"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-xs uppercase tracking-[0.18em] text-muted">
                Текущий раздел
              </span>
              <span className="mt-1 block text-sm font-semibold text-foreground">
                {activeSectionMeta.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {activeSectionMeta.description}
              </span>
            </span>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-soft)_42%,white)] text-accent">
              {isMobileMenuOpen ? (
                <ChevronUp size={18} strokeWidth={2.1} />
              ) : (
                <ChevronDown size={18} strokeWidth={2.1} />
              )}
            </span>
          </button>

          {isMobileMenuOpen ? (
            <div className="mt-3 grid gap-2">
              {sectionOptions.map((section) => {
                const isActive = activeSection === section.key;
                const Icon = section.icon;

                return (
                  <button
                    aria-pressed={isActive}
                    className={`section-chip flex w-full items-start justify-between gap-3 px-3 py-3 text-left ${
                      isActive ? "section-chip--active" : ""
                    }`}
                    data-testid={`dashboard-workspace-option-${section.key}`}
                    key={section.key}
                    onClick={() => handleSectionSelect(section.key)}
                    type="button"
                  >
                    <span className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                          isActive
                            ? "bg-accent text-white"
                            : "bg-[color-mix(in_srgb,var(--accent-soft)_40%,white)] text-accent"
                        }`}
                      >
                        <Icon size={17} strokeWidth={2.1} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">
                          {section.label}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-muted">
                          {section.description}
                        </span>
                      </span>
                    </span>
                    {isActive ? (
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-soft)_42%,white)] text-accent">
                        <Check size={16} strokeWidth={2.1} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mt-4 hidden flex-wrap gap-3 md:flex">
          {sectionOptions.map((section) => (
            <SectionButton
              active={activeSection === section.key}
              description={section.description}
              icon={section.icon}
              key={section.key}
              label={section.label}
              onClick={() => handleSectionSelect(section.key)}
            />
          ))}
        </div>
      </section>

      {activeSection === "summary" ? (
        <div className="grid gap-6">
          <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <DashboardSurfaceCard>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="workspace-kicker">Активный план</p>
                  <h3 className="app-display mt-2 text-3xl font-semibold text-foreground">
                    {snapshot.activePrograms > 0
                      ? "План уже в работе"
                      : "Время собрать первый цикл"}
                  </h3>
                </div>
                <span className="pill">
                  {workoutCharts.recovery.goalDaysPerWeek === null
                    ? "цель не задана"
                    : `${workoutCharts.recovery.goalDaysPerWeek} дня в неделю`}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <p className="text-sm leading-7 text-muted">
                  {snapshot.activePrograms > 0
                    ? `Сейчас у тебя ${formatCount(snapshot.activePrograms)} активных программы и ${formatCount(snapshot.completedDays)} закрытых тренировок. Держи ритм и открывай следующий день без лишних кликов.`
                    : "Открой конструктор недели, собери первую тренировочную сетку и начни вести выполнение в одном ритме с питанием и AI-коучем."}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="athletic-module-card">
                    <p className="workspace-kicker">Следующий фокус</p>
                    <p className="mt-3 text-base font-semibold text-foreground">
                      {workoutPrioritySignal?.action ??
                        "Собери или продолжай рабочую неделю тренировок."}
                    </p>
                  </div>
                  <div className="athletic-module-card">
                    <p className="workspace-kicker">Recovery</p>
                    <p className="mt-3 text-base font-semibold text-foreground">
                      {formatNumber(workoutCharts.recovery.consistencyRatio, "%")}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      Доля недель, где тренировочный ритм совпадает с целью.
                    </p>
                  </div>
                </div>

                <Link
                  className="action-button action-button--primary w-full justify-center px-5 py-4 text-sm sm:w-auto"
                  href={"/workouts" as Route}
                >
                  Открыть тренировки
                  <ArrowRight size={16} strokeWidth={2.1} />
                </Link>
              </div>
            </DashboardSurfaceCard>

            <DashboardSurfaceCard>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="workspace-kicker">Последние сигналы</p>
                  <h3 className="app-display mt-2 text-3xl font-semibold text-foreground">
                    Что важно не потерять сегодня
                  </h3>
                </div>
                <span className="pill">
                  {latestSignals.length > 0 ? `${latestSignals.length} сигнала` : "ожидаются"}
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
                    Как только появятся новые логы и свежие записи, здесь появится короткая сводка по нагрузке и питанию.
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
        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <DashboardSurfaceCard className="border-l-4 border-l-accent">
            <p className="workspace-kicker text-accent">AI коуч</p>
            <h3 className="app-display mt-3 text-3xl font-semibold text-foreground">
              Вся история уже собрана для следующего решения
            </h3>
            <p className="mt-4 text-lg leading-9 text-foreground">
              “
              {nutritionPrioritySignal?.summary ??
                workoutPrioritySignal?.summary ??
                "Открой AI, чтобы быстро получить следующий план или короткий разбор по текущему ритму."}
              ”
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="athletic-module-card">
                <p className="workspace-kicker">Что уже учитывается</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Тоннаж, рабочие веса, RPE, питание, калории, белок, свежие замеры тела и персональные ограничения.
                </p>
              </div>
              <div className="athletic-module-card">
                <p className="workspace-kicker">Что можно сделать</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Собрать новый план, запросить точечный совет или сразу применить подтверждённое предложение.
                </p>
              </div>
            </div>
          </DashboardSurfaceCard>

          <DashboardSurfaceCard>
            <p className="workspace-kicker">Следующий шаг</p>
            <h3 className="app-display mt-3 text-3xl font-semibold text-foreground">
              Перейти в AI и довести решение до применения
            </h3>

            <div className="mt-5 grid gap-3">
              <div className="athletic-note-row">
                Тренировочный и пищевой контекст уже в системе, поэтому AI не нужно заново объяснять базу.
              </div>
              <div className="athletic-note-row">
                Если нужен новый план, используй чат и proposal flow — черновик сразу появится в рабочем сценарии.
              </div>
            </div>

            <Link
              className="action-button action-button--primary mt-5 w-full justify-center px-5 py-4 text-sm"
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
