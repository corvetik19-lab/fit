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
      return "pt-[calc(0.9rem+env(safe-area-inset-top))] sm:pt-5";
    }

    if (isMobile) {
      return "pt-[calc(5.8rem+env(safe-area-inset-top))]";
    }

    return "pt-[calc(7.8rem+env(safe-area-inset-top))] xl:pt-[8.4rem]";
  }, [immersive, isMobile]);

  const showAssistantWidget =
    Boolean(viewer) && !hideAssistantWidget && !isMobileDrawerOpen;
  const brandLabel = getViewerBadge(viewer);
  const viewerIdentity = viewer?.fullName ?? viewer?.email ?? "Аккаунт fit";

  return (
    <div className="min-h-dvh">
      {!immersive ? (
        <header className="fixed inset-x-0 top-0 z-30 px-4 pt-[calc(0.8rem+env(safe-area-inset-top))] sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1500px]">
            <div className="card rounded-[2rem] px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/82 p-2 shadow-[0_20px_40px_-28px_rgba(0,64,224,0.22)]">
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
                    <p className="app-display text-xl font-black tracking-tight text-accent">
                      {brandLabel}
                    </p>
                    <p className="workspace-kicker mt-1">{eyebrow}</p>
                  </div>
                </div>

                <div className="hidden min-w-0 flex-1 items-center justify-center px-6 lg:flex">
                  <p className="truncate text-sm font-semibold uppercase tracking-[0.24em] text-muted">
                    {title}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className="hidden xl:flex">
                    <span className="pill">{viewerIdentity}</span>
                  </div>
                  <AppShellNav
                    minimal={isMobile}
                    onDrawerOpenChange={setIsMobileDrawerOpen}
                    viewer={viewer}
                  />
                </div>
              </div>

              <div className="mt-3 lg:hidden">
                <p className="truncate text-sm font-semibold text-foreground">
                  {title}
                </p>
              </div>
            </div>
          </div>
        </header>
      ) : null}

      <main
        className={`mx-auto grid max-w-[1500px] gap-6 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pb-8 ${topPaddingClassName}`}
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
