import type { ReactNode } from "react";

import { AppShellFrame } from "@/components/app-shell-frame";
import { getViewer } from "@/lib/viewer";

export async function AppShell({
  title,
  eyebrow,
  children,
  compactHeader = false,
  hideAssistantWidget: _hideAssistantWidget = false,
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
  void _hideAssistantWidget;

  return (
    <AppShellFrame
      compactHeader={compactHeader}
      eyebrow={eyebrow}
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
