"use client";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Globe,
  ImagePlus,
  LoaderCircle,
  Square,
  WandSparkles,
  X,
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

type MealPhotoAnalysis = {
  title: string;
  summary: string;
  confidence: "low" | "medium" | "high";
  estimatedKcal: number;
  macros: {
    protein: number;
    fat: number;
    carbs: number;
  };
  items: Array<{
    name: string;
    portion: string;
    confidence: "low" | "medium" | "high";
  }>;
  suggestions: string[];
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

type MealPhotoResponse = {
  data?: MealPhotoAnalysis;
  message?: string;
  messages?: {
    assistant?: ChatMessage;
    user?: ChatMessage;
  };
  session?: {
    id: string;
    title: string | null;
  };
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
  mealPhotoAccess: FeatureAccessSnapshot;
};

const quickPrompts = [
  "Разбери мой прогресс за последние недели и скажи, что лучше поправить.",
  "Составь план питания на день с упором на белок и восстановление.",
  "Собери тренировку без перегруза с учётом моей истории.",
];

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatConfidence(value: MealPhotoAnalysis["confidence"]) {
  switch (value) {
    case "high":
      return "высокая";
    case "medium":
      return "средняя";
    default:
      return "низкая";
  }
}

function formatProposalStatus(status: string) {
  if (status === "applied") {
    return "применено";
  }

  if (status === "approved") {
    return "подтверждено";
  }

  return "черновик";
}

function toUiTextMessage(message: ChatMessage): UIMessage {
  return {
    id: message.id,
    role: message.role,
    parts: [
      {
        type: "text",
        text: message.content,
      },
    ],
  };
}

function buildMealPhotoMarkdown(result: MealPhotoAnalysis) {
  const items =
    result.items.length > 0
      ? result.items
          .map(
            (item) =>
              `- ${item.name} · ${item.portion} · уверенность ${formatConfidence(item.confidence)}`,
          )
          .join("\n")
      : "- Точный состав определить не удалось.";

  const suggestions =
    result.suggestions.length > 0
      ? result.suggestions.map((item) => `- ${item}`).join("\n")
      : "- Можно уточнить рецепт, замену продуктов или попросить план питания.";

  return [
    `### ${result.title}`,
    result.summary,
    "",
    `Оценка: **${result.estimatedKcal} ккал**`,
    `Белки: **${result.macros.protein} г** · Жиры: **${result.macros.fat} г** · Углеводы: **${result.macros.carbs} г**`,
    "",
    "Что видно на фото:",
    items,
    "",
    "Что можно сделать дальше:",
    suggestions,
  ].join("\n");
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

function LoadingToolCard({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-border bg-white/80 px-4 py-4 text-sm text-muted">
      <div className="flex items-center gap-2">
        <LoaderCircle className="animate-spin" size={16} />
        {text}
      </div>
    </div>
  );
}

function ProposalToolCard({
  output,
  state,
}: {
  output?: AssistantProposalOutput;
  state: string;
}) {
  if (state === "input-streaming" || state === "input-available") {
    return <LoadingToolCard text="Собираю новый план..." />;
  }

  if (!output) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-border bg-white/90 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
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

      <p className="mt-4 text-sm leading-6 text-muted">
        Черновик уже сохранён. Его можно подтвердить или применить прямо в этом чате.
      </p>
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
    return <LoadingToolCard text="Ищу свежую информацию..." />;
  }

  if (!output) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-border bg-white/90 p-4">
      <p className="text-sm font-semibold text-foreground">Поиск в интернете: {output.query}</p>
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
          <p className="text-sm text-muted">Подходящих результатов не нашлось.</p>
        )}
      </div>
    </div>
  );
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
    return <LoadingToolCard text="Поднимаю последние предложения..." />;
  }

  if (!output) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-border bg-white/90 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Последние предложения</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            Ниже можно быстро выбрать черновик и сразу применить его.
          </p>
        </div>
        <span className="pill">{output.count}</span>
      </div>

      <div className="mt-3 grid gap-3">
        {output.items.length ? (
          output.items.slice(0, 4).map((item) => (
            <div
              className="rounded-2xl border border-border bg-white/80 px-3 py-3"
              key={item.proposalId}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {`Сохранённый ${formatProposalType(item.proposalType)}-план.`}
                  </p>
                </div>
                <ProposalStatusPill proposalType={item.proposalType} status={item.status} />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                {item.status === "applied"
                  ? "Уже добавлен в приложение."
                  : item.status === "approved"
                    ? "Подтверждён и готов к применению."
                    : "Черновик готов к проверке и применению."}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
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
                    {actionBusyKey === `approve:${item.proposalId}` ? "Подтверждаю..." : "Подтвердить"}
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
                    {actionBusyKey === `apply:${item.proposalId}` ? "Применяю..." : "Применить"}
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
          <p className="text-sm text-muted">Сохранённых предложений пока нет.</p>
        )}
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
      <LoadingToolCard
        text={variant === "approve" ? "Подтверждаю предложение..." : "Применяю предложение..."}
      />
    );
  }

  if (!output) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-border bg-white/90 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{output.title}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{output.summary}</p>
        </div>
        <ProposalStatusPill proposalType={output.proposalType} status={output.status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
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
          href={output.proposalType === "workout_plan" ? "/workouts" : "/nutrition"}
        >
          Открыть раздел
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
  mealPhotoAccess,
}: AiChatPanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);

  const [sessionId, setSessionId] = useState(initialSessionId);
  const [sessionTitle, setSessionTitle] = useState(initialSessionTitle);
  const [draft, setDraft] = useState("");
  const [allowWebSearch, setAllowWebSearch] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [messageTimes, setMessageTimes] = useState(
    () => new Map(initialMessages.map((message) => [message.id, message.created_at])),
  );

  const initialUiMessages = useMemo(() => toUiMessages(initialMessages), [initialMessages]);
  const nowLabel = useMemo(() => timeFormatter.format(new Date()), []);

  const { messages, sendMessage, status, error, stop, setMessages } = useChat({
    messages: initialUiMessages,
    transport: new DefaultChatTransport({
      api: "/api/ai/assistant",
    }),
  });

  const isBusy = status === "submitted" || status === "streaming";
  const isComposerBusy = isBusy || isAnalyzingImage;
  const lastAssistantMessageId = useMemo(() => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
    return lastAssistantMessage?.id ?? null;
  }, [messages]);

  useEffect(() => {
    if (!selectedImage) {
      setSelectedImageUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setSelectedImageUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return objectUrl;
    });

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;

    if (!viewport) {
      return;
    }

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isBusy, notice]);

  function updateSessionUrl(nextSessionId: string | null) {
    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);

    if (nextSessionId) {
      url.searchParams.set("session", nextSessionId);
    } else {
      url.searchParams.delete("session");
    }

    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function rememberLocalSession(nextSessionId: string, titleSeed: string) {
    setSessionId(nextSessionId);
    setSessionTitle((current) => current ?? titleSeed.trim().slice(0, 72));
    updateSessionUrl(nextSessionId);
  }

  function submitText(nextText?: string) {
    const trimmed = (nextText ?? draft).trim();

    if (!trimmed || isComposerBusy || !access.allowed) {
      return;
    }

    const nextSessionId = sessionId ?? crypto.randomUUID();
    rememberLocalSession(nextSessionId, trimmed);
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
        throw new Error(payload?.message ?? "Не удалось выполнить действие с предложением.");
      }

      setNotice(
        action === "approve"
          ? "Предложение подтверждено и готово к применению."
          : target.proposalType === "workout_plan"
            ? "План тренировок уже добавлен в приложение."
            : "План питания уже добавлен в приложение.",
      );
      router.refresh();
    } catch (proposalActionError) {
      setNotice(
        proposalActionError instanceof Error
          ? proposalActionError.message
          : "Не удалось выполнить действие с предложением.",
      );
    } finally {
      setActionBusyKey(null);
    }
  }

  async function analyzeMealPhoto() {
    if (!selectedImage || isComposerBusy) {
      return;
    }

    if (!mealPhotoAccess.allowed) {
      setNotice(mealPhotoAccess.reason ?? "Анализ фото еды сейчас недоступен.");
      return;
    }

    const nextSessionId = sessionId ?? crypto.randomUUID();
    const trimmedNotes = draft.trim();
    const formData = new FormData();
    formData.set("image", selectedImage);
    formData.set("sessionId", nextSessionId);

    if (trimmedNotes) {
      formData.set("notes", trimmedNotes);
    }

    setIsAnalyzingImage(true);
    setNotice(null);

    try {
      const response = await fetch("/api/ai/meal-photo", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as MealPhotoResponse | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.message ?? "Не удалось разобрать фото. Попробуй другой кадр.");
      }

      const resolvedSessionId = payload.session?.id ?? nextSessionId;
      const nextTitle = payload.session?.title ?? trimmedNotes ?? "Разбор фото еды";
      const userMessage =
        payload.messages?.user ??
        ({
          id: crypto.randomUUID(),
          session_id: resolvedSessionId,
          role: "user",
          content: trimmedNotes || "Загружено фото еды для анализа.",
          created_at: new Date().toISOString(),
        } satisfies ChatMessage);
      const assistantMessage =
        payload.messages?.assistant ??
        ({
          id: crypto.randomUUID(),
          session_id: resolvedSessionId,
          role: "assistant",
          content: buildMealPhotoMarkdown(payload.data),
          created_at: new Date().toISOString(),
        } satisfies ChatMessage);

      rememberLocalSession(resolvedSessionId, nextTitle);

      setMessageTimes((current) => {
        const next = new Map(current);
        next.set(userMessage.id, userMessage.created_at);
        next.set(assistantMessage.id, assistantMessage.created_at);
        return next;
      });

      setMessages((current) => [
        ...current,
        toUiTextMessage(userMessage),
        toUiTextMessage(assistantMessage),
      ]);

      setDraft("");
      setSelectedImage(null);
      setNotice("Фото разобрано. Теперь можно попросить рецепт, замену или план питания.");
    } catch (mealPhotoError) {
      setNotice(
        mealPhotoError instanceof Error
          ? mealPhotoError.message
          : "Не удалось проанализировать фото.",
      );
    } finally {
      setIsAnalyzingImage(false);
    }
  }

  function resetChat() {
    setSessionId(null);
    setSessionTitle(null);
    setMessages([]);
    setDraft("");
    setSelectedImage(null);
    setNotice(null);
    updateSessionUrl(null);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (selectedImage) {
        void analyzeMealPhoto();
        return;
      }

      submitText();
    }
  }

  return (
    <section className="card flex min-h-[72dvh] flex-col overflow-hidden p-4 sm:p-5 lg:min-h-[78dvh]">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {sessionTitle?.trim() || "Новый чат"}
          </p>
          <p className="mt-1 text-xs text-muted">
            История сохраняется автоматически. AI отвечает только по тренировкам, питанию,
            восстановлению и форме.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label={
              allowWebSearch
                ? "Выключить поиск в интернете"
                : "Включить поиск в интернете"
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
            aria-label="Выбрать фото еды"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
              selectedImage
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-border bg-white/80 text-muted hover:bg-white"
            }`}
            disabled={!mealPhotoAccess.allowed}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <ImagePlus size={18} strokeWidth={2.2} />
          </button>

          <button
            className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
            onClick={resetChat}
            type="button"
          >
            Новый чат
          </button>
        </div>
      </div>

      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
        ref={fileInputRef}
        type="file"
      />

      {!access.allowed ? (
        <div className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {access.reason ?? "AI-чат сейчас недоступен для текущего доступа."}
          <Link
            className="mt-3 inline-flex rounded-full border border-amber-400/70 bg-white/80 px-4 py-2 font-semibold text-foreground transition hover:bg-white"
            href="/settings#billing-center"
          >
            Открыть доступ
          </Link>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </p>
      ) : null}

      {notice ? (
        <p className="mt-4 rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}

      <div
        className="mt-4 flex-1 overflow-y-auto rounded-[1.75rem] border border-border bg-white/50 p-3 sm:p-4"
        ref={scrollViewportRef}
      >
        <div className="grid gap-4">
          {messages.length ? (
            messages.map((message) => (
              <article
                className={`rounded-3xl border px-4 py-4 ${
                  message.role === "assistant"
                    ? "border-border bg-white/85"
                    : "ml-auto border-accent/20 bg-accent/5"
                }`}
                key={message.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {message.role === "assistant" ? "AI-коуч" : "Ты"}
                  </p>
                  <p className="text-xs text-muted">
                    {messageTimes.has(message.id)
                      ? timeFormatter.format(new Date(messageTimes.get(message.id) ?? ""))
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
                          key={`${message.id}-search-${index}`}
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
                          key={`${message.id}-tool-call-${index}`}
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
            <div className="grid gap-3 rounded-3xl border border-dashed border-border bg-white/70 px-4 py-6">
              <p className="text-sm leading-6 text-muted">
                Спроси про тренировку, питание, восстановление, анализ прогресса или загрузи фото
                еды для разбора.
              </p>

              <div className="grid gap-2 sm:grid-cols-3">
                {quickPrompts.map((prompt) => (
                  <button
                    className="inline-flex items-center justify-between gap-3 rounded-2xl border border-border bg-white/80 px-4 py-3 text-left text-sm text-foreground transition hover:bg-white disabled:opacity-60"
                    disabled={isComposerBusy || !access.allowed}
                    key={prompt}
                    onClick={() => submitText(prompt)}
                    type="button"
                  >
                    <span className="line-clamp-2">{prompt}</span>
                    <WandSparkles size={16} strokeWidth={2.1} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <form
        className="mt-4 rounded-[1.75rem] border border-border bg-white/85 p-3 sm:p-4"
        onSubmit={(event) => {
          event.preventDefault();

          if (selectedImage) {
            void analyzeMealPhoto();
            return;
          }

          submitText();
        }}
      >
        {selectedImage ? (
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-white/90 p-3">
            {selectedImageUrl ? (
              <Image
                alt="Выбранное фото еды"
                className="h-16 w-16 rounded-2xl object-cover"
                height={64}
                src={selectedImageUrl}
                unoptimized
                width={64}
              />
            ) : null}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{selectedImage.name}</p>
              <p className="mt-1 text-xs text-muted">
                Сначала AI разберёт фото, потом можно попросить рецепт, замену или план питания.
              </p>
            </div>

            <button
              aria-label="Убрать фото"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/80 text-muted transition hover:bg-white"
              onClick={() => setSelectedImage(null)}
              type="button"
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>
        ) : null}

        <textarea
          className="min-h-28 w-full resize-none rounded-3xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!access.allowed}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleComposerKeyDown}
          placeholder={
            selectedImage
              ? "Например: это мой ужин после тренировки, оцени состав и подскажи, как улучшить."
              : "Напиши вопрос, задачу или попроси собрать программу."
          }
          value={draft}
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {selectedImage
              ? "Фото будет проанализировано и сохранено в историю этого чата."
              : allowWebSearch
                ? "Поиск в интернете включён."
                : "Поиск в интернете выключен."}
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
              disabled={
                isComposerBusy ||
                (!selectedImage && !draft.trim()) ||
                (selectedImage && !mealPhotoAccess.allowed) ||
                !access.allowed
              }
              type="submit"
            >
              <span className="inline-flex items-center gap-2">
                {isComposerBusy ? <LoaderCircle className="animate-spin" size={16} /> : null}
                {selectedImage
                  ? isAnalyzingImage
                    ? "Анализирую фото..."
                    : "Разобрать фото"
                  : isBusy
                    ? "Отправляю..."
                    : "Отправить"}
              </span>
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
