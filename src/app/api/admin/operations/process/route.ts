import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import { processAdminOperationQueues } from "@/lib/admin-queue-processing";
import { logger } from "@/lib/logger";

const processOperationsSchema = z.object({
  deletionLimit: z.number().int().min(1).max(20).optional(),
  exportLimit: z.number().int().min(1).max(20).optional(),
  supportLimit: z.number().int().min(1).max(20).optional(),
});

export async function POST(request: Request) {
  try {
    const { user } = await requireAdminRouteAccess("queue_support_actions");
    const payload = processOperationsSchema.parse(
      await request.json().catch(() => ({})),
    );

    const summary = await processAdminOperationQueues({
      actorUserId: user.id,
      deletionLimit: payload.deletionLimit,
      exportLimit: payload.exportLimit,
      supportLimit: payload.supportLimit,
    });

    return Response.json({
      data: summary,
    });
  } catch (error) {
    logger.error("admin operations process route failed", { error });

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
        code: "ADMIN_OPERATIONS_PROCESS_INVALID",
        details: error.flatten(),
        message: "Параметры обработчика операций заполнены некорректно.",
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_OPERATIONS_PROCESS_FAILED",
      message: "Не удалось обработать очередь админ-операций.",
    });
  }
}
