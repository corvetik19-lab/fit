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
  createEmptyAiRuntimeContextResult,
  getAiRuntimeContext,
} from "@/lib/ai/user-context";
import {
  createFallbackUserBillingAccessSnapshot,
  readUserBillingAccessOrFallback,
  type UserBillingAccessSnapshot,
} from "@/lib/billing-access";
import { logger } from "@/lib/logger";
import { withTimeout, withTransientRetry } from "@/lib/runtime-retry";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireReadyViewer } from "@/lib/viewer";

const AI_PAGE_DATA_TIMEOUT_MS = 20_000;

type AiPageProps = {
  searchParams?: Promise<{
    session?: string | string[] | undefined;
  }>;
};

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
    return await withTransientRetry(
      async () => await withTimeout(factory(), AI_PAGE_DATA_TIMEOUT_MS, label),
      {
        attempts: 3,
        delaysMs: [500, 1_500, 3_000],
      },
    );
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
