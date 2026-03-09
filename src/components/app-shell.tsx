import type { ReactNode } from "react";

import { AppShellNav } from "@/components/app-shell-nav";
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
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-5 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:py-6 lg:px-10 lg:pb-8">
      <header className="sticky top-[env(safe-area-inset-top)] z-30">
        <div className="card border-white/60 bg-[color-mix(in_srgb,var(--surface)_88%,white)] p-4 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/65 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-muted">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  {eyebrow}
                </div>
                <h1 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {title}
                </h1>
              </div>

              <div className="hidden lg:flex">
                <div className="rounded-full border border-border bg-white/60 px-4 py-2 text-sm text-muted backdrop-blur">
                  PWA-first fit platform
                </div>
              </div>
            </div>

            <AppShellNav
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
            />
          </div>
        </div>
      </header>

      <main className="grid gap-6">{children}</main>
    </div>
  );
}
