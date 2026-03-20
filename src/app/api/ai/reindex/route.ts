import { z } from "zod";

import { reindexUserKnowledgeBase } from "@/lib/ai/knowledge";
import {
  formatKnowledgeReindexMessage,
  recordKnowledgeReindexAuditLog,
  recordKnowledgeReindexSupportAction,
} from "@/lib/ai/knowledge-reindex-admin";
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

    const supportAction = await recordKnowledgeReindexSupportAction({
      actorUserId: user.id,
      details: {
        embeddingsIndexed: result.embeddingsIndexed,
        indexedChunks: result.indexedChunks,
        mode: result.mode,
        searchMode: result.searchMode,
      },
      source: "admin",
      status: "completed",
      supabase: adminSupabase,
      targetUserId,
      withRecord: true,
    });

    await recordKnowledgeReindexAuditLog({
      actorUserId: user.id,
      details: {
        embeddingsIndexed: result.embeddingsIndexed,
        indexedChunks: result.indexedChunks,
        mode: result.mode,
        searchMode: result.searchMode,
      },
      reason: payload.reason,
      supabase: adminSupabase,
      supportActionId: supportAction.id,
      targetUserId,
    });

    return Response.json({
      data: {
        ...supportAction,
        indexedChunks: result.indexedChunks,
        message: formatKnowledgeReindexMessage({
          embeddingsIndexed: result.embeddingsIndexed,
          indexedChunks: result.indexedChunks,
          mode: result.mode,
          searchMode: result.searchMode,
        }),
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
