"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Globe,
  LoaderCircle,
  Plus,
  Sparkles,
  Square,
  WandSparkles,
  X,
} from "lucide-react";

import { AssistantMarkdown } from "@/components/assistant-markdown";
import { toUiMessages } from "@/lib/ai/chat";

type AiAssistantWidgetProps = {
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
  | {
      type: "text";
      text: string;
    }
  | {
      type: "tool-createWorkoutPlan";
      output?: AssistantProposalOutput;
      state: string;
    }
  | {
      type: "tool-createMealPlan";
      output?: AssistantProposalOutput;
      state: string;
    }
  | {
      type: "tool-searchWeb";
      output?: AssistantSearchOutput;
      state: string;
    }
  | {
      type: "tool-listRecentProposals";
      output?: AssistantProposalListOutput;
      state: string;
    }
  | {
      type: "tool-approveProposal";
      output?: AssistantProposalActionOutput;
      state: string;
    }
  | {
      type: "tool-applyProposal";
      output?: AssistantProposalActionOutput;
      state: string;
    }
  | {
      type: "tool-call";
      toolName: string;
    }
  | {
      type: "tool-result";
    };

const textareaClassName =
  "min-h-24 w-full rounded-3xl border border-border bg-white/85 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60";

const quickPrompts = [
  "Составь мне план тренировок на 4 дня с акцентом на прогресс без перегруза.",
  "Составь мне план питания на день с упором на белок и восстановление.",
  "Разбери мой текущий прогресс и подскажи, что улучшить на этой неделе.",
];

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function ProposalToolCard({
  busy,
  onApply,
  output,
  state,
}: {
  busy: boolean;
  onApply: (output: AssistantProposalOutput) => void;
  output?: AssistantProposalOutput;
  state: string;
}) {
  if (state === "input-streaming" || state === "input-available") {
    return (
      <div className="rounded-3xl border border-border bg-white/80 px-4 py-4 text-sm text-muted">
        <div className="flex items-center gap-2">
          <LoaderCircle className="animate-spin" size={16} />
          Подготавливаю новый план...
        </div>
      </div>
    );
  }

  if (!output) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-border bg-white/90 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{output.title}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{output.description}</p>
        </div>
        <span className="pill">
          {output.proposalType === "workout_plan" ? "Тренировки" : "Питание"}
        </span>
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
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
          onClick={() => onApply(output)}
          type="button"
        >
          {output.applyLabel}
        </button>
      </div>
    </div>
  );
}

function SearchToolCard({
  output,
  state,
}: {
  output?: AssistantSearchOutput;
  state: string;
}) {
  if (state === "input-streaming" || state === "input-available") {
    return (
      <div className="rounded-3xl border border-border bg-white/80 px-4 py-4 text-sm text-muted">
        <div className="flex items-center gap-2">
          <LoaderCircle className="animate-spin" size={16} />
          Ищу свежую информацию в интернете...
        </div>
      </div>
    );
  }

  if (!output) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-border bg-white/90 p-4">
      <p className="text-sm font-semibold text-foreground">
        Интернет-поиск: {output.query}
      </p>
      <div className="mt-3 grid gap-3">
        {output.results.length ? (
          output.results.map((result) => (
            <a
              className="rounded-2xl border border-border bg-white/80 px-3 py-3 text-sm transition hover:border-accent/40 hover:bg-white"
              href={result.url}
              key={`${output.query}-${result.url}`}
              rel="noreferrer"
              target="_blank"
            >
              <p className="font-semibold text-foreground">{result.title}</p>
              {result.snippet ? (
                <p className="mt-1 leading-6 text-muted">{result.snippet}</p>
              ) : null}
            </a>
          ))
        ) : (
          <p className="text-sm text-muted">Ничего полезного не нашлось.</p>
        )}
      </div>
    </div>
  );
}

function ProposalStatusPill({
  proposalType,
  status,
}: {
  proposalType: "meal_plan" | "workout_plan";
  status: string;
}) {
  const typeLabel = proposalType === "workout_plan" ? "Тренировки" : "Питание";
  const statusLabel =
    status === "applied"
      ? "применено"
      : status === "approved"
        ? "подтверждено"
        : "черновик";

  return <span className="pill">{`${typeLabel} · ${statusLabel}`}</span>;
}

function ProposalListToolCard({
  actionBusyKey,
  onApply,
  onApprove,
  output,
  state,
}: {
  actionBusyKey: string | null;
  onApply: (target: AssistantProposalTarget) => void;
  onApprove: (target: AssistantProposalTarget) => void;
  output?: AssistantProposalListOutput;
  state: string;
}) {
  if (state === "input-streaming" || state === "input-available") {
    return (
      <div className="rounded-3xl border border-border bg-white/80 px-4 py-4 text-sm text-muted">
        <div className="flex items-center gap-2">
          <LoaderCircle className="animate-spin" size={16} />
          Собираю последние AI-предложения...
        </div>
      </div>
    );
  }

  if (!output) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-border bg-white/90 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Последние AI-предложения
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">
            Найдено: {output.count}. Открой студию или полный экран, чтобы выбрать
            нужный черновик.
          </p>
        </div>
        <span className="pill">{output.count} шт.</span>
      </div>

      <div className="mt-3 grid gap-3">
        {output.items.length ? (
          output.items.slice(0, 3).map((item) => (
            <div
              className="rounded-2xl border border-border bg-white/80 px-3 py-3"
              key={item.proposalId}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{item.requestSummary}</p>
                </div>
                <ProposalStatusPill
                  proposalType={item.proposalType}
                  status={item.status}
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{item.timeline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {item.status === "draft" ? (
                  <button
                    className="rounded-full border border-border bg-white/80 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={actionBusyKey === `approve:${item.proposalId}`}
                    onClick={() =>
                      onApprove({
                        proposalId: item.proposalId,
                        proposalType: item.proposalType,
                      })
                    }
                    type="button"
                  >
                    {actionBusyKey === `approve:${item.proposalId}`
                      ? "Подтверждаю..."
                      : "Подтвердить"}
                  </button>
                ) : null}
                {item.status !== "applied" ? (
                  <button
                    className="rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={actionBusyKey === `apply:${item.proposalId}`}
                    onClick={() =>
                      onApply({
                        proposalId: item.proposalId,
                        proposalType: item.proposalType,
                      })
                    }
                    type="button"
                  >
                    {actionBusyKey === `apply:${item.proposalId}`
                      ? "Применяю..."
                      : "Применить"}
                  </button>
                ) : (
                  <a
                    className="rounded-full border border-border bg-white/80 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white"
                    href={item.proposalType === "workout_plan" ? "/workouts" : "/nutrition"}
                  >
                    Открыть раздел
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">Сохранённых AI-предложений пока нет.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
          href="/ai#proposal-studio"
        >
          Открыть студию
        </a>
      </div>
    </div>
  );
}

function ProposalActionToolCard({
  actionBusyKey,
  onApply,
  output,
  state,
  variant,
}: {
  actionBusyKey: string | null;
  onApply: (target: AssistantProposalTarget) => void;
  output?: AssistantProposalActionOutput;
  state: string;
  variant: "approve" | "apply";
}) {
  if (state === "input-streaming" || state === "input-available") {
    return (
      <div className="rounded-3xl border border-border bg-white/80 px-4 py-4 text-sm text-muted">
        <div className="flex items-center gap-2">
          <LoaderCircle className="animate-spin" size={16} />
          {variant === "approve"
            ? "Подтверждаю AI-предложение..."
            : "Применяю AI-предложение..."}
        </div>
      </div>
    );
  }

  if (!output) {
    return null;
  }

  const primaryHref =
    variant === "apply"
      ? output.proposalType === "workout_plan"
        ? "/workouts"
        : "/nutrition"
      : "/ai#proposal-studio";

  const primaryLabel =
    variant === "apply"
      ? output.proposalType === "workout_plan"
        ? "Открыть тренировки"
        : "Открыть питание"
      : "Открыть студию";

  return (
    <div className="rounded-3xl border border-border bg-white/90 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{output.title}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{output.summary}</p>
        </div>
        <ProposalStatusPill
          proposalType={output.proposalType}
          status={output.status}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {output.status !== "applied" ? (
          <button
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={actionBusyKey === `apply:${output.proposalId}`}
            onClick={() =>
              onApply({
                proposalId: output.proposalId,
                proposalType: output.proposalType,
              })
            }
            type="button"
          >
            {actionBusyKey === `apply:${output.proposalId}` ? "Применяю..." : "Применить"}
          </button>
        ) : null}
        <a
          className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
          href={primaryHref}
        >
          {primaryLabel}
        </a>
        <a
          className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
          href="/ai#proposal-studio"
        >
          История AI-предложений
        </a>
      </div>
    </div>
  );
}

export function AiAssistantWidget({
  initialMessages,
  initialSessionId,
  viewer,
}: AiAssistantWidgetProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [allowWebSearch, setAllowWebSearch] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [applyBusyId, setApplyBusyId] = useState<string | null>(null);
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const nowLabel = useMemo(() => timeFormatter.format(new Date()), []);
  const initialUiMessages = useMemo(
    () => toUiMessages(initialMessages),
    [initialMessages],
  );
  const { messages, sendMessage, status, error, stop, setMessages } = useChat({
    messages: initialUiMessages,
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

  const isBusy = status === "submitted" || status === "streaming";
  const lastAssistantMessageId = useMemo(() => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
    return lastAssistantMessage?.id ?? null;
  }, [messages]);

  async function applyProposal(output: AssistantProposalOutput) {
    setNotice(null);
    setApplyBusyId(output.proposalId);

    try {
      const response = await fetch(`/api/ai/proposals/${output.proposalId}/apply`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Не удалось применить AI-предложение.");
      }

      setNotice(
        output.proposalType === "workout_plan"
          ? "Тренировочный план добавлен в приложение."
          : "План питания добавлен в приложение.",
      );
      router.refresh();
    } catch (applyError) {
      setNotice(
        applyError instanceof Error
          ? applyError.message
          : "Не удалось применить AI-предложение.",
      );
    } finally {
      setApplyBusyId(null);
    }
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
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Не удалось выполнить действие с AI-предложением.");
      }

      setNotice(
        action === "approve"
          ? "AI-предложение подтверждено и готово к применению."
          : target.proposalType === "workout_plan"
            ? "Тренировочный план добавлен в приложение."
            : "План питания добавлен в приложение.",
      );
      router.refresh();
    } catch (proposalActionError) {
      setNotice(
        proposalActionError instanceof Error
          ? proposalActionError.message
          : "Не удалось выполнить действие с AI-предложением.",
      );
    } finally {
      setActionBusyKey(null);
    }
  }

  function submitText(text: string) {
    const trimmed = text.trim();

    if (!trimmed || isBusy) {
      return;
    }

    const nextSessionId = sessionId ?? crypto.randomUUID();
    setSessionId(nextSessionId);
    setNotice(null);
    sendMessage(
      {
        text: trimmed,
      },
      {
        body: {
          allowWebSearch,
          sessionId: nextSessionId,
        },
      },
    );
    setDraft("");
  }

  function resetChat() {
    setMessages([]);
    setSessionId(null);
    setDraft("");
    setNotice(null);
  }

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-label="Открыть AI-ассистента"
        className="fixed bottom-[calc(6.4rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_48px_-26px_rgba(20,97,75,0.65)] transition hover:opacity-92 sm:right-6 lg:bottom-6 lg:right-10"
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
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                  AI-ассистент
                </p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                  Чат, планы и быстрые действия
                </h2>
                <p className="mt-2 truncate text-sm text-muted">
                  {viewer.fullName ?? viewer.email ?? "Аккаунт fit"}
                </p>
              </div>

              <button
                aria-label="Закрыть AI-ассистента"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/75 text-foreground transition hover:bg-white"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
              <label className="flex items-center gap-3 text-sm text-foreground">
                <span
                  className={`inline-flex h-6 w-11 items-center rounded-full border p-1 transition ${
                    allowWebSearch
                      ? "border-accent bg-accent/15"
                      : "border-border bg-white/80"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full transition ${
                      allowWebSearch ? "translate-x-5 bg-accent" : "bg-muted"
                    }`}
                  />
                </span>
                <span className="inline-flex items-center gap-2">
                  <Globe size={16} strokeWidth={2.2} />
                  Интернет
                </span>
                <input
                  checked={allowWebSearch}
                  className="sr-only"
                  onChange={(event) => setAllowWebSearch(event.target.checked)}
                  type="checkbox"
                />
              </label>

              <div className="flex items-center gap-2">
                <button
                  className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/80"
                  onClick={resetChat}
                  type="button"
                >
                  Новый чат
                </button>
                <a
                  className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/80"
                  href="/ai"
                >
                  Полный экран
                </a>
              </div>
            </div>

            <div className="grid gap-2 border-b border-border px-5 py-3">
              {quickPrompts.map((prompt) => (
                <button
                  className="inline-flex items-center justify-between gap-3 rounded-2xl border border-border bg-white/76 px-4 py-3 text-left text-sm text-foreground transition hover:bg-white disabled:opacity-60"
                  disabled={isBusy}
                  key={prompt}
                  onClick={() => submitText(prompt)}
                  type="button"
                >
                  <span className="line-clamp-2">{prompt}</span>
                  <WandSparkles size={16} strokeWidth={2.1} />
                </button>
              ))}
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
                          {message.role === "assistant" ? "AI" : "Ты"}
                        </p>
                        <p className="text-xs text-muted">{nowLabel}</p>
                      </div>

                      <div className="mt-3 grid gap-3">
                        {(message.parts as AssistantToolPart[]).map((part, index) => {
                          if (part.type === "text") {
                            return (
                              <AssistantMarkdown
                                isStreaming={
                                  message.role === "assistant" &&
                                  status === "streaming" &&
                                  message.id === lastAssistantMessageId
                                }
                                key={`${message.id}-text-${index}`}
                                text={part.text}
                              />
                            );
                          }

                          if (part.type === "tool-createWorkoutPlan") {
                            return (
                              <ProposalToolCard
                                busy={applyBusyId === part.output?.proposalId}
                                key={`${message.id}-workout-${index}`}
                                onApply={applyProposal}
                                output={part.output}
                                state={part.state}
                              />
                            );
                          }

                          if (part.type === "tool-createMealPlan") {
                            return (
                              <ProposalToolCard
                                busy={applyBusyId === part.output?.proposalId}
                                key={`${message.id}-meal-${index}`}
                                onApply={applyProposal}
                                output={part.output}
                                state={part.state}
                              />
                            );
                          }

                          if (part.type === "tool-searchWeb") {
                            return (
                              <SearchToolCard
                                key={`${message.id}-web-${index}`}
                                output={part.output}
                                state={part.state}
                              />
                            );
                          }

                          if (part.type === "tool-listRecentProposals") {
                            return (
                              <ProposalListToolCard
                                actionBusyKey={actionBusyKey}
                                key={`${message.id}-proposal-list-${index}`}
                                onApply={(target) => runProposalAction("apply", target)}
                                onApprove={(target) => runProposalAction("approve", target)}
                                output={part.output}
                                state={part.state}
                              />
                            );
                          }

                          if (part.type === "tool-approveProposal") {
                            return (
                              <ProposalActionToolCard
                                actionBusyKey={actionBusyKey}
                                key={`${message.id}-proposal-approve-${index}`}
                                onApply={(target) => runProposalAction("apply", target)}
                                output={part.output}
                                state={part.state}
                                variant="approve"
                              />
                            );
                          }

                          if (part.type === "tool-applyProposal") {
                            return (
                              <ProposalActionToolCard
                                actionBusyKey={actionBusyKey}
                                key={`${message.id}-proposal-apply-${index}`}
                                onApply={(target) => runProposalAction("apply", target)}
                                output={part.output}
                                state={part.state}
                                variant="apply"
                              />
                            );
                          }

                          if (part.type === "tool-call") {
                            return (
                              <div
                                className="rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm text-muted"
                                key={`${message.id}-toolcall-${index}`}
                              >
                                Выполняю действие: {part.toolName}
                              </div>
                            );
                          }

                          return null;
                        })}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-border bg-white/70 px-4 py-6 text-sm leading-7 text-muted">
                    Здесь можно задать вопрос, попросить AI составить план питания
                    или тренировок, а затем сразу добавить результат в приложение
                    одним нажатием.
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border px-5 py-4">
              {notice ? (
                <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <div className="flex items-center gap-2">
                    <Check size={16} strokeWidth={2.2} />
                    {notice}
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error.message}
                </div>
              ) : null}

              <div className="grid gap-3">
                <textarea
                  className={textareaClassName}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Например: составь тренировку на 4 дня с учётом моего текущего прогресса."
                  value={draft}
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted">
                    Ассистент может строить планы и предлагать следующий шаг прямо
                    внутри fit.
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
                      onClick={() => submitText(draft)}
                      type="button"
                    >
                      <span className="inline-flex items-center gap-2">
                        {isBusy ? (
                          <LoaderCircle className="animate-spin" size={16} />
                        ) : (
                          <Plus size={16} strokeWidth={2.2} />
                        )}
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
    </>
  );
}
