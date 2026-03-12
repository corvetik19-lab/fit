import { AppShell } from "@/components/app-shell";
import { DashboardWorkspace } from "@/components/dashboard-workspace";
import { getAiRuntimeContext } from "@/lib/ai/user-context";
import { getDashboardRuntimeMetrics } from "@/lib/dashboard/metrics";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireReadyViewer } from "@/lib/viewer";

export default async function DashboardPage() {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const [dashboardRuntime, aiRuntime] = await Promise.all([
    getDashboardRuntimeMetrics(supabase, viewer.user.id),
    getAiRuntimeContext(supabase, viewer.user.id),
  ]);

  const { snapshot, periodComparison, workoutCharts, nutritionCharts } =
    dashboardRuntime.metrics;
  const aiContext = aiRuntime.context;
  const dashboardUpdatedAt =
    dashboardRuntime.cache.generatedAt ??
    dashboardRuntime.cache.snapshotCreatedAt ??
    null;
  const dashboardSourceLabel =
    dashboardRuntime.cache.source === "snapshot"
      ? "Сводка обновлена"
      : "Сводка пересчитана";

  return (
    <AppShell eyebrow="Обзор" title="Ваш прогресс">
      <DashboardWorkspace
        aiContext={aiContext}
        dashboardSourceLabel={dashboardSourceLabel}
        dashboardUpdatedAt={dashboardUpdatedAt}
        nutritionCharts={nutritionCharts}
        periodComparison={periodComparison}
        snapshot={snapshot}
        viewerEmail={viewer.user.email ?? null}
        viewerName={viewer.profile?.full_name ?? null}
        workoutCharts={workoutCharts}
      />
    </AppShell>
  );
}
