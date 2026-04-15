import { AppShell, toAppShellViewer } from "@/components/app-shell";
import { DashboardWorkspace } from "@/components/dashboard-workspace";
import {
  getAiRuntimeContext,
  type AiRuntimeContextResult,
  type AiUserContext,
} from "@/lib/ai/user-context";
import {
  getDashboardRuntimeMetrics,
  type DashboardNutritionCharts,
  type DashboardPeriodComparison,
  type DashboardRuntimeMetricsResult,
  type DashboardSnapshot,
  type DashboardWorkoutCharts,
} from "@/lib/dashboard/metrics";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireReadyViewer } from "@/lib/viewer";
import { withTransientRetry } from "@/lib/runtime-retry";

const DASHBOARD_PAGE_RUNTIME_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}

function createEmptyDashboardSnapshot(): DashboardSnapshot {
  return {
    activePrograms: 0,
    aiSessions: 0,
    completedDays: 0,
    draftPrograms: 0,
    exercises: 0,
    loggedSets: 0,
    nutritionDays: 0,
    templates: 0,
  };
}

function createEmptyPeriodComparisonMetric() {
  return {
    current: 0,
    delta: 0,
    previous: 0,
  };
}

function createEmptyDashboardPeriodComparison(): DashboardPeriodComparison {
  return {
    aiSessions: createEmptyPeriodComparisonMetric(),
    caloriesTracked: createEmptyPeriodComparisonMetric(),
    workoutsCompleted: createEmptyPeriodComparisonMetric(),
  };
}

function createEmptyDashboardWorkoutCharts(): DashboardWorkoutCharts {
  return {
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
      status: "steady",
      summary:
        "Сводка тренировок временно недоступна. Основной экран открыт в безопасном режиме, чтобы можно было продолжить работу.",
    },
    topExercises: [],
    totals: {
      completedDays: 0,
      loggedSets: 0,
      tonnageKg: 0,
    },
    weeklyTrend: [],
  };
}

function createEmptyDashboardNutritionCharts(): DashboardNutritionCharts {
  return {
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
  };
}

function createEmptyDashboardRuntimeResult(): DashboardRuntimeMetricsResult {
  return {
    cache: {
      generatedAt: null,
      snapshotCreatedAt: null,
      snapshotId: null,
      snapshotReason: null,
      source: "live",
    },
    metrics: {
      nutritionCharts: createEmptyDashboardNutritionCharts(),
      periodComparison: createEmptyDashboardPeriodComparison(),
      snapshot: createEmptyDashboardSnapshot(),
      workoutCharts: createEmptyDashboardWorkoutCharts(),
    },
  };
}

function createEmptyAiRuntimeContextResult(): AiRuntimeContextResult {
  const context: AiUserContext = {
    goal: {
      goalType: null,
      targetWeightKg: null,
      weeklyTrainingDays: null,
    },
    latestBodyMetrics: {
      bodyFatPct: null,
      measuredAt: null,
      weightKg: null,
    },
    latestNutritionSummary: {
      carbs: null,
      fat: null,
      kcal: null,
      protein: null,
      summaryDate: null,
    },
    nutritionInsights: {
      avgKcalLast7: null,
      avgProteinLast7: null,
      coachingSignals: [],
      daysTrackedLast7: 0,
      kcalDeltaFromTarget: null,
      latestTrackedDay: null,
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
      proteinDeltaFromTarget: null,
      strategy: [],
    },
    nutritionTargets: {
      carbsTarget: null,
      fatTarget: null,
      kcalTarget: null,
      proteinTarget: null,
    },
    onboarding: {
      age: null,
      dietaryPreferences: [],
      equipment: [],
      fitnessLevel: null,
      heightCm: null,
      injuries: [],
      sex: null,
      weightKg: null,
    },
    profile: {
      fullName: null,
    },
    structuredKnowledge: {
      facts: [],
      generatedAt: new Date().toISOString(),
    },
    workoutInsights: {
      avgActualReps: null,
      avgActualRpe: null,
      avgActualWeightKg: null,
      bestEstimatedOneRmKg: null,
      bestSetWeightKg: null,
      coachingSignals: [],
      completedDaysLast28: 0,
      hardSetShareLast28: null,
      latestCompletedDayAt: null,
      latestSessionBodyWeightKg: null,
      loggedSetsLast28: 0,
      tonnageLast28Kg: null,
    },
  };

  return {
    cache: {
      generatedAt: context.structuredKnowledge.generatedAt,
      snapshotCreatedAt: null,
      snapshotId: null,
      snapshotReason: null,
      source: "live",
    },
    context,
  };
}

async function loadDashboardRuntime(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
) {
  try {
    return await withTransientRetry(
      async () =>
        await withTimeout(
          getDashboardRuntimeMetrics(supabase, userId),
          DASHBOARD_PAGE_RUNTIME_TIMEOUT_MS,
          "dashboard runtime metrics",
        ),
      {
        attempts: 3,
        delaysMs: [500, 1_500, 3_000],
      },
    );
  } catch (error) {
    logger.warn("dashboard page is using runtime fallback", { error, userId });
    return createEmptyDashboardRuntimeResult();
  }
}

async function loadAiRuntime(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
) {
  try {
    return await withTransientRetry(
      async () =>
        await withTimeout(
          getAiRuntimeContext(supabase, userId),
          DASHBOARD_PAGE_RUNTIME_TIMEOUT_MS,
          "AI runtime context",
        ),
      {
        attempts: 3,
        delaysMs: [500, 1_500, 3_000],
      },
    );
  } catch (error) {
    logger.warn("dashboard page is using AI runtime fallback", { error, userId });
    return createEmptyAiRuntimeContextResult();
  }
}

export default async function DashboardPage() {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const [dashboardRuntime, aiRuntime] = await Promise.all([
    loadDashboardRuntime(supabase, viewer.user.id),
    loadAiRuntime(supabase, viewer.user.id),
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
    <AppShell eyebrow="Обзор" title="Статус дня" viewer={toAppShellViewer(viewer)}>
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
