import { z } from "zod";

import { queueAdminExportJob } from "@/lib/admin-user-requests";
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
      message: "Идентификатор целевого пользователя заполнен некорректно.",
    });
    const payload = exportJobSchema.parse(await request.json().catch(() => ({})));
    const adminSupabase = createAdminSupabaseClient();

    const data = await queueAdminExportJob({
      actorUserId: user.id,
      auditReason: payload.reason ?? "ручной запрос на выгрузку",
      format: payload.format ?? "json_csv_zip",
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
        code: "ADMIN_EXPORT_INVALID",
        message: "Параметры выгрузки заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("admin export route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_EXPORT_FAILED",
      message: "Не удалось поставить выгрузку в очередь.",
    });
  }
}
