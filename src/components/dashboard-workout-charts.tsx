import { PanelCard } from "@/components/panel-card";
import type { DashboardWorkoutCharts } from "@/lib/dashboard/metrics";

type WorkoutMetricKey = "completedDays" | "loggedSets";

function formatMetricValue(value: number) {
  return value.toLocaleString("ru-RU");
}

function WorkoutTrendChart({
  title,
  description,
  color,
  metricKey,
  points,
}: {
  title: string;
  description: string;
  color: string;
  metricKey: WorkoutMetricKey;
  points: DashboardWorkoutCharts["weeklyTrend"];
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
            {formatMetricValue(latestValue)}
          </p>
          <p className="mt-2 text-xs text-muted">
            {delta === 0
              ? "Без изменений к прошлой неделе"
              : delta > 0
                ? `+${formatMetricValue(delta)} к прошлой неделе`
                : `${formatMetricValue(delta)} к прошлой неделе`}
          </p>
        </div>
      </div>

      <div className="mt-6 grid h-52 grid-cols-8 items-end gap-3">
        {points.map((point) => {
          const value = point[metricKey];
          const height = value > 0 ? Math.max((value / maxValue) * 100, 12) : 8;

          return (
            <div className="flex h-full flex-col justify-end" key={`${title}-${point.label}`}>
              <div className="mb-2 text-center text-[11px] text-muted">
                {value > 0 ? formatMetricValue(value) : "0"}
              </div>
              <div
                className="rounded-t-2xl transition-[height] duration-300"
                style={{
                  background: color,
                  height: `${height}%`,
                  minHeight: "0.5rem",
                }}
                title={`${point.rangeLabel}: ${formatMetricValue(value)}`}
              />
              <div className="mt-3 text-center text-[11px] uppercase tracking-[0.16em] text-muted">
                {point.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-white/60 px-4 py-3 text-xs leading-6 text-muted">
        Последние 8 недель. Если тренд пустой, появится после первых завершённых
        тренировок и сохранённых фактических повторов.
      </div>
    </section>
  );
}

export function DashboardWorkoutCharts({
  charts,
}: {
  charts: DashboardWorkoutCharts;
}) {
  return (
    <PanelCard caption="Тренировки" title="Динамика тренировок">
      <div className="grid gap-4 md:grid-cols-2">
        <article className="kpi p-5">
          <p className="text-sm text-muted">Тренировок за 8 недель</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatMetricValue(charts.totals.completedDays)}
          </p>
        </article>
        <article className="kpi p-5">
          <p className="text-sm text-muted">Логов подходов за 8 недель</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatMetricValue(charts.totals.loggedSets)}
          </p>
        </article>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <WorkoutTrendChart
          color="var(--accent)"
          description="Количество тренировочных дней, переведённых в статус «завершён» по неделям."
          metricKey="completedDays"
          points={charts.weeklyTrend}
          title="Завершённые дни"
        />
        <WorkoutTrendChart
          color="var(--warning)"
          description="Количество подходов, у которых сохранены фактические повторы, по неделям."
          metricKey="loggedSets"
          points={charts.weeklyTrend}
          title="Логи подходов"
        />
      </div>
    </PanelCard>
  );
}
