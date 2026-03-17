"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  AiSurfaceNotice,
  ChatMessage,
} from "@/components/ai-chat-panel-model";

type TranscriptMessage = {
  id: string;
  role: string;
};

export function useAiChatViewState({
  initialMessages,
  isBusy,
  messages,
  notice,
}: {
  initialMessages: ChatMessage[];
  isBusy: boolean;
  messages: TranscriptMessage[];
  notice: AiSurfaceNotice | null;
}) {
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [messageTimes, setMessageTimes] = useState(
    () => new Map(initialMessages.map((message) => [message.id, message.created_at])),
  );

  const selectedImageUrl = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : null),
    [selectedImage],
  );

  const lastAssistantMessageId = useMemo(() => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
    return lastAssistantMessage?.id ?? null;
  }, [messages]);

  useEffect(
    () => () => {
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl);
      }
    },
    [selectedImageUrl],
  );

  useEffect(() => {
    const viewport = scrollViewportRef.current;

    if (!viewport) {
      return;
    }

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isBusy, notice?.kind, notice?.message]);

  return {
    lastAssistantMessageId,
    messageTimes,
    scrollViewportRef,
    selectedImage,
    selectedImageUrl,
    setMessageTimes,
    setSelectedImage,
  };
}
