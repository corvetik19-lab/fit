"use client";

import { useCallback, type KeyboardEvent, type MutableRefObject } from "react";

import type { AiSurfaceNotice } from "@/components/ai-chat-panel-model";

export function useAiChatComposer({
  accessAllowed,
  allowWebSearch,
  analyzeMealPhoto,
  createRemoteSession,
  draft,
  isComposerBusy,
  onBeforeSend,
  selectedImage,
  sendMessage,
  sessionIdRef,
  setDraft,
  setNotice,
}: {
  accessAllowed: boolean;
  allowWebSearch: boolean;
  analyzeMealPhoto: () => Promise<void>;
  createRemoteSession: (titleSeed: string) => Promise<string>;
  draft: string;
  isComposerBusy: boolean;
  onBeforeSend?: (text: string) => void;
  selectedImage: File | null;
  sendMessage: (
    message: { text: string },
    options: { body: { allowWebSearch: boolean; sessionId?: string } },
  ) => void;
  sessionIdRef: MutableRefObject<string | null>;
  setDraft: (value: string) => void;
  setNotice: (value: AiSurfaceNotice | null) => void;
}) {
  const submitText = useCallback(
    async (nextText?: string) => {
      const trimmed = (nextText ?? draft).trim();

      if (!trimmed || isComposerBusy || !accessAllowed) {
        return;
      }

      try {
        const nextSessionId =
          sessionIdRef.current ?? (await createRemoteSession(trimmed));
        onBeforeSend?.(trimmed);
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
      } catch (sessionError) {
        setNotice({
          kind: "runtime",
          message:
            sessionError instanceof Error
              ? sessionError.message
              : "Не удалось открыть новый AI-чат.",
        });
      }
    },
    [
      accessAllowed,
      allowWebSearch,
      createRemoteSession,
      draft,
      isComposerBusy,
      onBeforeSend,
      sendMessage,
      sessionIdRef,
      setDraft,
      setNotice,
    ],
  );

  const handleComposerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();

        if (selectedImage) {
          void analyzeMealPhoto();
          return;
        }

        void submitText();
      }
    },
    [analyzeMealPhoto, selectedImage, submitText],
  );

  const handleSubmit = useCallback(() => {
    if (selectedImage) {
      void analyzeMealPhoto();
      return;
    }

    void submitText();
  }, [analyzeMealPhoto, selectedImage, submitText]);

  return {
    handleComposerKeyDown,
    handleSubmit,
  };
}
