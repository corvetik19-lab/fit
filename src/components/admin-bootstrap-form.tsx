"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

export function AdminBootstrapForm({
  userEmail,
}: {
  userEmail: string;
}) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function submit() {
    setError(null);
    setNotice(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/bootstrap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setError(payload?.message ?? "Не удалось назначить супер-админа.");
          return;
        }

        setNotice("Роль супер-админа назначена. Обновляю панель.");
        router.refresh();
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white/60 p-4 text-sm leading-7 text-muted">
        Текущий пользователь: <span className="font-semibold text-foreground">{userEmail}</span>
      </div>

      <label className="grid gap-2 text-sm text-muted">
        Токен инициализации
        <input
          className={inputClassName}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Вставь ADMIN_BOOTSTRAP_TOKEN"
          type="password"
          value={token}
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
        className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending || !token.trim()}
        onClick={submit}
        type="button"
      >
        {isPending ? "Назначаю..." : "Назначить себя супер-админом"}
      </button>
    </div>
  );
}
