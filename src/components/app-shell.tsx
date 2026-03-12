import type { ReactNode } from "react";

import { AppShellFrame } from "@/components/app-shell-frame";
import { getViewer } from "@/lib/viewer";

export async function AppShell({
  title,
  eyebrow,
  children,
  compactHeader = false,
  hideAssistantWidget = false,
  immersive = false,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  compactHeader?: boolean;
  hideAssistantWidget?: boolean;
  immersive?: boolean;
}) {
  const viewer = await getViewer();

  return (
    <AppShellFrame
      compactHeader={compactHeader}
      eyebrow={eyebrow}
      hideAssistantWidget={hideAssistantWidget}
      immersive={immersive}
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
