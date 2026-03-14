"use client";

import type { UIMessage } from "ai";
import { useState, type Dispatch, type SetStateAction } from "react";

import {
  buildMealPhotoMarkdown,
  toUiTextMessage,
  type AssistantProposalTarget,
  type ChatMessage,
  type MealPhotoResponse,
} from "@/components/ai-chat-panel-model";
import type { FeatureAccessSnapshot } from "@/lib/billing-access";

export function useAiChatActions({
  draft,
  isChatBusy,
  mealPhotoAccess,
  onRefresh,
  rememberLocalSession,
  selectedImage,
  sessionId,
  setDraft,
  setMessageTimes,
  setMessages,
  setNotice,
  setSelectedImage,
}: {
  draft: string;
  isChatBusy: boolean;
  mealPhotoAccess: FeatureAccessSnapshot;
  onRefresh: () => void;
  rememberLocalSession: (nextSessionId: string, titleSeed: string) => void;
  selectedImage: File | null;
  sessionId: string | null;
  setDraft: Dispatch<SetStateAction<string>>;
  setMessageTimes: Dispatch<SetStateAction<Map<string, string>>>;
  setMessages: Dispatch<SetStateAction<UIMessage[]>>;
  setNotice: Dispatch<SetStateAction<string | null>>;
  setSelectedImage: Dispatch<SetStateAction<File | null>>;
}) {
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

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
      onRefresh();
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
    if (!selectedImage || isChatBusy || isAnalyzingImage) {
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

  return {
    actionBusyKey,
    analyzeMealPhoto,
    isAnalyzingImage,
    runProposalAction,
  };
}
