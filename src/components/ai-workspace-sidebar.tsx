"use client";

import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";

import type { AiChatSessionRow } from "@/lib/ai/chat";
import type { AiStructuredKnowledgeSnapshot } from "@/lib/ai/structured-knowledge";

type AiWorkspaceSidebarProps = {
  activeSessionId: string | null;
  busySessionId?: string | null;
  historyError?: string | null;
  isClearingAll?: boolean;
  onClearSessions?: () => void;
  onDeleteSession?: (sessionId: string) => void;
  recentSessions: AiChatSessionRow[];
  section: "history" | "context";
  structuredKnowledge: AiStructuredKnowledgeSnapshot;
};

function formatPriority(value: string) {
  switch (value) {
    case "high":
      return "Критично";
    case "medium":
      return "В фокусе";
    default:
      return "База";
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
  busySessionId = null,
  historyError = null,
  isClearingAll = false,
  onClearSessions,
  onDeleteSession,
  recentSessions,
  section,
  structuredKnowledge,
}: AiWorkspaceSidebarProps) {
  const router = useRouter();

  if (section === "context") {
    return (
      <section className="surface-panel p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="workspace-kicker">Контекст</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              Что AI уже знает
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted">
              Короткие сигналы по прогрессу, нагрузке, питанию и восстановлению.
            </p>
          </div>
          <span className="pill">{structuredKnowledge.facts.length}</span>
        </div>

        <div className="mt-3 grid gap-2.5">
          {structuredKnowledge.facts.length ? (
            structuredKnowledge.facts.slice(0, 6).map((fact) => (
              <article className="surface-panel surface-panel--soft p-3" key={fact.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill">{formatPriority(fact.priority)}</span>
                  <span className="text-xs uppercase tracking-[0.16em] text-muted">
                    {fact.topic}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {fact.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {fact.summary}
                </p>
                {fact.action ? (
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    Следующий шаг: {fact.action}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <div className="surface-panel border-dashed px-4 py-5 text-sm leading-6 text-muted">
              Когда накопится история тренировок и питания, здесь появятся факты, на которые AI будет опираться в ответах.
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="surface-panel p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="workspace-kicker">История</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Сохранённые чаты
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted">
            Открывай прошлые решения и убирай лишние сессии.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <button
            className="toggle-chip px-3 py-2 text-xs font-semibold"
            onClick={() => router.push("/ai")}
            type="button"
          >
            Новый
          </button>

          {recentSessions.length > 0 && onClearSessions ? (
            <button
              className="toggle-chip px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="ai-session-clear-all"
              disabled={isClearingAll}
              onClick={onClearSessions}
              type="button"
            >
              {isClearingAll ? "Очищаю..." : "Очистить"}
            </button>
          ) : null}
        </div>
      </div>

      {historyError ? (
        <div className="mt-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {historyError}
        </div>
      ) : null}

      <div className="mt-3 grid gap-2.5">
        {recentSessions.length ? (
          <div className="grid gap-2.5" data-testid="ai-session-list">
            {recentSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isDeleting = busySessionId === session.id;

              return (
                <article
                  className={`rounded-[1.2rem] border px-3 py-3 text-sm transition ${
                    isActive
                      ? "border-accent/30 bg-[color:var(--accent-soft)]"
                      : "border-border bg-white hover:border-accent/30"
                  }`}
                  data-testid="ai-session-item"
                  key={session.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-semibold text-foreground">
                        {session.title?.trim() || "Чат без названия"}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Обновлено {formatSessionTime(session.updated_at)}
                      </p>
                    </div>
                    {isActive ? <span className="pill">Открыт</span> : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="toggle-chip px-3 py-2 text-xs font-semibold"
                      onClick={() => router.push(`/ai?session=${session.id}`)}
                      type="button"
                    >
                      Открыть
                    </button>

                    {onDeleteSession ? (
                      <button
                        className="toggle-chip px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                        data-testid="ai-session-delete"
                        disabled={isDeleting || isClearingAll}
                        onClick={() => onDeleteSession(session.id)}
                        type="button"
                      >
                        {isDeleting ? (
                          <LoaderCircle className="animate-spin" size={14} />
                        ) : (
                          <Trash2 size={14} strokeWidth={2.1} />
                        )}
                        {isDeleting ? "Удаляю..." : "Удалить"}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div
            className="surface-panel border-dashed px-4 py-5 text-sm leading-6 text-muted"
            data-testid="ai-session-empty-state"
          >
            После первых сообщений здесь появится история переписки. Любой чат можно открыть, продолжить или удалить.
          </div>
        )}
      </div>
    </section>
  );
}
