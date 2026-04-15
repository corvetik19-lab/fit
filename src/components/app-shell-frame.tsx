"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { AiAssistantWidget } from "@/components/ai-assistant-widget";
import { AppShellNav } from "@/components/app-shell-nav";
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
    return "fit";
  }

  return viewer.isPlatformAdmin ? "fit admin" : "fit";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const syncViewport = () => setIsMobile(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  const topPaddingClassName = useMemo(() => {
    if (immersive) {
      return "pt-[calc(0.75rem+env(safe-area-inset-top))] sm:pt-4";
    }

    if (isMobile) {
      return "pt-[calc(4.5rem+env(safe-area-inset-top))]";
    }

    return "pt-[calc(5.35rem+env(safe-area-inset-top))] xl:pt-[5.7rem]";
  }, [immersive, isMobile]);

  const showAssistantWidget =
    Boolean(viewer) && !hideAssistantWidget && !isMobileDrawerOpen;
  const brandLabel = getViewerBadge(viewer);
  const viewerIdentity = viewer?.fullName ?? viewer?.email ?? "Аккаунт fit";

  return (
    <div className="min-h-dvh">
      {!immersive ? (
        <header className="fixed inset-x-0 top-0 z-30 overflow-x-clip pt-[calc(0.65rem+env(safe-area-inset-top))]">
          <div className="mx-4 sm:mx-6 lg:mx-auto lg:max-w-[1500px] lg:px-10">
            <div className="surface-panel surface-panel--soft flex w-full items-center justify-between gap-3 rounded-[1.1rem] px-3 py-2.5 sm:px-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border border-border bg-[color-mix(in_srgb,var(--accent-soft)_32%,white)] p-2">
                  <Image
                    alt="fit"
                    className="h-full w-full object-contain"
                    height={44}
                    priority
                    src="/fit-logo.svg"
                    width={44}
                  />
                </div>

                <div className="min-w-0">
                  <p className="app-display truncate text-lg font-black tracking-[-0.08em] text-foreground">
                    {brandLabel}
                  </p>
                  <p className="workspace-kicker mt-1 text-[0.6rem]">{eyebrow}</p>
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

                <AppShellNav
                  minimal={isMobile}
                  onDrawerOpenChange={setIsMobileDrawerOpen}
                  viewer={viewer}
                />
              </div>
            </div>

            <div className="px-1 pb-1 pt-2 lg:hidden">
              <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted">
                {title}
              </p>
            </div>
          </div>
        </header>
      ) : null}

      <main
        className={`mx-auto grid w-full max-w-[1500px] grid-cols-[minmax(0,1fr)] gap-4 overflow-x-clip px-4 pb-[calc(5.85rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:gap-5 lg:pb-8 ${topPaddingClassName}`}
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
  );
}
