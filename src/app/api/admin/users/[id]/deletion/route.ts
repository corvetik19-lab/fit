import { z } from "zod";

import {
  cancelAdminDeletionRequest,
  holdAdminDeletionRequest,
} from "@/lib/admin-user-requests";
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAdminRouteAccess("queue_support_actions");
    const { id: rawId } = await params;
    const id = parseAdminUserIdParam(rawId, {
      code: "ADMIN_DELETION_TARGET_INVALID",
      message: "Идентификатор целевого пользователя заполнен некорректно.",
    });
    const payload = deletionRequestSchema.parse(
      await request.json().catch(() => ({})),
    );
    const adminSupabase = createAdminSupabaseClient();

    await assertUserIsNotPrimarySuperAdmin(adminSupabase, id);

    const data = await holdAdminDeletionRequest({
      actorUserId: user.id,
      auditReason: payload.reason ?? "ручная постановка удаления на удержание",
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
      message: "Идентификатор целевого пользователя заполнен некорректно.",
    });
    const payload = deletionRequestSchema.parse(
      await request.json().catch(() => ({})),
    );
    const adminSupabase = createAdminSupabaseClient();

    await assertUserIsNotPrimarySuperAdmin(adminSupabase, id);

    const data = await cancelAdminDeletionRequest({
      actorUserId: user.id,
      auditReason: payload.reason ?? "ручная отмена запроса на удаление",
      supabase: adminSupabase,
      targetUserId: id,
    });

    if (!data) {
      return createApiErrorResponse({
        status: 404,
        code: "ADMIN_DELETION_NOT_FOUND",
        message: "Запрос на удаление не найден.",
      });
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
