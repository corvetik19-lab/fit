import { AdminUserDetail } from "@/components/admin-user-detail";
import { AppShell, toAppShellViewer } from "@/components/app-shell";
import { requirePlatformAdminViewer } from "@/lib/viewer";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requirePlatformAdminViewer();
  const { id } = await params;

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
        userId={id}
      />
    </AppShell>
  );
}
