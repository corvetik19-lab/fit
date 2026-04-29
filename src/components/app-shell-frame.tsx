"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useState } from "react";

import { AiAssistantWidget } from "@/components/ai-assistant-widget";
import { AppShellNav } from "@/components/app-shell-nav";
import { RepairMojibakeTree } from "@/components/repair-mojibake-tree";
import { WorkoutSyncMonitor } from "@/components/workout-sync-monitor";

type PlatformAdminRole = "super_admin" | "support_admin" | "analyst" | null;

type AppShellFrameProps = {
  children: ReactNode;
  compactHeader?: boolean;
  eyebrow: string;
  hideAssistantWidget?: boolean;
  immersive?: boolean;
  title: string;
  viewer: {
    email: string | null;
    fullName: string | null;
    isPlatformAdmin: boolean;
    platformAdminRole: PlatformAdminRole;
    userId: string;
  } | null;
};

function getViewerBadge(viewer: AppShellFrameProps["viewer"]) {
  if (!viewer) {
    return "fitora";
  }

  return viewer.isPlatformAdmin ? "fitora admin" : "fitora";
}

export function AppShellFrame({
  children,
  eyebrow,
  hideAssistantWidget = false,
  immersive = false,
  title,
  viewer,
}: AppShellFrameProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const topPaddingClassName = immersive
    ? "pt-[calc(0.75rem+env(safe-area-inset-top))] sm:pt-4"
    : "pt-[calc(4.05rem+env(safe-area-inset-top))] lg:pt-[calc(4.75rem+env(safe-area-inset-top))] xl:pt-[5rem]";

  const showAssistantWidget =
    Boolean(viewer) && !hideAssistantWidget && !isMobileDrawerOpen;
  const brandLabel = getViewerBadge(viewer);
  const viewerIdentity = viewer?.fullName ?? viewer?.email ?? "Аккаунт fitora";

  return (
    <RepairMojibakeTree>
      <div className="min-h-dvh">
        {!immersive ? (
          <header className="fixed inset-x-0 top-0 z-30 overflow-x-clip pt-[calc(0.55rem+env(safe-area-inset-top))]">
            <div className="mx-3 max-w-[26.875rem] sm:mx-auto lg:max-w-[1500px] lg:px-10">
              <div className="surface-panel surface-panel--soft flex w-full items-center justify-between gap-2.5 rounded-[1rem] px-2.5 py-1.5 sm:px-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="min-w-0">
                    <Image
                      alt={brandLabel}
                      className="h-8 w-auto max-w-[7.9rem] object-contain sm:h-9 sm:max-w-[9.5rem]"
                      height={96}
                      priority
                      src="/fitora-logo-clean.png"
                      width={900}
                    />
                    <p className="workspace-kicker mt-0.5 hidden text-[0.54rem] sm:block">
                      {eyebrow}
                    </p>
                  </div>
                </div>

                <div className="hidden min-w-0 flex-1 items-center justify-center px-6 lg:flex">
                  <div className="truncate text-center">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {title}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className="hidden xl:flex">
                    <span className="pill max-w-[14rem]" title={viewerIdentity}>
                      {viewerIdentity}
                    </span>
                  </div>

                  <div className="lg:hidden">
                    <AppShellNav
                      minimal
                      onDrawerOpenChange={setIsMobileDrawerOpen}
                      viewer={viewer}
                    />
                  </div>

                  <div className="hidden lg:block">
                    <AppShellNav
                      minimal={false}
                      onDrawerOpenChange={setIsMobileDrawerOpen}
                      viewer={viewer}
                    />
                  </div>
                </div>
              </div>
            </div>
          </header>
        ) : null}

        <main
          className={`mx-auto grid w-full max-w-[26.875rem] grid-cols-[minmax(0,1fr)] gap-3 overflow-x-clip px-3 pb-[calc(5.35rem+env(safe-area-inset-bottom))] sm:px-4 lg:max-w-[1500px] lg:px-10 lg:gap-5 lg:pb-8 ${topPaddingClassName}`}
        >
          {children}
        </main>

        {viewer ? <WorkoutSyncMonitor /> : null}

        {showAssistantWidget ? (
          <AiAssistantWidget
            hidden={isMobileDrawerOpen}
            initialMessages={[]}
            initialSessionId={null}
            viewer={{
              email: viewer?.email ?? null,
              fullName: viewer?.fullName ?? null,
            }}
          />
        ) : null}
      </div>
    </RepairMojibakeTree>
  );
}
