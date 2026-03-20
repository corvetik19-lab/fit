import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  canApplyOperationAction,
  getNextOperationStatus,
} from "@/lib/admin-operations";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const paramsSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(["support_action", "export_job", "deletion_request"]),
});

const operationUpdateSchema = z.object({
  action: z.enum([
    "mark_processing",
    "mark_completed",
    "mark_failed",
    "mark_holding",
    "mark_canceled",
  ]),
  hold_until: z.string().datetime().optional(),
  note: z.string().trim().max(300).optional(),
  reason: z.string().trim().max(300).optional(),
});

function getDefaultHoldUntil() {
  const holdUntil = new Date();
  holdUntil.setDate(holdUntil.getDate() + 14);
  return holdUntil.toISOString();
}

function getAuditAction(kind: "support_action" | "export_job" | "deletion_request") {
  switch (kind) {
    case "support_action":
      return "support_action_status_updated";
    case "export_job":
      return "export_job_status_updated";
    case "deletion_request":
      return "deletion_request_status_updated";
    default:
      return "admin_operation_status_updated";
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; kind: string }> },
) {
  try {
    const { user } = await requireAdminRouteAccess("queue_support_actions");
    const { id, kind } = paramsSchema.parse(await params);
    const payload = operationUpdateSchema.parse(await request.json());
    const adminSupabase = createAdminSupabaseClient();

    if (kind === "support_action") {
      const { data: current, error: currentError } = await adminSupabase
        .from("support_actions")
        .select("id, status, action, target_user_id, payload")
        .eq("id", id)
        .maybeSingle();

      if (currentError) {
        throw currentError;
      }

      if (!current) {
        return createApiErrorResponse({
          status: 404,
          code: "ADMIN_OPERATION_NOT_FOUND",
          message: "Элемент support action не найден.",
        });
      }

      if (!canApplyOperationAction(kind, current.status, payload.action)) {
        return createApiErrorResponse({
          status: 409,
          code: "ADMIN_OPERATION_INVALID_TRANSITION",
          message: "Этот статус support action нельзя обновить выбранным действием.",
        });
      }

      const nextStatus = getNextOperationStatus(kind, payload.action);

      if (!nextStatus) {
        return createApiErrorResponse({
          status: 400,
          code: "ADMIN_OPERATION_INVALID_ACTION",
          message: "Неверное действие для support action.",
        });
      }

      const { data: updated, error: updateError } = await adminSupabase
        .from("support_actions")
        .update({
          payload: {
            ...(current.payload ?? {}),
            resolvedAt: new Date().toISOString(),
            resolvedBy: user.id,
            resolutionAction: payload.action,
            resolutionNote: payload.note ?? null,
          },
          status: nextStatus,
        })
        .eq("id", id)
        .select("id, status, updated_at, target_user_id")
        .single();

      if (updateError) {
        throw updateError;
      }

      const { error: auditError } = await adminSupabase
        .from("admin_audit_logs")
        .insert({
          action: getAuditAction(kind),
          actor_user_id: user.id,
          payload: {
            action: current.action,
            fromStatus: current.status,
            kind,
            note: payload.note ?? null,
            toStatus: nextStatus,
          },
          reason: payload.reason ?? payload.note ?? "manual operations inbox update",
          target_user_id: current.target_user_id,
        });

      if (auditError) {
        throw auditError;
      }

      return Response.json({
        data: {
          ...updated,
          kind,
        },
      });
    }

    if (kind === "export_job") {
      const { data: current, error: currentError } = await adminSupabase
        .from("export_jobs")
        .select("id, status, user_id, format")
        .eq("id", id)
        .maybeSingle();

      if (currentError) {
        throw currentError;
      }

      if (!current) {
        return createApiErrorResponse({
          status: 404,
          code: "ADMIN_OPERATION_NOT_FOUND",
          message: "Элемент export job не найден.",
        });
      }

      if (!canApplyOperationAction(kind, current.status, payload.action)) {
        return createApiErrorResponse({
          status: 409,
          code: "ADMIN_OPERATION_INVALID_TRANSITION",
          message: "Этот статус export job нельзя обновить выбранным действием.",
        });
      }

      const nextStatus = getNextOperationStatus(kind, payload.action);

      if (!nextStatus) {
        return createApiErrorResponse({
          status: 400,
          code: "ADMIN_OPERATION_INVALID_ACTION",
          message: "Неверное действие для export job.",
        });
      }

      const { data: updated, error: updateError } = await adminSupabase
        .from("export_jobs")
        .update({
          status: nextStatus,
        })
        .eq("id", id)
        .select("id, status, updated_at, user_id")
        .single();

      if (updateError) {
        throw updateError;
      }

      const { error: auditError } = await adminSupabase
        .from("admin_audit_logs")
        .insert({
          action: getAuditAction(kind),
          actor_user_id: user.id,
          payload: {
            format: current.format,
            fromStatus: current.status,
            kind,
            note: payload.note ?? null,
            toStatus: nextStatus,
          },
          reason: payload.reason ?? payload.note ?? "manual operations inbox update",
          target_user_id: current.user_id,
        });

      if (auditError) {
        throw auditError;
      }

      return Response.json({
        data: {
          ...updated,
          kind,
        },
      });
    }

    const { data: current, error: currentError } = await adminSupabase
      .from("deletion_requests")
      .select("id, status, user_id, hold_until")
      .eq("id", id)
      .maybeSingle();

    if (currentError) {
      throw currentError;
    }

    if (!current) {
      return createApiErrorResponse({
        status: 404,
        code: "ADMIN_OPERATION_NOT_FOUND",
        message: "Элемент deletion request не найден.",
      });
    }

    if (!canApplyOperationAction(kind, current.status, payload.action)) {
      return createApiErrorResponse({
        status: 409,
        code: "ADMIN_OPERATION_INVALID_TRANSITION",
        message: "Этот статус deletion request нельзя обновить выбранным действием.",
      });
    }

    const nextStatus = getNextOperationStatus(kind, payload.action);

    if (!nextStatus) {
      return createApiErrorResponse({
        status: 400,
        code: "ADMIN_OPERATION_INVALID_ACTION",
        message: "Неверное действие для deletion request.",
      });
    }

    const holdUntil =
      payload.action === "mark_holding"
        ? payload.hold_until ?? current.hold_until ?? getDefaultHoldUntil()
        : current.hold_until;

    const { data: updated, error: updateError } = await adminSupabase
      .from("deletion_requests")
      .update({
        hold_until: holdUntil,
        requested_by: user.id,
        status: nextStatus,
      })
      .eq("id", id)
      .select("id, status, updated_at, user_id, hold_until")
      .single();

    if (updateError) {
      throw updateError;
    }

    const { error: auditError } = await adminSupabase
      .from("admin_audit_logs")
      .insert({
        action: getAuditAction(kind),
        actor_user_id: user.id,
        payload: {
          fromStatus: current.status,
          holdUntil,
          kind,
          note: payload.note ?? null,
          toStatus: nextStatus,
        },
        reason: payload.reason ?? payload.note ?? "manual operations inbox update",
        target_user_id: current.user_id,
      });

    if (auditError) {
      throw auditError;
    }

    return Response.json({
      data: {
        ...updated,
        kind,
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
        code: "ADMIN_OPERATION_INVALID",
        details: error.flatten(),
        message: "Параметры элемента operations inbox заполнены некорректно.",
      });
    }

    logger.error("admin operation update route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_OPERATION_UPDATE_FAILED",
      message: "Не удалось обновить элемент operations inbox.",
    });
  }
}
