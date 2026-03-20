import { createServerSupabaseClient } from "@/lib/supabase/server";

export const AI_CHAT_SESSION_CREATE_AUTH_MESSAGE =
  "Нужно войти в аккаунт, чтобы создать новый AI-чат.";
export const AI_CHAT_SESSION_CLEAR_AUTH_MESSAGE =
  "Нужно войти в аккаунт, чтобы очистить историю чатов с ИИ.";
export const AI_CHAT_SESSION_DELETE_AUTH_MESSAGE =
  "Нужно войти в аккаунт, чтобы удалить выбранный чат с ИИ.";
export const AI_CHAT_SESSION_INVALID_ID_MESSAGE =
  "Некорректный идентификатор чата с ИИ.";
export const AI_CHAT_SESSION_DELETE_FAILED_MESSAGE =
  "Не удалось удалить выбранный чат с ИИ.";
export const AI_CHAT_SESSION_CREATE_FAILED_MESSAGE =
  "Не удалось создать новый AI-чат.";
export const AI_CHAT_SESSION_CLEAR_FAILED_MESSAGE =
  "Не удалось очистить историю чатов с ИИ.";
export const AI_CHAT_SESSION_INVALID_CREATE_MESSAGE =
  "Параметры нового AI-чата заполнены некорректно.";
export const AI_CHAT_NEW_SESSION_TITLE = "Новый чат";

export async function getAiSessionRouteContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return { supabase, user };
}
