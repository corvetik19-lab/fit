"use client";

import { useState, useTransition } from "react";

import type { DashboardPeriodComparison } from "@/lib/dashboard/metrics";
import { PanelCard } from "@/components/panel-card";

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "90 дней" },
] as const;

type PeriodValue = (typeof PERIOD_OPTIONS)[number]["value"];

type DashboardPeriodComparisonProps = {
  initialPeriod: PeriodValue;
  initialMetrics: DashboardPeriodComparison;
};

type ComparisonCardProps = {
  title: string;
  description: string;
  valueSuffix?: string;
  metric: DashboardPeriodComparison[keyof DashboardPeriodComparison];
};

function formatMetricValue(value: number, suffix?: string) {
  const formatted = value.toLocaleString("ru-RU");
  return suffix ? `${formatted} ${suffix}` : formatted;
}

function formatDelta(delta: number, suffix?: string) {
  const absolute = formatMetricValue(Math.abs(delta), suffix);

  if (delta === 0) {
    return `без изменений (${absolute})`;
  }

  return delta > 0 ? `+${absolute}` : `-${absolute}`;
}

function getDeltaTone(delta: number) {
  if (delta > 0) {
    return "text-emerald-300";
  }

  if (delta < 0) {
    return "text-rose-300";
  }

  return "text-muted";
}

function ComparisonBars({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const maxValue = Math.max(current, previous, 1);
  const currentWidth = `${Math.max((current / maxValue) * 100, current > 0 ? 8 : 0)}%`;
  const previousWidth = `${Math.max((previous / maxValue) * 100, previous > 0 ? 8 : 0)}%`;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Текущий период</span>
          <span>{current.toLocaleString("ru-RU")}</span>
        </div>
        <div className="h-2 rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
            style={{ width: currentWidth }}
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Предыдущий период</span>
          <span>{previous.toLocaleString("ru-RU")}</span>
        </div>
        <div className="h-2 rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-white/35 transition-[width] duration-300"
            style={{ width: previousWidth }}
          />
        </div>
      </div>
    </div>
  );
}

function ComparisonCard({
  title,
  description,
  valueSuffix,
  metric,
}: ComparisonCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-black/10 p-5">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-2 text-xs leading-6 text-muted">{description}</p>

      <p className="mt-5 text-3xl font-semibold text-foreground">
        {formatMetricValue(metric.current, valueSuffix)}
      </p>
      <p className={`mt-2 text-sm font-medium ${getDeltaTone(metric.delta)}`}>
        {formatDelta(metric.delta, valueSuffix)}
      </p>

      <div className="mt-5">
        <ComparisonBars current={metric.current} previous={metric.previous} />
      </div>
    </article>
  );
}

async function loadComparison(period: PeriodValue) {
  const baseline = period;
  const response = await fetch(
    `/api/dashboard/period-compare?period=${period}&baseline=${baseline}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Не удалось обновить сравнение периодов.");
  }

  const payload = (await response.json()) as {
    data: {
      period: PeriodValue;
      metrics: DashboardPeriodComparison;
    };
  };

  return payload.data;
}

export function DashboardPeriodComparison({
  initialPeriod,
  initialMetrics,
}: DashboardPeriodComparisonProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodValue>(initialPeriod);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePeriodChange(period: PeriodValue) {
    if (period === selectedPeriod) {
      return;
    }

    startTransition(async () => {
      try {
        setErrorMessage(null);
        const nextData = await loadComparison(period);
        setSelectedPeriod(nextData.period);
        setMetrics(nextData.metrics);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Не удалось обновить сравнение периодов.",
        );
      }
    });
  }

  return (
    <PanelCard
      caption={`${selectedPeriod} против предыдущего периода`}
      title="Сравнение периодов"
    >
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((option) => {
          const isActive = option.value === selectedPeriod;

          return (
            <button
              className={
                isActive
                  ? "rounded-full border border-[var(--accent)] bg-[var(--accent)]/15 px-4 py-2 text-sm font-medium text-foreground"
                  : "rounded-full border border-white/10 px-4 py-2 text-sm text-muted transition hover:border-white/20 hover:text-foreground"
              }
              disabled={isPending}
              key={option.value}
              onClick={() => handlePeriodChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 text-sm text-muted">
        <p>
          Текущий период сравнивается с предыдущим интервалом такой же длины.
        </p>
        <p>{isPending ? "Обновление..." : "Данные синхронизированы"}</p>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ComparisonCard
          description="Завершённые тренировочные дни за выбранный интервал."
          metric={metrics.workoutsCompleted}
          title="Тренировки"
        />
        <ComparisonCard
          description="Сумма калорий из дневных сводок по питанию."
          metric={metrics.caloriesTracked}
          title="Калории"
          valueSuffix="ккал"
        />
        <ComparisonCard
          description="Количество чат-сессий, записанных в AI-контур."
          metric={metrics.aiSessions}
          title="AI-сессии"
        />
      </div>
    </PanelCard>
  );
}
