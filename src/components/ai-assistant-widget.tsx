"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Globe,
  LoaderCircle,
  Sparkles,
  Square,
  WandSparkles,
  X,
} from "lucide-react";

import { AssistantMarkdown } from "@/components/assistant-markdown";
import { AiPromptLibrary } from "@/components/ai-prompt-library";

type AiAssistantWidgetProps = {
  hidden?: boolean;
  initialMessages: Array<{
    id: string;
    session_id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
  }>;
  initialSessionId: string | null;
  viewer: {
    email: string | null;
    fullName: string | null;
  };
};

type AssistantProposalOutput = {
  applyLabel: string;
  description: string;
  highlights: string[];
  proposalId: string;
  proposalType: "meal_plan" | "workout_plan";
  title: string;
};

type AssistantSearchOutput = {
  query: string;
  results: Array<{
    snippet: string;
    title: string;
    url: string;
  }>;
};

type AssistantProposalListOutput = {
  count: number;
  items: Array<{
    createdAt: string;
    proposalId: string;
    proposalType: "meal_plan" | "workout_plan";
    requestSummary: string;
    status: string;
    timeline: string;
    title: string;
    updatedAt: string;
  }>;
};

type AssistantProposalActionOutput = {
  proposalId: string;
  proposalType: "meal_plan" | "workout_plan";
  status: string;
  summary: string;
  title: string;
};

type AssistantProposalTarget = {
  proposalId: string;
  proposalType: "meal_plan" | "workout_plan";
};

type AssistantToolPart =
  | { type: "text"; text: string }
  | { type: "tool-createWorkoutPlan"; output?: AssistantProposalOutput; state: string }
  | { type: "tool-createMealPlan"; output?: AssistantProposalOutput; state: string }
  | { type: "tool-searchWeb"; output?: AssistantSearchOutput; state: string }
  | { type: "tool-listRecentProposals"; output?: AssistantProposalListOutput; state: string }
  | { type: "tool-approveProposal"; output?: AssistantProposalActionOutput; state: string }
  | { type: "tool-applyProposal"; output?: AssistantProposalActionOutput; state: string }
  | { type: "tool-call"; toolName: string }
  | { type: "tool-result" };

const quickPrompts = [
  "Разбери мой прогресс и скажи, что лучше улучшить.",
  "Собери план питания на день с упором на белок.",
  "Составь тренировку без перегруза.",
];

void quickPrompts;

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatProposalStatus(status: string) {
  if (status === "applied") {
    return "применено";
  }

  if (status === "approved") {
    return "подтверждено";
  }

  return "черновик";
}

function ProposalStatusPill({
  proposalType,
  status,
}: {
  proposalType: "meal_plan" | "workout_plan";
  status: string;
}) {
  return (
    <span className="pill">
      {proposalType === "workout_plan" ? "Тренировки" : "Питание"} · {formatProposalStatus(status)}
    </span>
  );
}

function formatProposalType(proposalType: "meal_plan" | "workout_plan") {
  return proposalType === "workout_plan" ? "тренировки" : "питание";
}

export function AiAssistantWidget(props: AiAssistantWidgetProps) {
  const { hidden = false, viewer } = props;
  const router = useRouter();
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [allowWebSearch, setAllowWebSearch] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const nowLabel = useMemo(() => timeFormatter.format(new Date()), []);

  const { messages, sendMessage, status, error, stop, setMessages } = useChat({
    messages: [],
    transport: new DefaultChatTransport({
      api: "/api/ai/assistant",
    }),
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (hidden) {
      setIsOpen(false);
    }
  }, [hidden]);

  const isBusy = status === "submitted" || status === "streaming";
  const lastAssistantMessageId = useMemo(() => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
    return lastAssistantMessage?.id ?? null;
  }, [messages]);

  function submitText(nextText?: string) {
    const trimmed = (nextText ?? draft).trim();

    if (!trimmed || isBusy) {
      return;
    }

    const nextSessionId = sessionId ?? crypto.randomUUID();
    setSessionId(nextSessionId);
    setNotice(null);

    sendMessage(
      { text: trimmed },
      {
        body: {
          allowWebSearch,
          sessionId: nextSessionId,
        },
      },
    );

    setDraft("");
  }

  function insertPromptTemplate(prompt: string) {
    setDraft((current) => (current.trim() ? `${current.trimEnd()}\n\n${prompt}` : prompt));
    setIsPromptLibraryOpen(false);
    window.requestAnimationFrame(() => composerRef.current?.focus());
  }

  async function runProposalAction(
    action: "approve" | "apply",
    target: AssistantProposalTarget,
  ) {
    setNotice(null);
    setActionBusyKey(`${action}:${target.proposalId}`);

    try {
      const response = await fetch(`/api/ai/proposals/${target.proposalId}/${action}`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Не удалось выполнить действие.");
      }

      setNotice(
        action === "approve"
          ? "Предложение подтверждено."
          : target.proposalType === "workout_plan"
            ? "План тренировок добавлен."
            : "План питания добавлен.",
      );
      router.refresh();
    } catch (actionError) {
      setNotice(actionError instanceof Error ? actionError.message : "Не удалось выполнить действие.");
    } finally {
      setActionBusyKey(null);
    }
  }

  function resetChat() {
    setMessages([]);
    setSessionId(null);
    setDraft("");
    setNotice(null);
  }

  function renderPart(part: AssistantToolPart, key: string) {
    if (part.type === "text") {
      return (
        <AssistantMarkdown
          isStreaming={status === "streaming" && key.startsWith(`${lastAssistantMessageId}`)}
          key={key}
          text={part.text}
        />
      );
    }

    if (
      part.type === "tool-createWorkoutPlan" ||
      part.type === "tool-createMealPlan"
    ) {
      if (part.state === "input-streaming" || part.state === "input-available") {
        return (
          <div className="rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-muted" key={key}>
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="animate-spin" size={16} />
              Собираю новый план...
            </span>
          </div>
        );
      }

      if (!part.output) {
        return null;
      }

      const output = part.output;

      return (
        <div className="rounded-2xl border border-border bg-white/85 p-4" key={key}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{output.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{output.description}</p>
            </div>
            <ProposalStatusPill proposalType={output.proposalType} status="draft" />
          </div>
          {output.highlights.length ? (
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
              {output.highlights.slice(0, 4).map((item) => (
                <li key={`${output.proposalId}-${item}`}>{item}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              onClick={() =>
                runProposalAction("apply", {
                  proposalId: output.proposalId,
                  proposalType: output.proposalType,
                })
              }
              type="button"
            >
              {output.applyLabel}
            </button>
          </div>
        </div>
      );
    }

    if (part.type === "tool-searchWeb") {
      if (part.state === "input-streaming" || part.state === "input-available") {
        return (
          <div className="rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-muted" key={key}>
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="animate-spin" size={16} />
              Ищу свежую информацию...
            </span>
          </div>
        );
      }

      if (!part.output) {
        return null;
      }

      return (
        <div className="rounded-2xl border border-border bg-white/85 p-4" key={key}>
          <p className="text-sm font-semibold text-foreground">Поиск: {part.output.query}</p>
          <div className="mt-3 grid gap-3">
            {part.output.results.map((result) => (
              <a
                className="rounded-2xl border border-border bg-white/80 px-3 py-3 text-sm transition hover:bg-white"
                href={result.url}
                key={result.url}
                rel="noreferrer"
                target="_blank"
              >
                <p className="font-semibold text-foreground">{result.title}</p>
                {result.snippet ? <p className="mt-1 leading-6 text-muted">{result.snippet}</p> : null}
              </a>
            ))}
          </div>
        </div>
      );
    }

    if (part.type === "tool-listRecentProposals") {
      if (!part.output) {
        return null;
      }

      return (
        <div className="rounded-2xl border border-border bg-white/85 p-4" key={key}>
          <p className="text-sm font-semibold text-foreground">Последние предложения</p>
          <div className="mt-3 grid gap-3">
            {part.output.items.slice(0, 3).map((item) => (
              <div className="rounded-2xl border border-border bg-white/75 px-3 py-3" key={item.proposalId}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      {`Сохранённый ${formatProposalType(item.proposalType)}-план.`}
                    </p>
                  </div>
                  <ProposalStatusPill proposalType={item.proposalType} status={item.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.status === "draft" ? (
                    <button
                      className="rounded-full border border-border bg-white/80 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white disabled:opacity-60"
                      disabled={actionBusyKey === `approve:${item.proposalId}`}
                      onClick={() =>
                        runProposalAction("approve", {
                          proposalId: item.proposalId,
                          proposalType: item.proposalType,
                        })
                      }
                      type="button"
                    >
                      Подтвердить
                    </button>
                  ) : null}
                  {item.status !== "applied" ? (
                    <button
                      className="rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                      disabled={actionBusyKey === `apply:${item.proposalId}`}
                      onClick={() =>
                        runProposalAction("apply", {
                          proposalId: item.proposalId,
                          proposalType: item.proposalType,
                        })
                      }
                      type="button"
                    >
                      Применить
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (part.type === "tool-approveProposal" || part.type === "tool-applyProposal") {
      if (!part.output) {
        return null;
      }

      const output = part.output;

      return (
        <div className="rounded-2xl border border-border bg-white/85 p-4" key={key}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{output.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{output.summary}</p>
            </div>
            <ProposalStatusPill proposalType={output.proposalType} status={output.status} />
          </div>
          {output.status !== "applied" ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                disabled={actionBusyKey === `apply:${output.proposalId}`}
                onClick={() =>
                  runProposalAction("apply", {
                    proposalId: output.proposalId,
                    proposalType: output.proposalType,
                  })
                }
                type="button"
              >
                Применить
              </button>
            </div>
          ) : null}
        </div>
      );
    }

    if (part.type === "tool-call") {
      return (
        <div className="rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-muted" key={key}>
          Выполняю действие: {part.toolName}
        </div>
      );
    }

    return null;
  }

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-label="Открыть AI-ассистента"
        className="fixed bottom-[calc(6.4rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_48px_-26px_rgba(20,97,75,0.65)] transition hover:opacity-92 sm:right-6 lg:bottom-6 lg:right-10"
        data-testid="ai-assistant-widget-trigger"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Sparkles size={18} strokeWidth={2.2} />
        AI
      </button>

      <div
        aria-hidden={!isOpen}
        className={`app-drawer-backdrop ${isOpen ? "app-drawer-backdrop--visible" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      {isOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-0 z-[70] flex items-end justify-end p-3 sm:p-4 lg:p-6">
          <section className="relative flex h-[min(84dvh,52rem)] w-full max-w-[31rem] flex-col overflow-hidden rounded-[2rem] border border-border bg-[color-mix(in_srgb,var(--surface)_94%,white)] shadow-[0_28px_90px_-32px_rgba(24,22,19,0.42)]">
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
              <div className="min-w-0">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">AI</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">AI-коуч</h2>
                <p className="mt-2 truncate text-sm text-muted">
                  {viewer.fullName ?? viewer.email ?? "Аккаунт fit"}
                </p>
              </div>

              <button
                aria-label="Закрыть AI"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/75 text-foreground transition hover:bg-white"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <button
                  aria-label={
                    allowWebSearch ? "Выключить поиск в интернете" : "Включить поиск в интернете"
                  }
                  aria-pressed={allowWebSearch}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
                    allowWebSearch
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : "border-border bg-white/80 text-muted hover:bg-white"
                  }`}
                  onClick={() => setAllowWebSearch((current) => !current)}
                  type="button"
                >
                  <Globe size={18} strokeWidth={2.2} />
                </button>

                <button
                  aria-label="??????? ???????"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/80 text-foreground transition hover:bg-white"
                  onClick={() => setIsPromptLibraryOpen(true)}
                  type="button"
                >
                  <WandSparkles size={16} strokeWidth={2.1} />
                </button>

                <button
                  className="rounded-full border border-border bg-white/80 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white"
                  onClick={resetChat}
                  type="button"
                >
                  Новый чат
                </button>
              </div>

              <Link
                className="rounded-full border border-border bg-white/80 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white"
                href="/ai"
              >
                Полный экран
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="grid gap-4">
                {messages.length ? (
                  messages.map((message) => (
                    <article
                      className={`rounded-3xl border px-4 py-4 ${
                        message.role === "assistant"
                          ? "border-border bg-white/85"
                          : "border-accent/20 bg-accent/5"
                      }`}
                      key={message.id}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          {message.role === "assistant" ? "AI-коуч" : "Ты"}
                        </p>
                        <p className="text-xs text-muted">{nowLabel}</p>
                      </div>

                      <div className="mt-3 grid gap-3">
                        {(message.parts as AssistantToolPart[]).map((part, index) =>
                          renderPart(part, `${message.id}-${index}`),
                        )}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-border bg-white/70 px-4 py-6" />
                )}
              </div>
            </div>

            <div className="border-t border-border px-5 py-4">
              {notice ? (
                <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {notice}
                </div>
              ) : null}

              {error ? (
                <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error.message}
                </div>
              ) : null}

              <div className="grid gap-3">
                <textarea
                  className="min-h-24 w-full rounded-3xl border border-border bg-white/85 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      submitText();
                    }
                  }}
                  placeholder="Напиши вопрос или задачу для AI."
                  ref={composerRef}
                  value={draft}
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted">
                    {allowWebSearch ? "Поиск в интернете включён." : "Поиск в интернете выключен."}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {isBusy ? (
                      <button
                        className="rounded-full border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-white/80"
                        onClick={() => stop()}
                        type="button"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Square size={16} strokeWidth={2.2} />
                          Остановить
                        </span>
                      </button>
                    ) : null}

                    <button
                      className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!draft.trim() || isBusy}
                      onClick={() => submitText()}
                      type="button"
                    >
                      <span className="inline-flex items-center gap-2">
                        {isBusy ? <LoaderCircle className="animate-spin" size={16} /> : null}
                        {isBusy ? "Думаю..." : "Отправить"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <AiPromptLibrary
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelect={insertPromptTemplate}
      />
    </>
  );
}
