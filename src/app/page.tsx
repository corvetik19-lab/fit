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
      <div className="relative z-10 w-full max-w-[32rem]">
        <header className="mb-8 flex flex-col items-center text-center sm:mb-10">
          <Image
            alt="fit"
            className="h-28 w-28 object-contain drop-shadow-[0_22px_46px_rgba(0,64,224,0.18)] sm:h-32 sm:w-32"
            height={128}
            priority
            src="/fit-logo.svg"
            width={128}
          />
          <p className="mt-5 font-display text-5xl font-black tracking-[-0.1em] text-accent sm:text-6xl">
            fit
          </p>
          <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-muted sm:text-[0.95rem]">
            Тренируйся точно. Восстанавливайся умно.
          </p>
        </header>

        <section className="flex justify-center">
          <AuthForm />
        </section>
      </div>
    </main>
  );
}
