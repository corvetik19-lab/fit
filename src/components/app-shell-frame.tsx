"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { AiAssistantWidget } from "@/components/ai-assistant-widget";
import { AppShellNav } from "@/components/app-shell-nav";
import { WorkoutSyncMonitor } from "@/components/workout-sync-monitor";

type PlatformAdminRole = "super_admin" | "support_admin" | "analyst" | null;

type AppShellFrameProps = {
  title: string;
  eyebrow: string;
  children: ReactNode;
  compactHeader?: boolean;
  hideAssistantWidget?: boolean;
  immersive?: boolean;
  viewer: {
    userId: string;
    email: string | null;
    fullName: string | null;
    isPlatformAdmin: boolean;
    platformAdminRole: PlatformAdminRole;
  } | null;
};

const collapseStorageKey = "fit-app-shell-collapsed";

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getCollapseSnapshot() {
  return window.localStorage.getItem(collapseStorageKey) === "true";
}

function getServerSnapshot() {
  return false;
}

export function AppShellFrame({
  title,
  eyebrow,
  children,
  compactHeader = false,
  hideAssistantWidget = false,
  immersive = false,
  viewer,
}: AppShellFrameProps) {
  const isCollapsed = useSyncExternalStore(
    subscribeToStorage,
    getCollapseSnapshot,
    getServerSnapshot,
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const syncViewport = () => setIsMobile(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  function toggleCollapsed() {
    const nextValue = !isCollapsed;
    window.localStorage.setItem(collapseStorageKey, String(nextValue));
    window.dispatchEvent(
      new StorageEvent("storage", { key: collapseStorageKey }),
    );
  }

  const shouldUseCompactHeader =
    !immersive && !isMobile && (compactHeader || isCollapsed);
  const showMobileHeader = !immersive && isMobile;
  const showAssistantWidget = Boolean(viewer) && !hideAssistantWidget;

  return (
    <div className="min-h-dvh">
      {showMobileHeader ? (
        <header className="fixed inset-x-0 top-0 z-30 px-4 pt-[calc(0.65rem+env(safe-area-inset-top))] sm:px-6 lg:hidden">
          <div className="mx-auto max-w-[1500px]">
            <div className="flex items-center gap-3 rounded-[1.5rem] border border-white/60 bg-[color-mix(in_srgb,var(--surface)_94%,white)] px-3 py-3 shadow-[0_18px_45px_rgba(24,22,19,0.08)] backdrop-blur-xl">
              <AppShellNav minimal viewer={viewer} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[0.64rem] uppercase tracking-[0.22em] text-muted">
                  {eyebrow}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {title}
                </p>
              </div>
            </div>
          </div>
        </header>
      ) : null}

      {!immersive && !shouldUseCompactHeader ? (
        <header className="fixed inset-x-0 top-0 z-30 hidden px-4 pt-[calc(0.65rem+env(safe-area-inset-top))] sm:px-6 lg:block lg:px-10">
          <div className="mx-auto max-w-[1500px]">
            <div className="card border-white/60 bg-[color-mix(in_srgb,var(--surface)_90%,white)] p-4 backdrop-blur-xl sm:p-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-muted">
                      <span className="h-2 w-2 rounded-full bg-accent" />
                      {eyebrow}
                    </div>
                    <h1 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
                      {title}
                    </h1>
                  </div>

                  <button
                    aria-expanded
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white"
                    onClick={toggleCollapsed}
                    type="button"
                  >
                    <ChevronUp size={18} strokeWidth={2.2} />
                    Свернуть
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="pill">
                    {viewer?.fullName ?? viewer?.email ?? "Аккаунт fit"}
                  </span>
                  {viewer?.isPlatformAdmin ? (
                    <span className="pill">Доступ администратора активен</span>
                  ) : null}
                </div>

                <AppShellNav viewer={viewer} />
              </div>
            </div>
          </div>
        </header>
      ) : null}

      {!immersive && shouldUseCompactHeader ? (
        <div className="fixed right-4 top-[calc(0.35rem+env(safe-area-inset-top))] z-30 flex items-center gap-2 sm:right-6 lg:right-10">
          <div className="rounded-full border border-border bg-white/90 p-1.5 shadow-[0_16px_40px_-28px_rgba(24,22,19,0.5)] backdrop-blur-xl">
            <AppShellNav minimal viewer={viewer} />
          </div>

          {!compactHeader ? (
            <button
              aria-expanded={false}
              aria-label="Развернуть верхнюю панель"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/92 text-foreground shadow-[0_16px_40px_-28px_rgba(24,22,19,0.5)] backdrop-blur-xl transition hover:bg-white"
              onClick={toggleCollapsed}
              type="button"
            >
              <ChevronDown size={18} strokeWidth={2.2} />
            </button>
          ) : (
            <div className="hidden items-center rounded-full border border-border bg-white/92 px-3 py-2 text-xs font-medium text-muted shadow-[0_16px_40px_-28px_rgba(24,22,19,0.5)] backdrop-blur-xl sm:flex">
              Панель скрыта
            </div>
          )}
        </div>
      ) : null}

      <main
        className={`mx-auto grid max-w-[1500px] gap-6 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pb-8 ${
          immersive
            ? "pt-[calc(0.8rem+env(safe-area-inset-top))] sm:pt-4 lg:pt-5"
            : showMobileHeader
              ? "pt-[calc(5.4rem+env(safe-area-inset-top))]"
              : shouldUseCompactHeader
                ? "pt-[calc(0.9rem+env(safe-area-inset-top))] sm:pt-[1.15rem] lg:pt-[1.3rem]"
                : "pt-[calc(10.8rem+env(safe-area-inset-top))] sm:pt-[12.5rem] lg:pt-[12.8rem]"
        }`}
      >
        {children}
      </main>

      {viewer ? <WorkoutSyncMonitor /> : null}

      {showAssistantWidget ? (
        <AiAssistantWidget
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
