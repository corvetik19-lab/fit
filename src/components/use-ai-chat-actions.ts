"use client";

import type { UIMessage } from "ai";
import { useState, type Dispatch, type SetStateAction } from "react";

import {
  buildMealPhotoMarkdown,
  classifyAiSurfaceErrorMessage,
  createAiSurfaceNotice,
  toUiTextMessage,
  type AssistantProposalTarget,
  type AiSurfaceNotice,
  type ChatMessage,
  type MealPhotoResponse,
} from "@/components/ai-chat-panel-model";
import type { FeatureAccessSnapshot } from "@/lib/billing-access";

type ProposalActionResponse = {
  message?: string;
};

type MealPhotoApiResponse = MealPhotoResponse & {
  code?: string;
};

function resolveErrorNotice(
  message: string,
  fallbackMessage: string,
): AiSurfaceNotice {
  return (
    classifyAiSurfaceErrorMessage(message || fallbackMessage) ??
    createAiSurfaceNotice("runtime", fallbackMessage)
  );
}

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
  setNotice: Dispatch<SetStateAction<AiSurfaceNotice | null>>;
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
      const payload = (await response.json().catch(() => null)) as ProposalActionResponse | null;
      const fallbackMessage =
        "Не удалось выполнить действие с предложением. Попробуй ещё раз чуть позже.";

      if (!response.ok) {
        throw new Error(payload?.message ?? fallbackMessage);
      }

      setNotice(
        createAiSurfaceNotice(
          "success",
          action === "approve"
            ? "Предложение подтверждено и готово к применению."
            : target.proposalType === "workout_plan"
              ? "План тренировок уже добавлен в приложение."
              : "План питания уже добавлен в приложение.",
        ),
      );
      onRefresh();
    } catch (proposalActionError) {
      setNotice(
        resolveErrorNotice(
          proposalActionError instanceof Error ? proposalActionError.message : "",
          "Не удалось выполнить действие с предложением. Попробуй ещё раз чуть позже.",
        ),
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
      setNotice(
        createAiSurfaceNotice(
          "info",
          mealPhotoAccess.reason ?? "Анализ фото еды сейчас недоступен.",
        ),
      );
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
      const payload = (await response.json().catch(() => null)) as MealPhotoApiResponse | null;
      const fallbackMessage =
        "Не удалось разобрать фото. Попробуй другой кадр или повтори запрос чуть позже.";

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.message ?? fallbackMessage);
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
        createAiSurfaceNotice(
          "success",
          "Фото разобрано. Теперь можно попросить рецепт, замену или план питания.",
        ),
      );
    } catch (mealPhotoError) {
      setNotice(
        resolveErrorNotice(
          mealPhotoError instanceof Error ? mealPhotoError.message : "",
          "Не удалось проанализировать фото. Повтори попытку немного позже.",
        ),
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
