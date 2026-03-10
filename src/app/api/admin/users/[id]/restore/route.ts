import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const restoreSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAdminRouteAccess("queue_support_actions");
    const { id } = await params;
    const payload = restoreSchema.parse(await request.json().catch(() => ({})));
    const adminSupabase = createAdminSupabaseClient();

    const { data, error } = await adminSupabase
      .from("support_actions")
      .insert({
        actor_user_id: user.id,
        target_user_id: id,
        action: "restore_user",
        status: "queued",
        payload: {
          source: "admin-api",
        },
      })
      .select("id, action, status, created_at")
      .single();

    if (error) {
      throw error;
    }

    const { error: auditError } = await adminSupabase
      .from("admin_audit_logs")
      .insert({
        actor_user_id: user.id,
        target_user_id: id,
        action: "restore_user",
        reason: payload.reason ?? "manual restore request",
        payload: {
          supportActionId: data.id,
        },
      });

    if (auditError) {
      throw auditError;
    }

    return Response.json({
      data: {
        ...data,
        targetUserId: id,
      },
    });
  } catch (error) {
    logger.error("admin restore route failed", { error });

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
        code: "ADMIN_RESTORE_INVALID",
        message: "Restore payload is invalid.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_RESTORE_FAILED",
      message: "Unable to queue restore action.",
    });
  }
}
