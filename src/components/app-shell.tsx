import type { ReactNode } from "react";

import { AppShellFrame } from "@/components/app-shell-frame";
import { RepairMojibakeTree } from "@/components/repair-mojibake-tree";
import { logger } from "@/lib/logger";
import { repairMojibakeText } from "@/lib/text/repair-mojibake";
import type { Viewer } from "@/lib/viewer";
import { getViewer } from "@/lib/viewer";

const APP_SHELL_VIEWER_TIMEOUT_MS = 5_000;

export type AppShellViewer = {
  userId: string;
  email: string | null;
  fullName: string | null;
  isPlatformAdmin: boolean;
  platformAdminRole: Viewer["platformAdminRole"];
};

export function toAppShellViewer(viewer: Viewer | null): AppShellViewer | null {
  if (!viewer) {
    return null;
  }

  return {
    userId: viewer.user.id,
    email: viewer.user.email ?? null,
    fullName: viewer.profile?.full_name ?? null,
    isPlatformAdmin: viewer.isPlatformAdmin,
    platformAdminRole: viewer.platformAdminRole,
  };
}

async function readAppShellViewerOrFallback() {
  try {
    return await Promise.race<AppShellViewer | null>([
      getViewer().then((viewer) => toAppShellViewer(viewer)),
      new Promise<AppShellViewer | null>((resolve) => {
        setTimeout(() => resolve(null), APP_SHELL_VIEWER_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    logger.warn("app shell viewer fallback activated", { error });
    return null;
  }
}

export async function AppShell({
  title,
  eyebrow,
  children,
  compactHeader = false,
  hideAssistantWidget = false,
  immersive = false,
  viewer: initialViewer,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  compactHeader?: boolean;
  hideAssistantWidget?: boolean;
  immersive?: boolean;
  viewer?: AppShellViewer | null;
}) {
  const viewer = initialViewer ?? (await readAppShellViewerOrFallback());

  return (
    <AppShellFrame
      compactHeader={compactHeader}
      eyebrow={repairMojibakeText(eyebrow)}
      hideAssistantWidget={hideAssistantWidget}
      immersive={immersive}
      title={repairMojibakeText(title)}
      viewer={viewer}
    >
      <RepairMojibakeTree>{children}</RepairMojibakeTree>
    </AppShellFrame>
  );
}
