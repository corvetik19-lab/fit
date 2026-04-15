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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-5 py-8 sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(36,188,181,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(32,99,175,0.08),transparent_24%),linear-gradient(180deg,#faf6f1_0%,#f5f2ed_46%,#eee6dc_100%)]" />

      <div className="relative z-10 w-full max-w-[28rem]">
        <header className="mb-8 flex flex-col items-center text-center sm:mb-10">
          <Image
            alt="fit"
            className="h-24 w-24 object-contain drop-shadow-[0_18px_30px_rgba(35,152,185,0.18)] sm:h-28 sm:w-28"
            height={112}
            priority
            src="/fit-logo.svg"
            width={112}
          />
          <p className="mt-4 font-display text-5xl font-black tracking-[-0.1em] text-foreground sm:text-6xl">
            fit
          </p>
          <p className="mt-3 max-w-xs text-sm font-medium leading-6 text-muted sm:text-[0.95rem]">
            Одна платформа для тренировок, питания и спокойного контроля прогресса.
          </p>
        </header>

        <section className="flex justify-center">
          <AuthForm />
        </section>
      </div>
    </main>
  );
}
