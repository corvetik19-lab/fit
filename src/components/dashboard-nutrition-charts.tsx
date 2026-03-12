"use client";

import { useMemo, useState } from "react";

import { PanelCard } from "@/components/panel-card";
import type { DashboardNutritionCharts } from "@/lib/dashboard/metrics";

const bodyMetricDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
});

function formatNumber(value: number) {
  return value.toLocaleString("ru-RU");
}

function formatMacro(value: number) {
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

function formatDelta(value: number | null, suffix: string) {
  if (value === null) {
    return "нет цели";
  }

  if (value === 0) {
    return `в цели (${suffix})`;
  }

  const absolute = Math.abs(value).toLocaleString("ru-RU", {
    minimumFractionDigits: Math.abs(value) % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });

  return value > 0 ? `+${absolute} ${suffix}` : `-${absolute} ${suffix}`;
}

function formatMeasuredAt(value: string | null) {
  if (!value) {
    return "нет данных";
  }

  return bodyMetricDateFormatter.format(new Date(value));
}

function NutritionSummaryCard({
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

function getCoachingSignalBadge(
  status: DashboardNutritionCharts["coachingSignals"][number]["status"],
) {
  switch (status) {
    case "positive":
      return {
        label: "можно закреплять",
        className: "border-emerald-300/70 bg-emerald-50 text-emerald-700",
      };
    case "watch":
      return {
        label: "держать под контролем",
        className: "border-sky-300/70 bg-sky-50 text-sky-700",
      };
    default:
      return {
        label: "нужно исправить",
        className: "border-amber-300/70 bg-amber-50 text-amber-700",
      };
    }
}

function NutritionCoachingSignalCard({
  signal,
}: {
  signal: DashboardNutritionCharts["coachingSignals"][number];
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

function NutritionMealPatternCard({
  signal,
}: {
  signal: DashboardNutritionCharts["mealPatterns"]["patterns"][number];
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

function getStrategyBadge(
  priority: DashboardNutritionCharts["strategy"][number]["priority"],
) {
  switch (priority) {
    case "high":
      return {
        label: "сейчас в приоритете",
        className: "border-rose-300/70 bg-rose-50 text-rose-700",
      };
    case "medium":
      return {
        label: "следующий шаг",
        className: "border-amber-300/70 bg-amber-50 text-amber-700",
      };
    default:
      return {
        label: "можно закреплять",
        className: "border-emerald-300/70 bg-emerald-50 text-emerald-700",
      };
  }
}

function NutritionStrategyCard({
  recommendation,
}: {
  recommendation: DashboardNutritionCharts["strategy"][number];
}) {
  const badge = getStrategyBadge(recommendation.priority);

  return (
    <article className="rounded-3xl border border-border bg-white/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{recommendation.title}</p>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>
      <p className="mt-4 text-sm leading-7 text-muted">{recommendation.summary}</p>
      <div className="mt-4 rounded-2xl border border-border/70 bg-white/88 px-4 py-4 text-sm text-muted">
        <p className="font-semibold text-foreground">Что делать</p>
        <p className="mt-2 leading-7">{recommendation.action}</p>
      </div>
    </article>
  );
}

function CaloriesTrend({
  points,
  selectedIndex,
  onSelect,
}: {
  points: DashboardNutritionCharts["dailyTrend"];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const maxValue = Math.max(...points.map((point) => point.kcal), 1);

  return (
    <section className="rounded-3xl border border-border bg-white/55 p-5">
      <p className="text-sm font-medium text-foreground">Калории по дням</p>
      <p className="mt-2 text-xs leading-6 text-muted">
        Нажмите на день, чтобы увидеть точные КБЖУ и отклонение от целей.
      </p>

      <div className="mt-6 grid h-52 grid-cols-7 items-end gap-3">
        {points.map((point, index) => {
          const height = point.kcal > 0 ? Math.max((point.kcal / maxValue) * 100, 10) : 8;
          const isSelected = index === selectedIndex;

          return (
            <button
              className="flex h-full flex-col justify-end rounded-2xl px-1 text-left outline-none transition hover:bg-white/40 focus-visible:ring-2 focus-visible:ring-accent/20"
              key={point.label}
              onClick={() => onSelect(index)}
              type="button"
            >
              <div className="mb-2 text-center text-[11px] text-muted">
                {point.kcal > 0 ? formatNumber(point.kcal) : "0"}
              </div>
              <div
                className={`rounded-t-2xl bg-[var(--warning)] transition-[height,opacity] duration-300 ${
                  isSelected ? "opacity-100" : "opacity-75"
                }`}
                style={{ height: `${height}%`, minHeight: "0.5rem" }}
                title={`${point.label}: ${formatNumber(point.kcal)} ккал`}
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

function MacroBars({
  averages,
  targets,
}: {
  averages: DashboardNutritionCharts["averages"];
  targets: DashboardNutritionCharts["targets"];
}) {
  const macroRows = [
    {
      key: "protein",
      label: "Белки",
      value: averages.protein,
      target: targets.protein,
      color: "var(--accent)",
    },
    {
      key: "fat",
      label: "Жиры",
      value: averages.fat,
      target: targets.fat,
      color: "#b65f11",
    },
    {
      key: "carbs",
      label: "Углеводы",
      value: averages.carbs,
      target: targets.carbs,
      color: "#4a6aa8",
    },
  ] as const;

  const maxValue = Math.max(...macroRows.map((row) => row.value), 1);

  return (
    <section className="rounded-3xl border border-border bg-white/55 p-5">
      <p className="text-sm font-medium text-foreground">Средние КБЖУ за день</p>
      <p className="mt-2 text-xs leading-6 text-muted">
        AI опирается именно на эти средние и отклонения от целей при генерации
        планов питания.
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
            <p className="mt-2 text-xs text-muted">
              Цель:{" "}
              <span className="font-medium text-foreground">
                {row.target === null ? "не задана" : `${formatMacro(row.target)} г`}
              </span>
            </p>
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
  const [selectedDayIndex, setSelectedDayIndex] = useState(
    Math.max(charts.dailyTrend.length - 1, 0),
  );
  const selectedDay =
    charts.recentDays.find(
      (point) =>
        point.label === charts.dailyTrend[selectedDayIndex]?.label &&
        point.kcal === charts.dailyTrend[selectedDayIndex]?.kcal,
    ) ?? charts.recentDays[0] ?? null;
  const summaryCards = useMemo(
    () => [
      {
        label: "Калорий за период",
        value: formatNumber(charts.totals.kcal),
        detail: "Сумма по дням, где у вас реально есть nutrition summary.",
      },
      {
        label: "Среднее в дне с логом",
        value: `${formatNumber(charts.averages.kcal)} ккал`,
        detail: "Среднее считается только по дням, где питание было зафиксировано.",
      },
      {
        label: "Дней в цели",
        value: formatNumber(charts.highlights.targetAlignedDays),
        detail: "Дни, где калории и белок близки к текущим целям.",
      },
      {
        label: "Вес тела",
        value:
          charts.bodyMetrics.latestWeightKg === null
            ? "нет данных"
            : `${formatMacro(charts.bodyMetrics.latestWeightKg)} кг`,
        detail:
          charts.bodyMetrics.deltaKg === null
            ? "Нужны как минимум два замера, чтобы увидеть движение."
            : `Изменение к прошлому замеру: ${charts.bodyMetrics.deltaKg > 0 ? "+" : ""}${formatMacro(charts.bodyMetrics.deltaKg)} кг.`,
      },
    ],
    [charts],
  );

  return (
    <PanelCard caption="Питание" title="Динамика питания и восстановление">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <NutritionSummaryCard
            detail={item.detail}
            key={item.label}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <CaloriesTrend
          onSelect={setSelectedDayIndex}
          points={charts.dailyTrend}
          selectedIndex={selectedDayIndex}
        />
        <MacroBars averages={charts.averages} targets={charts.targets} />
      </div>

      {selectedDay ? (
        <div className="mt-6 rounded-[28px] border border-border bg-white/75 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Выбран день: {selectedDay.label}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Детализация по этому дню: калории, белок и отклонение от текущих
                целей питания.
              </p>
            </div>
            <span className="pill">
              {selectedDay.tracked ? "день зафиксирован" : "без лога"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Калории</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatNumber(selectedDay.kcal)}
              </p>
              <p className="mt-1">{formatDelta(selectedDay.kcalDelta, "ккал")}</p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Белки</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatMacro(selectedDay.protein)} г
              </p>
              <p className="mt-1">{formatDelta(selectedDay.proteinDelta, "г")}</p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Жиры</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatMacro(selectedDay.fat)} г
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Углеводы</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatMacro(selectedDay.carbs)} г
              </p>
            </article>
          </div>
        </div>
      ) : null}

      <section className="mt-6 rounded-[28px] border border-border bg-white/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Рекомендации по рациону и восстановлению
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Этот слой уже переводит пищевую историю в готовые сигналы: где хромает
              дисциплина логирования, насколько рацион попадает в калории и белок, и
              что сейчас происходит с весом тела.
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
              <NutritionCoachingSignalCard key={signal.key} signal={signal} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-white/78 px-4 py-5 text-sm leading-6 text-muted">
              После нескольких дней питания с целями здесь появятся конкретные
              сигналы по рациону, белку и динамике веса тела.
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-border bg-white/74 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Что править в рационе в первую очередь
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Это уже не просто сигналы, а приоритетные действия. Блок собирает 3-4
              самых полезных шага из истории питания, тайминга приёмов пищи и
              распределения белка.
            </p>
          </div>
          <span className="pill">
            {charts.strategy.length
              ? `${charts.strategy.length} приоритетных шага`
              : "стратегия появится после логов"}
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {charts.strategy.length ? (
            charts.strategy.map((recommendation) => (
              <NutritionStrategyCard
                key={recommendation.key}
                recommendation={recommendation}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-white/78 px-4 py-5 text-sm leading-6 text-muted">
              После нескольких дней с логами питания здесь появятся приоритетные
              шаги по рациону, а не только базовые сводки по КБЖУ.
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="rounded-[28px] border border-border bg-white/70 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Как реально устроены приёмы пищи
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Здесь видны не только суточные цифры, но и привычки: насколько день
                собирается из крупных приёмов пищи, смещаются ли калории в вечер и как
                распределяется белок по блюдам.
              </p>
            </div>
            <span className="pill">
              {charts.mealPatterns.mealCount
                ? `${charts.mealPatterns.mealCount} приёмов пищи`
                : "без meal-level истории"}
            </span>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {charts.mealPatterns.patterns.length ? (
              charts.mealPatterns.patterns.map((signal) => (
                <NutritionMealPatternCard key={signal.key} signal={signal} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-white/78 px-4 py-5 text-sm leading-6 text-muted">
                После нескольких дней с подробными блюдами здесь появятся meal-level
                паттерны по таймингу, размеру приёмов пищи и распределению белка.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-white/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Повторяющиеся продукты и базовые привычки
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Этот блок нужен AI для практичных рекомендаций: он показывает, из чего
                реально состоит ваш рацион, а не только какие цели стоят по КБЖУ.
              </p>
            </div>
            <span className="pill">
              {charts.mealPatterns.topFoods.length
                ? `${charts.mealPatterns.topFoods.length} частых продуктов`
                : "пока пусто"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Приёмов пищи в день</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {charts.mealPatterns.avgMealsPerTrackedDay === null
                  ? "нет данных"
                  : formatMacro(charts.mealPatterns.avgMealsPerTrackedDay)}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Средний приём пищи</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {charts.mealPatterns.avgMealKcal === null
                  ? "нет данных"
                  : `${formatNumber(charts.mealPatterns.avgMealKcal)} ккал`}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Белок на приём</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {charts.mealPatterns.avgProteinPerMeal === null
                  ? "нет данных"
                  : `${formatMacro(charts.mealPatterns.avgProteinPerMeal)} г`}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Калории вечером</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {charts.mealPatterns.eveningCaloriesShare === null
                  ? "нет данных"
                  : `${Math.round(charts.mealPatterns.eveningCaloriesShare * 100)}%`}
              </p>
            </article>
          </div>

          <div className="mt-4 grid gap-3">
            {charts.mealPatterns.topFoods.length ? (
              charts.mealPatterns.topFoods.map((food) => (
                <article
                  className="rounded-2xl border border-border/70 bg-white/82 px-4 py-4"
                  key={food.foodName}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{food.foodName}</p>
                      <p className="mt-1 text-sm text-muted">
                        {food.appearances} появлений в логах
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="pill">{formatNumber(food.totalKcal)} ккал</span>
                      <span className="pill">{formatMacro(food.totalProtein)} г белка</span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-white/78 px-4 py-5 text-sm leading-6 text-muted">
                Когда в логах появится больше блюд, здесь будет видно, какие продукты
                и блюда чаще всего повторяются в рационе.
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="rounded-[28px] border border-border bg-white/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Последние дни питания
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Быстрый drilldown по последним дням помогает понять, где есть
                просадка по калориям и белку.
              </p>
            </div>
            <span className="pill">
              {charts.highlights.trackedDays} дней с логом
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {charts.recentDays.map((day) => (
              <article
                className="rounded-2xl border border-border/70 bg-white/80 px-4 py-4"
                key={day.summaryDate}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{day.label}</p>
                    <p className="mt-1 text-sm text-muted">
                      {day.tracked
                        ? `${formatNumber(day.kcal)} ккал · ${formatMacro(day.protein)} г белка`
                        : "В этот день пока нет nutrition summary."}
                    </p>
                  </div>
                  <span className="pill">
                    {day.isTargetAligned === null
                      ? day.tracked
                        ? "без цели"
                        : "не заполнено"
                      : day.isTargetAligned
                        ? "в пределах цели"
                        : "есть отклонение"}
                  </span>
                </div>

                {day.tracked ? (
                  <div className="mt-3 grid gap-1 text-sm text-muted">
                    <p>Калории: {formatDelta(day.kcalDelta, "ккал")}</p>
                    <p>Белок: {formatDelta(day.proteinDelta, "г")}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-border bg-white/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Сигналы для AI и восстановления
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Эти показатели помогают AI видеть не только еду, но и ход
                восстановления по телу и соблюдению режима.
              </p>
            </div>
            <span className="pill">{formatMeasuredAt(charts.bodyMetrics.latestMeasuredAt)}</span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Среднее отклонение по калориям</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {charts.highlights.avgKcalDelta === null
                  ? "нет цели"
                  : `${charts.highlights.avgKcalDelta > 0 ? "+" : ""}${formatNumber(charts.highlights.avgKcalDelta)} ккал`}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Среднее отклонение по белку</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {charts.highlights.avgProteinDelta === null
                  ? "нет цели"
                  : `${charts.highlights.avgProteinDelta > 0 ? "+" : ""}${formatMacro(charts.highlights.avgProteinDelta)} г`}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Последний вес</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {charts.bodyMetrics.latestWeightKg === null
                  ? "нет данных"
                  : `${formatMacro(charts.bodyMetrics.latestWeightKg)} кг`}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Жир тела</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {charts.bodyMetrics.bodyFatPct === null
                  ? "нет данных"
                  : `${formatMacro(charts.bodyMetrics.bodyFatPct)}%`}
              </p>
            </article>
          </div>

          <div className="mt-4 rounded-2xl border border-border/70 bg-white/80 px-4 py-4 text-sm leading-6 text-muted">
            AI уже использует эту статистику при генерации новых планов питания:
            он видит вашу частоту логов, средние калории, белок и то, насколько вы
            держитесь рядом с целевыми значениями.
          </div>
        </section>
      </div>
    </PanelCard>
  );
}
