import Link from "next/link";

import type { AiChatSessionRow } from "@/lib/ai/chat";
import type { AiStructuredKnowledgeSnapshot } from "@/lib/ai/structured-knowledge";

type AiWorkspaceSidebarProps = {
  activeSessionId: string | null;
  proposalCount: number;
  recentSessions: AiChatSessionRow[];
  structuredKnowledge: AiStructuredKnowledgeSnapshot;
};

function formatPriority(value: string) {
  switch (value) {
    case "high":
      return "сейчас";
    case "medium":
      return "в фокусе";
    default:
      return "база";
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
  proposalCount,
  recentSessions,
  structuredKnowledge,
}: AiWorkspaceSidebarProps) {
  return (
    <div className="grid gap-6">
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Контекст AI
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Что AI уже знает о тебе
            </h2>
          </div>
          <span className="pill">{structuredKnowledge.facts.length} фактов</span>
        </div>

        <div className="mt-4 grid gap-3">
          {structuredKnowledge.facts.slice(0, 6).map((fact) => (
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
          ))}
        </div>
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Рабочая зона
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Последние диалоги и действия
            </h2>
          </div>
          <span className="pill">{proposalCount} предложений</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
            href="/ai#chat-workspace"
          >
            Новый чат
          </Link>
          <Link
            className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
            href="/ai#proposal-studio"
          >
            Студия предложений
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
                  href={`/ai?session=${session.id}#chat-workspace`}
                  key={session.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="line-clamp-2 font-semibold text-foreground">
                      {session.title?.trim() || "Диалог без названия"}
                    </p>
                    {isActive ? <span className="pill">открыт</span> : null}
                  </div>
                  <p className="mt-2 text-muted">
                    Обновлено {formatSessionTime(session.updated_at)}
                  </p>
                </Link>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-white/60 px-4 py-5 text-sm leading-6 text-muted">
              Здесь появятся сохраненные AI-диалоги. Можно возвращаться к старым
              чатам и продолжать их как отдельные рабочие сессии.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
