import Link from "next/link";

import type { AiChatSessionRow } from "@/lib/ai/chat";
import type { AiStructuredKnowledgeSnapshot } from "@/lib/ai/structured-knowledge";

type AiWorkspaceSidebarProps = {
  activeSessionId: string | null;
  recentSessions: AiChatSessionRow[];
  section: "history" | "context";
  structuredKnowledge: AiStructuredKnowledgeSnapshot;
};

function formatPriority(value: string) {
  switch (value) {
    case "high":
      return "Важно";
    case "medium":
      return "В фокусе";
    default:
      return "Основа";
  }
}

function formatSessionTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AiWorkspaceSidebar({
  activeSessionId,
  recentSessions,
  section,
  structuredKnowledge,
}: AiWorkspaceSidebarProps) {
  if (section === "context") {
    return (
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">Контекст</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Что AI уже знает</h2>
          </div>
          <span className="pill">{structuredKnowledge.facts.length}</span>
        </div>

        <div className="mt-4 grid gap-3">
          {structuredKnowledge.facts.length ? (
            structuredKnowledge.facts.slice(0, 6).map((fact) => (
              <article
                className="rounded-2xl border border-border bg-white/70 px-4 py-4"
                key={fact.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill">{formatPriority(fact.priority)}</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-muted">
                    {fact.topic}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{fact.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{fact.summary}</p>
                {fact.action ? (
                  <p className="mt-3 text-sm leading-6 text-foreground">
                    Следующий шаг: {fact.action}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-white/60 px-4 py-5 text-sm leading-6 text-muted">
              Когда накопится история тренировок и питания, здесь появятся короткие факты, на
              которые AI будет опираться в ответах.
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">История</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">Сохранённые чаты</h2>
        </div>
        <Link
          className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
          href="/ai"
        >
          Новый чат
        </Link>
      </div>

      <div className="mt-5 grid gap-3">
        {recentSessions.length ? (
          recentSessions.map((session) => {
            const isActive = session.id === activeSessionId;

            return (
              <Link
                className={`rounded-2xl border px-4 py-4 text-sm transition ${
                  isActive
                    ? "border-accent/40 bg-accent/8"
                    : "border-border bg-white/70 hover:bg-white"
                }`}
                href={`/ai?session=${session.id}`}
                key={session.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="line-clamp-2 font-semibold text-foreground">
                    {session.title?.trim() || "Диалог без названия"}
                  </p>
                  {isActive ? <span className="pill">Открыт</span> : null}
                </div>
                <p className="mt-2 text-muted">Обновлено {formatSessionTime(session.updated_at)}</p>
              </Link>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-white/60 px-4 py-5 text-sm leading-6 text-muted">
            После первых сообщений здесь появится история переписки. Любой чат можно будет открыть
            и продолжить с того же места.
          </div>
        )}
      </div>
    </section>
  );
}
