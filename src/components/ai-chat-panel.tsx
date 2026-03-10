"use client";

import Link from "next/link";
import { useState } from "react";

import type { FeatureAccessSnapshot } from "@/lib/billing-access";

type ChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type ChatSource = {
  id: string;
  sourceType: string;
  sourceId: string | null;
  similarity: number;
  contentPreview: string;
};

type AiChatPanelProps = {
  access: FeatureAccessSnapshot;
  initialSessionId: string | null;
  initialSessionTitle: string | null;
  initialMessages: ChatMessage[];
};

const textareaClassName =
  "min-h-28 w-full rounded-3xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60";

function formatRole(role: ChatMessage["role"]) {
  return role === "assistant" ? "AI-коуч" : "Ты";
}

function formatSourceType(value: string) {
  switch (value) {
    case "user_profile":
      return "профиль";
    case "body_metrics":
      return "замеры";
    case "nutrition_history":
      return "питание";
    case "user_memory":
      return "память";
    case "context_snapshot":
      return "снимок контекста";
    case "weekly_program":
      return "тренировочная неделя";
    default:
      return value;
  }
}

export function AiChatPanel({
  access,
  initialSessionId,
  initialSessionTitle,
  initialMessages,
}: AiChatPanelProps) {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [sessionTitle, setSessionTitle] = useState(initialSessionTitle);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceMap, setSourceMap] = useState<Record<string, ChatSource[]>>({});

  async function submitMessage() {
    const trimmed = draft.trim();

    if (!trimmed || pending || !access.allowed) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message: trimmed,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            data?: {
              sessionId: string;
              sessionTitle: string | null;
              userMessage: ChatMessage;
              assistantMessage: ChatMessage;
              sources: ChatSource[];
            };
          }
        | null;

      if (!response.ok || !payload?.data) {
        setError(payload?.message ?? "Не удалось отправить сообщение в AI-чат.");
        return;
      }

      setSessionId(payload.data.sessionId);
      setSessionTitle(payload.data.sessionTitle);
      setMessages((current) => [
        ...current,
        payload.data!.userMessage,
        payload.data!.assistantMessage,
      ]);
      setSourceMap((current) => ({
        ...current,
        [payload.data!.assistantMessage.id]: payload.data!.sources,
      }));
      setDraft("");
    } catch {
      setError("Не удалось отправить сообщение в AI-чат.");
    } finally {
      setPending(false);
    }
  }

  function resetChat() {
    setSessionId(null);
    setSessionTitle(null);
    setMessages([]);
    setDraft("");
    setError(null);
    setSourceMap({});
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            {sessionTitle
              ? `Текущий чат: ${sessionTitle}`
              : "Новый AI-чат без сохранённого заголовка"}
          </p>
          <p className="mt-1 text-sm text-muted">
            Чат работает только онлайн и использует сохранённый пользовательский
            контекст.
          </p>
          <p className="mt-1 text-sm text-muted">
            Использовано: {access.usage.count}
            {typeof access.usage.limit === "number" ? ` / ${access.usage.limit}` : ""}
          </p>
        </div>
        <button
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!access.allowed}
          onClick={resetChat}
          type="button"
        >
          Новый чат
        </button>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!access.allowed ? (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {access.reason ?? "AI-чат сейчас недоступен для текущего плана."}
          <Link
            className="mt-3 inline-flex rounded-full border border-amber-400/70 bg-white/80 px-4 py-2 font-semibold text-foreground transition hover:bg-white"
            href="/settings#billing-center"
          >
            Открыть billing center
          </Link>
        </div>
      ) : null}

      <div className="grid max-h-[36rem] gap-4 overflow-y-auto rounded-3xl border border-border bg-white/50 p-4">
        {messages.length ? (
          messages.map((message) => (
            <article
              className={`rounded-3xl border px-4 py-4 ${
                message.role === "assistant"
                  ? "border-border bg-white/80"
                  : "border-accent/20 bg-accent/5"
              }`}
              key={message.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {formatRole(message.role)}
                </p>
                <p className="text-xs text-muted">
                  {new Intl.DateTimeFormat("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(message.created_at))}
                </p>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground">
                {message.content}
              </p>
              {message.role === "assistant" && sourceMap[message.id]?.length ? (
                <div className="mt-4 grid gap-2 rounded-2xl border border-border/80 bg-white/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Источники контекста
                  </p>
                  {sourceMap[message.id].map((source) => (
                    <div
                      className="rounded-2xl border border-border bg-white/80 px-3 py-3 text-sm"
                      key={`${message.id}-${source.id}`}
                    >
                      <p className="font-medium text-foreground">
                        {formatSourceType(source.sourceType)} · релевантность{" "}
                        {source.similarity}
                      </p>
                      <p className="mt-1 text-muted">{source.contentPreview}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-white/60 px-4 py-6 text-sm leading-7 text-muted">
            Здесь появится диалог с AI-коучем. Он опирается на профиль, цели,
            питание, тренировки и сохранённые context snapshots.
          </div>
        )}
      </div>

      <div className="grid gap-3">
        <textarea
          className={textareaClassName}
          disabled={!access.allowed}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Например: подскажи, как перестроить неделю тренировок без перегруза плеч."
          value={draft}
        />
        <div className="flex flex-wrap justify-between gap-3">
          <p className="text-sm text-muted">
            AI не записывает ничего в тренировки или питание автоматически.
          </p>
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending || !draft.trim() || !access.allowed}
            onClick={submitMessage}
            type="button"
          >
            {pending ? "Отправляю..." : "Отправить в AI-чат"}
          </button>
        </div>
      </div>
    </div>
  );
}
