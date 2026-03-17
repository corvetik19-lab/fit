import { z } from "zod";

import { reindexUserKnowledgeBase } from "@/lib/ai/knowledge";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const reindexSchema = z.object({
  mode: z.enum(["embeddings", "full"]).optional(),
  targetUserId: z.string().uuid().optional(),
  reason: z.string().trim().max(300).optional(),
});

export async function POST(request: Request) {
  try {
    const { user } = await requireAdminRouteAccess("run_knowledge_reindex");
    const payload = reindexSchema.parse(await request.json().catch(() => ({})));
    const adminSupabase = createAdminSupabaseClient();

    const targetUserId = payload.targetUserId ?? user.id;
    const result = await reindexUserKnowledgeBase(adminSupabase, targetUserId, {
      mode: payload.mode ?? "full",
    });

    const { data: supportAction, error: supportActionError } = await adminSupabase
      .from("support_actions")
      .insert({
        actor_user_id: user.id,
        target_user_id: targetUserId,
        action: "reindex_knowledge",
        status: "completed",
        payload: {
          embeddingsIndexed: result.embeddingsIndexed,
          indexedChunks: result.indexedChunks,
          mode: result.mode,
          searchMode: result.searchMode,
        },
      })
      .select("id, action, status, created_at, payload")
      .single();

    if (supportActionError) {
      throw supportActionError;
    }

    const { error: auditError } = await adminSupabase.from("admin_audit_logs").insert({
      actor_user_id: user.id,
      target_user_id: targetUserId,
      action: "reindex_knowledge",
      reason:
        payload.reason ??
        (result.mode === "embeddings"
          ? "Ручное обновление векторного индекса базы знаний"
          : "Ручная переиндексация базы знаний"),
      payload: {
        embeddingsIndexed: result.embeddingsIndexed,
        indexedChunks: result.indexedChunks,
        mode: result.mode,
        searchMode: result.searchMode,
        supportActionId: supportAction.id,
      },
    });

    if (auditError) {
      throw auditError;
    }

    const message =
      result.mode === "embeddings"
        ? `Эмбеддинги обновлены. Чанков в базе знаний: ${result.indexedChunks}, векторов пересобрано: ${result.embeddingsIndexed}.`
        : `База знаний переиндексирована. Индексировано чанков: ${result.indexedChunks}.`;

    return Response.json({
      data: {
        ...supportAction,
        indexedChunks: result.indexedChunks,
        message,
      },
    });
  } catch (error) {
    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "REINDEX_INVALID",
        message: "Параметры переиндексации заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.warn("reindex route rejected", { error });

    return createApiErrorResponse({
      status: 500,
      code: "REINDEX_FAILED",
      message: "Не удалось переиндексировать базу знаний.",
    });
  }
}
