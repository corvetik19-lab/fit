import type {
  DashboardNutritionCharts,
  DashboardPeriodComparison,
  DashboardRuntimeMetrics,
  DashboardSnapshot,
  DashboardWorkoutCharts,
} from "@/lib/dashboard/metrics";

type DashboardRuntimeMetricLoaders = {
  nutritionCharts: () => Promise<DashboardNutritionCharts>;
  periodComparison: () => Promise<DashboardPeriodComparison>;
  snapshot: () => Promise<DashboardSnapshot>;
  workoutCharts: () => Promise<DashboardWorkoutCharts>;
};

export async function buildLiveDashboardRuntimeMetrics(
  loaders: DashboardRuntimeMetricLoaders,
): Promise<DashboardRuntimeMetrics> {
  const [snapshot, periodComparison, workoutCharts, nutritionCharts] =
    await Promise.all([
      loaders.snapshot(),
      loaders.periodComparison(),
      loaders.workoutCharts(),
      loaders.nutritionCharts(),
    ]);

  return {
    nutritionCharts,
    periodComparison,
    snapshot,
    workoutCharts,
  };
}
