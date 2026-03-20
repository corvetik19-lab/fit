import { z } from "zod";

import { queueAdminSupportAction } from "@/lib/admin-support-actions";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import {
  isAdminRouteParamError,
  parseAdminUserIdParam,
} from "@/lib/admin-route-params";
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
    const { id: rawId } = await params;
    const id = parseAdminUserIdParam(rawId, {
      code: "ADMIN_RESTORE_TARGET_INVALID",
      message: "Идентификатор целевого пользователя заполнен некорректно.",
    });
    const payload = restoreSchema.parse(await request.json().catch(() => ({})));
    const adminSupabase = createAdminSupabaseClient();

    const data = await queueAdminSupportAction({
      action: "restore_user",
      actorUserId: user.id,
      auditReason: payload.reason ?? "ручной запрос на восстановление",
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

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "ADMIN_RESTORE_INVALID",
        message: "Параметры восстановления заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("admin restore route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_RESTORE_FAILED",
      message: "Не удалось поставить восстановление в очередь.",
    });
  }
}
