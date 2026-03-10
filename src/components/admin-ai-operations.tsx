"use client";

import { useState } from "react";

import {
  getAdminRoleLabel,
  hasAdminCapability,
  type PlatformAdminRole,
} from "@/lib/admin-permissions";

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

export function AdminAiOperations({
  defaultTargetUserId,
  currentAdminRole,
}: {
  defaultTargetUserId: string;
  currentAdminRole: PlatformAdminRole;
}) {
  const [targetUserId, setTargetUserId] = useState(defaultTargetUserId);
  const [reason, setReason] = useState(
    "Обновление контекста после AI/RAG-изменений",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canRunReindex = hasAdminCapability(
    currentAdminRole,
    "run_knowledge_reindex",
  );

  async function runReindex() {
    if (!targetUserId.trim() || pending || !canRunReindex) {
      return;
    }

    setPending(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/ai/reindex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: targetUserId.trim(),
          reason: reason.trim(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            data?: {
              message?: string;
              indexedChunks?: number;
            };
          }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось запустить переиндексацию базы знаний.");
        return;
      }

      setNotice(
        payload?.data?.message ??
          `Переиндексация завершена. Индексировано чанков: ${payload?.data?.indexedChunks ?? 0}.`,
      );
    } catch {
      setError("Не удалось запустить переиндексацию базы знаний.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4">
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

      {!canRunReindex ? (
        <p className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Роль {getAdminRoleLabel(currentAdminRole)} работает здесь в read-only режиме.
          Переиндексацию базы знаний может запускать только `super_admin` или `support_admin`.
        </p>
      ) : null}

      <label className="grid gap-2 text-sm text-muted">
        Пользователь для reindex
        <input
          className={inputClassName}
          disabled={!canRunReindex}
          onChange={(event) => setTargetUserId(event.target.value)}
          placeholder="UUID пользователя"
          value={targetUserId}
        />
      </label>

      <label className="grid gap-2 text-sm text-muted">
        Причина
        <textarea
          className={`${inputClassName} min-h-28 resize-y`}
          disabled={!canRunReindex}
          onChange={(event) => setReason(event.target.value)}
          value={reason}
        />
      </label>

      <button
        className="inline-flex w-fit rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || !targetUserId.trim() || !canRunReindex}
        onClick={runReindex}
        type="button"
      >
        {pending ? "Переиндексирую..." : "Переиндексировать базу знаний"}
      </button>
    </div>
  );
}
