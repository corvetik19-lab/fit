import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import {
  isAdminRouteParamError,
  parseAdminUserIdParam,
} from "@/lib/admin-route-params";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const exportJobSchema = z.object({
  format: z.enum(["json_csv_zip"]).optional(),
  reason: z.string().trim().max(300).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAdminRouteAccess("queue_support_actions");
    const { id: rawId } = await params;
    const id = parseAdminUserIdParam(rawId, {
      code: "ADMIN_EXPORT_TARGET_INVALID",
      message: "Target user id is invalid.",
    });
    const payload = exportJobSchema.parse(await request.json().catch(() => ({})));
    const adminSupabase = createAdminSupabaseClient();

    const { data, error } = await adminSupabase
      .from("export_jobs")
      .insert({
        user_id: id,
        requested_by: user.id,
        format: payload.format ?? "json_csv_zip",
        status: "queued",
      })
      .select("id, format, status, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    const { error: auditError } = await adminSupabase
      .from("admin_audit_logs")
      .insert({
        actor_user_id: user.id,
        target_user_id: id,
        action: "queue_export_job",
        reason: payload.reason ?? "manual export request",
        payload: {
          exportJobId: data.id,
          format: data.format,
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

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "ADMIN_EXPORT_INVALID",
        message: "Export payload is invalid.",
        details: error.flatten(),
      });
    }

    logger.error("admin export route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_EXPORT_FAILED",
      message: "Unable to queue export job.",
    });
  }
}
