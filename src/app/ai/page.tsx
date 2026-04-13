import { AiWorkspace } from "@/components/ai-workspace";
import { AppShell } from "@/components/app-shell";
import { getAiChatState, listAiChatSessions } from "@/lib/ai/chat";
import { listAiPlanProposals } from "@/lib/ai/proposals";
import { getAiRuntimeContext } from "@/lib/ai/user-context";
import { readUserBillingAccessOrFallback } from "@/lib/billing-access";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireReadyViewer } from "@/lib/viewer";

type AiPageProps = {
  searchParams?: Promise<{
    session?: string | string[] | undefined;
  }>;
};

export default async function AiPage({ searchParams }: AiPageProps) {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const sessionParam = Array.isArray(resolvedSearchParams.session)
    ? resolvedSearchParams.session[0]
    : resolvedSearchParams.session ?? null;

  const [runtimeContext, proposals, chatState, recentSessions, access] =
    await Promise.all([
      getAiRuntimeContext(supabase, viewer.user.id),
      listAiPlanProposals(supabase, viewer.user.id, 10),
      getAiChatState(supabase, viewer.user.id, sessionParam, {
        fallbackToLatest: false,
      }),
      listAiChatSessions(supabase, viewer.user.id, 30),
      readUserBillingAccessOrFallback(supabase, viewer.user.id, {
        email: viewer.user.email,
      }),
    ]);

  return (
    <AppShell compactHeader eyebrow="AI" hideAssistantWidget immersive title="AI-коуч">
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
