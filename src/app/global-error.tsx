"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ru">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <main className="flex min-h-screen items-center justify-center px-6 py-16">
          <section className="w-full max-w-md rounded-[32px] border border-border bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm uppercase tracking-[0.24em] text-muted">
              Ошибка приложения
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-foreground">
              Что-то пошло не так
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted">
              Приложение столкнулось с неожиданной ошибкой. Отчёт уже отправлен в
              мониторинг, и экран можно попробовать открыть заново.
            </p>
            {error.digest ? (
              <p className="mt-4 rounded-2xl bg-stone-100 px-4 py-3 font-mono text-xs text-stone-700">
                Digest: {error.digest}
              </p>
            ) : null}
            <button
              className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              onClick={() => reset()}
              type="button"
            >
              Перезагрузить экран
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
