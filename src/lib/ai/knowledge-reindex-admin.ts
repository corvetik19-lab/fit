import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type KnowledgeReindexMode = "embeddings" | "full";

type KnowledgeReindexSuccessDetails = {
  embeddingsIndexed: number;
  indexedChunks: number;
  mode: KnowledgeReindexMode;
  searchMode: "text" | "vector";
};

type KnowledgeReindexFailureDetails = {
  message: string;
  mode: KnowledgeReindexMode;
};

type KnowledgeReindexDetails =
  | KnowledgeReindexFailureDetails
  | KnowledgeReindexSuccessDetails;

type KnowledgeReindexSupportActionRow = {
  action: string;
  created_at: string;
  id: string;
  payload: Record<string, unknown> | null;
  status: string;
};

type KnowledgeReindexSupabase = ReturnType<typeof createAdminSupabaseClient>;

export function parseKnowledgeReindexMode(
  value: string | null | undefined,
): KnowledgeReindexMode {
  return value === "full" ? "full" : "embeddings";
}

export function formatKnowledgeReindexMessage(
  details: KnowledgeReindexSuccessDetails,
) {
  return details.mode === "embeddings"
    ? `Эмбеддинги обновлены. Чанков в базе знаний: ${details.indexedChunks}, векторов пересобрано: ${details.embeddingsIndexed}.`
    : `База знаний переиндексирована. Индексировано чанков: ${details.indexedChunks}.`;
}

export async function recordKnowledgeReindexSupportAction(params: {
  actorUserId: string | null;
  details: KnowledgeReindexDetails;
  source: "admin" | "cron";
  status: "completed" | "failed";
  supabase: KnowledgeReindexSupabase;
  targetUserId: string;
  withRecord: true;
}): Promise<KnowledgeReindexSupportActionRow>;
export async function recordKnowledgeReindexSupportAction(params: {
  actorUserId: string | null;
  details: KnowledgeReindexDetails;
  source: "admin" | "cron";
  status: "completed" | "failed";
  supabase: KnowledgeReindexSupabase;
  targetUserId: string;
  withRecord?: false;
}): Promise<null>;
export async function recordKnowledgeReindexSupportAction(params: {
  actorUserId: string | null;
  details: KnowledgeReindexDetails;
  source: "admin" | "cron";
  status: "completed" | "failed";
  supabase: KnowledgeReindexSupabase;
  targetUserId: string;
  withRecord?: boolean;
}) {
  const { actorUserId, details, source, status, supabase, targetUserId, withRecord } =
    params;

  const insert = supabase.from("support_actions").insert({
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    action: "reindex_knowledge",
    status,
    payload: {
      ...details,
      jobType: "scheduled_knowledge_reindex",
      source,
    },
  });

  if (!withRecord) {
    const { error } = await insert;

    if (error) {
      throw error;
    }

    return null;
  }

  const { data, error } = await insert
    .select("id, action, status, created_at, payload")
    .single();

  if (error) {
    throw error;
  }

  return data as KnowledgeReindexSupportActionRow;
}

export async function recordKnowledgeReindexAuditLog(params: {
  actorUserId: string;
  details: KnowledgeReindexSuccessDetails;
  reason?: string | null;
  supabase: KnowledgeReindexSupabase;
  supportActionId: string;
  targetUserId: string;
}) {
  const { actorUserId, details, reason, supabase, supportActionId, targetUserId } =
    params;

  const { error } = await supabase.from("admin_audit_logs").insert({
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    action: "reindex_knowledge",
    reason:
      reason ??
      (details.mode === "embeddings"
        ? "Ручное обновление векторного индекса базы знаний"
        : "Ручная переиндексация базы знаний"),
    payload: {
      embeddingsIndexed: details.embeddingsIndexed,
      indexedChunks: details.indexedChunks,
      mode: details.mode,
      searchMode: details.searchMode,
      supportActionId,
    },
  });

  if (error) {
    throw error;
  }
}
