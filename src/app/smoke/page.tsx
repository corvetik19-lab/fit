import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "fitora smoke",
};

export default function SmokePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl items-center justify-center px-6 py-16">
      <section className="card w-full max-w-xl space-y-4 p-8 text-center">
        <p className="pill mx-auto">smoke check</p>
        <h1 className="text-3xl font-semibold text-foreground">fitora smoke</h1>
        <p className="text-sm leading-7 text-muted">
          Эта страница нужна для базовой проверки production-сборки, SSR и PWA
          ассетов без логина и без внешних сервисов.
        </p>
        <p
          className="rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
          data-testid="smoke-status"
        >
          ok
        </p>
      </section>
    </main>
  );
}
