import { AppShell, toAppShellViewer } from "@/components/app-shell";
import { DashboardWorkspace } from "@/components/dashboard-workspace";
import {
  createEmptyAiUserContext,
  type AiUserContext,
} from "@/lib/ai/user-context";
import {
  getDashboardRuntimeMetrics,
  type DashboardRuntimeMetricsResult,
} from "@/lib/dashboard/metrics";
import { logger } from "@/lib/logger";
import { withTransientRetry } from "@/lib/runtime-retry";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireReadyViewer } from "@/lib/viewer";

const DASHBOARD_TIMEOUT_MS =
  process.env.PLAYWRIGHT_TEST_HOOKS === "1" ? 1_500 : 8_000;
const IS_PLAYWRIGHT_RUNTIME = process.env.PLAYWRIGHT_TEST_HOOKS === "1";

function withTimeout<T>(promise: Promise<T>, label: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${label} timed out after ${DASHBOARD_TIMEOUT_MS}ms`));
      }, DASHBOARD_TIMEOUT_MS);
    }),
  ]);
}

function createFallbackDashboardResult(): DashboardRuntimeMetricsResult {
  return {
    cache: {
      generatedAt: null,
      snapshotCreatedAt: null,
      snapshotId: null,
      snapshotReason: null,
      source: "live",
    },
    metrics: {
      nutritionCharts: {
        averages: {
          carbs: 0,
          fat: 0,
          kcal: 0,
          protein: 0,
        },
        bodyMetrics: {
          bodyFatPct: null,
          deltaKg: null,
          latestMeasuredAt: null,
          latestWeightKg: null,
          previousWeightKg: null,
        },
        coachingSignals: [],
        dailyTrend: [],
        highlights: {
          avgKcalDelta: null,
          avgProteinDelta: null,
          latestTrackedAt: null,
          targetAlignedDays: 0,
          trackedDays: 0,
        },
        mealPatterns: {
          avgMealKcal: null,
          avgMealsPerTrackedDay: null,
          avgProteinPerMeal: null,
          dominantWindow: null,
          eveningCaloriesShare: null,
          mealCount: 0,
          patterns: [],
          proteinDenseMealShare: null,
          topFoods: [],
          trackedMealDays: 0,
        },
        recentDays: [],
        strategy: [],
        targets: {
          carbs: null,
          fat: null,
          kcal: null,
          protein: null,
        },
        totals: {
          carbs: 0,
          fat: 0,
          kcal: 0,
          protein: 0,
        },
      },
      periodComparison: {
        aiSessions: {
          current: 0,
          delta: 0,
          previous: 0,
        },
        caloriesTracked: {
          current: 0,
          delta: 0,
          previous: 0,
        },
        workoutsCompleted: {
          current: 0,
          delta: 0,
          previous: 0,
        },
      },
      snapshot: {
        activePrograms: 0,
        aiSessions: 0,
        completedDays: 0,
        draftPrograms: 0,
        exercises: 0,
        loggedSets: 0,
        nutritionDays: 0,
        templates: 0,
      },
      workoutCharts: {
        coachingSignals: [],
        highlights: {
          activeWeeks: 0,
          avgActualReps: null,
          avgActualRpe: null,
          avgActualWeightKg: null,
          avgCompletedDaysPerWeek: 0,
          avgLoggedSetsPerWorkout: 0,
          bestEstimatedOneRmKg: null,
          bestSetWeightKg: null,
          hardSetShareLast14: null,
          latestWorkoutAt: null,
        },
        recentDays: [],
        recovery: {
          avgActualRpeLast14: null,
          avgRecoveryDays: null,
          completedDaysLast14: 0,
          consistencyRatio: null,
          daysSinceLastWorkout: null,
          goalDaysPerWeek: null,
          loggedSetsLast14: 0,
          longestGapDays: null,
          status: "needs_attention",
          summary:
            "Пока нет завершенных тренировок. После первых сессий здесь появится сигнал по ритму и восстановлению.",
        },
        topExercises: [],
        totals: {
          completedDays: 0,
          loggedSets: 0,
          tonnageKg: 0,
        },
        weeklyTrend: [],
      },
    },
  };
}

function buildDashboardAiContext(
  dashboard: DashboardRuntimeMetricsResult,
): AiUserContext {
  const context = createEmptyAiUserContext();

  context.latestBodyMetrics = {
    bodyFatPct: dashboard.metrics.nutritionCharts.bodyMetrics.bodyFatPct,
    measuredAt: dashboard.metrics.nutritionCharts.bodyMetrics.latestMeasuredAt,
    weightKg: dashboard.metrics.nutritionCharts.bodyMetrics.latestWeightKg,
  };

  context.nutritionInsights = {
    avgKcalLast7: dashboard.metrics.nutritionCharts.averages.kcal,
    avgProteinLast7: dashboard.metrics.nutritionCharts.averages.protein,
    coachingSignals: dashboard.metrics.nutritionCharts.coachingSignals,
    daysTrackedLast7: dashboard.metrics.nutritionCharts.highlights.trackedDays,
    kcalDeltaFromTarget:
      dashboard.metrics.nutritionCharts.highlights.avgKcalDelta,
    latestTrackedDay:
      dashboard.metrics.nutritionCharts.highlights.latestTrackedAt,
    mealPatterns: dashboard.metrics.nutritionCharts.mealPatterns,
    proteinDeltaFromTarget:
      dashboard.metrics.nutritionCharts.highlights.avgProteinDelta,
    strategy: dashboard.metrics.nutritionCharts.strategy,
  };

  context.nutritionTargets = {
    carbsTarget: dashboard.metrics.nutritionCharts.targets.carbs,
    fatTarget: dashboard.metrics.nutritionCharts.targets.fat,
    kcalTarget: dashboard.metrics.nutritionCharts.targets.kcal,
    proteinTarget: dashboard.metrics.nutritionCharts.targets.protein,
  };

  context.workoutInsights = {
    avgActualReps: dashboard.metrics.workoutCharts.highlights.avgActualReps,
    avgActualRpe: dashboard.metrics.workoutCharts.highlights.avgActualRpe,
    avgActualWeightKg:
      dashboard.metrics.workoutCharts.highlights.avgActualWeightKg,
    bestEstimatedOneRmKg:
      dashboard.metrics.workoutCharts.highlights.bestEstimatedOneRmKg,
    bestSetWeightKg: dashboard.metrics.workoutCharts.highlights.bestSetWeightKg,
    coachingSignals: dashboard.metrics.workoutCharts.coachingSignals,
    completedDaysLast28:
      dashboard.metrics.workoutCharts.recovery.completedDaysLast14,
    hardSetShareLast28:
      dashboard.metrics.workoutCharts.highlights.hardSetShareLast14,
    latestCompletedDayAt:
      dashboard.metrics.workoutCharts.highlights.latestWorkoutAt,
    latestSessionBodyWeightKg:
      dashboard.metrics.workoutCharts.recentDays[0]?.bodyWeightKg ?? null,
    loggedSetsLast28: dashboard.metrics.workoutCharts.recovery.loggedSetsLast14,
    tonnageLast28Kg: dashboard.metrics.workoutCharts.totals.tonnageKg,
  };

  return context;
}

export default async function DashboardPage() {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();

  const dashboard = IS_PLAYWRIGHT_RUNTIME
    ? createFallbackDashboardResult()
    : await withTransientRetry(
        async () =>
          await withTimeout(
            getDashboardRuntimeMetrics(supabase, viewer.user.id),
            "dashboard runtime metrics",
          ),
        {
          attempts: 3,
          delaysMs: [500, 1_500, 3_000],
        },
      ).catch((error) => {
        logger.warn("dashboard page fallback activated", {
          error,
          userId: viewer.user.id,
        });

        return createFallbackDashboardResult();
      });

  const dashboardUpdatedAt =
    dashboard.cache.generatedAt ?? dashboard.cache.snapshotCreatedAt ?? null;
  const dashboardSourceLabel =
    dashboard.cache.source === "snapshot"
      ? "Сводка обновлена"
      : "Сводка пересчитана";

  return (
    <AppShell
      eyebrow="Обзор"
      title="Статус дня"
      viewer={toAppShellViewer(viewer)}
    >
      <DashboardWorkspace
        aiContext={buildDashboardAiContext(dashboard)}
        dashboardSourceLabel={dashboardSourceLabel}
        dashboardUpdatedAt={dashboardUpdatedAt}
        nutritionCharts={dashboard.metrics.nutritionCharts}
        periodComparison={dashboard.metrics.periodComparison}
        snapshot={dashboard.metrics.snapshot}
        viewerEmail={viewer.user.email ?? null}
        viewerName={viewer.profile?.full_name ?? null}
        workoutCharts={dashboard.metrics.workoutCharts}
      />
    </AppShell>
  );
}
