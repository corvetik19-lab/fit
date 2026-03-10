import type { Route } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getViewer } from "@/lib/viewer";

export default async function Home() {
  const viewer = await getViewer();

  if (viewer) {
    redirect((viewer.hasCompletedOnboarding ? "/dashboard" : "/onboarding") as Route);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[1180px] items-center px-4 py-4 sm:px-6 sm:py-8 lg:px-10">
      <section className="grid w-full gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="card overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap gap-2">
            <span className="pill">fit</span>
            <span className="pill">вход в приложение</span>
          </div>

          <div className="mt-6 space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Откройте платформу и продолжайте с того места, где остановились.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
              Войдите в аккаунт или создайте новый. Сессия сохранится на этом
              устройстве, пока вы сами не выйдете из приложения.
            </p>
          </div>
        </article>

        <div className="flex items-center justify-center xl:justify-end">
          <AuthForm />
        </div>
      </section>
    </main>
  );
}
