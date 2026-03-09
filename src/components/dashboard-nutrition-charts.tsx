import { PanelCard } from "@/components/panel-card";
import type { DashboardNutritionCharts } from "@/lib/dashboard/metrics";

function formatNumber(value: number) {
  return value.toLocaleString("ru-RU");
}

function formatMacro(value: number) {
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

function CaloriesTrend({
  points,
}: {
  points: DashboardNutritionCharts["dailyTrend"];
}) {
  const maxValue = Math.max(...points.map((point) => point.kcal), 1);

  return (
    <section className="rounded-3xl border border-border bg-white/55 p-5">
      <p className="text-sm font-medium text-foreground">
        Калории по дням
      </p>
      <p className="mt-2 text-xs leading-6 text-muted">
        Последние 7 дней по `daily_nutrition_summaries`.
      </p>

      <div className="mt-6 grid h-52 grid-cols-7 items-end gap-3">
        {points.map((point) => {
          const height = point.kcal > 0 ? Math.max((point.kcal / maxValue) * 100, 10) : 8;

          return (
            <div className="flex h-full flex-col justify-end" key={point.label}>
              <div className="mb-2 text-center text-[11px] text-muted">
                {point.kcal > 0 ? formatNumber(point.kcal) : "0"}
              </div>
              <div
                className="rounded-t-2xl bg-[var(--warning)] transition-[height] duration-300"
                style={{ height: `${height}%`, minHeight: "0.5rem" }}
                title={`${point.label}: ${formatNumber(point.kcal)} ккал`}
              />
              <div className="mt-3 text-center text-[11px] uppercase tracking-[0.16em] text-muted">
                {point.label}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MacroBars({
  averages,
}: {
  averages: DashboardNutritionCharts["averages"];
}) {
  const macroRows = [
    {
      key: "protein",
      label: "Белки",
      value: averages.protein,
      color: "var(--accent)",
    },
    {
      key: "fat",
      label: "Жиры",
      value: averages.fat,
      color: "#b65f11",
    },
    {
      key: "carbs",
      label: "Углеводы",
      value: averages.carbs,
      color: "#4a6aa8",
    },
  ] as const;

  const maxValue = Math.max(...macroRows.map((row) => row.value), 1);

  return (
    <section className="rounded-3xl border border-border bg-white/55 p-5">
      <p className="text-sm font-medium text-foreground">Средние КБЖУ за день</p>
      <p className="mt-2 text-xs leading-6 text-muted">
        Усреднение по последним 7 дням с учётом сохранённых nutrition summaries.
      </p>

      <div className="mt-6 space-y-4">
        {macroRows.map((row) => (
          <div key={row.key}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{row.label}</span>
              <span className="font-medium text-foreground">
                {formatMacro(row.value)} г
              </span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-white/70">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  background: row.color,
                  width: `${Math.max((row.value / maxValue) * 100, row.value > 0 ? 8 : 0)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardNutritionCharts({
  charts,
}: {
  charts: DashboardNutritionCharts;
}) {
  return (
    <PanelCard caption="Питание" title="Динамика питания">
      <div className="grid gap-4 md:grid-cols-2">
        <article className="kpi p-5">
          <p className="text-sm text-muted">Калорий за 7 дней</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatNumber(charts.totals.kcal)}
          </p>
        </article>
        <article className="kpi p-5">
          <p className="text-sm text-muted">Среднее в день</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatNumber(charts.averages.kcal)} ккал
          </p>
        </article>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <CaloriesTrend points={charts.dailyTrend} />
        <MacroBars averages={charts.averages} />
      </div>
    </PanelCard>
  );
}
