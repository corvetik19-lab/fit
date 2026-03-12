"use client";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Globe,
  LoaderCircle,
  Square,
  WandSparkles,
} from "lucide-react";

import { AssistantMarkdown } from "@/components/assistant-markdown";
import type { FeatureAccessSnapshot } from "@/lib/billing-access";
import { toUiMessages } from "@/lib/ai/chat";

type ChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
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

type AiChatPanelProps = {
  access: FeatureAccessSnapshot;
  initialSessionId: string | null;
  initialSessionTitle: string | null;
  initialMessages: ChatMessage[];
};

const textareaClassName =
  "min-h-28 w-full rounded-3xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60";

const quickPrompts = [
  "Разбери мой прогресс по тренировкам и подскажи, что скорректировать на этой неделе.",
  "Составь новый план питания с акцентом на белок и восстановление.",
  "Собери тренировку без перегруза с учётом моей истории.",
];

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function ProposalToolCard({
  output,
  state,
}: {
  output?: AssistantProposalOutput;
  state: string;
}) {
  if (state === "input-streaming" || state === "input-available") {
    return (
      <div className="rounded-3xl border border-border bg-white/80 px-4 py-4 text-sm text-muted">
        <div className="flex items-center gap-2">
          <LoaderCircle className="animate-spin" size={16} />
          Готовлю новый план...
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
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted">
          Черновик уже создан в системе и доступен в студии предложений.
        </p>
        <Link
          className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
          href="/ai#proposal-studio"
        >
          Открыть студию
        </Link>
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
          Ищу свежую информацию...
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
            Найдено: {output.count}. Можно открыть студию и выбрать, что подтверждать
            или применять дальше.
          </p>
        </div>
        <span className="pill">{output.count} шт.</span>
      </div>

      <div className="mt-3 grid gap-3">
        {output.items.length ? (
          output.items.slice(0, 4).map((item) => (
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
                  <Link
                    className="rounded-full border border-border bg-white/80 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white"
                    href={item.proposalType === "workout_plan" ? "/workouts" : "/nutrition"}
                  >
                    Открыть раздел
                  </Link>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">Сохранённых AI-предложений пока нет.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted">
          Полный список и все действия доступны в студии предложений.
        </p>
        <Link
          className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
          href="/ai#proposal-studio"
        >
          Открыть студию
        </Link>
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
        <Link
          className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
          href={primaryHref}
        >
          {primaryLabel}
        </Link>
        <Link
          className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
          href="/ai#proposal-studio"
        >
          История AI-предложений
        </Link>
      </div>
    </div>
  );
}

export function AiChatPanel({
  access,
  initialSessionId,
  initialSessionTitle,
  initialMessages,
}: AiChatPanelProps) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [sessionTitle, setSessionTitle] = useState(initialSessionTitle);
  const [draft, setDraft] = useState("");
  const [allowWebSearch, setAllowWebSearch] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const nowLabel = useMemo(() => timeFormatter.format(new Date()), []);
  const initialUiMessages = useMemo(
    () => toUiMessages(initialMessages),
    [initialMessages],
  );
  const initialMessageTimes = useMemo(
    () =>
      new Map(initialMessages.map((message) => [message.id, message.created_at])),
    [initialMessages],
  );
  const { messages, sendMessage, status, error, stop, setMessages } = useChat({
    messages: initialUiMessages as UIMessage[],
    transport: new DefaultChatTransport({
      api: "/api/ai/assistant",
    }),
  });

  const isBusy = status === "submitted" || status === "streaming";
  const lastAssistantMessageId = useMemo(() => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
    return lastAssistantMessage?.id ?? null;
  }, [messages]);

  function submitMessage(text?: string) {
    const trimmed = (text ?? draft).trim();

    if (!trimmed || isBusy || !access.allowed) {
      return;
    }

    const nextSessionId = sessionId ?? crypto.randomUUID();
    setSessionId(nextSessionId);
    if (!sessionTitle) {
      setSessionTitle(trimmed.slice(0, 72));
    }

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
            ? "Тренировочный план применён и добавлен в приложение."
            : "План питания применён и добавлен в приложение.",
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

  function resetChat() {
    setSessionId(null);
    setSessionTitle(null);
    setMessages([]);
    setDraft("");
    setNotice(null);
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
            Чат использует сохранённый профиль, полную историю тренировок,
            питания и состава тела текущего пользователя.
          </p>
          <p className="mt-1 text-sm text-muted">
            Использовано: {access.usage.count}
            {typeof access.usage.limit === "number" ? ` / ${access.usage.limit}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-3 rounded-full border border-border bg-white/80 px-4 py-2 text-sm text-foreground">
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

          <button
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!access.allowed}
            onClick={resetChat}
            type="button"
          >
            Новый чат
          </button>
        </div>
      </div>

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

      {error ? (
        <p className="rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </p>
      ) : null}

      {notice ? (
        <p className="rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-2 md:grid-cols-3">
        {quickPrompts.map((prompt) => (
          <button
            className="inline-flex items-center justify-between gap-3 rounded-2xl border border-border bg-white/76 px-4 py-3 text-left text-sm text-foreground transition hover:bg-white disabled:opacity-60"
            disabled={isBusy || !access.allowed}
            key={prompt}
            onClick={() => submitMessage(prompt)}
            type="button"
          >
            <span className="line-clamp-2">{prompt}</span>
            <WandSparkles size={16} strokeWidth={2.1} />
          </button>
        ))}
      </div>

      <div className="grid max-h-[42rem] gap-4 overflow-y-auto rounded-3xl border border-border bg-white/50 p-4">
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
                  {message.role === "assistant" ? "AI-коуч" : "Ты"}
                </p>
                <p className="text-xs text-muted">
                  {initialMessageTimes.has(message.id)
                    ? timeFormatter.format(
                        new Date(initialMessageTimes.get(message.id) ?? ""),
                      )
                    : nowLabel}
                </p>
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
                        key={`${message.id}-workout-${index}`}
                        output={part.output}
                        state={part.state}
                      />
                    );
                  }

                  if (part.type === "tool-createMealPlan") {
                    return (
                      <ProposalToolCard
                        key={`${message.id}-meal-${index}`}
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
          <div className="rounded-3xl border border-dashed border-border bg-white/60 px-4 py-6 text-sm leading-7 text-muted">
            Здесь появится диалог с AI-коучем. Он опирается на профиль, цели,
            тренировки, питание и исторические пользовательские данные текущего
            аккаунта.
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
            AI не записывает ничего в тренировки или питание автоматически без
            явного применения предложений.
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
              disabled={isBusy || !draft.trim() || !access.allowed}
              onClick={() => submitMessage()}
              type="button"
            >
              {isBusy ? "Думаю..." : "Отправить в AI-чат"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
