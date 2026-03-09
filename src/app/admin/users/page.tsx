import { AdminUsersDirectory } from "@/components/admin-users-directory";
import { AppShell } from "@/components/app-shell";
import { PanelCard } from "@/components/panel-card";
import { requirePlatformAdminViewer } from "@/lib/viewer";

export default async function AdminUsersPage() {
  await requirePlatformAdminViewer();

  return (
    <AppShell eyebrow="Админ" title="Каталог пользователей">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PanelCard caption="Пользователи" title="Каталог пользователей">
          <ul className="grid gap-3 text-sm leading-7 text-muted">
            <li>Экран читает реальные профили через `/api/admin/users`.</li>
            <li>Отсюда можно перейти в карточку каждого пользователя.</li>
            <li>
              Следующий шаг для этого контура: добавить поиск, фильтры и сводные
              статусы по подпискам и правам доступа.
            </li>
          </ul>
        </PanelCard>

        <PanelCard caption="Контур" title="Что уже доступно">
          <ul className="grid gap-3 text-sm leading-7 text-muted">
            <li>Список последних профилей.</li>
            <li>Переход в карточку пользователя.</li>
            <li>Блокировка, восстановление и кастомные действия поддержки через карточку пользователя.</li>
          </ul>
        </PanelCard>
      </div>

      <AdminUsersDirectory />
    </AppShell>
  );
}
