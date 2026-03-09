import { AdminUserDetail } from "@/components/admin-user-detail";
import { AppShell } from "@/components/app-shell";
import { requirePlatformAdminViewer } from "@/lib/viewer";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdminViewer();
  const { id } = await params;

  return (
    <AppShell eyebrow="Админ" title="Карточка пользователя">
      <AdminUserDetail userId={id} />
    </AppShell>
  );
}
