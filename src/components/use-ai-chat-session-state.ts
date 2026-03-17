"use client";

import { useRef, useState, type RefObject } from "react";

import type { AiSurfaceNotice } from "@/components/ai-chat-panel-model";
import type { AiChatSessionRow } from "@/lib/ai/chat";

type CreateSessionResponse = {
  data?: {
    session?: AiChatSessionRow;
  };
  message?: string;
};

export function useAiChatSessionState({
  composerRef,
  initialSessionId,
  initialSessionTitle,
  onSessionTouched,
}: {
  composerRef: RefObject<HTMLTextAreaElement | null>;
  initialSessionId: string | null;
  initialSessionTitle: string | null;
  onSessionTouched?: (session: AiChatSessionRow) => void;
}) {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [sessionTitle, setSessionTitle] = useState(initialSessionTitle);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<AiSurfaceNotice | null>(null);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const sessionIdRef = useRef<string | null>(initialSessionId);

  function updateSessionUrl(nextSessionId: string | null) {
    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);

    if (nextSessionId) {
      url.searchParams.set("session", nextSessionId);
    } else {
      url.searchParams.delete("session");
    }

    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function rememberSession(session: AiChatSessionRow) {
    sessionIdRef.current = session.id;
    setSessionId(session.id);
    setSessionTitle(session.title);
    updateSessionUrl(session.id);
    onSessionTouched?.(session);
    return session.id;
  }

  function rememberLocalSession(nextSessionId: string, titleSeed: string) {
    const trimmedSeed = titleSeed.trim();
    const timestamp = new Date().toISOString();
    const nextTitle = trimmedSeed.slice(0, 72) || "Новый чат";

    return rememberSession({
      id: nextSessionId,
      title: nextTitle,
      created_at: timestamp,
      updated_at: timestamp,
    });
  }

  async function createRemoteSession(titleSeed: string) {
    const response = await fetch("/api/ai/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        titleSeed,
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | CreateSessionResponse
      | null;

    if (!response.ok || !payload?.data?.session) {
      throw new Error(payload?.message ?? "Не удалось создать новый AI-чат.");
    }

    return rememberSession(payload.data.session);
  }

  function insertPromptTemplate(prompt: string) {
    setDraft((current) => (current.trim() ? `${current.trimEnd()}\n\n${prompt}` : prompt));
    setIsPromptLibraryOpen(false);
    window.requestAnimationFrame(() => composerRef.current?.focus());
  }

  function resetLocalSessionState() {
    sessionIdRef.current = null;
    setSessionId(null);
    setSessionTitle(null);
    setDraft("");
    setNotice(null);
    updateSessionUrl(null);
  }

  return {
    createRemoteSession,
    draft,
    insertPromptTemplate,
    isPromptLibraryOpen,
    notice,
    rememberLocalSession,
    rememberSession,
    resetLocalSessionState,
    sessionId,
    sessionIdRef,
    sessionTitle,
    setDraft,
    setIsPromptLibraryOpen,
    setNotice,
  };
}
