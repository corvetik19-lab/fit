"use client";

import type { UIMessage } from "ai";
import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";

import {
  createAiSurfaceNotice,
  type AiSurfaceNotice,
} from "@/components/ai-chat-panel-model";

export type PendingRetryPayload = {
  text: string;
  allowWebSearch: boolean;
};

function isMissingChatSessionError(message: string | null | undefined) {
  return Boolean(message?.includes("AI_CHAT_SESSION_NOT_FOUND"));
}

export function useAiChatSessionRecovery({
  clearError,
  createRemoteSession,
  errorMessage,
  resetLocalSessionState,
  sendMessage,
  setMessages,
  setNotice,
  setSelectedImage,
}: {
  clearError: () => void;
  createRemoteSession: (titleSeed: string) => Promise<string>;
  errorMessage: string | null | undefined;
  resetLocalSessionState: () => void;
  sendMessage: (
    message: { text: string },
    options: { body: { allowWebSearch: boolean; sessionId?: string } },
  ) => void;
  setMessages: Dispatch<SetStateAction<UIMessage[]>>;
  setNotice: Dispatch<SetStateAction<AiSurfaceNotice | null>>;
  setSelectedImage: Dispatch<SetStateAction<File | null>>;
}) {
  const pendingRetryRef = useRef<PendingRetryPayload | null>(null);
  const missingSessionRetriedRef = useRef(false);

  useEffect(() => {
    if (!isMissingChatSessionError(errorMessage)) {
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
    errorMessage,
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

  function queueRetry(payload: PendingRetryPayload) {
    pendingRetryRef.current = payload;
    missingSessionRetriedRef.current = false;
  }

  return {
    queueRetry,
    resetChat,
  };
}
