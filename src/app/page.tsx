import type { Route } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getViewer } from "@/lib/viewer";

export default async function Home() {
  const viewer = await getViewer();

  if (viewer) {
    redirect(
      (viewer.hasCompletedOnboarding ? "/dashboard" : "/onboarding") as Route,
    );
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-5 py-10 sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(46,91,255,0.12),transparent_34%),linear-gradient(180deg,#fcf9f8_0%,#f6f3f2_100%)]" />
      <div className="relative z-10 w-full max-w-[36rem]">
        <header className="mb-8 flex justify-center">
          <div className="flex items-center gap-3 rounded-full bg-white/78 px-4 py-3 shadow-[0_18px_42px_-32px_rgba(28,27,27,0.24)] backdrop-blur-xl">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-2 shadow-[0_14px_30px_-24px_rgba(28,27,27,0.28)]">
              <Image
                alt="fit"
                className="h-full w-full object-contain"
                height={44}
                priority
                src="/fit-logo.svg"
                width={44}
              />
            </span>
            <div>
              <p className="font-display text-3xl font-black tracking-[-0.08em] text-accent">
                fit
              </p>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-muted">
                fitness platform
              </p>
            </div>
          </div>
        </header>

        <section className="flex justify-center">
          <AuthForm />
        </section>
      </div>
    </main>
  );
}
