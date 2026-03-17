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
      ? "border-emerald-300/60 bg-emerald-50 text-emerald-800"
      : notice.kind === "info"
        ? "border-sky-300/60 bg-sky-50 text-sky-800"
        : notice.kind === "provider"
          ? "border-amber-300/60 bg-amber-50 text-amber-800"
          : "border-red-300/60 bg-red-50 text-red-700";

  const title =
    notice.kind === "success"
      ? "Готово"
      : notice.kind === "info"
        ? "Что важно знать"
        : notice.kind === "provider"
          ? "Сервис временно недоступен"
          : "Не удалось выполнить запрос";

  return (
    <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${styles}`}>
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
        <div className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Доступ к AI закрыт</p>
          <p className="mt-1">
            {accessReason ?? "AI-чат сейчас недоступен для текущего доступа."}
          </p>
          <Link
            className="mt-3 inline-flex rounded-full border border-amber-400/70 bg-white/80 px-4 py-2 font-semibold text-foreground transition hover:bg-white"
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
