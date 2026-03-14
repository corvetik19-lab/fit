"use client";

import Link from "next/link";

type AiChatNoticesProps = {
  accessAllowed: boolean;
  accessReason: string | null;
  errorMessage: string | null;
  notice: string | null;
};

export function AiChatNotices({
  accessAllowed,
  accessReason,
  errorMessage,
  notice,
}: AiChatNoticesProps) {
  return (
    <>
      {!accessAllowed ? (
        <div className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {accessReason ?? "AI-чат сейчас недоступен для текущего доступа."}
          <Link
            className="mt-3 inline-flex rounded-full border border-amber-400/70 bg-white/80 px-4 py-2 font-semibold text-foreground transition hover:bg-white"
            href="/settings#billing-center"
          >
            Открыть доступ
          </Link>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {notice ? (
        <p className="mt-4 rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}
    </>
  );
}
