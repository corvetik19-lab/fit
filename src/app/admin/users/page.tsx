import type { Route } from "next";
import Link from "next/link";

import { AdminUsersDirectory } from "@/components/admin-users-directory";
import { AppShell } from "@/components/app-shell";
import { PRIMARY_SUPER_ADMIN_EMAIL } from "@/lib/admin-permissions";
import { requirePlatformAdminViewer } from "@/lib/viewer";

function formatRole(value: string | null | undefined) {
  switch (value) {
    case "super_admin":
      return "Супер-админ";
    case "support_admin":
      return "Поддержка";
    case "analyst":
      return "Аналитик";
    default:
      return "Администратор";
  }
}

export default async function AdminUsersPage() {
  const viewer = await requirePlatformAdminViewer();

  return (
    <AppShell eyebrow="Админ" title="Пользователи и управление доступом">
      <section className="card overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="pill">Пользователи</span>
              <span className="pill">Роль: {formatRole(viewer.platformAdminRole)}</span>
              <span className="pill">Главный доступ: {PRIMARY_SUPER_ADMIN_EMAIL}</span>
            </div>

            <div className="space-y-3">
              <h2 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Просторный каталог для разбора пользователей, доступов и проблемных случаев.
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
                Здесь удобно искать пользователя по email или ID, проверять активность,
                подписку, очередь задач, доступы и сразу переходить в полную карточку без
                ручного просмотра таблиц.
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
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70"
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
                "Email, ID, роли, активность, подписка и служебные очереди.",
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
                "Тренировки, питание, ИИ, оплата, аудит и служебная история в одном месте.",
              ],
            ].map(([label, detail]) => (
              <article
                className="rounded-3xl border border-border bg-white/70 p-5 text-sm"
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
      />
    </AppShell>
  );
}
