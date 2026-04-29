import type { User } from "@supabase/supabase-js";

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
import { withTransientRetry } from "@/lib/runtime-retry";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const IS_PLAYWRIGHT_RUNTIME = process.env.PLAYWRIGHT_TEST_HOOKS === "1";

function createPlaywrightAuthUser(userId: string): User {
  const isAdminUser = userId === "00000000-0000-4000-8000-000000000002";
  const email = isAdminUser
    ? process.env.PLAYWRIGHT_ADMIN_EMAIL
    : process.env.PLAYWRIGHT_TEST_EMAIL;
  const fullName = isAdminUser
    ? process.env.PLAYWRIGHT_ADMIN_FULL_NAME
    : process.env.PLAYWRIGHT_TEST_FULL_NAME;

  return {
    id: userId,
    aud: "authenticated",
    role: "authenticated",
    email: email ?? "playwright@example.test",
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
    user_metadata: {
      full_name: fullName ?? "Playwright User",
    },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  } as User;
}

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

    if (IS_PLAYWRIGHT_RUNTIME && userId.startsWith("00000000-0000-4000-8000-")) {
      return Response.json(
        createFallbackAdminUserDetailResponse({
          authUser: createPlaywrightAuthUser(userId),
          currentAdminRole: currentAdmin.role,
          userId,
        }),
      );
    }

    const adminSupabase = createAdminSupabaseClient();
    const authUserResult = await withTransientRetry(() =>
      adminSupabase.auth.admin.getUserById(userId),
    );

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
        await withTransientRetry(() =>
          loadAdminUserDetailData({
            adminSupabase,
            authUser: authUserResult.data.user,
            currentAdminRole: currentAdmin.role,
            forceFallback,
            userId,
          }),
        ),
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
