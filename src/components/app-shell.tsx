import type { ReactNode } from "react";

import { AppShellFrame } from "@/components/app-shell-frame";
import { getLatestAiChatState } from "@/lib/ai/chat";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

export async function AppShell({
  title,
  eyebrow,
  children,
  compactHeader = false,
  hideAssistantWidget = false,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  compactHeader?: boolean;
  hideAssistantWidget?: boolean;
}) {
  const viewer = await getViewer();
  const supabase = viewer ? await createServerSupabaseClient() : null;
  const assistantState =
    viewer && supabase
      ? await getLatestAiChatState(supabase, viewer.user.id)
      : { session: null, messages: [] };

  return (
    <AppShellFrame
      assistantState={assistantState}
      compactHeader={compactHeader}
      eyebrow={eyebrow}
      hideAssistantWidget={hideAssistantWidget}
      title={title}
      viewer={
        viewer
          ? {
              userId: viewer.user.id,
              email: viewer.user.email ?? null,
              fullName: viewer.profile?.full_name ?? null,
              isPlatformAdmin: viewer.isPlatformAdmin,
              platformAdminRole: viewer.platformAdminRole,
            }
          : null
      }
    >
      {children}
    </AppShellFrame>
  );
}
