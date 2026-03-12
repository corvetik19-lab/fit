import type { Route } from "next";
import Link from "next/link";

import { AdminAiOperations } from "@/components/admin-ai-operations";
import { AdminAiEvalRuns } from "@/components/admin-ai-eval-runs";
import { AdminBootstrapForm } from "@/components/admin-bootstrap-form";
import { AdminHealthDashboard } from "@/components/admin-health-dashboard";
import { AdminOperationsInbox } from "@/components/admin-operations-inbox";
import { AppShell } from "@/components/app-shell";
import { PanelCard } from "@/components/panel-card";
import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  canUseRootAdminControls,
  hasAdminCapability,
  isPrimarySuperAdminEmail,
} from "@/lib/admin-permissions";
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

function formatAdminRole(value: string) {
  switch (value) {
    case "super_admin":
      return "Супер-админ";
    case "support_admin":
      return "Поддержка";
    case "analyst":
      return "Аналитик";
    default:
      return value;
  }
}

function formatSupportAction(value: string) {
  switch (value) {
    case "billing_access_review":
      return "Проверка billing-доступа";
    case "purge_user_data":
      return "Полная очистка данных";
    case "reindex_knowledge":
      return "Переиндексация базы знаний";
    case "resync_user_context":
      return "Пересинхронизация контекста";
    case "restore_user":
      return "Восстановление пользователя";
    case "suspend_user":
      return "Блокировка пользователя";
    default:
      return value;
  }
}

function formatStatus(value: string) {
  switch (value) {
    case "queued":
      return "в очереди";
    case "running":
      return "в работе";
    case "processing":
      return "в обработке";
    case "completed":
      return "завершено";
    case "failed":
      return "ошибка";
    case "holding":
      return "на удержании";
    case "canceled":
      return "отменено";
    case "active":
      return "активно";
    case "trial":
      return "пробный период";
    case "past_due":
      return "нужна оплата";
    default:
      return value;
  }
}

function formatRouteKey(value: string) {
  switch (value) {
    case "ai_chat":
      return "AI-чат";
    case "meal_plan":
      return "План питания";
    case "workout_plan":
      return "План тренировок";
    case "meal_photo":
      return "Фото-анализ еды";
    default:
      return value;
  }
}

function formatAuditAction(value: string) {
  switch (value) {
    case "admin_role_granted":
      return "Выдача admin-доступа";
    case "admin_role_updated":
      return "Изменение admin-роли";
    case "admin_role_confirmed":
      return "Подтверждение admin-роли";
    case "admin_role_revoked":
      return "Отзыв admin-доступа";
    case "primary_super_admin_enforced":
      return "Фиксация primary super-admin";
    default:
      return value;
  }
}

function StatTile({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200/70 bg-emerald-50/70"
      : tone === "warning"
        ? "border-amber-300/60 bg-amber-50/70"
        : "border-border bg-white/70";

  return (
    <article className={`rounded-3xl border p-5 ${toneClass}`}>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-muted">{detail}</p> : null}
    </article>
  );
}

const adminRoleOrder: Record<string, number> = {
  super_admin: 0,
  support_admin: 1,
  analyst: 2,
};

export default async function AdminPage() {
  const viewer = await requireViewer();

  if (!viewer.isPlatformAdmin) {
    return (
      <AppShell eyebrow="Админ" title="Доступ к admin-панели">
        <PanelCard caption="Доступ" title="Root-admin закреплён за одним аккаунтом">
          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-border bg-white/60 p-5 text-sm">
              <p className="font-semibold text-foreground">
                Admin-панель предназначена для root-контура платформы.
              </p>
              <p className="mt-3 leading-7 text-muted">
                Primary super-admin жёстко закреплён за{" "}
                <span className="font-semibold text-foreground">
                  {PRIMARY_SUPER_ADMIN_EMAIL}
                </span>
                . Если ты вошёл под этим email и всё ещё не видишь доступ, можно
                выполнить bootstrap или просто обновить сессию после миграции.
              </p>
            </article>

            <article className="rounded-3xl border border-border bg-white/60 p-5 text-sm">
              <p className="font-semibold text-foreground">
                Текущий пользователь
              </p>
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
                <AdminBootstrapForm
                  userEmail={viewer.user.email ?? "неизвестно"}
                />
              </div>
            </article>
          </div>
        </PanelCard>
      </AppShell>
    );
  }

  const adminSupabase = createAdminSupabaseClient();

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
    adminAuditLogsResult,
  ].find((result) => result.error);

  if (failedResult?.error) {
    throw failedResult.error;
  }

  const users = usersResult.data ?? [];
  const admins = adminsResult.data ?? [];
  const supportActions = supportActionsResult.data ?? [];
  const aiEvalRuns = aiEvalRunsResult.data ?? [];
  const aiSafetyEvents = aiSafetyEventsResult.data ?? [];
  const adminAuditLogs = adminAuditLogsResult.data ?? [];
  const authUsersById = new Map(
    (authUsersResult.data.users ?? []).map((user) => [user.id, user]),
  );

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
      label: "Пользователи",
      value: String(usersCountResult.count ?? 0),
      detail: "активная база профилей",
    },
    {
      label: "Активные недели",
      value: String(activeProgramsCountResult.count ?? 0),
      detail: "программы со статусом active",
    },
    {
      label: "AI сообщения",
      value: String(aiChatMessagesCountResult.count ?? 0),
      detail: "живой срез активности продукта",
    },
    {
      label: "Контроль root-политики",
      value: String(superAdminPolicyViolations),
      detail: superAdminPolicyViolations
        ? "в БД есть лишние super_admin"
        : "root-политика в норме",
      tone: superAdminPolicyViolations ? ("warning" as const) : ("success" as const),
    },
  ];

  return (
    <AppShell eyebrow="Админ" title="Операционная панель fit">
      <section className="card overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="pill">{formatAdminRole(viewer.platformAdminRole ?? "analyst")}</span>
              <span className="pill">Root: {PRIMARY_SUPER_ADMIN_EMAIL}</span>
              {canUseSuperAdminConsole ? <span className="pill">Полный контур</span> : null}
            </div>

            <div className="space-y-3">
              <h2 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Один рабочий центр управления для пользователей, операций и AI-контура.
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
                Панель собрана под единый root-сценарий: быстрый переход в каталог
                пользователей, контроль очередей, диагностика системы, аудит и AI-операции
                без длинной стены одинаковых блоков.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                href={"/admin/users" as Route}
              >
                Открыть пользователей
              </Link>
              <Link
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70"
                href={`/admin/users/${viewer.user.id}` as Route}
              >
                Моя admin-карточка
              </Link>
              <Link
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70"
                href={"/dashboard" as Route}
              >
                Вернуться в продукт
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile
              label="Текущий оператор"
              value={viewer.user.email ?? "email не найден"}
              detail={`Роль: ${formatAdminRole(viewer.platformAdminRole ?? "analyst")}`}
            />
            <StatTile
              label="Главный супер-админ"
              value={rootAdminRecord?.email ?? PRIMARY_SUPER_ADMIN_EMAIL}
              detail={
                rootAdminRecord
                  ? `Последний вход: ${formatDateTime(rootAdminRecord.lastSignInAt)}`
                  : "Root-пользователь уже закреплён миграцией"
              }
              tone={superAdminPolicyViolations ? "warning" : "success"}
            />
            <StatTile
              label="Команда админов"
              value={String(adminRoster.length)}
              detail={`super_admin: ${adminRoster.filter((item) => item.role === "super_admin").length}`}
            />
            <StatTile
              label="База знаний"
              value={String(knowledgeEmbeddingsCountResult.count ?? 0)}
              detail={`chunks: ${knowledgeChunksCountResult.count ?? 0} · reindex jobs: ${reindexActionsCountResult.count ?? 0}`}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-border bg-white/72 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Разделы центра
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Быстрые переходы по панели
            </h2>
          </div>
          <span className="pill">Мобильный control center</span>
        </div>

        <div className="mt-4 grid gap-3 md:flex md:flex-wrap">
          {[
            ["#health", "Состояние", "Состояние runtime и интеграций."],
            ["#operations", "Очереди", "Inbox, wave и операционные хвосты."],
            ["#users", "Пользователи", "Каталог, карточки и доступы."],
            ["#ai-ops", "AI", "База знаний, reindex и eval runs."],
            ...(canUseSuperAdminConsole
              ? [["#root-policy", "Root", "Root-политика и главный доступ."]]
              : []),
          ].map(([href, label, description]) => (
            <a
              className="w-full rounded-3xl border border-border bg-white px-4 py-3 text-left transition hover:border-accent/30 hover:bg-accent-soft md:w-auto md:min-w-[13rem]"
              href={href}
              key={href}
            >
              <span className="block text-sm font-semibold text-foreground">{label}</span>
              <span className="mt-1 block text-xs leading-5 text-muted">{description}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {heroMetrics.map((metric) => (
          <StatTile
            detail={metric.detail}
            key={metric.label}
            label={metric.label}
            tone={metric.tone}
            value={metric.value}
          />
        ))}
      </section>

      <div className="scroll-mt-28" id="health">
        <AdminHealthDashboard
          canRunAdminJobs={canUseSuperAdminConsole}
          canTriggerSentrySmokeTest={canUseSuperAdminConsole}
        />
      </div>

      <div className="scroll-mt-28" id="operations">
        <AdminOperationsInbox
          currentAdminRole={viewer.platformAdminRole ?? "analyst"}
        />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr] scroll-mt-28" id="users">
        <PanelCard caption="Пользователи" title="Управление пользователями">
          <div className="grid gap-5">
            <p className="text-sm leading-7 text-muted">
              Здесь начинается основной рабочий сценарий root-admin: перейти в
              каталог, открыть детальную карточку, выдать доступ, проверить billing,
              export, deletion и историю операций.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                href={"/admin/users" as Route}
              >
                Полный каталог
              </Link>
              <Link
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70"
                href={`/admin/users/${viewer.user.id}` as Route}
              >
                Root-карточка
              </Link>
            </div>

            <div className="grid gap-3">
              {users.length ? (
                users.map((user) => (
                  <Link
                    className="rounded-3xl border border-border bg-white/60 px-4 py-4 text-sm transition hover:bg-white/85"
                    href={`/admin/users/${user.user_id}` as Route}
                    key={user.user_id}
                  >
                    <p className="font-semibold text-foreground">
                      {user.full_name ?? "Без имени"}
                    </p>
                    <p className="mt-1 break-all text-muted">{user.user_id}</p>
                    <p className="mt-2 text-muted">
                      Создан: {formatDateTime(user.created_at)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted">Пока нет профилей пользователей.</p>
              )}
            </div>
          </div>
        </PanelCard>

        <div className="scroll-mt-28" id="ai-ops">
          <PanelCard caption="AI" title="AI и база знаний">
          <div className="grid gap-5">
            <div className="flex flex-wrap gap-2">
              <span className="pill">
                Служебные действия: {canQueueSupportActions ? "доступно" : "только просмотр"}
              </span>
              <span className="pill">
                Переиндексация: {canRunKnowledgeReindex ? "доступно" : "только просмотр"}
              </span>
              <span className="pill">
                AI-оценки: {canQueueAiEvalRuns ? "доступно" : "только просмотр"}
              </span>
            </div>

            <p className="text-sm leading-7 text-muted">
              Отсюда запускаются ручные AI-операции и обслуживание базы знаний.
              Блок вынесен отдельно, чтобы не смешивать пользовательский контур
              и технические действия в одной колонке.
            </p>

            <AdminAiOperations
              currentAdminRole={viewer.platformAdminRole ?? "analyst"}
              defaultTargetUserId={viewer.user.id}
            />
          </div>
          </PanelCard>
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
        <PanelCard caption="Команда" title="Кто управляет платформой">
          <div className="grid gap-3">
            {adminRoster.length ? (
              adminRoster.map((admin) => (
                <article
                  className="rounded-3xl border border-border bg-white/60 px-4 py-4 text-sm"
                  key={`${admin.user_id}-${admin.created_at}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {admin.email ?? admin.user_id}
                      </p>
                      <p className="mt-1 text-muted">{formatAdminRole(admin.role)}</p>
                    </div>
                    <div className="text-right text-muted">
                      <p>{formatDateTime(admin.lastSignInAt)}</p>
                      {isPrimarySuperAdminEmail(admin.email) ? (
                        <p className="mt-1 font-semibold text-foreground">основной root</p>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-muted">Назначенных администраторов пока нет.</p>
            )}
          </div>
        </PanelCard>

        <PanelCard caption="Аудит" title="Последние изменения доступа">
          <div className="grid gap-3">
            {adminAuditLogs.length ? (
              adminAuditLogs.map((entry) => (
                <article
                  className="rounded-3xl border border-border bg-white/60 px-4 py-4 text-sm"
                  key={entry.id}
                >
                  <p className="font-semibold text-foreground">
                    {formatAuditAction(entry.action)}
                  </p>
                  <p className="mt-1 text-muted">
                    Причина: {entry.reason ?? "Без пояснения"}
                  </p>
              <p className="mt-1 break-all text-muted">
                    Кто изменил: {entry.actor_user_id ?? "не указан"}
              </p>
              <p className="mt-1 break-all text-muted">
                    Для кого: {entry.target_user_id ?? "не указан"}
              </p>
                  <p className="mt-2 text-muted">
                    {formatDateTime(entry.created_at)}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-muted">
                Audit log по доступам пока пуст.
              </p>
            )}
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
        <PanelCard caption="Сигналы" title="Последние product-сигналы">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="grid gap-3">
              <p className="text-sm font-semibold text-foreground">Служебные действия</p>
              {supportActions.length ? (
                supportActions.map((action) => (
                  <article
                    className="rounded-3xl border border-border bg-white/60 px-4 py-4 text-sm"
                    key={action.id}
                  >
                    <p className="font-semibold text-foreground">
                      {formatSupportAction(action.action)}
                    </p>
                    <p className="mt-1 text-muted">
                      {formatStatus(action.status)} · {formatDateTime(action.created_at)}
                    </p>
                    <p className="mt-1 break-all text-muted">
                      Пользователь: {action.target_user_id ?? "не указан"}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-muted">
                  Support actions ещё не запускались.
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <p className="text-sm font-semibold text-foreground">События AI-безопасности</p>
              {aiSafetyEvents.length ? (
                aiSafetyEvents.map((event) => (
                  <article
                    className="rounded-3xl border border-border bg-white/60 px-4 py-4 text-sm"
                    key={event.id}
                  >
                    <p className="font-semibold text-foreground">
                      {formatRouteKey(event.route_key)} · {event.action}
                    </p>
                    <p className="mt-1 text-muted">
                      {formatDateTime(event.created_at)}
                    </p>
                    <p className="mt-2 text-muted">
                      {event.prompt_excerpt || "Фрагмент запроса не сохранён."}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-muted">
                  AI safety events пока не зафиксированы.
                </p>
              )}
            </div>
          </div>
        </PanelCard>

        <AdminAiEvalRuns
          currentAdminRole={viewer.platformAdminRole ?? "analyst"}
          initialRuns={aiEvalRuns}
        />
      </div>

      {canUseSuperAdminConsole ? (
        <div className="scroll-mt-28" id="root-policy">
        <PanelCard caption="Root policy" title="Главный super-admin закреплён">
          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-emerald-200/70 bg-emerald-50/70 p-5 text-sm">
              <p className="font-semibold text-foreground">
                Единственный super_admin: {PRIMARY_SUPER_ADMIN_EMAIL}
              </p>
              <p className="mt-3 leading-7 text-muted">
                База и runtime теперь синхронно закрепляют root-доступ только за
                этим email. Другой пользователь не сможет стать `super_admin`
                через UI или обычные admin routes.
              </p>
            </article>

            <article className="rounded-3xl border border-border bg-white/60 p-5 text-sm">
              <p className="font-semibold text-foreground">Срез root-контура</p>
              <p className="mt-3 text-muted">
                Пользователь:{" "}
                <span className="font-semibold text-foreground">
                  {viewer.user.email ?? PRIMARY_SUPER_ADMIN_EMAIL}
                </span>
              </p>
              <p className="mt-2 text-muted">
                AI proposals:{" "}
                <span className="text-foreground">
                  {aiPlanProposalsCountResult.count ?? 0}
                </span>
              </p>
              <p className="mt-2 text-muted">
                Safety events:{" "}
                <span className="text-foreground">
                  {aiSafetyEventsCountResult.count ?? 0}
                </span>
              </p>
            </article>
          </div>
          </PanelCard>
        </div>
      ) : null}
    </AppShell>
  );
}

