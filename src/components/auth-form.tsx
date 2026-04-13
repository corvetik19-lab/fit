"use client";

import type { Route } from "next";
import { Eye, EyeOff, LogIn, Mail } from "lucide-react";
import { startTransition, useState, type FormEvent } from "react";

type Mode = "sign-in" | "sign-up";

const fieldClassName =
  "w-full rounded-[1.4rem] border border-white/70 bg-white/82 px-4 py-4 text-sm text-foreground outline-none transition placeholder:text-[#7b7a84] focus:bg-white focus:ring-2 focus:ring-accent/18";

export function AuthForm() {
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
          const response = await fetch("/api/auth/sign-up", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              fullName,
              password,
            }),
          });
          const payload = (await response.json().catch(() => null)) as
            | {
                message?: string;
                notice?: string;
                redirectTo?: Route;
              }
            | null;

          if (!response.ok) {
            setError(payload?.message ?? "Не удалось создать аккаунт.");
            return;
          }

          if (payload?.notice && !payload.redirectTo) {
            setNotice(payload.notice);
            setMode("sign-in");
            return;
          }

          window.location.assign(payload?.redirectTo ?? "/onboarding");
          return;
        }

        const response = await fetch("/api/auth/sign-in", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | {
              message?: string;
              redirectTo?: Route;
            }
          | null;

        if (!response.ok) {
          setError(payload?.message ?? "Не удалось выполнить вход.");
          return;
        }

        window.location.assign(payload?.redirectTo ?? "/dashboard");
      } catch {
        setError(
          mode === "sign-up"
            ? "Сервис регистрации временно недоступен. Попробуй ещё раз немного позже."
            : "Сервис входа временно недоступен. Попробуй ещё раз немного позже.",
        );
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <section className="w-full max-w-[28rem] px-1 sm:px-2">
      <div className="flex items-center justify-center gap-7 border-b border-[#d8d5d4]/75 pb-5">
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

        {error ? (
          <p className="rounded-[1.35rem] border border-red-300/70 bg-red-50/92 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {notice ? (
          <p className="rounded-[1.35rem] border border-emerald-300/70 bg-emerald-50/92 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}

        <button
          className="w-full rounded-[1.4rem] bg-[linear-gradient(135deg,#0040e0,#2e5bff)] px-5 py-4 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_18px_40px_-24px_rgba(0,64,224,0.48)] transition hover:translate-y-[-1px] hover:shadow-[0_24px_44px_-24px_rgba(0,64,224,0.56)] disabled:cursor-not-allowed disabled:opacity-60"
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
    </section>
  );
}
