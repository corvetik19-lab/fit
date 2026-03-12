import type { ModelMessage, UIMessage } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AiChatSessionRow = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type AiChatMessageRow = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function buildSessionTitle(input: string) {
  const trimmed = input.trim();

  if (trimmed.length <= 72) {
    return trimmed;
  }

  return `${trimmed.slice(0, 69)}...`;
}

export async function ensureAiChatSession(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string | null | undefined,
  firstPrompt: string,
) {
  if (sessionId) {
    const { data } = await supabase
      .from("ai_chat_sessions")
      .select("id, title, created_at, updated_at")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      return data as AiChatSessionRow;
    }
  }

  const { data, error } = await supabase
    .from("ai_chat_sessions")
    .insert({
      ...(sessionId ? { id: sessionId } : {}),
      user_id: userId,
      title: buildSessionTitle(firstPrompt),
    })
    .select("id, title, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data as AiChatSessionRow;
}

export async function touchAiChatSession(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  title?: string | null,
) {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (title) {
    payload.title = title;
  }

  const { error } = await supabase
    .from("ai_chat_sessions")
    .update(payload)
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function createAiChatMessage(
  supabase: SupabaseClient,
  input: {
    userId: string;
    sessionId: string;
    role: "user" | "assistant";
    content: string;
  },
) {
  const { data, error } = await supabase
    .from("ai_chat_messages")
    .insert({
      user_id: input.userId,
      session_id: input.sessionId,
      role: input.role,
      content: input.content,
    })
    .select("id, session_id, role, content, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data as AiChatMessageRow;
}

export async function listAiChatMessages(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("ai_chat_messages")
    .select("id, session_id, role, content, created_at")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data as AiChatMessageRow[] | null) ?? [];
}

export async function getLatestAiChatState(
  supabase: SupabaseClient,
  userId: string,
) {
  return getAiChatState(supabase, userId, null);
}

export async function listAiChatSessions(
  supabase: SupabaseClient,
  userId: string,
  limit = 8,
) {
  const { data: sessionData, error: sessionError } = await supabase
    .from("ai_chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (sessionError) {
    throw sessionError;
  }

  return (sessionData as AiChatSessionRow[] | null) ?? [];
}

export async function getAiChatState(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string | null,
  options?: {
    fallbackToLatest?: boolean;
  },
) {
  const fallbackToLatest = options?.fallbackToLatest ?? true;
  let session: AiChatSessionRow | null = null;

  if (sessionId) {
    const { data: requestedSession, error: requestedSessionError } = await supabase
      .from("ai_chat_sessions")
      .select("id, title, created_at, updated_at")
      .eq("user_id", userId)
      .eq("id", sessionId)
      .maybeSingle();

    if (requestedSessionError) {
      throw requestedSessionError;
    }

    session = (requestedSession as AiChatSessionRow | null) ?? null;
  }

  if (!session && fallbackToLatest) {
    const { data: latestSession, error: latestSessionError } = await supabase
      .from("ai_chat_sessions")
      .select("id, title, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestSessionError) {
      throw latestSessionError;
    }

    session = (latestSession as AiChatSessionRow | null) ?? null;
  }

  if (!session) {
    return {
      session: null,
      messages: [] as AiChatMessageRow[],
    };
  }

  const messages = await listAiChatMessages(supabase, userId, session.id, 24);

  return {
    session,
    messages,
  };
}

export function toModelMessages(messages: AiChatMessageRow[]): ModelMessage[] {
  return messages
    .filter(
      (message): message is AiChatMessageRow & { role: "user" | "assistant" } =>
        message.role === "user" || message.role === "assistant",
    )
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

export function toUiMessages(messages: AiChatMessageRow[]): UIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: [
      {
        type: "text",
        text: message.content,
      },
    ],
  }));
}

export async function deleteAiChatSession(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
) {
  const { error: messageDeleteError } = await supabase
    .from("ai_chat_messages")
    .delete()
    .eq("user_id", userId)
    .eq("session_id", sessionId);

  if (messageDeleteError) {
    throw messageDeleteError;
  }

  const { error: sessionDeleteError } = await supabase
    .from("ai_chat_sessions")
    .delete()
    .eq("user_id", userId)
    .eq("id", sessionId);

  if (sessionDeleteError) {
    throw sessionDeleteError;
  }
}

export async function deleteAllAiChatSessions(
  supabase: SupabaseClient,
  userId: string,
) {
  const { error: messageDeleteError } = await supabase
    .from("ai_chat_messages")
    .delete()
    .eq("user_id", userId);

  if (messageDeleteError) {
    throw messageDeleteError;
  }

  const { error: sessionDeleteError } = await supabase
    .from("ai_chat_sessions")
    .delete()
    .eq("user_id", userId);

  if (sessionDeleteError) {
    throw sessionDeleteError;
  }
}
