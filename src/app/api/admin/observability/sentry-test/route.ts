import * as Sentry from "@sentry/nextjs";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import { canUseRootAdminControls } from "@/lib/admin-permissions";
import { hasSentryRuntimeEnv, serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    const { user, role } = await requireAdminRouteAccess("view_admin_dashboard");

    if (!canUseRootAdminControls(role, user.email ?? null)) {
      return createApiErrorResponse({
        status: 403,
        code: "PRIMARY_SUPER_ADMIN_REQUIRED",
        message:
          "Тестовое событие в Sentry может отправлять только корневой администратор.",
      });
    }

    if (!hasSentryRuntimeEnv()) {
      return createApiErrorResponse({
        status: 409,
        code: "SENTRY_RUNTIME_NOT_CONFIGURED",
        message: "Sentry runtime ещё не настроен: нужен NEXT_PUBLIC_SENTRY_DSN.",
      });
    }

    const createdAt = new Date().toISOString();
    const eventId = Sentry.withScope((scope) => {
      scope.setLevel("warning");
      scope.setTag("observability.smoke_test", "true");
      scope.setTag("admin.role", role);
      scope.setTag("sentry.org", serverEnv.SENTRY_ORG ?? "unset");
      scope.setTag("sentry.project", serverEnv.SENTRY_PROJECT ?? "unset");
      scope.setUser({
        email: user.email ?? undefined,
        id: user.id,
      });
      scope.setExtras({
        adminEmail: user.email ?? null,
        adminUserId: user.id,
        createdAt,
        sentryEnvironment: serverEnv.SENTRY_ENVIRONMENT ?? "unset",
      });

      return Sentry.captureException(new Error("Admin Sentry smoke test"));
    });

    await Sentry.flush(2_000);

    logger.info("admin sentry smoke test sent", {
      adminUserId: user.id,
      eventId,
    });

    return Response.json({
      data: {
        createdAt,
        eventId: eventId ?? null,
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

    logger.error("admin sentry smoke test failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_SENTRY_SMOKE_TEST_FAILED",
      message: "Не удалось отправить тестовое событие в Sentry.",
    });
  }
}
