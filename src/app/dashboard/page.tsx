import { DashboardNutritionCharts } from "@/components/dashboard-nutrition-charts";
import { AppShell } from "@/components/app-shell";
import { DashboardPeriodComparison } from "@/components/dashboard-period-comparison";
import { DashboardWorkoutCharts } from "@/components/dashboard-workout-charts";
import { PanelCard } from "@/components/panel-card";
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
    { label: "Активные недели", value: String(snapshot.activePrograms) },
    { label: "Выполненные дни", value: String(snapshot.completedDays) },
    { label: "Логов подходов", value: String(snapshot.loggedSets) },
    { label: "Шаблоны", value: String(snapshot.templates) },
  ];

  return (
    <AppShell eyebrow="Обзор" title="Дашборд платформы">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PanelCard caption="Живой срез" title="Текущий пользовательский срез">
          <ul className="grid gap-3 text-sm leading-7 text-muted">
            <li>
              <span className="font-semibold text-foreground">
                {viewer.user.email ?? "Авторизованный пользователь"}
              </span>{" "}
              уже работает внутри защищённого приложения.
            </li>
            <li>
              Активных упражнений: <span className="font-semibold text-foreground">{snapshot.exercises}</span>.
            </li>
            <li>
              Черновиков недель: <span className="font-semibold text-foreground">{snapshot.draftPrograms}</span>.
            </li>
            <li>
              AI-сессий: <span className="font-semibold text-foreground">{snapshot.aiSessions}</span>, дней питания:{" "}
              <span className="font-semibold text-foreground">{snapshot.nutritionDays}</span>.
            </li>
          </ul>
        </PanelCard>
        <div className="grid gap-4">
          {metrics.map((metric) => (
            <article className="kpi p-5" key={metric.label}>
              <p className="text-sm text-muted">{metric.label}</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {metric.value}
              </p>
            </article>
          ))}
        </div>
      </div>

      <DashboardPeriodComparison
        initialMetrics={periodComparison}
        initialPeriod="30d"
      />

      <DashboardWorkoutCharts charts={workoutCharts} />

      <DashboardNutritionCharts charts={nutritionCharts} />
    </AppShell>
  );
}
