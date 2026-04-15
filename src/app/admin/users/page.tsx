import type { Route } from "next";
import Link from "next/link";

import { AdminUsersDirectory } from "@/components/admin-users-directory";
import type { AdminUsersDirectoryInitialState } from "@/components/admin-users-directory-model";
import { AppShell, toAppShellViewer } from "@/components/app-shell";
import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  canUseRootAdminControls,
} from "@/lib/admin-permissions";
import {
  createFallbackAdminUsersResponse,
  loadAdminUsersData,
} from "@/lib/admin-users-data";
import { logger } from "@/lib/logger";
import { withTimeout, withTransientRetry } from "@/lib/runtime-retry";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requirePlatformAdminViewer } from "@/lib/viewer";

const ADMIN_USERS_PAGE_TIMEOUT_MS = 4_000;

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
      title="Пользователи и управление доступом"
      viewer={toAppShellViewer(viewer)}
    >
      <section className="card overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="pill">Пользователи</span>
              {showAdminRoles ? (
                <>
                  <span className="pill">Главный доступ: {PRIMARY_SUPER_ADMIN_EMAIL}</span>
                  <span className="pill">Роли и привилегии видны только вам</span>
                </>
              ) : null}
            </div>

            <div className="space-y-3">
              <h2 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Удобный каталог для поиска пользователей, доступа и важных случаев.
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
                Здесь удобно искать пользователя по email или ID, проверять активность,
                подписку, очередь задач и сразу переходить в полную карточку без лишних
                экранов и служебного шума.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                href={"/admin" as Route}
              >
                Вернуться в центр управления
              </Link>
              <Link
                className="action-button action-button--secondary px-5 py-3 text-sm"
                href={`/admin/users/${viewer.user.id}` as Route}
              >
                Открыть мою карточку
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
              <article
                className="surface-panel surface-panel--soft p-5 text-sm"
                key={label}
              >
                <p className="font-semibold text-foreground">{label}</p>
                <p className="mt-2 leading-7 text-muted">{detail}</p>
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
