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
      <section className="card card--hero p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="workspace-kicker">Контекст</p>
            <h2 className="app-display mt-2 text-2xl font-semibold text-foreground">
              Что AI уже знает
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Это не сырые таблицы, а уже собранные сигналы по прогрессу,
              питанию и восстановлению.
            </p>
          </div>
          <span className="pill">{structuredKnowledge.facts.length}</span>
        </div>

        <div className="mt-4 grid gap-3">
          {structuredKnowledge.facts.length ? (
            structuredKnowledge.facts.slice(0, 6).map((fact) => (
              <article
                className="surface-panel p-4"
                key={fact.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill">{formatPriority(fact.priority)}</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-muted">
                    {fact.topic}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {fact.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">{fact.summary}</p>
                {fact.action ? (
                  <p className="mt-3 text-sm leading-6 text-foreground">
                    Следующий шаг: {fact.action}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <div className="surface-panel border-dashed px-4 py-5 text-sm leading-6 text-muted">
              Когда накопится история тренировок и питания, здесь появятся
              короткие факты, на которые AI будет опираться в ответах.
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="card card--hero p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="workspace-kicker">История</p>
          <h2 className="app-display mt-2 text-2xl font-semibold text-foreground">
            Сохранённые чаты
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Оставляй только полезные сессии, быстро возвращайся к планам и
            очищай лишнее без перегруженного списка.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="toggle-chip px-4 py-2 text-sm font-semibold"
            onClick={() => router.push("/ai")}
            type="button"
          >
            Новый чат
          </button>

          {recentSessions.length > 0 && onClearSessions ? (
            <button
              className="toggle-chip px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="ai-session-clear-all"
              disabled={isClearingAll}
              onClick={onClearSessions}
              type="button"
            >
              {isClearingAll ? "Очищаю..." : "Очистить всё"}
            </button>
          ) : null}
        </div>
      </div>

      {historyError ? (
        <div className="mt-4 rounded-3xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {historyError}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3">
        {recentSessions.length ? (
          <div className="grid gap-3" data-testid="ai-session-list">
            {recentSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isDeleting = busySessionId === session.id;

              return (
                <article
                  className={`rounded-[1.7rem] border px-4 py-4 text-sm transition ${
                    isActive
                      ? "border-accent/26 bg-[color-mix(in_srgb,var(--accent-soft)_76%,white)] shadow-[0_24px_54px_-42px_rgba(15,122,96,0.22)]"
                      : "border-border bg-white/76 hover:bg-white"
                  }`}
                  data-testid="ai-session-item"
                  key={session.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-semibold text-foreground">
                        {session.title?.trim() || "Чат без названия"}
                      </p>
                      <p className="mt-2 text-muted">
                        Обновлено {formatSessionTime(session.updated_at)}
                      </p>
                    </div>
                    {isActive ? <span className="pill">Открыт</span> : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="toggle-chip px-3 py-2 text-sm font-semibold"
                      onClick={() => router.push(`/ai?session=${session.id}`)}
                      type="button"
                    >
                      Открыть
                    </button>

                    {onDeleteSession ? (
                      <button
                        className="toggle-chip px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                        data-testid="ai-session-delete"
                        disabled={isDeleting || isClearingAll}
                        onClick={() => onDeleteSession(session.id)}
                        type="button"
                      >
                        {isDeleting ? (
                          <LoaderCircle className="animate-spin" size={15} />
                        ) : (
                          <Trash2 size={15} strokeWidth={2.1} />
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
            После первых сообщений здесь появится история переписки. Любой чат
            можно открыть, продолжить или удалить.
          </div>
        )}
      </div>
    </section>
  );
}
