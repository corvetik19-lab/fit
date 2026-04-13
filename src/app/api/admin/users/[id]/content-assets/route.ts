import { z } from "zod";

import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import { isAdminRouteParamError, parseAdminUserIdParam } from "@/lib/admin-route-params";
import { updateAdminUserContentAsset } from "@/lib/admin-user-content-assets";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { optionalImageUrlSchema } from "@/lib/image-url";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const contentAssetBodySchema = z.object({
  entityType: z.enum(["exercise", "food"]),
  entityId: z.string().uuid(),
  imageUrl: optionalImageUrlSchema,
  reason: z.string().trim().max(300).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAdminRouteAccess("manage_user_content_assets");
    const { id: rawId } = await params;
    const targetUserId = parseAdminUserIdParam(rawId, {
      code: "ADMIN_CONTENT_ASSET_TARGET_INVALID",
      message: "Идентификатор целевого пользователя заполнен некорректно.",
    });
    const body = contentAssetBodySchema.parse(await request.json());
    const adminSupabase = createAdminSupabaseClient();

    const data = await updateAdminUserContentAsset({
      actorUserId: user.id,
      entityId: body.entityId,
      entityType: body.entityType,
      imageUrl: body.imageUrl ?? null,
      reason:
        body.reason ??
        (body.entityType === "exercise"
          ? "ручное обновление изображения упражнения"
          : "ручное обновление изображения продукта"),
      supabase: adminSupabase,
      targetUserId,
    });

    if (!data) {
      return createApiErrorResponse({
        status: 404,
        code: "ADMIN_CONTENT_ASSET_NOT_FOUND",
        message: "Контентная карточка не найдена.",
      });
    }

    return Response.json({ data });
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
        code: "ADMIN_CONTENT_ASSET_INVALID",
        message: "Параметры обновления изображения заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("admin content asset route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_CONTENT_ASSET_FAILED",
      message: "Не удалось обновить изображение контентной карточки.",
    });
  }
}
