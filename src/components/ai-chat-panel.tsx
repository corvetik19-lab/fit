"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { AiChatComposer } from "@/components/ai-chat-composer";
import { AiChatNotices } from "@/components/ai-chat-notices";
import { AiPromptLibrary } from "@/components/ai-prompt-library";
import { AiChatTranscript } from "@/components/ai-chat-transcript";
import { AiChatToolbar } from "@/components/ai-chat-toolbar";
import { useAiChatSessionState } from "@/components/use-ai-chat-session-state";
import {
  buildMealPhotoMarkdown,
  timeFormatter,
  toUiTextMessage,
  type AiChatPanelProps,
  type AssistantProposalTarget,
  type ChatMessage,
  type MealPhotoResponse,
} from "@/components/ai-chat-panel-model";
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

  const [allowWebSearch, setAllowWebSearch] = useState(false);
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [messageTimes, setMessageTimes] = useState(
    () => new Map(initialMessages.map((message) => [message.id, message.created_at])),
  );
  const {
    draft,
    insertPromptTemplate,
    isPromptLibraryOpen,
    notice,
    rememberLocalSession,
    resetLocalSessionState,
    sessionId,
    sessionTitle,
    setDraft,
    setIsPromptLibraryOpen,
    setNotice,
  } = useAiChatSessionState({
    composerRef,
    initialSessionId,
    initialSessionTitle,
    onSessionTouched,
  });

  const initialUiMessages = useMemo(
    () => toUiMessages(initialMessages),
    [initialMessages],
  );
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
        throw new Error(
          payload?.message ?? "Не удалось разобрать фото. Попробуй другой кадр.",
        );
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
      setNotice(
        "Фото разобрано. Теперь можно попросить рецепт, замену или план питания.",
      );
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
    setMessages([]);
    setSelectedImage(null);
    resetLocalSessionState();
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

  function handleSubmit() {
    if (selectedImage) {
      void analyzeMealPhoto();
      return;
    }

    submitText();
  }

  return (
    <section className="card flex min-h-[72dvh] flex-col overflow-hidden p-4 sm:p-5 lg:min-h-[78dvh]">
      <AiChatToolbar
        allowWebSearch={allowWebSearch}
        mealPhotoAccessAllowed={mealPhotoAccess.allowed}
        onOpenMealPhoto={() => fileInputRef.current?.click()}
        onOpenPromptLibrary={() => setIsPromptLibraryOpen(true)}
        onReset={resetChat}
        onToggleWebSearch={() => setAllowWebSearch((current) => !current)}
        selectedImage={Boolean(selectedImage)}
        sessionTitle={sessionTitle}
      />

      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
        ref={fileInputRef}
        type="file"
      />

      <AiChatNotices
        accessAllowed={access.allowed}
        accessReason={access.reason ?? null}
        errorMessage={error?.message ?? null}
        notice={notice}
      />

      <AiChatTranscript
        actionBusyKey={actionBusyKey}
        lastAssistantMessageId={lastAssistantMessageId}
        messageTimes={messageTimes}
        messages={messages}
        nowLabel={nowLabel}
        onApplyProposal={(target) => runProposalAction("apply", target)}
        onApproveProposal={(target) => runProposalAction("approve", target)}
        scrollViewportRef={scrollViewportRef}
        status={status}
      />

      <AiChatComposer
        accessAllowed={access.allowed}
        allowWebSearch={allowWebSearch}
        composerRef={composerRef}
        draft={draft}
        isAnalyzingImage={isAnalyzingImage}
        isBusy={isBusy}
        isComposerBusy={isComposerBusy}
        mealPhotoAccessAllowed={mealPhotoAccess.allowed}
        onClearSelectedImage={() => setSelectedImage(null)}
        onDraftChange={setDraft}
        onKeyDown={handleComposerKeyDown}
        onStop={stop}
        onSubmit={handleSubmit}
        selectedImage={selectedImage}
        selectedImageUrl={selectedImageUrl}
      />

      <AiPromptLibrary
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelect={insertPromptTemplate}
      />
    </section>
  );
}
