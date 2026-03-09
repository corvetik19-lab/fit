import { z } from "zod";

import { reindexUserKnowledgeBase } from "@/lib/ai/knowledge";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { requireAdminRouteAccess } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const reindexSchema = z.object({
  targetUserId: z.string().uuid().optional(),
  reason: z.string().trim().max(300).optional(),
});

export async function POST(request: Request) {
  try {
    const { user } = await requireAdminRouteAccess();
    const payload = reindexSchema.parse(await request.json().catch(() => ({})));
    const adminSupabase = createAdminSupabaseClient();

    const targetUserId = payload.targetUserId ?? user.id;

    const result = await reindexUserKnowledgeBase(adminSupabase, targetUserId);

    const { data: supportAction, error: supportActionError } = await adminSupabase
      .from("support_actions")
      .insert({
        actor_user_id: user.id,
        target_user_id: targetUserId,
        action: "reindex_knowledge",
        status: "completed",
        payload: {
          indexedChunks: result.indexedChunks,
        },
      })
      .select("id, action, status, created_at, payload")
      .single();

    if (supportActionError) {
      throw supportActionError;
    }

    const { error: auditError } = await adminSupabase
      .from("admin_audit_logs")
      .insert({
        actor_user_id: user.id,
        target_user_id: targetUserId,
        action: "reindex_knowledge",
        reason: payload.reason ?? "ручной reindex базы знаний",
        payload: {
          indexedChunks: result.indexedChunks,
          supportActionId: supportAction.id,
        },
      });

    if (auditError) {
      throw auditError;
    }

    return Response.json({
      data: {
        ...supportAction,
        indexedChunks: result.indexedChunks,
        message: `База знаний переиндексирована. Индексировано чанков: ${result.indexedChunks}.`,
      },
    });
  } catch (error) {
    logger.warn("reindex route rejected", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "REINDEX_INVALID",
        message: "Параметры reindex заполнены некорректно.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "REINDEX_FAILED",
      message: "Не удалось переиндексировать базу знаний.",
    });
  }
}
