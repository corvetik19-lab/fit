"use client";

import type { Route } from "next";
import { Eye, EyeOff, LogIn, Mail } from "lucide-react";
import { startTransition, useState, type FormEvent } from "react";

type Mode = "sign-in" | "sign-up";

const fieldClassName =
  "w-full rounded-2xl border border-white/8 bg-white/4 px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-[#6f7d8f] focus:border-[#24bcb5]/40 focus:bg-white/7 focus:ring-2 focus:ring-[#24bcb5]/15";

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
    <section className="w-full max-w-[25rem]">
      <div className="grid gap-5 rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(21,29,39,0.96),rgba(13,18,24,0.94))] p-4 shadow-[0_26px_60px_-40px_rgba(0,0,0,0.72)] sm:p-5">
        <div className="inline-flex rounded-2xl border border-white/8 bg-white/4 p-1">
          {([
            ["sign-in", "Вход"],
            ["sign-up", "Регистрация"],
          ] as const).map(([nextMode, label]) => {
            const active = mode === nextMode;

            return (
              <button
                className={`flex-1 rounded-[0.95rem] px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-[linear-gradient(135deg,#2063af,#24bcb5)] text-white shadow-[0_14px_28px_-20px_rgba(35,152,185,0.65)]"
                    : "text-[#95a4b5] hover:text-foreground"
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

        <form className="grid gap-4" onSubmit={submit}>
          {mode === "sign-up" ? (
            <label className="grid gap-2">
              <span className="px-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#90a0b1]">
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

          <label className="grid gap-2">
            <span className="px-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#90a0b1]">
              Email
            </span>
            <div className="relative">
              <input
                autoComplete="email"
                className={`${fieldClassName} pr-12`}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@fit.app"
                type="email"
                value={email}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#6f7d8f]">
                <Mail size={18} strokeWidth={2} />
              </span>
            </div>
          </label>

          <label className="grid gap-2">
            <span className="px-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#90a0b1]">
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6f7d8f] transition hover:text-foreground"
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
            <p className="rounded-2xl border border-[#ff7f7b]/30 bg-[#ff7f7b]/12 px-4 py-3 text-sm text-[#ffc8c5]">
              {error}
            </p>
          ) : null}

          {notice ? (
            <p className="rounded-2xl border border-[#24bcb5]/25 bg-[#24bcb5]/12 px-4 py-3 text-sm text-[#b7f8f4]">
              {notice}
            </p>
          ) : null}

          <button
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#24bcb5]/18 bg-[linear-gradient(135deg,#2063af,#2398b9,#24bcb5)] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_36px_-24px_rgba(35,152,185,0.65)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={
              isPending ||
              !email.trim() ||
              !password.trim() ||
              (mode === "sign-up" && !fullName.trim())
            }
            type="submit"
          >
            <LogIn size={18} strokeWidth={2.3} />
            {isPending
              ? "Обработка..."
              : mode === "sign-up"
                ? "Создать аккаунт"
                : "Войти"}
          </button>
        </form>
      </div>
    </section>
  );
}
