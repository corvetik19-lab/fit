import { AiWorkspace } from "@/components/ai-workspace";
import { AppShell, toAppShellViewer } from "@/components/app-shell";
import {
  getAiChatState,
  type AiChatMessageRow,
  type AiChatSessionRow,
  listAiChatSessions,
} from "@/lib/ai/chat";
import { type AiPlanProposalRow, listAiPlanProposals } from "@/lib/ai/proposals";
import {
  getAiRuntimeContext,
  type AiRuntimeContextResult,
  type AiUserContext,
} from "@/lib/ai/user-context";
import {
  createFallbackUserBillingAccessSnapshot,
  readUserBillingAccessOrFallback,
  type UserBillingAccessSnapshot,
} from "@/lib/billing-access";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireReadyViewer } from "@/lib/viewer";

const AI_PAGE_DATA_TIMEOUT_MS = 8_000;

type AiPageProps = {
  searchParams?: Promise<{
    session?: string | string[] | undefined;
  }>;
};

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

function createEmptyAiChatState() {
  return {
    messages: [] as AiChatMessageRow[],
    session: null as AiChatSessionRow | null,
  };
}

async function loadAiPageResource<T>(
  userId: string,
  label: string,
  factory: () => Promise<T>,
  fallback: () => T,
) {
  try {
    return await withTimeout(factory(), AI_PAGE_DATA_TIMEOUT_MS, label);
  } catch (error) {
    logger.warn("AI page is using fallback data", {
      error,
      label,
      userId,
    });
    return fallback();
  }
}

export default async function AiPage({ searchParams }: AiPageProps) {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const sessionParam = Array.isArray(resolvedSearchParams.session)
    ? resolvedSearchParams.session[0]
    : resolvedSearchParams.session ?? null;

  const [runtimeContext, proposals, chatState, recentSessions, access] =
    await Promise.all([
      loadAiPageResource(
        viewer.user.id,
        "AI runtime context",
        () => getAiRuntimeContext(supabase, viewer.user.id),
        createEmptyAiRuntimeContextResult,
      ),
      loadAiPageResource(
        viewer.user.id,
        "AI proposals",
        () => listAiPlanProposals(supabase, viewer.user.id, 10),
        () => [] as AiPlanProposalRow[],
      ),
      loadAiPageResource(
        viewer.user.id,
        "AI chat state",
        () =>
          getAiChatState(supabase, viewer.user.id, sessionParam, {
            fallbackToLatest: false,
          }),
        createEmptyAiChatState,
      ),
      loadAiPageResource(
        viewer.user.id,
        "AI chat sessions",
        () => listAiChatSessions(supabase, viewer.user.id, 30),
        () => [] as AiChatSessionRow[],
      ),
      loadAiPageResource<UserBillingAccessSnapshot>(
        viewer.user.id,
        "AI billing access",
        () =>
          readUserBillingAccessOrFallback(supabase, viewer.user.id, {
            email: viewer.user.email,
          }),
        () =>
          createFallbackUserBillingAccessSnapshot({
            email: viewer.user.email,
          }),
      ),
    ]);

  return (
    <AppShell
      compactHeader
      eyebrow="AI"
      hideAssistantWidget
      immersive
      title="AI-коуч"
      viewer={toAppShellViewer(viewer)}
    >
      <AiWorkspace
        chatAccess={access.features.ai_chat}
        initialMessages={chatState.messages}
        initialSessionId={chatState.session?.id ?? null}
        initialSessionTitle={chatState.session?.title ?? null}
        mealPhotoAccess={access.features.meal_photo}
        proposals={proposals}
        recentSessions={recentSessions}
        structuredKnowledge={runtimeContext.context.structuredKnowledge}
      />
    </AppShell>
  );
}
