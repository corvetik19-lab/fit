"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { AiChatComposer } from "@/components/ai-chat-composer";
import { AiChatNotices } from "@/components/ai-chat-notices";
import { AiPromptLibrary } from "@/components/ai-prompt-library";
import { AiChatTranscript } from "@/components/ai-chat-transcript";
import { AiChatToolbar } from "@/components/ai-chat-toolbar";
import { useAiChatActions } from "@/components/use-ai-chat-actions";
import { useAiChatComposer } from "@/components/use-ai-chat-composer";
import { useAiChatSessionState } from "@/components/use-ai-chat-session-state";
import { useAiChatViewState } from "@/components/use-ai-chat-view-state";
import {
  classifyAiSurfaceErrorMessage,
  createAiSurfaceNotice,
  timeFormatter,
  type AiChatPanelProps,
} from "@/components/ai-chat-panel-model";
import { toUiMessages } from "@/lib/ai/chat";

const subscribeToHydration = () => () => {};
const WEB_SEARCH_STORAGE_KEY = "fit.ai.web-search";
const WEB_SEARCH_EVENT = "fit:ai:web-search";

function subscribeToWebSearch(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => callback();
  window.addEventListener("storage", handleChange);
  window.addEventListener(WEB_SEARCH_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(WEB_SEARCH_EVENT, handleChange);
  };
}

function getWebSearchSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(WEB_SEARCH_STORAGE_KEY) === "true";
}

function isMissingChatSessionError(message: string | null | undefined) {
  return Boolean(message?.includes("AI_CHAT_SESSION_NOT_FOUND"));
}

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
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingRetryRef = useRef<{ text: string; allowWebSearch: boolean } | null>(
    null,
  );
  const missingSessionRetriedRef = useRef(false);

  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const allowWebSearch = useSyncExternalStore(
    subscribeToWebSearch,
    getWebSearchSnapshot,
    () => false,
  );
  const {
    createRemoteSession,
    draft,
    insertPromptTemplate,
    isPromptLibraryOpen,
    notice,
    rememberLocalSession,
    resetLocalSessionState,
    sessionIdRef,
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

  const {
    clearError,
    messages,
    sendMessage,
    status,
    error,
    stop,
    setMessages,
  } = useChat({
    messages: initialUiMessages,
    transport: new DefaultChatTransport({
      api: "/api/ai/assistant",
    }),
  });
  const errorNotice = useMemo(
    () =>
      isMissingChatSessionError(error?.message)
        ? null
        : classifyAiSurfaceErrorMessage(error?.message ?? null),
    [error?.message],
  );

  const isBusy = status === "submitted" || status === "streaming";
  const {
    lastAssistantMessageId,
    messageTimes,
    scrollViewportRef,
    selectedImage,
    selectedImageUrl,
    setMessageTimes,
    setSelectedImage,
  } = useAiChatViewState({
    initialMessages,
    isBusy,
    messages,
    notice,
  });
  const { actionBusyKey, analyzeMealPhoto, isAnalyzingImage, runProposalAction } =
    useAiChatActions({
      createRemoteSession,
      draft,
      isChatBusy: isBusy,
      mealPhotoAccess,
      onRefresh: () => router.refresh(),
      rememberLocalSession,
      selectedImage,
      sessionIdRef,
      setDraft,
      setMessageTimes,
      setMessages,
      setNotice,
      setSelectedImage,
    });
  const isComposerBusy = isBusy || isAnalyzingImage;

  useEffect(() => {
    if (!isMissingChatSessionError(error?.message)) {
      return;
    }

    const retryPayload = pendingRetryRef.current;
    setMessages([]);
    setSelectedImage(null);
    resetLocalSessionState();
    clearError();

    if (retryPayload && !missingSessionRetriedRef.current) {
      missingSessionRetriedRef.current = true;
      pendingRetryRef.current = null;
      setNotice(
        createAiSurfaceNotice(
          "info",
          "Предыдущий чат больше недоступен. Создаю новый чат и повторяю запрос.",
        ),
      );

      void (async () => {
        try {
          const nextSessionId = await createRemoteSession(retryPayload.text);

          window.setTimeout(() => {
            sendMessage(
              { text: retryPayload.text },
              {
                body: {
                  allowWebSearch: retryPayload.allowWebSearch,
                  sessionId: nextSessionId,
                },
              },
            );
          }, 0);
        } catch (sessionError) {
          setNotice(
            createAiSurfaceNotice(
              "runtime",
              sessionError instanceof Error
                ? sessionError.message
                : "Не удалось открыть новый AI-чат.",
            ),
          );
        }
      })();
      return;
    }

    pendingRetryRef.current = null;
    setNotice(
      createAiSurfaceNotice(
        "info",
        "Предыдущий чат больше недоступен. Открыт новый пустой чат.",
      ),
    );
  }, [
    clearError,
    createRemoteSession,
    error?.message,
    resetLocalSessionState,
    sendMessage,
    setMessages,
    setNotice,
    setSelectedImage,
  ]);

  function resetChat() {
    setMessages([]);
    setSelectedImage(null);
    resetLocalSessionState();
    pendingRetryRef.current = null;
    missingSessionRetriedRef.current = false;
    clearError();
  }

  function toggleWebSearch() {
    if (typeof window === "undefined") {
      return;
    }

    const next = !allowWebSearch;
    window.sessionStorage.setItem(
      WEB_SEARCH_STORAGE_KEY,
      next ? "true" : "false",
    );
    window.dispatchEvent(new Event(WEB_SEARCH_EVENT));
  }

  const { handleComposerKeyDown, handleSubmit } = useAiChatComposer({
    accessAllowed: access.allowed,
    allowWebSearch,
    analyzeMealPhoto,
    createRemoteSession,
    draft,
    isComposerBusy,
    onBeforeSend: (text) => {
      pendingRetryRef.current = {
        text,
        allowWebSearch,
      };
      missingSessionRetriedRef.current = false;
    },
    selectedImage,
    sendMessage,
    sessionIdRef,
    setDraft,
    setNotice,
  });

  return (
    <section
      className="card flex min-h-[72dvh] flex-col overflow-hidden p-4 sm:p-5 lg:min-h-[78dvh]"
      data-testid="ai-chat-panel"
      data-hydrated={isHydrated ? "true" : "false"}
    >
      <AiChatToolbar
        allowWebSearch={allowWebSearch}
        mealPhotoAccessAllowed={mealPhotoAccess.allowed}
        onOpenMealPhoto={() => fileInputRef.current?.click()}
        onOpenPromptLibrary={() => setIsPromptLibraryOpen(true)}
        onReset={resetChat}
        onToggleWebSearch={toggleWebSearch}
        selectedImage={Boolean(selectedImage)}
        sessionTitle={sessionTitle}
      />

      <input
        accept="image/*"
        className="hidden"
        data-testid="ai-image-input"
        onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
        ref={fileInputRef}
        type="file"
      />

      <AiChatNotices
        accessAllowed={access.allowed}
        accessReason={access.reason ?? null}
        errorNotice={errorNotice}
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
