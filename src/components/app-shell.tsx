import type { ReactNode } from "react";

import { AppShellFrame } from "@/components/app-shell-frame";
import { getViewer } from "@/lib/viewer";

export async function AppShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  const viewer = await getViewer();

  return (
    <AppShellFrame
      eyebrow={eyebrow}
      title={title}
      viewer={
        viewer
          ? {
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
