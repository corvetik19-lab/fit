import { AdminUserDetail } from "@/components/admin-user-detail";
import { AppShell, toAppShellViewer } from "@/components/app-shell";
import type { AdminUserDetailData } from "@/components/admin-user-detail-model";
import type { User } from "@supabase/supabase-js";
import {
  createFallbackAdminUserDetailResponse,
  loadAdminUserDetailData,
} from "@/lib/admin-user-detail-data";
import {
  isAdminRouteParamError,
  parseAdminUserIdParam,
} from "@/lib/admin-route-params";
import { logger } from "@/lib/logger";
import { withTimeout, withTransientRetry } from "@/lib/runtime-retry";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requirePlatformAdminViewer } from "@/lib/viewer";

const ADMIN_USER_DETAIL_TIMEOUT_MS =
  process.env.PLAYWRIGHT_TEST_HOOKS === "1" ? 8_000 : 10_000;
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

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requirePlatformAdminViewer();
  const { id: rawId } = await params;
  let userId = rawId;
  let initialDetail: AdminUserDetailData | null = null;
  let initialError: string | null = null;
  let initialIsDegraded = false;

  try {
    userId = parseAdminUserIdParam(rawId, {
      code: "ADMIN_USER_DETAIL_INVALID",
      message: "Идентификатор пользователя заполнен некорректно.",
    });

    if (IS_PLAYWRIGHT_RUNTIME && userId.startsWith("00000000-0000-4000-8000-")) {
      const fallbackResponse = createFallbackAdminUserDetailResponse({
        authUser: createPlaywrightAuthUser(userId),
        currentAdminRole: viewer.platformAdminRole ?? "support_admin",
        userId,
      });

      initialDetail = fallbackResponse.data as AdminUserDetailData;
      initialIsDegraded = true;
    } else {

      const adminSupabase = createAdminSupabaseClient();
      const authUserResult = await withTimeout(
        withTransientRetry(() => adminSupabase.auth.admin.getUserById(userId)),
        ADMIN_USER_DETAIL_TIMEOUT_MS,
        "admin user detail auth lookup",
      );

    if (authUserResult.error) {
      throw authUserResult.error;
    }

    if (!authUserResult.data.user) {
      initialError = "Карточка пользователя не найдена.";
    } else {
      try {
        const response = await withTimeout(
          withTransientRetry(() =>
            loadAdminUserDetailData({
              adminSupabase,
              authUser: authUserResult.data.user,
              currentAdminRole: viewer.platformAdminRole ?? "support_admin",
              userId,
            }),
          ),
          ADMIN_USER_DETAIL_TIMEOUT_MS,
          "admin user detail snapshot",
        );

        initialDetail = response.data as AdminUserDetailData;
        initialIsDegraded = false;
      } catch (error) {
        logger.warn("admin user detail page degraded to fallback", {
          error,
          userId,
        });

        const fallbackResponse = createFallbackAdminUserDetailResponse({
          authUser: authUserResult.data.user,
          currentAdminRole: viewer.platformAdminRole ?? "support_admin",
          userId,
        });

        initialDetail = fallbackResponse.data as AdminUserDetailData;
        initialIsDegraded = true;
      }
    }
    }
  } catch (error) {
    if (isAdminRouteParamError(error)) {
      initialError = error.message;
    } else {
      logger.error("admin user detail page failed", { error, userId: rawId });
      initialError = "Не удалось загрузить карточку пользователя.";
    }
  }

  return (
    <AppShell
      viewer={toAppShellViewer(viewer)}
      eyebrow="Админ"
      hideAssistantWidget
      title="Операторская карточка пользователя"
    >
      <AdminUserDetail
        currentUserId={viewer.user.id}
        currentUserEmail={viewer.user.email ?? null}
        currentUserRole={viewer.platformAdminRole ?? "support_admin"}
        initialDetail={initialDetail}
        initialError={initialError}
        initialIsDegraded={initialIsDegraded}
        userId={userId}
      />
    </AppShell>
  );
}
