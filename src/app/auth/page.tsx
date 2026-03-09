import type { Route } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getViewer } from "@/lib/viewer";

export default async function AuthPage() {
  const viewer = await getViewer();

  if (viewer) {
    redirect(
      (viewer.hasCompletedOnboarding ? "/dashboard" : "/onboarding") as Route,
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10 lg:grid lg:grid-cols-[1fr_0.9fr] lg:items-start">
      <section className="card overflow-hidden p-8 sm:p-10">
        <div className="mb-4 flex flex-wrap gap-3">
          <span className="pill">Supabase Auth</span>
          <span className="pill">Онбординг</span>
          <span className="pill">Локальный контур</span>
        </div>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Вход и регистрация теперь подключены к реальному локальному контуру
          fit.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
          После входа пользователь попадает в онбординг, а затем уже в
          приложение. Контекст сразу сохраняется в Supabase и становится базой
          для дашборда, питания и AI.
        </p>
      </section>

      <AuthForm />
    </main>
  );
}
