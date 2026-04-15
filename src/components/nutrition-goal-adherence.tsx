"use client";

import type {
  NutritionSummaryTrendPoint,
  NutritionTargets,
} from "@/lib/nutrition/meal-logging";

type MetricDefinition = {
  key: "kcal" | "protein" | "fat" | "carbs";
  targetKey: "kcal_target" | "protein_target" | "fat_target" | "carbs_target";
  label: string;
  unit: string;
};

const metrics: MetricDefinition[] = [
  { key: "kcal", targetKey: "kcal_target", label: "Калории", unit: "ккал" },
  { key: "protein", targetKey: "protein_target", label: "Белки", unit: "г" },
  { key: "fat", targetKey: "fat_target", label: "Жиры", unit: "г" },
  { key: "carbs", targetKey: "carbs_target", label: "Углеводы", unit: "г" },
];

const shortDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

function formatMetricValue(value: number) {
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

function getDayLabel(summaryDate: string) {
  return shortDateFormatter.format(new Date(`${summaryDate}T00:00:00.000Z`));
}

function getProgress(value: number, target: number | null) {
  if (!target || target <= 0) {
    return null;
  }

  return Math.min(Math.round((value / target) * 100), 160);
}

function getDeltaLabel(value: number, target: number | null, unit: string) {
  if (!target || target <= 0) {
    return "Цель не задана";
  }

  const difference = Number((target - value).toFixed(1));

  if (Math.abs(difference) < 0.05) {
    return "Ровно в цель";
  }

  if (difference > 0) {
    return `Осталось ${formatMetricValue(difference)} ${unit}`;
  }

  return `Перебор ${formatMetricValue(Math.abs(difference))} ${unit}`;
}

function getDayScore(
  day: NutritionSummaryTrendPoint,
  targets: NutritionTargets | null,
) {
  const progresses = metrics
    .map((metric) => {
      const target = targets?.[metric.targetKey] ?? null;
      const progress = getProgress(day[metric.key], target);
      return progress === null ? null : Math.min(progress, 100);
    })
    .filter((progress): progress is number => progress !== null);

  if (!progresses.length) {
    return 0;
  }

  return Math.round(
    progresses.reduce((sum, progress) => sum + progress, 0) / progresses.length,
  );
}

export function NutritionGoalAdherence({
  summary,
  targets,
  trend,
}: {
  summary: NutritionSummaryTrendPoint;
  targets: NutritionTargets | null;
  trend: NutritionSummaryTrendPoint[];
}) {
  const activeDays = trend.filter((day) => day.kcal > 0).length;
  const weeklyScores = trend.map((day) => getDayScore(day, targets));
  const weeklyAverage = weeklyScores.length
    ? Math.round(
        weeklyScores.reduce((sum, score) => sum + score, 0) / weeklyScores.length,
      )
    : 0;

  return (
    <section className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const value = Number(summary[metric.key] ?? 0);
          const target = targets?.[metric.targetKey] ?? null;
          const progress = getProgress(value, target);

          return (
            <article className="surface-panel surface-panel--soft p-4" key={metric.key}>
              <p className="text-sm text-muted">{metric.label}</p>
              <p className="mt-2 text-xl font-semibold text-foreground">
                {formatMetricValue(value)} {metric.unit}
              </p>
              <p className="mt-1.5 text-xs text-muted">
                {getDeltaLabel(value, target, metric.unit)}
              </p>
              <div className="mt-3 h-2 rounded-full bg-white/70">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-300"
                  style={{ width: `${progress ?? 0}%` }}
                />
              </div>
            </article>
          );
        })}
      </div>

      <section className="surface-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Выполнение целей
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">
              Тренд по питанию за 7 дней
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Средний процент считается только по заданным целям и не завышается выше 100%.
            </p>
          </div>

          <div className="grid gap-2 rounded-[1rem] border border-border bg-white/80 px-4 py-3 text-sm text-muted">
            <p>
              Среднее выполнение:{" "}
              <span className="font-semibold text-foreground">{weeklyAverage}%</span>
            </p>
            <p>
              Активных дней с логами:{" "}
              <span className="font-semibold text-foreground">{activeDays} из {trend.length}</span>
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="grid gap-3 sm:grid-cols-7">
            {trend.map((day) => {
              const score = getDayScore(day, targets);

              return (
                <article
                  className="rounded-[1rem] border border-border bg-white/82 p-3"
                  key={day.summary_date}
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">
                    {getDayLabel(day.summary_date)}
                  </p>
                  <div className="mt-3 flex min-h-28 items-end">
                    <div className="w-full rounded-[0.95rem] bg-[color-mix(in_srgb,var(--surface-strong)_82%,white)] p-2">
                      <div
                        className="rounded-[0.8rem] bg-accent/85 transition-[height] duration-300"
                        style={{ height: `${Math.max(score, 6)}px` }}
                      />
                    </div>
                  </div>
                  <p className="mt-2.5 text-base font-semibold text-foreground">{score}%</p>
                  <p className="text-xs text-muted">
                    {day.kcal.toLocaleString("ru-RU")} ккал
                  </p>
                </article>
              );
            })}
          </div>

          <div className="grid gap-3">
            {metrics.map((metric) => {
              const target = targets?.[metric.targetKey] ?? null;
              const average = target
                ? Math.round(
                    trend.reduce((sum, day) => {
                      return sum + Math.min((Number(day[metric.key]) / target) * 100, 100);
                    }, 0) / trend.length,
                  )
                : null;

              return (
                <article className="rounded-[1rem] border border-border bg-white/82 p-4" key={metric.key}>
                  <p className="text-sm text-muted">{metric.label}</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">
                    {average === null ? "—" : `${average}%`}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {target
                      ? `Среднее выполнение цели за неделю`
                      : "Сначала задай цель, чтобы видеть выполнение"}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </section>
  );
}
