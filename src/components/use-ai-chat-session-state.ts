"use client";

import { useState, type RefObject } from "react";

import type { AiSurfaceNotice } from "@/components/ai-chat-panel-model";
import type { AiChatSessionRow } from "@/lib/ai/chat";

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

  function rememberLocalSession(nextSessionId: string, titleSeed: string) {
    const trimmedSeed = titleSeed.trim();
    const timestamp = new Date().toISOString();
    const nextTitle = sessionTitle?.trim() || trimmedSeed.slice(0, 72) || null;

    setSessionId(nextSessionId);
    setSessionTitle((current) => current ?? nextTitle);
    updateSessionUrl(nextSessionId);
    onSessionTouched?.({
      id: nextSessionId,
      title: nextTitle,
      created_at: timestamp,
      updated_at: timestamp,
    });
  }

  function insertPromptTemplate(prompt: string) {
    setDraft((current) => (current.trim() ? `${current.trimEnd()}\n\n${prompt}` : prompt));
    setIsPromptLibraryOpen(false);
    window.requestAnimationFrame(() => composerRef.current?.focus());
  }

  function resetLocalSessionState() {
    setSessionId(null);
    setSessionTitle(null);
    setDraft("");
    setNotice(null);
    updateSessionUrl(null);
  }

  return {
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
  };
}
