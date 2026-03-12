"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { startTransition, useState, type FormEvent } from "react";

import { createClient } from "@/lib/supabase/browser";

type Mode = "sign-in" | "sign-up";

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

export function AuthForm() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError(null);
    setNotice(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        if (mode === "sign-up") {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName.trim(),
              },
            },
          });

          if (signUpError) {
            setError(signUpError.message);
            return;
          }

          if (!data.session) {
            setNotice(
              "Аккаунт создан. Если нужно подтверждение почты, подтвердите email и затем войдите в приложение.",
            );
            setMode("sign-in");
            return;
          }

          router.replace("/onboarding" as Route);
          router.refresh();
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        router.replace("/dashboard" as Route);
        router.refresh();
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <div className="card w-full max-w-xl p-6 sm:p-8">
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          {([
            ["sign-in", "Вход"],
            ["sign-up", "Регистрация"],
          ] as const).map(([nextMode, label]) => (
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === nextMode
                  ? "bg-accent text-white"
                  : "border border-border text-foreground hover:bg-white/70"
              }`}
              key={nextMode}
              onClick={() => {
                setMode(nextMode);
                setError(null);
                setNotice(null);
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {mode === "sign-up" ? "Создайте аккаунт" : "Войдите в приложение"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            После входа приложение сохранит сессию на этом устройстве, пока вы
            сами не выйдете из аккаунта.
          </p>
        </div>
      </div>

      <form className="grid gap-4" onSubmit={submit}>
        {mode === "sign-up" ? (
          <label className="grid gap-2 text-sm text-muted">
            Имя
            <input
              className={inputClassName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Например, Владислав"
              type="text"
              value={fullName}
            />
          </label>
        ) : null}

        <label className="grid gap-2 text-sm text-muted">
          Email
          <input
            autoComplete="email"
            className={inputClassName}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Пароль
          <input
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            className={inputClassName}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Минимум 6 символов"
            type="password"
            value={password}
          />
        </label>

        {error ? (
          <p className="rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {notice ? (
          <p className="rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}

        <button
          className="mt-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={
            isPending ||
            !email.trim() ||
            !password.trim() ||
            (mode === "sign-up" && !fullName.trim())
          }
          type="submit"
        >
          {isPending
            ? "Обработка..."
            : mode === "sign-up"
              ? "Создать аккаунт"
              : "Войти"}
        </button>
      </form>
    </div>
  );
}
