import { DashboardNutritionCharts } from "@/components/dashboard-nutrition-charts";
import { AppShell } from "@/components/app-shell";
import { DashboardPeriodComparison } from "@/components/dashboard-period-comparison";
import { DashboardWorkoutCharts } from "@/components/dashboard-workout-charts";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireReadyViewer } from "@/lib/viewer";
import {
  getDashboardPeriodComparison,
  getDashboardNutritionCharts,
  getDashboardSnapshot,
  getDashboardWorkoutCharts,
} from "@/lib/dashboard/metrics";

export default async function DashboardPage() {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const [snapshot, periodComparison, workoutCharts, nutritionCharts] =
    await Promise.all([
      getDashboardSnapshot(supabase, viewer.user.id),
      getDashboardPeriodComparison(supabase, viewer.user.id, 30, 30),
      getDashboardWorkoutCharts(supabase, viewer.user.id, 8),
      getDashboardNutritionCharts(supabase, viewer.user.id, 7),
    ]);

  const metrics = [
    {
      label: "Активные недели",
      value: String(snapshot.activePrograms),
      detail: "программы со статусом active",
    },
    {
      label: "Выполненные дни",
      value: String(snapshot.completedDays),
      detail: "дни, закрытые в тренировочном цикле",
    },
    {
      label: "Сохранённые подходы",
      value: String(snapshot.loggedSets),
      detail: "зафиксированные рабочие сеты",
    },
    {
      label: "Дни питания",
      value: String(snapshot.nutritionDays),
      detail: "дни с заполненным food log",
    },
  ];

  return (
    <AppShell eyebrow="Обзор" title="Ваш прогресс">
      <section className="card overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="pill">{viewer.profile?.full_name ?? "fit"}</span>
              <span className="pill">{viewer.user.email ?? "Аккаунт"}</span>
            </div>

            <div className="space-y-3">
              <h2 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Сегодня вы работаете внутри своего основного пространства.
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
                Здесь собран текущий срез по тренировкам, питанию и истории
                активности без лишнего служебного текста.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => (
              <article
                className="rounded-3xl border border-border bg-white/72 p-5 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.28)]"
                key={metric.label}
              >
                <p className="text-sm text-muted">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {metric.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">{metric.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <DashboardPeriodComparison
        initialMetrics={periodComparison}
        initialPeriod="30d"
      />

      <DashboardWorkoutCharts charts={workoutCharts} />

      <DashboardNutritionCharts charts={nutritionCharts} />
    </AppShell>
  );
}
