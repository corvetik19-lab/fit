import { z } from "zod";

import { queueAdminSupportAction } from "@/lib/admin-support-actions";
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
    const { id: rawId } = await params;
    const id = parseAdminUserIdParam(rawId, {
      code: "ADMIN_SUPPORT_ACTION_TARGET_INVALID",
      message: "Target user id is invalid.",
    });
    const body = supportActionSchema.parse(await request.json());
    const adminSupabase = createAdminSupabaseClient();

    if (["purge_user_data", "suspend_user"].includes(body.action)) {
      await assertUserIsNotPrimarySuperAdmin(adminSupabase, id);
    }

    const data = await queueAdminSupportAction({
      action: body.action,
      actorUserId: user.id,
      auditPayload: body.payload ?? {},
      auditReason: body.reason ?? "manual support action",
      payload: body.payload ?? {},
      supabase: adminSupabase,
      targetUserId: id,
    });

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
        code: "ADMIN_SUPPORT_ACTION_INVALID",
        message: "Параметры support action заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("admin support action route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_SUPPORT_ACTION_FAILED",
      message: "Не удалось поставить support action в очередь.",
    });
  }
}
