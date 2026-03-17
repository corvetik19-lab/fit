"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useSyncExternalStore } from "react";

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
  const errorNotice = useMemo(
    () => classifyAiSurfaceErrorMessage(error?.message ?? null),
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
      draft,
      isChatBusy: isBusy,
      mealPhotoAccess,
      onRefresh: () => router.refresh(),
      rememberLocalSession,
      selectedImage,
      sessionId,
      setDraft,
      setMessageTimes,
      setMessages,
      setNotice,
      setSelectedImage,
    });
  const isComposerBusy = isBusy || isAnalyzingImage;

  function resetChat() {
    setMessages([]);
    setSelectedImage(null);
    resetLocalSessionState();
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
    draft,
    isComposerBusy,
    rememberLocalSession,
    selectedImage,
    sendMessage,
    sessionId,
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
