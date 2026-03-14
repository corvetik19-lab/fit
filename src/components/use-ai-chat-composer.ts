"use client";

import { useCallback, type KeyboardEvent } from "react";

export function useAiChatComposer({
  accessAllowed,
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
}: {
  accessAllowed: boolean;
  allowWebSearch: boolean;
  analyzeMealPhoto: () => Promise<void>;
  draft: string;
  isComposerBusy: boolean;
  rememberLocalSession: (nextSessionId: string, titleSeed: string) => void;
  selectedImage: File | null;
  sendMessage: (
    message: { text: string },
    options: { body: { allowWebSearch: boolean; sessionId: string } },
  ) => void;
  sessionId: string | null;
  setDraft: (value: string) => void;
  setNotice: (value: string | null) => void;
}) {
  const submitText = useCallback(
    (nextText?: string) => {
      const trimmed = (nextText ?? draft).trim();

      if (!trimmed || isComposerBusy || !accessAllowed) {
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
    },
    [
      accessAllowed,
      allowWebSearch,
      draft,
      isComposerBusy,
      rememberLocalSession,
      sendMessage,
      sessionId,
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

        submitText();
      }
    },
    [analyzeMealPhoto, selectedImage, submitText],
  );

  const handleSubmit = useCallback(() => {
    if (selectedImage) {
      void analyzeMealPhoto();
      return;
    }

    submitText();
  }, [analyzeMealPhoto, selectedImage, submitText]);

  return {
    handleComposerKeyDown,
    handleSubmit,
  };
}
