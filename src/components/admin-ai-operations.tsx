"use client";

import { useState } from "react";

import {
  hasAdminCapability,
  type PlatformAdminRole,
} from "@/lib/admin-permissions";

const inputClassName =
  "w-full rounded-2xl border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_92%,var(--surface))] px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

export function AdminAiOperations({
  defaultTargetUserId,
  currentAdminRole,
}: {
  defaultTargetUserId: string;
  currentAdminRole: PlatformAdminRole;
}) {
  const [mode, setMode] = useState<"embeddings" | "full">("full");
  const [targetUserId, setTargetUserId] = useState(defaultTargetUserId);
  const [reason, setReason] = useState(
    "Обновление контекста ИИ и поиска после изменения данных пользователя",
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
          mode,
          targetUserId: targetUserId.trim(),
          reason: reason.trim(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            data?: {
              indexedChunks?: number;
              message?: string;
            };
          }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось обновить базу знаний ИИ.");
        return;
      }

      setNotice(
        payload?.data?.message ??
          (mode === "embeddings"
            ? `Быстрое обновление завершено. Обработано материалов: ${payload?.data?.indexedChunks ?? 0}.`
            : `Полное обновление завершено. Обработано материалов: ${payload?.data?.indexedChunks ?? 0}.`),
      );
    } catch {
      setError("Не удалось обновить базу знаний ИИ.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4">
      {error ? (
        <p className="rounded-2xl border border-red-500/25 bg-red-500/12 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="rounded-2xl border border-emerald-500/25 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      {!canRunReindex ? (
        <p className="rounded-2xl border border-amber-500/25 bg-amber-500/12 px-4 py-3 text-sm text-amber-100">
          Для этого аккаунта в этом разделе доступен только просмотр.
        </p>
      ) : null}

      <label className="grid gap-2 text-sm text-muted">
        Режим обновления
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "full"
                ? "border border-accent/20 bg-[color-mix(in_srgb,var(--accent)_18%,var(--surface-elevated))] text-accent-foreground"
                : "border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_92%,var(--surface))] text-foreground hover:bg-[color-mix(in_srgb,var(--surface-elevated)_96%,var(--surface))]"
            }`}
            disabled={!canRunReindex}
            onClick={() => setMode("full")}
            type="button"
          >
            Полное обновление
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "embeddings"
                ? "border border-accent/20 bg-[color-mix(in_srgb,var(--accent)_18%,var(--surface-elevated))] text-accent-foreground"
                : "border border-border bg-[color-mix(in_srgb,var(--surface-elevated)_92%,var(--surface))] text-foreground hover:bg-[color-mix(in_srgb,var(--surface-elevated)_96%,var(--surface))]"
            }`}
            disabled={!canRunReindex}
            onClick={() => setMode("embeddings")}
            type="button"
          >
            Быстрое обновление
          </button>
        </div>
      </label>

      <label className="grid gap-2 text-sm text-muted">
        Идентификатор пользователя
        <input
          className={inputClassName}
          disabled={!canRunReindex}
          onChange={(event) => setTargetUserId(event.target.value)}
          placeholder="Введите ID пользователя"
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
        className="action-button action-button--primary inline-flex w-fit px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || !targetUserId.trim() || !canRunReindex}
        onClick={runReindex}
        type="button"
      >
        {pending
          ? "Запускаю..."
          : mode === "embeddings"
            ? "Обновить быстро"
            : "Обновить полностью"}
      </button>
    </div>
  );
}
