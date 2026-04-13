import type { Route } from "next";
import { CircleHelp, Globe } from "lucide-react";
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
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/72 p-2 shadow-[0_14px_30px_-24px_rgba(28,27,27,0.28)]">
              <Image
                alt="fit"
                className="h-full w-full object-contain"
                height={44}
                priority
                src="/fit-logo.svg"
                width={44}
              />
            </span>
            <span className="font-display text-3xl font-black tracking-[-0.08em] text-accent">
              fit
            </span>
          </div>
          <div className="flex items-center gap-3 text-muted">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/72 shadow-[0_14px_30px_-24px_rgba(28,27,27,0.28)]">
              <Globe size={18} strokeWidth={2.1} />
            </span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/72 shadow-[0_14px_30px_-24px_rgba(28,27,27,0.28)]">
              <CircleHelp size={18} strokeWidth={2.1} />
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto flex min-h-dvh w-full max-w-[1500px] flex-col pt-20 md:flex-row md:pt-0">
        <article className="relative flex min-h-[26rem] w-full items-end overflow-hidden px-5 pb-10 pt-28 sm:min-h-[32rem] sm:px-8 sm:pb-14 md:min-h-dvh md:w-[52%] md:items-center md:px-12 md:pt-20 lg:px-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_20%,rgba(255,255,255,0.12),transparent_18%),linear-gradient(180deg,rgba(7,7,9,0.14),rgba(7,7,9,0.78)),linear-gradient(135deg,#040405_0%,#141518_50%,#4b4d52_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(180deg,rgba(252,249,248,0)_0%,rgba(252,249,248,0.96)_100%)] md:inset-y-0 md:right-0 md:left-auto md:h-auto md:w-40 md:bg-[linear-gradient(90deg,rgba(252,249,248,0)_0%,rgba(252,249,248,0.96)_100%)]" />
          <div className="absolute left-1/2 top-[14%] h-[22rem] w-[11rem] -translate-x-[6%] rounded-[8rem] bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.24),rgba(255,255,255,0.08)_24%,rgba(12,12,14,0.26)_56%,rgba(12,12,14,0)_74%)] opacity-60 blur-[1.5px] sm:h-[28rem] sm:w-[13rem] md:top-[12%] md:h-[35rem] md:w-[17rem]" />

          <div className="relative z-10 max-w-xl space-y-5">
            <h1 className="font-display text-6xl font-black leading-[0.9] tracking-[-0.12em] text-[#171719] drop-shadow-[0_16px_44px_rgba(255,255,255,0.18)] sm:text-7xl md:text-8xl">
              СОЗДАЙ
              <br />
              СЕБЯ.
            </h1>
            <p className="max-w-md text-base leading-8 text-[color:rgba(28,27,27,0.74)] sm:text-lg">
              Дисциплинированный интерфейс для тех, кто хочет держать под
              контролем тренировки, питание и реальный прогресс без лишнего
              шума.
            </p>
          </div>
        </article>

        <section className="flex w-full items-center justify-center px-5 pb-8 pt-3 sm:px-8 sm:pb-10 md:w-[48%] md:px-10 md:py-16 lg:px-14">
          <AuthForm />
        </section>
      </section>
    </main>
  );
}
