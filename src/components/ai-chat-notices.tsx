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
      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
      : notice.kind === "info"
        ? "border-sky-300 bg-sky-50 text-sky-700"
        : notice.kind === "provider"
          ? "border-amber-300 bg-amber-50 text-amber-800"
          : "border-red-300 bg-red-50 text-red-700";

  const title =
    notice.kind === "success"
      ? "Готово"
      : notice.kind === "info"
        ? "Важно"
        : notice.kind === "provider"
          ? "Сервис временно недоступен"
          : "Не удалось выполнить запрос";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${styles}`}
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
          className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          data-testid="ai-access-closed"
        >
          <p className="font-semibold">Доступ к AI закрыт</p>
          <p className="mt-1">
            {accessReason ??
              "AI-чат сейчас недоступен для текущего уровня доступа."}
          </p>
          <Link
            className="action-button action-button--secondary mt-3 px-4 py-2.5 text-sm"
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
