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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-5 py-6 sm:px-8 sm:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(36,188,181,0.07),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(32,99,175,0.07),transparent_22%),linear-gradient(180deg,#fbf7f2_0%,#f5f2ed_54%,#efe8df_100%)]" />

      <div className="relative z-10 w-full max-w-[21.5rem]">
        <header className="mb-6 flex flex-col items-center text-center sm:mb-7">
          <Image
            alt="fit"
            className="h-24 w-24 object-contain drop-shadow-[0_16px_24px_rgba(35,152,185,0.18)] sm:h-28 sm:w-28"
            height={112}
            priority
            src="/fit-logo.svg"
            width={112}
          />
          <p className="mt-2.5 font-display text-[2.9rem] font-black tracking-[-0.1em] text-foreground sm:text-[3.35rem]">
            fit
          </p>
          <p className="mt-2 max-w-[17.5rem] text-sm font-medium leading-6 text-muted sm:text-[0.92rem]">
            Ежедневный ритм тренировок, питания и прогресса без лишнего шума.
          </p>
        </header>

        <section className="flex justify-center">
          <AuthForm />
        </section>
      </div>
    </main>
  );
}
