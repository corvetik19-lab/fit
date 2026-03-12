"use client";

import { useMemo, useState } from "react";

import { PanelCard } from "@/components/panel-card";
import type { DashboardWorkoutCharts as DashboardWorkoutChartsData } from "@/lib/dashboard/metrics";

type WorkoutMetricKey = "completedDays" | "loggedSets" | "tonnageKg";

const sessionDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

function formatMetricValue(value: number) {
  return value.toLocaleString("ru-RU");
}

function formatDecimal(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

function formatKg(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return `${value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })} кг`;
}

function formatWorkoutDate(value: string | null) {
  if (!value) {
    return "нет данных";
  }

  return sessionDateFormatter.format(new Date(value));
}

function formatDays(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return `${formatMetricValue(value)} дн.`;
}

function formatConsistency(value: number | null) {
  if (value === null) {
    return "нет цели";
  }

  return `${Math.round(value * 100)}%`;
}

function formatShare(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return `${Math.round(value * 100)}%`;
}

function getRecoveryBadge(status: DashboardWorkoutChartsData["recovery"]["status"]) {
  switch (status) {
    case "fresh":
      return {
        label: "ритм сильный",
        className: "border-emerald-300/70 bg-emerald-50 text-emerald-700",
      };
    case "steady":
      return {
        label: "ритм стабильный",
        className: "border-sky-300/70 bg-sky-50 text-sky-700",
      };
    default:
      return {
        label: "нужно внимание",
        className: "border-amber-300/70 bg-amber-50 text-amber-700",
      };
  }
}

function getMomentumBadge(momentum: "up" | "stable" | "down") {
  switch (momentum) {
    case "up":
      return {
        label: "растёт",
        className: "border-emerald-300/70 bg-emerald-50 text-emerald-700",
      };
    case "down":
      return {
        label: "просел",
        className: "border-amber-300/70 bg-amber-50 text-amber-700",
      };
    default:
      return {
        label: "ровно",
        className: "border-slate-300/70 bg-slate-50 text-slate-700",
      };
  }
}

function getCoachingSignalBadge(
  status: DashboardWorkoutChartsData["coachingSignals"][number]["status"],
) {
  switch (status) {
    case "positive":
      return {
        label: "можно усиливать",
        className: "border-emerald-300/70 bg-emerald-50 text-emerald-700",
      };
    case "watch":
      return {
        label: "держать под контролем",
        className: "border-sky-300/70 bg-sky-50 text-sky-700",
      };
    default:
      return {
        label: "нужно вмешательство",
        className: "border-amber-300/70 bg-amber-50 text-amber-700",
      };
  }
}

function WorkoutSummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-3xl border border-border bg-white/70 p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
    </article>
  );
}

function CoachingSignalCard({
  signal,
}: {
  signal: DashboardWorkoutChartsData["coachingSignals"][number];
}) {
  const badge = getCoachingSignalBadge(signal.status);

  return (
    <article className="rounded-3xl border border-border bg-white/78 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{signal.title}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{signal.metric}</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>
      <p className="mt-4 text-sm leading-7 text-muted">{signal.summary}</p>
      <div className="mt-4 rounded-2xl border border-border/70 bg-white/88 px-4 py-4 text-sm text-muted">
        <p className="font-semibold text-foreground">Следующий шаг</p>
        <p className="mt-2 leading-7">{signal.action}</p>
      </div>
    </article>
  );
}

function WorkoutTrendChart({
  colorClassName,
  metricKey,
  points,
  selectedIndex,
  onSelect,
  title,
  description,
}: {
  colorClassName: string;
  metricKey: WorkoutMetricKey;
  points: DashboardWorkoutChartsData["weeklyTrend"];
  selectedIndex: number;
  onSelect: (index: number) => void;
  title: string;
  description: string;
}) {
  const values = points.map((point) => point[metricKey]);
  const maxValue = Math.max(...values, 1);
  const latestValue = values.at(-1) ?? 0;
  const previousValue = values.at(-2) ?? 0;
  const delta = latestValue - previousValue;

  return (
    <section className="rounded-3xl border border-border bg-white/55 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-2 text-xs leading-6 text-muted">{description}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold text-foreground">
            {metricKey === "tonnageKg" ? formatKg(latestValue) : formatMetricValue(latestValue)}
          </p>
          <p className="mt-2 text-xs text-muted">
            {delta === 0
              ? "Без изменений к прошлой неделе"
              : delta > 0
                ? `+${metricKey === "tonnageKg" ? formatKg(delta) : formatMetricValue(delta)} к прошлой неделе`
                : `${metricKey === "tonnageKg" ? formatKg(delta) : formatMetricValue(delta)} к прошлой неделе`}
          </p>
        </div>
      </div>

      <div className="mt-6 grid h-52 grid-cols-8 items-end gap-3">
        {points.map((point, index) => {
          const value = point[metricKey];
          const height = value > 0 ? Math.max((value / maxValue) * 100, 12) : 8;
          const isSelected = index === selectedIndex;

          return (
            <button
              className="flex h-full flex-col justify-end rounded-2xl px-1 text-left outline-none transition hover:bg-white/40 focus-visible:ring-2 focus-visible:ring-accent/20"
              key={`${title}-${point.label}`}
              onClick={() => onSelect(index)}
              type="button"
            >
              <div className="mb-2 text-center text-[11px] text-muted">
                {metricKey === "tonnageKg"
                  ? value > 0
                    ? Math.round(value).toLocaleString("ru-RU")
                    : "0"
                  : value > 0
                    ? formatMetricValue(value)
                    : "0"}
              </div>
              <div
                className={`rounded-t-2xl transition-[height,transform,opacity] duration-300 ${
                  isSelected ? "opacity-100" : "opacity-80"
                } ${colorClassName}`}
                style={{
                  height: `${height}%`,
                  minHeight: "0.5rem",
                  transform: isSelected ? "scaleY(1.02)" : "scaleY(1)",
                }}
              />
              <div
                className={`mt-3 text-center text-[11px] uppercase tracking-[0.16em] ${
                  isSelected ? "text-foreground" : "text-muted"
                }`}
              >
                {point.label}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function DashboardWorkoutCharts({
  charts,
}: {
  charts: DashboardWorkoutChartsData;
}) {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(
    Math.max(charts.weeklyTrend.length - 1, 0),
  );
  const [selectedRecentDayId, setSelectedRecentDayId] = useState<string | null>(
    charts.recentDays[0]?.id ?? null,
  );

  const selectedWeek =
    charts.weeklyTrend[selectedWeekIndex] ?? charts.weeklyTrend.at(-1) ?? null;
  const selectedRecentDay =
    charts.recentDays.find((day) => day.id === selectedRecentDayId) ??
    charts.recentDays[0] ??
    null;
  const recoveryBadge = getRecoveryBadge(charts.recovery.status);

  const summaryCards = useMemo(
    () => [
      {
        label: "Тренировок за период",
        value: formatMetricValue(charts.totals.completedDays),
        detail: "Сколько завершённых дней вы реально закрыли за последние 8 недель.",
      },
      {
        label: "Рабочих подходов",
        value: formatMetricValue(charts.totals.loggedSets),
        detail: "Сколько подходов дошло до фактической записи, а не осталось только в плане.",
      },
      {
        label: "Суммарный тоннаж",
        value: formatKg(charts.totals.tonnageKg),
        detail: "Общий объём работы по всем подходам, где был записан и вес, и число повторов.",
      },
      {
        label: "Средний рабочий вес",
        value: formatKg(charts.highlights.avgActualWeightKg),
        detail: "Средний вес по записанным рабочим подходам за период.",
      },
      {
        label: "Средний RPE",
        value: formatDecimal(charts.highlights.avgActualRpe),
        detail: "Показывает, насколько тяжело в среднем шли рабочие сеты за период.",
      },
      {
        label: "Лучший зафиксированный вес",
        value: formatKg(charts.highlights.bestSetWeightKg),
        detail: "Самый тяжёлый сет, который уже есть в истории тренировок.",
      },
      {
        label: "Оценка 1ПМ",
        value: formatKg(charts.highlights.bestEstimatedOneRmKg),
        detail: "Грубая силовая оценка по лучшему рабочему подходу в истории.",
      },
    ],
    [charts],
  );

  return (
    <PanelCard
      caption="Тренировки"
      title="Силовая аналитика, тоннаж и разбор последних сессий"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((item) => (
          <WorkoutSummaryCard
            detail={item.detail}
            key={item.label}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <WorkoutTrendChart
          colorClassName="bg-[var(--accent)]"
          description="Показывает, в какие недели вы действительно закрывали тренировочные дни."
          metricKey="completedDays"
          onSelect={setSelectedWeekIndex}
          points={charts.weeklyTrend}
          selectedIndex={selectedWeekIndex}
          title="Завершённые дни"
        />
        <WorkoutTrendChart
          colorClassName="bg-[var(--warning)]"
          description="Показывает глубину логирования рабочих подходов по неделям."
          metricKey="loggedSets"
          onSelect={setSelectedWeekIndex}
          points={charts.weeklyTrend}
          selectedIndex={selectedWeekIndex}
          title="Сохранённые подходы"
        />
        <WorkoutTrendChart
          colorClassName="bg-[var(--success)]"
          description="Показывает общий тоннаж по неделям, чтобы видеть реальную нагрузку, а не только факт тренировки."
          metricKey="tonnageKg"
          onSelect={setSelectedWeekIndex}
          points={charts.weeklyTrend}
          selectedIndex={selectedWeekIndex}
          title="Тоннаж"
        />
      </div>

      {selectedWeek ? (
        <div className="mt-6 rounded-[28px] border border-border bg-white/75 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Выбрана неделя: {selectedWeek.rangeLabel}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Здесь видно не только количество тренировок, но и реальную
                нагрузку по весу и объёму.
              </p>
            </div>
            <span className="pill">{selectedWeek.label}</span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Завершённые дни</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatMetricValue(selectedWeek.completedDays)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Сохранённые подходы</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatMetricValue(selectedWeek.loggedSets)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Тоннаж недели</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatKg(selectedWeek.tonnageKg)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Средние повторы</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatDecimal(charts.highlights.avgActualReps)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Средний вес</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatKg(charts.highlights.avgActualWeightKg)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Средний RPE</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatDecimal(charts.highlights.avgActualRpe)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Подходов на тренировку</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatDecimal(charts.highlights.avgLoggedSetsPerWorkout)}
              </p>
            </article>
          </div>
        </div>
      ) : null}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[28px] border border-border bg-white/70 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Сигнал по ритму и восстановлению
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Этот блок помогает понять, готов ли текущий ритм к росту нагрузки.
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${recoveryBadge.className}`}
            >
              {recoveryBadge.label}
            </span>
          </div>

          <div className="mt-4 rounded-3xl border border-border/70 bg-white/82 p-5">
            <p className="text-sm leading-7 text-muted">{charts.recovery.summary}</p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <article className="rounded-2xl border border-border/70 bg-white/82 px-4 py-3 text-sm text-muted">
              <p>После последней тренировки</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatDays(charts.recovery.daysSinceLastWorkout)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/82 px-4 py-3 text-sm text-muted">
              <p>Средняя пауза</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatDays(charts.recovery.avgRecoveryDays)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/82 px-4 py-3 text-sm text-muted">
              <p>Самый длинный перерыв</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatDays(charts.recovery.longestGapDays)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/82 px-4 py-3 text-sm text-muted">
              <p>Ритм к цели</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatConsistency(charts.recovery.consistencyRatio)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/82 px-4 py-3 text-sm text-muted">
              <p>Средний RPE за 14 дней</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatDecimal(charts.recovery.avgActualRpeLast14)}
              </p>
            </article>
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-white/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Что уже видит AI-коуч
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Частота, тоннаж, рабочие веса и лучшие подходы уже готовы для AI-рекомендаций.
              </p>
            </div>
            <span className="pill">
              {charts.highlights.latestWorkoutAt
                ? formatWorkoutDate(charts.highlights.latestWorkoutAt)
                : "ещё без истории"}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            <article className="rounded-2xl border border-border/70 bg-white/82 px-4 py-4 text-sm text-muted">
              <p className="font-semibold text-foreground">Нагрузка за период</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {formatKg(charts.totals.tonnageKg)}
              </p>
              <p className="mt-2 leading-6">
                Это реальный объём работы по весу и повторам, а не просто факт тренировки.
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/82 px-4 py-4 text-sm text-muted">
              <p className="font-semibold text-foreground">Рабочий вес</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {formatKg(charts.highlights.avgActualWeightKg)}
              </p>
              <p className="mt-2 leading-6">
                Средний рабочий вес помогает отличать лёгкую активность от реального силового прогресса.
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/82 px-4 py-4 text-sm text-muted">
              <p className="font-semibold text-foreground">Тяжёлые сеты</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {formatShare(charts.highlights.hardSetShareLast14)}
              </p>
              <p className="mt-2 leading-6">
                Доля сетов с RPE 8.5+ помогает AI понять, идёте ли вы уже на пределе или есть запас для прогрессии.
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/82 px-4 py-4 text-sm text-muted">
              <p className="font-semibold text-foreground">Лучший силовой сигнал</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {formatKg(charts.highlights.bestEstimatedOneRmKg)}
              </p>
              <p className="mt-2 leading-6">
                Оценка 1ПМ даёт ориентир для прогрессии нагрузки без догадок.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-border bg-white/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Рекомендации по прогрессии и восстановлению
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Это уже не сырые графики, а готовый coaching-слой: где можно усиливать
              нагрузку, где лучше удержать темп, и какое упражнение сейчас важнее
              всего разобрать.
            </p>
          </div>
          <span className="pill">
            {charts.coachingSignals.length
              ? `${charts.coachingSignals.length} коуч-сигнала`
              : "сигналы появятся после логов"}
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {charts.coachingSignals.length ? (
            charts.coachingSignals.map((signal) => (
              <CoachingSignalCard key={signal.key} signal={signal} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-white/78 px-4 py-5 text-sm leading-6 text-muted">
              После нескольких заполненных тренировок здесь появятся сигналы по
              прогрессии нагрузки, восстановлению и регулярности.
            </div>
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[28px] border border-border bg-white/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Ключевые упражнения и прогрессия
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Сравнение последних 4 недель с предыдущими 4 помогает увидеть, где реально растут вес и объём.
              </p>
            </div>
            <span className="pill">
              {charts.topExercises.length
                ? `${charts.topExercises.length} упражнений`
                : "пока пусто"}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {charts.topExercises.length ? (
              charts.topExercises.map((exercise, index) => {
                const momentum = getMomentumBadge(exercise.momentum);

                return (
                  <article
                    className="rounded-2xl border border-border/70 bg-white/82 px-4 py-4"
                    key={`${exercise.exerciseTitle}-${index}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {exercise.exerciseTitle}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          Последняя активность: {formatWorkoutDate(exercise.latestLoggedAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${momentum.className}`}
                        >
                          {momentum.label}
                        </span>
                        <span className="pill">
                          {formatMetricValue(exercise.completedSets)} сетов
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-border/70 bg-white/85 px-3 py-3 text-sm text-muted">
                        <p>Средние повторы</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          {formatDecimal(exercise.avgActualReps)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-white/85 px-3 py-3 text-sm text-muted">
                        <p>Средний вес</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          {formatKg(exercise.avgActualWeightKg)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-white/85 px-3 py-3 text-sm text-muted">
                        <p>Средний RPE</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          {formatDecimal(exercise.avgActualRpe)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-white/85 px-3 py-3 text-sm text-muted">
                        <p>Лучший сет</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          {formatKg(exercise.bestSetWeightKg)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-white/85 px-3 py-3 text-sm text-muted">
                        <p>Оценка 1ПМ</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          {formatKg(exercise.bestEstimatedOneRmKg)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-border/70 bg-white/85 px-3 py-3 text-sm text-muted">
                        <p>Последние 4 недели</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          {formatKg(exercise.recentTonnageKg)}
                        </p>
                        <p className="mt-1 text-xs">
                          {formatDecimal(exercise.recentAvgActualReps)} повт. · {formatKg(exercise.recentAvgActualWeightKg)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-white/85 px-3 py-3 text-sm text-muted">
                        <p>Предыдущие 4 недели</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          {formatKg(exercise.previousTonnageKg)}
                        </p>
                        <p className="mt-1 text-xs">
                          {formatDecimal(exercise.previousAvgActualReps)} повт. · {formatKg(exercise.previousAvgActualWeightKg)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-white/85 px-3 py-3 text-sm text-muted">
                        <p>Дельта нагрузки</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">
                          {formatKg(exercise.tonnageDeltaKg)}
                        </p>
                        <p className="mt-1 text-xs">
                          Вес:{" "}
                          <span className="font-medium text-foreground">
                            {exercise.weightDeltaKg === null
                              ? "нет данных"
                              : `${exercise.weightDeltaKg > 0 ? "+" : ""}${formatKg(exercise.weightDeltaKg)}`}
                          </span>
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-white/75 px-4 py-5 text-sm leading-6 text-muted">
                После первых логов по весам здесь появится сравнение ключевых упражнений и их силовой динамики.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-border bg-white/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Разбор последних сессий
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Нажмите на нужный день и посмотрите упражнения, вес и реальные рабочие сеты.
              </p>
            </div>
            <span className="pill">
              {charts.recentDays.length
                ? `${charts.recentDays.length} последних дней`
                : "без истории"}
            </span>
          </div>

          {charts.recentDays.length ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
              <div className="grid gap-3">
                {charts.recentDays.map((day) => {
                  const selected = selectedRecentDay?.id === day.id;

                  return (
                    <button
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        selected
                          ? "border-accent/40 bg-accent/10 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.45)]"
                          : "border-border/70 bg-white/82 hover:bg-white"
                      }`}
                      key={day.id}
                      onClick={() => setSelectedRecentDayId(day.id)}
                      type="button"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {formatWorkoutDate(day.completedAt)}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            {formatMetricValue(day.exerciseCount)} упражнений · {formatMetricValue(day.loggedSets)} рабочих подходов
                          </p>
                        </div>
                        <span className="pill">{formatKg(day.tonnageKg)}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {day.exerciseTitles.map((title) => (
                          <span className="pill" key={`${day.id}-${title}`}>
                            {title}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-3xl border border-border/70 bg-white/82 p-5">
                {selectedRecentDay ? (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Детали сессии
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {formatWorkoutDate(selectedRecentDay.completedAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="pill">{formatKg(selectedRecentDay.tonnageKg)}</span>
                        <span className="pill">
                          {selectedRecentDay.avgActualWeightKg === null
                            ? "без веса"
                            : `ср. ${formatKg(selectedRecentDay.avgActualWeightKg)}`}
                        </span>
                        <span className="pill">
                          {selectedRecentDay.avgActualRpe === null
                            ? "RPE не записан"
                            : `RPE ${formatDecimal(selectedRecentDay.avgActualRpe)}`}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                      <article className="rounded-2xl border border-border/70 bg-white/90 px-4 py-4 text-sm text-muted">
                        <p>Рабочих подходов</p>
                        <p className="mt-1 text-2xl font-semibold text-foreground">
                          {formatMetricValue(selectedRecentDay.loggedSets)}
                        </p>
                      </article>
                      <article className="rounded-2xl border border-border/70 bg-white/90 px-4 py-4 text-sm text-muted">
                        <p>Средний вес</p>
                        <p className="mt-1 text-2xl font-semibold text-foreground">
                          {formatKg(selectedRecentDay.avgActualWeightKg)}
                        </p>
                      </article>
                      <article className="rounded-2xl border border-border/70 bg-white/90 px-4 py-4 text-sm text-muted">
                        <p>Средний RPE</p>
                        <p className="mt-1 text-2xl font-semibold text-foreground">
                          {formatDecimal(selectedRecentDay.avgActualRpe)}
                        </p>
                      </article>
                      <article className="rounded-2xl border border-border/70 bg-white/90 px-4 py-4 text-sm text-muted">
                        <p>Лучший сет</p>
                        <p className="mt-1 text-2xl font-semibold text-foreground">
                          {formatKg(selectedRecentDay.bestSetWeightKg)}
                        </p>
                      </article>
                      <article className="rounded-2xl border border-border/70 bg-white/90 px-4 py-4 text-sm text-muted">
                        <p>Вес тела в день</p>
                        <p className="mt-1 text-2xl font-semibold text-foreground">
                          {formatKg(selectedRecentDay.bodyWeightKg)}
                        </p>
                      </article>
                    </div>

                    {selectedRecentDay.sessionNote?.trim() ? (
                      <div className="mt-3 rounded-2xl border border-border/70 bg-white/90 px-4 py-4 text-sm text-muted">
                        <p className="font-semibold text-foreground">Заметка к сессии</p>
                        <p className="mt-2 leading-7">{selectedRecentDay.sessionNote}</p>
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-3">
                      {selectedRecentDay.exerciseDetails.length ? (
                        selectedRecentDay.exerciseDetails.map((exercise) => (
                          <article
                            className="rounded-2xl border border-border/70 bg-white/90 px-4 py-4"
                            key={`${selectedRecentDay.id}-${exercise.exerciseTitle}`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-foreground">
                                  {exercise.exerciseTitle}
                                </p>
                                <p className="mt-1 text-sm text-muted">
                                  {formatMetricValue(exercise.loggedSets)} рабочих подходов
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="pill">{formatKg(exercise.tonnageKg)}</span>
                                <span className="pill">
                                  {exercise.bestSetWeightKg === null
                                    ? "без веса"
                                    : `лучший ${formatKg(exercise.bestSetWeightKg)}`}
                                </span>
                              </div>
                            </div>

                            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              <div className="rounded-2xl border border-border/70 bg-white/85 px-3 py-3 text-sm text-muted">
                                <p>Средние повторы</p>
                                <p className="mt-1 text-xl font-semibold text-foreground">
                                  {formatDecimal(exercise.avgActualReps)}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-border/70 bg-white/85 px-3 py-3 text-sm text-muted">
                                <p>Средний вес</p>
                                <p className="mt-1 text-xl font-semibold text-foreground">
                                  {formatKg(exercise.avgActualWeightKg)}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-border/70 bg-white/85 px-3 py-3 text-sm text-muted">
                                <p>Средний RPE</p>
                                <p className="mt-1 text-xl font-semibold text-foreground">
                                  {formatDecimal(exercise.avgActualRpe)}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-border/70 bg-white/85 px-3 py-3 text-sm text-muted">
                                <p>Плановый диапазон</p>
                                <p className="mt-1 text-xl font-semibold text-foreground">
                                  {exercise.plannedRepTarget ?? "не задан"}
                                </p>
                              </div>
                            </div>

                            {exercise.setNotes.length ? (
                              <div className="mt-3 grid gap-2">
                                {exercise.setNotes.map((note, index) => (
                                  <div
                                    className="rounded-2xl border border-border/70 bg-white/85 px-3 py-3 text-sm text-muted"
                                    key={`${exercise.exerciseTitle}-${index}`}
                                  >
                                    {note}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </article>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border bg-white/85 px-4 py-5 text-sm leading-6 text-muted">
                          Для этой сессии пока нет детально сохранённых рабочих подходов.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-white/85 px-4 py-5 text-sm leading-6 text-muted">
                    После первой завершённой тренировки здесь появится полный разбор выбранной сессии.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-white/75 px-4 py-5 text-sm leading-6 text-muted">
              После первой завершённой тренировки здесь появится быстрый drilldown по последним сессиям.
            </div>
          )}
        </section>
      </div>
    </PanelCard>
  );
}
