"use client";

import Link from "next/link";

import type { AiSurfaceNotice } from "@/components/ai-chat-panel-model";

type AiChatNoticesProps = {
  accessAllowed: boolean;
  accessReason: string | null;
  errorNotice: AiSurfaceNotice | null;
  notice: AiSurfaceNotice | null;
};

function NoticeCard({ notice }: { notice: AiSurfaceNotice }) {
  const styles =
    notice.kind === "success"
      ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-100"
      : notice.kind === "info"
        ? "border-sky-500/25 bg-sky-500/12 text-sky-100"
        : notice.kind === "provider"
          ? "border-amber-500/25 bg-amber-500/12 text-amber-100"
          : "border-red-500/25 bg-red-500/12 text-red-100";

  const title =
    notice.kind === "success"
      ? "Готово"
      : notice.kind === "info"
        ? "Что важно знать"
        : notice.kind === "provider"
          ? "Сервис временно недоступен"
          : "Не удалось выполнить запрос";

  return (
    <div
      className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${styles}`}
      data-testid={`ai-notice-${notice.kind}`}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{notice.message}</p>
    </div>
  );
}

export function AiChatNotices({
  accessAllowed,
  accessReason,
  errorNotice,
  notice,
}: AiChatNoticesProps) {
  return (
    <>
      {!accessAllowed ? (
        <div
          className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/12 px-4 py-3 text-sm text-amber-100"
          data-testid="ai-access-closed"
        >
          <p className="font-semibold">Доступ к AI закрыт</p>
          <p className="mt-1">
            {accessReason ?? "AI-чат сейчас недоступен для текущего уровня доступа."}
          </p>
          <Link
            className="mt-3 inline-flex rounded-full border border-amber-400/30 bg-[color-mix(in_srgb,var(--surface-elevated)_92%,var(--surface))] px-4 py-2 font-semibold text-foreground transition hover:bg-[color-mix(in_srgb,var(--surface-elevated)_98%,var(--surface))]"
            href="/settings#billing-center"
          >
            Открыть доступ
          </Link>
        </div>
      ) : null}

      {errorNotice ? <NoticeCard notice={errorNotice} /> : null}
      {notice ? <NoticeCard notice={notice} /> : null}
    </>
  );
}
