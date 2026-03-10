import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import {
  PRIMARY_SUPER_ADMIN_GUARD_MESSAGE,
  assertUserIsNotPrimarySuperAdmin,
} from "@/lib/admin-target-guard";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const supportActionSchema = z.object({
  action: z.string().trim().min(2).max(120),
  reason: z.string().trim().max(300).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAdminRouteAccess("queue_support_actions");
    const { id } = await params;
    const body = supportActionSchema.parse(await request.json());
    const adminSupabase = createAdminSupabaseClient();

    if (["purge_user_data", "suspend_user"].includes(body.action)) {
      await assertUserIsNotPrimarySuperAdmin(adminSupabase, id);
    }

    const { data, error } = await adminSupabase
      .from("support_actions")
      .insert({
        actor_user_id: user.id,
        target_user_id: id,
        action: body.action,
        status: "queued",
        payload: body.payload ?? {},
      })
      .select("id, action, status, created_at, payload")
      .single();

    if (error) {
      throw error;
    }

    const { error: auditError } = await adminSupabase
      .from("admin_audit_logs")
      .insert({
        actor_user_id: user.id,
        target_user_id: id,
        action: body.action,
        reason: body.reason ?? "manual support action",
        payload: body.payload ?? {},
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
    logger.error("admin support action route failed", { error });

    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message === PRIMARY_SUPER_ADMIN_GUARD_MESSAGE
    ) {
      return createApiErrorResponse({
        status: 403,
        code: "PRIMARY_SUPER_ADMIN_PROTECTED",
        message: error.message,
      });
    }

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "ADMIN_SUPPORT_ACTION_INVALID",
        message: "Support action payload is invalid.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_SUPPORT_ACTION_FAILED",
      message: "Unable to queue support action.",
    });
  }
}
