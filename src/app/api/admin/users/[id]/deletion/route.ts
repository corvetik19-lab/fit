import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import {
  isAdminRouteParamError,
  parseAdminUserIdParam,
} from "@/lib/admin-route-params";
import {
  PRIMARY_SUPER_ADMIN_GUARD_MESSAGE,
  assertUserIsNotPrimarySuperAdmin,
} from "@/lib/admin-target-guard";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const deletionRequestSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

const DEFAULT_HOLD_DAYS = 14;

function getDefaultHoldUntil() {
  const holdUntil = new Date();
  holdUntil.setDate(holdUntil.getDate() + DEFAULT_HOLD_DAYS);
  return holdUntil.toISOString();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAdminRouteAccess("queue_support_actions");
    const { id: rawId } = await params;
    const id = parseAdminUserIdParam(rawId, {
      code: "ADMIN_DELETION_TARGET_INVALID",
      message: "Target user id is invalid.",
    });
    const payload = deletionRequestSchema.parse(
      await request.json().catch(() => ({})),
    );
    const adminSupabase = createAdminSupabaseClient();
    const holdUntil = getDefaultHoldUntil();

    await assertUserIsNotPrimarySuperAdmin(adminSupabase, id);

    const { data, error } = await adminSupabase
      .from("deletion_requests")
      .upsert(
        {
          user_id: id,
          requested_by: user.id,
          status: "holding",
          hold_until: holdUntil,
        },
        {
          onConflict: "user_id",
        },
      )
      .select("id, status, hold_until, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    const { error: auditError } = await adminSupabase
      .from("admin_audit_logs")
      .insert({
        actor_user_id: user.id,
        target_user_id: id,
        action: "queue_deletion_request",
        reason: payload.reason ?? "manual deletion hold request",
        payload: {
          deletionRequestId: data.id,
          holdUntil: data.hold_until,
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
    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    if (isAdminRouteParamError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
        details: error.details,
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
        code: "ADMIN_DELETION_INVALID",
        message: "Параметры удаления заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("admin deletion queue route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_DELETION_FAILED",
      message: "Не удалось поставить запрос на удаление в очередь.",
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAdminRouteAccess("queue_support_actions");
    const { id: rawId } = await params;
    const id = parseAdminUserIdParam(rawId, {
      code: "ADMIN_DELETION_TARGET_INVALID",
      message: "Target user id is invalid.",
    });
    const payload = deletionRequestSchema.parse(
      await request.json().catch(() => ({})),
    );
    const adminSupabase = createAdminSupabaseClient();

    await assertUserIsNotPrimarySuperAdmin(adminSupabase, id);

    const { data, error } = await adminSupabase
      .from("deletion_requests")
      .update({
        requested_by: user.id,
        status: "canceled",
      })
      .eq("user_id", id)
      .select("id, status, hold_until, created_at, updated_at")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return createApiErrorResponse({
        status: 404,
        code: "ADMIN_DELETION_NOT_FOUND",
        message: "Deletion request was not found.",
      });
    }

    const { error: auditError } = await adminSupabase
      .from("admin_audit_logs")
      .insert({
        actor_user_id: user.id,
        target_user_id: id,
        action: "cancel_deletion_request",
        reason: payload.reason ?? "manual deletion cancel request",
        payload: {
          deletionRequestId: data.id,
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
    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    if (isAdminRouteParamError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
        details: error.details,
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
        code: "ADMIN_DELETION_INVALID",
        message: "Параметры удаления заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("admin deletion cancel route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_DELETION_CANCEL_FAILED",
      message: "Не удалось отменить запрос на удаление.",
    });
  }
}
