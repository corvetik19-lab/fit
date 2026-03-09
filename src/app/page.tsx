import type { Route } from "next";
import Link from "next/link";

import { getViewer } from "@/lib/viewer";

export default async function Home() {
  const viewer = await getViewer();
  const primaryHref = (viewer
    ? viewer.hasCompletedOnboarding
      ? "/dashboard"
      : "/onboarding"
    : "/auth") as Route;
  const primaryLabel = viewer
    ? viewer.hasCompletedOnboarding
      ? "Открыть приложение"
      : "Продолжить онбординг"
    : "Войти в fit";

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-6 py-10 sm:px-10">
      <section className="card overflow-hidden p-8 sm:p-12">
        <div className="mb-4 flex flex-wrap gap-3">
          <span className="pill">Веб-PWA</span>
          <span className="pill">AI Gateway</span>
          <span className="pill">Supabase + pgvector</span>
        </div>
        <div className="grid gap-10 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-6">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              fit объединяет тренировки, питание, аналитику и AI-помощника в
              одном приложении с офлайн-сценариями.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted">
              В репозитории уже собран первый рабочий срез платформы: навигация,
              админ-панель, контракты Supabase, AI-маршруты, workout core и
              подготовка eval-контура для будущих RAG/CAG/KAG-проверок.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                href={primaryHref}
              >
                {primaryLabel}
              </Link>
              <Link
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70"
                href="/admin"
              >
                Открыть админ-панель
              </Link>
            </div>
          </div>
          <div className="grid gap-4">
            {[
              [
                "Авторизация",
                viewer
                  ? `Сессия активна для ${viewer.user.email ?? "текущего пользователя"}.`
                  : "Вход и регистрация через Supabase уже работают.",
              ],
              ["Тренировки", "Недельные планы, фиксация недели и логирование подходов."],
              ["Питание", "Учёт приёмов пищи, рецепты, КБЖУ и будущий анализ фото."],
              ["AI", "Планирование на Gemini, embeddings на Voyage и выпуск через eval-контур."],
            ].map(([title, copy]) => (
              <article className="kpi p-5" key={title}>
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.24em] text-muted">
                  {title}
                </p>
                <p className="text-base leading-7 text-foreground">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
