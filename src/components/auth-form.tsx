"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Eye, EyeOff, LogIn, Mail, Smartphone } from "lucide-react";
import { startTransition, useState, type FormEvent } from "react";

import { createClient } from "@/lib/supabase/browser";

type Mode = "sign-in" | "sign-up";

const fieldClassName =
  "w-full rounded-[1.15rem] border-none bg-[#e8e4e3] px-4 py-4 text-sm text-foreground outline-none transition placeholder:text-[#7b7a84] focus:bg-white focus:ring-2 focus:ring-accent/18";

function wait(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function waitForClientSession(
  supabase: SupabaseClient,
  timeoutMs = 4_000,
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      await wait(180);
      return;
    }

    await wait(120);
  }
}

export function AuthForm() {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
              "Аккаунт создан. Если нужно подтверждение почты, подтверди email и затем войди в приложение.",
            );
            setMode("sign-in");
            return;
          }

          await waitForClientSession(supabase);
          window.location.assign("/onboarding");
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

        await waitForClientSession(supabase);
        window.location.assign("/dashboard");
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <section className="w-full max-w-[34rem] rounded-[2rem] bg-[#f6f3f2] p-6 shadow-[0_28px_64px_-48px_rgba(28,27,27,0.2)] sm:p-8 md:rounded-[2.25rem] md:p-10">
      <div className="flex gap-7 border-b border-[#d8d5d4] pb-5">
        {([
          ["sign-in", "Вход"],
          ["sign-up", "Регистрация"],
        ] as const).map(([nextMode, label]) => {
          const active = mode === nextMode;

          return (
            <button
              className={`relative pb-1 font-display text-2xl font-bold tracking-[-0.05em] transition ${
                active
                  ? "text-accent after:absolute after:bottom-[-1.35rem] after:left-0 after:h-[3px] after:w-full after:rounded-full after:bg-accent"
                  : "text-[#a7a2a3] hover:text-foreground"
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
          );
        })}
      </div>

      <div className="mt-7 space-y-2">
        <h2 className="font-display text-[1.75rem] font-bold tracking-[-0.06em] text-foreground">
          {mode === "sign-up" ? "Создай профиль" : "Войдите в приложение"}
        </h2>
        <p className="max-w-md text-sm leading-7 text-muted">
          После входа сессия останется на этом устройстве. Ты сможешь сразу
          вернуться к плану, журналу питания и AI-коучу.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={submit}>
        {mode === "sign-up" ? (
          <label className="grid gap-2 text-sm text-muted">
            <span className="pl-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#6d7080]">
              Имя
            </span>
            <input
              className={fieldClassName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Например, Владислав"
              type="text"
              value={fullName}
            />
          </label>
        ) : null}

        <label className="grid gap-2 text-sm text-muted">
          <span className="pl-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#6d7080]">
            Email
          </span>
          <div className="relative">
            <input
              autoComplete="email"
              className={`${fieldClassName} pr-12`}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@fit.com"
              type="email"
              value={email}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#7b7a84]">
              <Mail size={18} strokeWidth={2} />
            </span>
          </div>
        </label>

        <label className="grid gap-2 text-sm text-muted">
          <span className="pl-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-[#6d7080]">
            Пароль
          </span>
          <div className="relative">
            <input
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              className={`${fieldClassName} pr-12`}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7b7a84] transition hover:text-foreground"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? (
                <EyeOff size={18} strokeWidth={2} />
              ) : (
                <Eye size={18} strokeWidth={2} />
              )}
            </button>
          </div>
        </label>

        <div className="flex justify-end">
          <button
            className="text-xs font-bold text-accent transition hover:opacity-80"
            type="button"
          >
            Забыли пароль?
          </button>
        </div>

        {error ? (
          <p className="rounded-[1.15rem] border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {notice ? (
          <p className="rounded-[1.15rem] border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}

        <button
          className="w-full rounded-[1.15rem] bg-[linear-gradient(135deg,#0040e0,#2e5bff)] px-5 py-4 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_18px_40px_-24px_rgba(0,64,224,0.48)] transition hover:translate-y-[-1px] hover:shadow-[0_24px_44px_-24px_rgba(0,64,224,0.56)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={
            isPending ||
            !email.trim() ||
            !password.trim() ||
            (mode === "sign-up" && !fullName.trim())
          }
          type="submit"
        >
          <span className="inline-flex items-center gap-2">
            <LogIn size={18} strokeWidth={2.3} />
            {isPending
              ? "Обработка..."
              : mode === "sign-up"
                ? "Создать аккаунт"
                : "Войти в систему"}
          </span>
        </button>
      </form>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#d8d5d4]" />
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#9f9aa0]">
          или через
        </span>
        <div className="h-px flex-1 bg-[#d8d5d4]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-[1.15rem] bg-[#e8e4e3] px-4 py-4 text-sm font-bold text-foreground opacity-70"
          type="button"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[0.65rem] font-black text-foreground">
            G
          </span>
          Google
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-[1.15rem] bg-[#e8e4e3] px-4 py-4 text-sm font-bold text-foreground opacity-70"
          type="button"
        >
          <Smartphone size={16} strokeWidth={2.1} />
          Apple
        </button>
      </div>

      <footer className="mt-8 px-2 text-center text-[0.72rem] leading-6 text-[#8b888d]">
        Входя, вы соглашаетесь с{" "}
        <span className="font-bold text-accent">правилами дисциплины</span> и{" "}
        <span className="font-bold text-accent">протоколом приватности</span>.
      </footer>
    </section>
  );
}
