"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useMemo, useRef } from "react";

import { AiChatComposer } from "@/components/ai-chat-composer";
import { AiChatNotices } from "@/components/ai-chat-notices";
import { AiPromptLibrary } from "@/components/ai-prompt-library";
import { AiChatTranscript } from "@/components/ai-chat-transcript";
import { AiChatToolbar } from "@/components/ai-chat-toolbar";
import { useAiChatActions } from "@/components/use-ai-chat-actions";
import { useAiChatComposer } from "@/components/use-ai-chat-composer";
import { useAiChatSessionRecovery } from "@/components/use-ai-chat-session-recovery";
import { useAiChatSessionState } from "@/components/use-ai-chat-session-state";
import { useAiChatViewState } from "@/components/use-ai-chat-view-state";
import { useAiChatWebSearch } from "@/components/use-ai-chat-web-search";
import {
  classifyAiSurfaceErrorMessage,
  dedupeUiMessages,
  timeFormatter,
  type AiChatPanelProps,
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
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const { allowWebSearch, toggleWebSearch } = useAiChatWebSearch();
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
      error?.message?.includes("AI_CHAT_SESSION_NOT_FOUND")
        ? null
        : classifyAiSurfaceErrorMessage(error?.message ?? null),
    [error?.message],
  );
  const transcriptMessages = useMemo(() => dedupeUiMessages(messages), [messages]);

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
    messages: transcriptMessages,
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
  const { queueRetry, resetChat } = useAiChatSessionRecovery({
    clearError,
    createRemoteSession,
    errorMessage: error?.message,
    resetLocalSessionState,
    sendMessage,
    setMessages,
    setNotice,
    setSelectedImage,
  });

  const { handleComposerKeyDown, handleSubmit } = useAiChatComposer({
    accessAllowed: access.allowed,
    allowWebSearch,
    analyzeMealPhoto,
    createRemoteSession,
    draft,
    isComposerBusy,
    onBeforeSend: (text) => {
      queueRetry({
        text,
        allowWebSearch,
      });
    },
    selectedImage,
    sendMessage,
    sessionIdRef,
    setDraft,
    setNotice,
  });

  return (
    <section
      className="card card--hero flex min-h-[72dvh] flex-col overflow-hidden p-4 sm:p-5 lg:min-h-[78dvh]"
      data-testid="ai-chat-panel"
      data-hydrated="true"
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

      <div className="mt-4 grid gap-3">
        <div className="surface-panel surface-panel--accent px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="workspace-kicker">Рабочий режим</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                Один экран для диалога, фото еды, web search и применения плана.
              </p>
            </div>
            <span className="pill">
              {transcriptMessages.length
                ? `${transcriptMessages.length} сообщений`
                : "новая сессия"}
            </span>
          </div>
        </div>

        <AiChatNotices
          accessAllowed={access.allowed}
          accessReason={access.reason ?? null}
          errorNotice={errorNotice}
          notice={notice}
        />
      </div>

      <AiChatTranscript
        actionBusyKey={actionBusyKey}
        lastAssistantMessageId={lastAssistantMessageId}
        messageTimes={messageTimes}
        messages={transcriptMessages}
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
