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
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const sectionOptions = [
  {
    key: "summary",
    label: "Сводка",
    description: "Главные цифры и сравнение периодов.",
    icon: BarChart3,
  },
  {
    key: "workouts",
    label: "Тренировки",
    description: "Силовая аналитика и детали по сессиям.",
    icon: Dumbbell,
  },
  {
    key: "nutrition",
    label: "Питание",
    description: "Рацион, восстановление и пищевые привычки.",
    icon: Activity,
  },
  {
    key: "ai",
    label: "AI",
    description: "Что коуч уже видит и какой следующий шаг.",
    icon: Sparkles,
  },
] as const satisfies Array<{
  key: DashboardSectionKey;
  label: string;
  description: string;
  icon: typeof BarChart3;
}>;

function formatCount(value: number) {
  return value.toLocaleString("ru-RU");
}

function formatNumber(value: number | null, suffix?: string) {
  if (value === null) {
    return "нет данных";
  }

  const formatted = value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });

  return suffix ? `${formatted} ${suffix}` : formatted;
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
      className={`w-full rounded-3xl border px-4 py-3 text-left transition md:min-w-[13rem] md:w-auto ${
        active
          ? "border-accent/20 bg-[color-mix(in_srgb,var(--accent-soft)_78%,white)] text-foreground shadow-[0_16px_38px_-34px_rgba(20,97,75,0.22)]"
          : "border-border bg-white/72 text-foreground hover:bg-white"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
            active
              ? "border border-accent/15 bg-[color-mix(in_srgb,var(--accent-soft)_72%,white)] text-accent"
              : "bg-accent/8 text-accent"
          }`}
        >
          <Icon size={18} strokeWidth={2.2} />
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

function SummaryDetailCard({
  title,
  summary,
  action,
}: {
  title: string;
  summary: string;
  action: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-white/76 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{summary}</p>
      <p className="mt-3 text-sm font-medium text-foreground">
        Следующий шаг: {action}
      </p>
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

  const metricCards = useMemo(
    () => [
      {
        label: "Активные недели",
        value: formatCount(snapshot.activePrograms),
        note: "программа в работе",
      },
      {
        label: "Тренировок закрыто",
        value: formatCount(snapshot.completedDays),
        note: "по факту выполнено",
      },
      {
        label: "Подходов записано",
        value: formatCount(snapshot.loggedSets),
        note: "история уже накоплена",
      },
      {
        label: "Дней питания",
        value: formatCount(snapshot.nutritionDays),
        note: "есть живые логи",
      },
    ],
    [snapshot],
  );

  const workoutPrioritySignal =
    aiContext.workoutInsights.coachingSignals[0] ?? null;
  const nutritionPrioritySignal =
    aiContext.nutritionInsights.strategy[0] ??
    aiContext.nutritionInsights.coachingSignals[0] ??
    null;
  const activeSectionMeta =
    sectionOptions.find((section) => section.key === activeSection) ??
    sectionOptions[0];

  function handleSectionSelect(nextSection: DashboardSectionKey) {
    setActiveSection(nextSection);
    setIsMobileMenuOpen(false);
  }

  return (
    <>
      <section className="card overflow-hidden p-5 sm:p-6 lg:p-8">
        <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="pill">{viewerName ?? "fit"}</span>
              <span className="pill">{viewerEmail ?? "Аккаунт"}</span>
              <span className="pill">
                {dashboardSourceLabel}{" "}
                {dashboardUpdatedAt
                  ? dashboardDateFormatter.format(new Date(dashboardUpdatedAt))
                  : "только что"}
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="max-w-4xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Весь прогресс под рукой, без длинной прокрутки и перегруженных
                отчётов.
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
                Здесь остаются только нужные секции: краткая сводка, силовая
                аналитика, питание и AI-коуч. На телефоне они открываются как
                удобное меню разделов, а не как длинная лента блоков.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <article className="rounded-3xl border border-border bg-white/76 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Текущий ритм тренировок
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {aiContext.workoutInsights.completedDaysLast28} тренировок и{" "}
                  {aiContext.workoutInsights.loggedSetsLast28} рабочих подходов
                  за последние 28 дней.
                </p>
                <p className="mt-3 text-sm font-medium text-foreground">
                  Средний рабочий объём:{" "}
                  {formatNumber(aiContext.workoutInsights.avgActualReps)}
                </p>
              </article>

              <article className="rounded-3xl border border-border bg-white/76 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Текущий ритм питания
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {aiContext.nutritionInsights.daysTrackedLast7} дней логов за
                  неделю, средние калории{" "}
                  {formatNumber(aiContext.nutritionInsights.avgKcalLast7)} и
                  белок{" "}
                  {formatNumber(
                    aiContext.nutritionInsights.avgProteinLast7,
                    "г",
                  )}
                  .
                </p>
                <p className="mt-3 text-sm font-medium text-foreground">
                  AI уже использует эти данные в новых рекомендациях.
                </p>
              </article>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {metricCards.map((metric) => (
              <article
                className="rounded-3xl border border-border bg-white/80 p-4 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.28)]"
                key={metric.label}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-foreground">
                  {metric.value}
                </p>
                <p className="mt-2 text-sm text-muted">{metric.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Разделы дашборда
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Открывай только тот слой аналитики, который нужен сейчас
            </h2>
          </div>

          <Link
            className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-[color-mix(in_srgb,var(--accent-soft)_72%,white)] px-4 py-2 text-sm font-semibold text-accent transition hover:bg-white"
            href={"/ai" as Route}
          >
            Открыть AI
            <ArrowRight size={16} strokeWidth={2.2} />
          </Link>
        </div>

        <div className="mt-4 md:hidden">
          <button
            aria-expanded={isMobileMenuOpen}
            className="flex w-full items-center justify-between gap-3 rounded-3xl border border-border bg-white/82 px-4 py-3 text-left shadow-[0_18px_45px_-35px_rgba(20,97,75,0.25)] transition hover:bg-white"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            type="button"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-xs uppercase tracking-[0.18em] text-muted">
                Раздел дашборда
              </span>
              <span className="mt-1 block text-sm font-semibold text-foreground">
                {activeSectionMeta.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {activeSectionMeta.description}
              </span>
            </span>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white/85 text-foreground">
              {isMobileMenuOpen ? (
                <ChevronUp size={18} strokeWidth={2.2} />
              ) : (
                <ChevronDown size={18} strokeWidth={2.2} />
              )}
            </span>
          </button>

          {isMobileMenuOpen ? (
            <div className="mt-3 grid gap-2 rounded-3xl border border-border bg-[color-mix(in_srgb,var(--surface)_94%,white)] p-3">
              {sectionOptions.map((section) => {
                const isActive = activeSection === section.key;
                const Icon = section.icon;

                return (
                  <button
                    aria-pressed={isActive}
                    className={`flex items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                      isActive
                        ? "border-accent/20 bg-[color-mix(in_srgb,var(--accent-soft)_72%,white)] text-foreground"
                        : "border-transparent bg-white/72 text-foreground hover:bg-white"
                    }`}
                    key={section.key}
                    onClick={() => handleSectionSelect(section.key)}
                    type="button"
                  >
                    <span className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                          isActive
                            ? "border border-accent/15 bg-[color-mix(in_srgb,var(--accent-soft)_72%,white)] text-accent"
                            : "bg-accent/8 text-accent"
                        }`}
                      >
                        <Icon size={17} strokeWidth={2.2} />
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
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
                        <Check size={16} strokeWidth={2.3} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mt-4 hidden gap-3 md:flex md:flex-wrap">
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
            <article className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                    Сводка по темпу
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">
                    Главный фокус на ближайшие дни
                  </h3>
                </div>
                <span className="pill">
                  {workoutCharts.recovery.goalDaysPerWeek === null
                    ? "цель по дням не задана"
                    : `${workoutCharts.recovery.goalDaysPerWeek} трен. в неделю`}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <SummaryDetailCard
                  action={
                    workoutPrioritySignal?.action ??
                    "Продолжай логировать тренировки и рабочие подходы."
                  }
                  summary={
                    workoutPrioritySignal?.summary ??
                    "После первых завершённых сессий здесь появится готовый сигнал по нагрузке и восстановлению."
                  }
                  title="По тренировкам"
                />
                <SummaryDetailCard
                  action={
                    nutritionPrioritySignal?.action ??
                    "Стабилизируй дневные логи и ключевые приёмы пищи."
                  }
                  summary={
                    nutritionPrioritySignal?.summary ??
                    "Как только логов станет больше, здесь появится приоритетная рекомендация по рациону."
                  }
                  title="По питанию"
                />
              </div>
            </article>

            <article className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                    AI-контекст
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">
                    Что коуч уже понимает без ручных пояснений
                  </h3>
                </div>
                <span className="pill">
                  {aiContext.latestBodyMetrics.weightKg === null
                    ? "без свежего веса"
                    : formatNumber(aiContext.latestBodyMetrics.weightKg, "кг")}
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-3xl border border-border bg-white/76 p-4 text-sm leading-6 text-muted">
                  Частота и объём тренировок уже попадают в AI-контекст вместе с
                  тоннажом, лучшими подходами, RPE, отдыхом и заметками по
                  сессиям.
                </div>
                <div className="rounded-3xl border border-border bg-white/76 p-4 text-sm leading-6 text-muted">
                  Питание тоже учитывается не только по КБЖУ, но и по частоте
                  логов, привычкам, повторяющимся продуктам и стратегии, которую
                  реально можно внедрить.
                </div>
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/25 bg-accent-soft px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-white"
                  href={"/ai#proposal-studio" as Route}
                >
                  Перейти в AI и собрать новый план
                  <ArrowRight size={16} strokeWidth={2.2} />
                </Link>
              </div>
            </article>
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
          <article className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                  AI-коуч
                </p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                  Вся история уже готова для диалога и новых планов
                </h2>
              </div>
              <span className="pill">
                {aiContext.workoutInsights.completedDaysLast28} тренировки /{" "}
                {aiContext.nutritionInsights.daysTrackedLast7} дней питания
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <article className="rounded-3xl border border-border bg-white/78 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Что ассистент уже использует
                </p>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
                  <li>Тоннаж, рабочие веса, RPE и сигналы по восстановлению.</li>
                  <li>Калории, белок, пищевые привычки и стратегию по рациону.</li>
                  <li>Цели, последние замеры тела и персональные ограничения.</li>
                </ul>
              </article>

              <article className="rounded-3xl border border-border bg-white/78 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Что можно сделать одним действием
                </p>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
                  <li>Собрать новую программу тренировок или питания.</li>
                  <li>Запросить совет по прогрессии нагрузки и восстановлению.</li>
                  <li>Сразу применить готовое предложение в приложение.</li>
                </ul>
              </article>
            </div>
          </article>

          <article className="card p-5 sm:p-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                Следующий шаг
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                Открывай AI, если нужен новый план, совет или быстрый разбор
              </h2>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-3xl border border-border bg-white/78 p-4 text-sm leading-6 text-muted">
                Если нужна новая программа, ассистент уже подхватит историю
                нагрузок, питание, recovery-сигналы и ограничения без ручного
                копирования данных.
              </div>
              <div className="rounded-3xl border border-border bg-white/78 p-4 text-sm leading-6 text-muted">
                Если нужен точечный совет, AI уже видит, где держится ритм, где
                питание попадает в цель и где сейчас узкое место.
              </div>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                href={"/ai" as Route}
              >
                Открыть AI-коуча
                <ArrowRight size={16} strokeWidth={2.2} />
              </Link>
            </div>
          </article>
        </section>
      ) : null}
    </>
  );
}
