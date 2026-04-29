import type { Route } from "next";
import Link from "next/link";

import { AdminUsersDirectory } from "@/components/admin-users-directory";
import type { AdminUsersDirectoryInitialState } from "@/components/admin-users-directory-model";
import { AppShell, toAppShellViewer } from "@/components/app-shell";
import { canUseRootAdminControls } from "@/lib/admin-permissions";
import {
  createFallbackAdminUsersResponse,
  loadAdminUsersData,
} from "@/lib/admin-users-data";
import { logger } from "@/lib/logger";
import { withTimeout, withTransientRetry } from "@/lib/runtime-retry";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requirePlatformAdminViewer } from "@/lib/viewer";

const ADMIN_USERS_PAGE_TIMEOUT_MS =
  process.env.PLAYWRIGHT_TEST_HOOKS === "1" ? 2_000 : 4_000;

export default async function AdminUsersPage() {
  const viewer = await requirePlatformAdminViewer();
  const showAdminRoles = canUseRootAdminControls(
    viewer.platformAdminRole,
    viewer.user.email ?? null,
  );
  let initialState: AdminUsersDirectoryInitialState;

  try {
    const payload = await withTimeout(
      withTransientRetry(() =>
        loadAdminUsersData({
          activityFilter: "all",
          adminSupabase: createAdminSupabaseClient(),
          query: "",
          roleFilter: "all",
          sortKey: "created_desc",
        }),
      ),
      ADMIN_USERS_PAGE_TIMEOUT_MS,
      "admin users page snapshot",
    );

    initialState = {
      users: payload.data,
      summary: payload.summary,
      segments: payload.segments,
      recentBulkWaves: payload.recentBulkWaves,
      isDegraded: false,
      error: null,
    };
  } catch (error) {
    logger.warn("admin users page degraded to fallback", { error });

    const fallback = createFallbackAdminUsersResponse({
      activityFilter: "all",
      roleFilter: "all",
      sortKey: "created_desc",
    });

    initialState = {
      users: fallback.data,
      summary: fallback.summary,
      segments: fallback.segments,
      recentBulkWaves: fallback.recentBulkWaves,
      isDegraded: true,
      error: null,
    };
  }

  return (
    <AppShell
      eyebrow="Админ"
      hideAssistantWidget
      title="Пользователи"
      viewer={toAppShellViewer(viewer)}
    >
      <section className="surface-panel overflow-hidden p-4">
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="pill">Пользователи</span>
              {showAdminRoles ? (
                <>
                  <span className="pill">Режим: super-admin</span>
                  <span className="pill">Роли и привилегии видны только вам</span>
                </>
              ) : null}
            </div>

            <div className="space-y-2.5">
              <h2 className="max-w-4xl text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Каталог пользователей, доступа и важных случаев.
              </h2>
              <p className="max-w-3xl text-sm leading-5 text-muted">
                Поиск, активность, подписка, очередь задач и переход в карточку
                остаются доступны в одном мобильном рабочем экране.
              </p>
            </div>

            <div className="grid gap-2.5 sm:flex sm:flex-wrap">
              <Link
                className="action-button action-button--primary w-full sm:w-auto"
                href={"/admin" as Route}
              >
                Вернуться в центр управления
              </Link>
              <Link
                className="action-button action-button--secondary w-full sm:w-auto"
                href={`/admin/users/${viewer.user.id}` as Route}
              >
                Открыть мою карточку
              </Link>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {[
              [
                "Поиск и фильтры",
                "Email, ID, активность, подписка и очередь задач.",
              ],
              [
                "Массовые действия",
                "Выгрузка, пересборка данных, ограничение доступа, пробный период и специальные доступы.",
              ],
              [
                "Контроль риска",
                "Платящие без активности, удаление, выгрузки и пользователи без входов.",
              ],
              [
                "Карточка пользователя",
                "Тренировки, питание, ИИ, оплата и история действий в одном месте.",
              ],
            ].map(([label, detail]) => (
              <article className="metric-tile p-3 text-sm" key={label}>
                <p className="font-semibold text-foreground">{label}</p>
                <p className="mt-1.5 leading-5 text-muted">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <AdminUsersDirectory
        currentAdminRole={viewer.platformAdminRole ?? "support_admin"}
        currentUserEmail={viewer.user.email ?? null}
        initialState={initialState}
      />
    </AppShell>
  );
}
