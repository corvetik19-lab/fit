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

const suspendSchema = z.object({
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
      code: "ADMIN_SUSPEND_TARGET_INVALID",
      message: "Target user id is invalid.",
    });
    const payload = suspendSchema.parse(await request.json().catch(() => ({})));
    const adminSupabase = createAdminSupabaseClient();

    await assertUserIsNotPrimarySuperAdmin(adminSupabase, id);

    const data = await queueAdminSupportAction({
      action: "suspend_user",
      actorUserId: user.id,
      auditReason: payload.reason ?? "manual suspend request",
      payload: {
        source: "admin-api",
      },
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
        code: "ADMIN_SUSPEND_INVALID",
        message: "Параметры блокировки заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("admin suspend route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_SUSPEND_FAILED",
      message: "Не удалось поставить блокировку в очередь.",
    });
  }
}
