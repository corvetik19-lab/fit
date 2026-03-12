"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
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
  assistantState: {
    session: {
      id: string;
      title: string | null;
      created_at: string;
      updated_at: string;
    } | null;
    messages: Array<{
      id: string;
      session_id: string;
      role: "user" | "assistant";
      content: string;
      created_at: string;
    }>;
  };
  viewer: {
    userId: string;
    email: string | null;
    fullName: string | null;
    isPlatformAdmin: boolean;
    platformAdminRole: PlatformAdminRole;
  } | null;
};

const collapseStorageKey = "fit-app-shell-collapsed";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot() {
  return window.localStorage.getItem(collapseStorageKey) === "true";
}

function getServerSnapshot() {
  return false;
}

export function AppShellFrame({
  title,
  eyebrow,
  assistantState,
  children,
  compactHeader = false,
  hideAssistantWidget = false,
  immersive = false,
  viewer,
}: AppShellFrameProps) {
  const isCollapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function toggleCollapsed() {
    const nextValue = !isCollapsed;
    window.localStorage.setItem(collapseStorageKey, String(nextValue));
    window.dispatchEvent(
      new StorageEvent("storage", { key: collapseStorageKey }),
    );
  }

  const shouldUseCompactHeader = !immersive && (compactHeader || isCollapsed);
  const showAssistantWidget = Boolean(viewer) && !hideAssistantWidget;

  return (
    <div className="min-h-dvh">
      {!immersive && !shouldUseCompactHeader ? (
        <header className="fixed inset-x-0 top-0 z-30 px-4 pt-[calc(0.65rem+env(safe-area-inset-top))] sm:px-6 lg:px-10">
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
        <div className="fixed inset-x-0 top-[calc(0.35rem+env(safe-area-inset-top))] z-30 px-4 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 rounded-full border border-border bg-white/90 px-3 py-2 shadow-[0_16px_40px_-28px_rgba(24,22,19,0.5)] backdrop-blur-xl">
            <AppShellNav minimal viewer={viewer} />
            <div className="hidden min-w-0 items-center gap-2 sm:flex">
              <span className="rounded-full border border-border bg-white/80 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
                {eyebrow}
              </span>
              <p className="truncate text-sm font-medium text-foreground">
                {title}
              </p>
            </div>
            {!compactHeader ? (
              <button
                aria-expanded={false}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white/88 px-4 text-sm font-semibold text-foreground transition hover:bg-white"
                onClick={toggleCollapsed}
                type="button"
              >
                <ChevronDown size={18} strokeWidth={2.2} />
                Развернуть
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <main
        className={`mx-auto grid max-w-[1500px] gap-6 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pb-8 ${
          immersive
            ? "pt-[calc(0.8rem+env(safe-area-inset-top))] sm:pt-4 lg:pt-5"
            : shouldUseCompactHeader
              ? "pt-[calc(3.3rem+env(safe-area-inset-top))] sm:pt-[3.4rem] lg:pt-[3.6rem]"
              : "pt-[calc(10.8rem+env(safe-area-inset-top))] sm:pt-[12.5rem] lg:pt-[12.8rem]"
        }`}
      >
        {children}
      </main>

      {viewer ? <WorkoutSyncMonitor /> : null}

      {showAssistantWidget ? (
        <AiAssistantWidget
          initialMessages={assistantState.messages}
          initialSessionId={assistantState.session?.id ?? null}
          viewer={{
            email: viewer?.email ?? null,
            fullName: viewer?.fullName ?? null,
          }}
        />
      ) : null}
    </div>
  );
}
