import { AdminBootstrapForm } from "@/components/admin-bootstrap-form";
import { AdminDashboardWorkspace } from "@/components/admin-dashboard-workspace";
import { AppShell, toAppShellViewer } from "@/components/app-shell";
import { PanelCard } from "@/components/panel-card";
import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  canUseRootAdminControls,
  hasAdminCapability,
  isPrimarySuperAdminEmail,
} from "@/lib/admin-permissions";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireViewer } from "@/lib/viewer";

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Нет данных";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const adminRoleOrder: Record<string, number> = {
  super_admin: 0,
  support_admin: 1,
  analyst: 2,
};

type AdminPageProps = {
  searchParams?: Promise<{
    __test_admin_dashboard_fallback?: string | string[];
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const viewer = await requireViewer();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const forceFallback =
    (Array.isArray(resolvedSearchParams.__test_admin_dashboard_fallback)
      ? resolvedSearchParams.__test_admin_dashboard_fallback[0]
      : resolvedSearchParams.__test_admin_dashboard_fallback) === "1";

  if (!viewer.isPlatformAdmin) {
    return (
    <AppShell
      eyebrow="Админ"
      hideAssistantWidget
      title="Доступ к панели управления"
      viewer={toAppShellViewer(viewer)}
    >
        <PanelCard
          caption="Доступ"
          title="Операторская панель доступна только администраторам платформы"
        >
          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <article className="surface-panel surface-panel--soft p-5 text-sm">
              <p className="font-semibold text-foreground">
                Главный доступ закреплён за одним email и не открывается обычному аккаунту.
              </p>
              <p className="mt-3 leading-7 text-muted">
                Админ-панель видна только назначенным ролям. Главный доступ
                отдельно закреплён за{" "}
                <span className="font-semibold text-foreground">
                  {PRIMARY_SUPER_ADMIN_EMAIL}
                </span>
                . Если вход уже выполнен под этим email, но панель не видна,
                обнови сессию или авторизуйся заново.
              </p>
            </article>

            <article className="surface-panel p-5 text-sm">
              <p className="font-semibold text-foreground">Текущий аккаунт</p>
              <p className="mt-3 text-muted">
                {viewer.user.email ?? "Email не найден"}
              </p>
              <p className="mt-2 text-muted">
                Последний вход:{" "}
                <span className="text-foreground">
                  {formatDateTime(viewer.user.last_sign_in_at)}
                </span>
              </p>
              <div className="mt-4">
                <AdminBootstrapForm userEmail={viewer.user.email ?? "неизвестно"} />
              </div>
            </article>
          </div>
        </PanelCard>
      </AppShell>
    );
  }

  const adminSupabase = createAdminSupabaseClient();
  let isDegraded = false;
  let users: Array<{
    created_at: string;
    full_name: string | null;
    user_id: string;
  }> = [];
  let admins: Array<{
    created_at: string;
    role: string;
    user_id: string;
  }> = [];
  let supportActions: Array<{
    action: string;
    created_at: string;
    id: string;
    status: string;
    target_user_id: string | null;
  }> = [];
  let aiEvalRuns: Array<{
    completed_at: string | null;
    created_at: string;
    id: string;
    label: string;
    model_id: string;
    started_at: string | null;
    status: string;
  }> = [];
  let aiSafetyEvents: Array<{
    action: string;
    created_at: string;
    id: string;
    prompt_excerpt: string | null;
    route_key: string;
  }> = [];
  let adminAuditLogs: Array<{
    action: string;
    actor_user_id: string | null;
    created_at: string;
    id: string;
    reason: string | null;
    target_user_id: string | null;
  }> = [];
  let usersCount = 0;
  let activeProgramsCount = 0;
  let aiChatMessagesCount = 0;
  let aiPlanProposalsCount = 0;
  let aiSafetyEventsCount = 0;
  let knowledgeChunksCount = 0;
  let knowledgeEmbeddingsCount = 0;
  let reindexActionsCount = 0;
  let authUsersById = new Map<
    string,
    {
      email: string | null;
      last_sign_in_at: string | null;
    }
  >();

  try {
    if (forceFallback) {
      throw new Error("admin dashboard fallback requested by test");
    }

    const [
      usersResult,
      adminsResult,
      supportActionsResult,
      aiEvalRunsResult,
      aiSafetyEventsResult,
      usersCountResult,
      activeProgramsCountResult,
      aiChatMessagesCountResult,
      aiPlanProposalsCountResult,
      aiSafetyEventsCountResult,
      knowledgeChunksCountResult,
      knowledgeEmbeddingsCountResult,
      reindexActionsCountResult,
      authUsersResult,
      adminAuditLogsResult,
    ] = await Promise.all([
      adminSupabase
        .from("profiles")
        .select("user_id, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      adminSupabase
        .from("platform_admins")
        .select("user_id, role, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      adminSupabase
        .from("support_actions")
        .select("id, action, status, created_at, target_user_id")
        .order("created_at", { ascending: false })
        .limit(8),
      adminSupabase
        .from("ai_eval_runs")
        .select("id, label, model_id, status, created_at, started_at, completed_at")
        .order("created_at", { ascending: false })
        .limit(8),
      adminSupabase
        .from("ai_safety_events")
        .select("id, route_key, action, prompt_excerpt, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      adminSupabase.from("profiles").select("*", { count: "exact", head: true }),
      adminSupabase
        .from("weekly_programs")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      adminSupabase
        .from("ai_chat_messages")
        .select("*", { count: "exact", head: true }),
      adminSupabase
        .from("ai_plan_proposals")
        .select("*", { count: "exact", head: true }),
      adminSupabase
        .from("ai_safety_events")
        .select("*", { count: "exact", head: true }),
      adminSupabase
        .from("knowledge_chunks")
        .select("*", { count: "exact", head: true }),
      adminSupabase
        .from("knowledge_embeddings")
        .select("*", { count: "exact", head: true }),
      adminSupabase
        .from("support_actions")
        .select("*", { count: "exact", head: true })
        .eq("action", "reindex_knowledge"),
      adminSupabase.auth.admin.listUsers({
        page: 1,
        perPage: 100,
      }),
      adminSupabase
        .from("admin_audit_logs")
        .select("id, action, reason, created_at, actor_user_id, target_user_id")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (authUsersResult.error) {
      throw authUsersResult.error;
    }

    const failedResult = [
      usersResult,
      adminsResult,
      supportActionsResult,
      aiEvalRunsResult,
      aiSafetyEventsResult,
      usersCountResult,
      activeProgramsCountResult,
      aiChatMessagesCountResult,
      aiPlanProposalsCountResult,
      aiSafetyEventsCountResult,
      knowledgeChunksCountResult,
      knowledgeEmbeddingsCountResult,
      reindexActionsCountResult,
      adminAuditLogsResult,
    ].find((result) => result.error);

    if (failedResult?.error) {
      throw failedResult.error;
    }

    users = usersResult.data ?? [];
    admins = adminsResult.data ?? [];
    supportActions = supportActionsResult.data ?? [];
    aiEvalRuns = aiEvalRunsResult.data ?? [];
    aiSafetyEvents = aiSafetyEventsResult.data ?? [];
    adminAuditLogs = adminAuditLogsResult.data ?? [];
    usersCount = usersCountResult.count ?? 0;
    activeProgramsCount = activeProgramsCountResult.count ?? 0;
    aiChatMessagesCount = aiChatMessagesCountResult.count ?? 0;
    aiPlanProposalsCount = aiPlanProposalsCountResult.count ?? 0;
    aiSafetyEventsCount = aiSafetyEventsCountResult.count ?? 0;
    knowledgeChunksCount = knowledgeChunksCountResult.count ?? 0;
    knowledgeEmbeddingsCount = knowledgeEmbeddingsCountResult.count ?? 0;
    reindexActionsCount = reindexActionsCountResult.count ?? 0;
    authUsersById = new Map(
      (authUsersResult.data.users ?? []).map((user) => [
        user.id,
        {
          email: user.email ?? null,
          last_sign_in_at: user.last_sign_in_at ?? null,
        },
      ]),
    );
  } catch (error) {
    isDegraded = true;
    logger.warn("admin page degraded to fallback", { error });
  }

  const adminRoster = admins
    .map((admin) => {
      const authUser = authUsersById.get(admin.user_id);

      return {
        ...admin,
        email: authUser?.email ?? null,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
      };
    })
    .sort((left, right) => {
      const roleDiff =
        (adminRoleOrder[left.role] ?? Number.MAX_SAFE_INTEGER) -
        (adminRoleOrder[right.role] ?? Number.MAX_SAFE_INTEGER);

      if (roleDiff !== 0) {
        return roleDiff;
      }

      return (
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      );
    });

  const canQueueSupportActions = hasAdminCapability(
    viewer.platformAdminRole,
    "queue_support_actions",
  );
  const canRunKnowledgeReindex = hasAdminCapability(
    viewer.platformAdminRole,
    "run_knowledge_reindex",
  );
  const canQueueAiEvalRuns = hasAdminCapability(
    viewer.platformAdminRole,
    "queue_ai_eval_runs",
  );
  const canUseSuperAdminConsole = canUseRootAdminControls(
    viewer.platformAdminRole,
    viewer.user.email ?? null,
  );
  const superAdminPolicyViolations = adminRoster.filter(
    (admin) => admin.role === "super_admin" && !isPrimarySuperAdminEmail(admin.email),
  ).length;
  const rootAdminRecord =
    adminRoster.find((admin) => admin.role === "super_admin") ?? null;
  const heroMetrics = [
    {
      label: "Всего пользователей",
      value: String(usersCount),
      detail: "активная база профилей на платформе",
    },
    {
      label: "Активные недели",
      value: String(activeProgramsCount),
      detail: "программы, которые сейчас используются",
    },
    {
      label: "Нагрузка AI",
      value: String(aiChatMessagesCount),
      detail: "сообщения и рабочая активность AI-контура",
    },
    {
      label: "Контроль root-доступа",
      value: String(superAdminPolicyViolations),
      detail: superAdminPolicyViolations
        ? "в системе есть лишний главный доступ"
        : "главный доступ закреплён корректно",
    },
  ];

  return (
    <AppShell
      eyebrow="Админ"
      hideAssistantWidget
      title="Операторский центр fit"
      viewer={toAppShellViewer(viewer)}
    >
      <AdminDashboardWorkspace
        adminAuditLogs={adminAuditLogs}
        adminRoster={adminRoster}
        aiEvalRuns={aiEvalRuns}
        aiPlanProposalsCount={aiPlanProposalsCount}
        aiSafetyEvents={aiSafetyEvents}
        aiSafetyEventsCount={aiSafetyEventsCount}
        canQueueAiEvalRuns={canQueueAiEvalRuns}
        canQueueSupportActions={canQueueSupportActions}
        canRunKnowledgeReindex={canRunKnowledgeReindex}
        canUseSuperAdminConsole={canUseSuperAdminConsole}
        heroMetrics={heroMetrics}
        isDegraded={isDegraded}
        knowledgeChunksCount={knowledgeChunksCount}
        knowledgeEmbeddingsCount={knowledgeEmbeddingsCount}
        reindexActionsCount={reindexActionsCount}
        rootAdminRecord={rootAdminRecord}
        supportActions={supportActions}
        superAdminPolicyViolations={superAdminPolicyViolations}
        users={users}
        viewer={{
          platformAdminRole: viewer.platformAdminRole,
          user: {
            email: viewer.user.email ?? null,
            id: viewer.user.id,
          },
        }}
      />
    </AppShell>
  );
}
