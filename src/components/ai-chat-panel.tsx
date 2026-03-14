"use client";

import { DefaultChatTransport } from "ai";
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
import {
  ProposalActionToolCard,
  ProposalListToolCard,
  ProposalToolCard,
  SearchToolCard,
} from "@/components/ai-chat-panel-cards";
import {
  buildMealPhotoMarkdown,
  timeFormatter,
  toUiTextMessage,
  type AiChatPanelProps,
  type AssistantProposalTarget,
  type AssistantToolPart,
  type ChatMessage,
  type MealPhotoResponse,
} from "@/components/ai-chat-panel-model";
import { AiPromptLibrary } from "@/components/ai-prompt-library";
import { toUiMessages } from "@/lib/ai/chat";

export function AiChatPanel({
  access,
  initialSessionId,
  initialSessionTitle,
  initialMessages,
  mealPhotoAccess,
  onSessionTouched,
}: AiChatPanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const [sessionId, setSessionId] = useState(initialSessionId);
  const [sessionTitle, setSessionTitle] = useState(initialSessionTitle);
  const [draft, setDraft] = useState("");
  const [allowWebSearch, setAllowWebSearch] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
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
    const trimmedSeed = titleSeed.trim();
    const timestamp = new Date().toISOString();
    const nextTitle = sessionTitle?.trim() || trimmedSeed.slice(0, 72) || null;

    setSessionId(nextSessionId);
    setSessionTitle((current) => current ?? nextTitle);
    updateSessionUrl(nextSessionId);
    onSessionTouched?.({
      id: nextSessionId,
      title: nextTitle,
      created_at: timestamp,
      updated_at: timestamp,
    });
  }

  function insertPromptTemplate(prompt: string) {
    setDraft((current) => (current.trim() ? `${current.trimEnd()}\n\n${prompt}` : prompt));
    setIsPromptLibraryOpen(false);
    window.requestAnimationFrame(() => composerRef.current?.focus());
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
            aria-label="Открыть шаблоны"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/80 text-foreground transition hover:bg-white"
            onClick={() => setIsPromptLibraryOpen(true)}
            type="button"
          >
            <WandSparkles size={16} strokeWidth={2.1} />
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
            <div className="rounded-3xl border border-dashed border-border bg-white/70 px-4 py-6" />
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
          ref={composerRef}
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

      <AiPromptLibrary
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelect={insertPromptTemplate}
      />
    </section>
  );
}
