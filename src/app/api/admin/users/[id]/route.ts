import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import {
  createFallbackAdminUserDetailResponse,
  loadAdminUserDetailData,
} from "@/lib/admin-user-detail-data";
import {
  isAdminRouteParamError,
  parseAdminUserIdParam,
} from "@/lib/admin-route-params";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const forceFallback =
    new URL(request.url).searchParams.get("__test_admin_detail_fallback") ===
    "1";

  try {
    const userId = parseAdminUserIdParam(rawId, {
      code: "ADMIN_USER_DETAIL_INVALID",
      message: "Идентификатор пользователя заполнен некорректно.",
    });
    const currentAdmin = await requireAdminRouteAccess("view_admin_user_details");
    const adminSupabase = createAdminSupabaseClient();
    const authUserResult = await adminSupabase.auth.admin.getUserById(userId);

    if (authUserResult.error) {
      throw authUserResult.error;
    }

    if (!authUserResult.data.user) {
      return createApiErrorResponse({
        status: 404,
        code: "ADMIN_USER_NOT_FOUND",
        message: "Карточка пользователя не найдена.",
      });
    }

    try {
      return Response.json(
        await loadAdminUserDetailData({
          adminSupabase,
          authUser: authUserResult.data.user,
          currentAdminRole: currentAdmin.role,
          forceFallback,
          userId,
        }),
      );
    } catch (error) {
      logger.warn("admin user detail route degraded to fallback", {
        error,
        userId,
      });

      return Response.json(
        createFallbackAdminUserDetailResponse({
          authUser: authUserResult.data.user,
          currentAdminRole: currentAdmin.role,
          userId,
        }),
      );
    }
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

    logger.error("admin user detail route failed", { error, userId: rawId });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_USER_DETAIL_FAILED",
      message: "Не удалось загрузить карточку пользователя.",
    });
  }
}
