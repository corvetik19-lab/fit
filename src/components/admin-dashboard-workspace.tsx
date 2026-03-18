import type { Route } from "next";
import Link from "next/link";

import { AdminAiEvalRuns } from "@/components/admin-ai-eval-runs";
import { AdminAiOperations } from "@/components/admin-ai-operations";
import { AdminHealthDashboard } from "@/components/admin-health-dashboard";
import { AdminOperationsInbox } from "@/components/admin-operations-inbox";
import { PageWorkspace } from "@/components/page-workspace";
import { PanelCard } from "@/components/panel-card";
import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  isPrimarySuperAdminEmail,
} from "@/lib/admin-permissions";

type PlatformAdminRole = "super_admin" | "support_admin" | "analyst" | null;

type AdminDashboardWorkspaceProps = {
  adminAuditLogs: Array<{
    action: string;
    actor_user_id: string | null;
    created_at: string;
    id: string;
    reason: string | null;
    target_user_id: string | null;
  }>;
  adminRoster: Array<{
    created_at: string;
    email: string | null;
    lastSignInAt: string | null;
    role: string;
    user_id: string;
  }>;
  aiEvalRuns: Array<{
    completed_at: string | null;
    created_at: string;
    id: string;
    label: string;
    model_id: string;
    started_at: string | null;
    status: string;
  }>;
  aiPlanProposalsCount: number;
  aiSafetyEvents: Array<{
    action: string;
    created_at: string;
    id: string;
    prompt_excerpt: string | null;
    route_key: string;
  }>;
  aiSafetyEventsCount: number;
  canQueueAiEvalRuns: boolean;
  canQueueSupportActions: boolean;
  canRunKnowledgeReindex: boolean;
  canUseSuperAdminConsole: boolean;
  heroMetrics: Array<{
    detail: string;
    label: string;
    value: string;
  }>;
  isDegraded: boolean;
  knowledgeChunksCount: number;
  knowledgeEmbeddingsCount: number;
  reindexActionsCount: number;
  rootAdminRecord: {
    email: string | null;
    lastSignInAt: string | null;
  } | null;
  supportActions: Array<{
    action: string;
    created_at: string;
    id: string;
    status: string;
    target_user_id: string | null;
  }>;
  superAdminPolicyViolations: number;
  users: Array<{
    created_at: string;
    full_name: string | null;
    user_id: string;
  }>;
  viewer: {
    platformAdminRole: PlatformAdminRole;
    user: {
      email: string | null;
      id: string;
    };
  };
};

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
      return "Проверка доступа к оплате";
    case "purge_user_data":
      return "Полная очистка данных";
    case "reindex_knowledge":
      return "Обновление базы знаний";
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
      return "Чат ИИ";
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
      return "Выдача доступа";
    case "admin_role_updated":
      return "Изменение роли";
    case "admin_role_confirmed":
      return "Подтверждение роли";
    case "admin_role_revoked":
      return "Отзыв доступа";
    case "primary_super_admin_enforced":
      return "Закрепление главного администратора";
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
  detail?: string;
  label: string;
  tone?: "default" | "success" | "warning";
  value: string;
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

export function AdminDashboardWorkspace({
  adminAuditLogs,
  adminRoster,
  aiEvalRuns,
  aiPlanProposalsCount,
  aiSafetyEvents,
  aiSafetyEventsCount,
  canQueueAiEvalRuns,
  canQueueSupportActions,
  canRunKnowledgeReindex,
  canUseSuperAdminConsole,
  heroMetrics,
  isDegraded,
  knowledgeChunksCount,
  knowledgeEmbeddingsCount,
  reindexActionsCount,
  rootAdminRecord,
  supportActions,
  superAdminPolicyViolations,
  users,
  viewer,
}: AdminDashboardWorkspaceProps) {
  const operatorRole = formatAdminRole(viewer.platformAdminRole ?? "analyst");
  const badges = [
    `Главный доступ: ${PRIMARY_SUPER_ADMIN_EMAIL}`,
    canUseSuperAdminConsole ? `Ваша роль: ${operatorRole}` : "Админ-доступ подтверждён",
    isDegraded ? "Резервный режим" : "Операторская панель",
  ];

  const sections = [
    {
      key: "health",
      label: "Состояние",
      description: "Сводка по сервисам, быстрые переходы и health-панель.",
      content: (
        <div className="grid gap-6">
          {isDegraded ? (
            <p
              className="max-w-4xl rounded-3xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900"
              data-testid="admin-page-degraded-banner"
            >
              Панель показана в резервном режиме. Часть служебных источников сейчас
              недоступна, поэтому показатели и списки могут быть неполными до следующего
              обновления.
            </p>
          ) : null}

          <PanelCard caption="Быстрые действия" title="Ключевые переходы для оператора">
            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <p className="text-sm leading-7 text-muted">
                  Панель собрана под единый сценарий главного администратора: быстрый
                  переход в каталог пользователей, контроль очередей, диагностика системы,
                  аудит и операции ИИ без длинной стены одинаковых блоков.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link
                    className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                    data-testid="admin-page-open-users-link"
                    href={"/admin/users" as Route}
                  >
                    Открыть пользователей
                  </Link>
                  <Link
                    className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70"
                    data-testid="admin-page-open-self-link"
                    href={`/admin/users/${viewer.user.id}` as Route}
                  >
                    Моя карточка
                  </Link>
                  <Link
                    className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70"
                    data-testid="admin-page-back-to-dashboard-link"
                    href={"/dashboard" as Route}
                  >
                    Вернуться в продукт
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <StatTile
                  detail={
                    canUseSuperAdminConsole
                      ? `Роль: ${operatorRole}`
                      : "Доступ администратора подтверждён"
                  }
                  label="Текущий оператор"
                  value={viewer.user.email ?? "email не найден"}
                />
                <StatTile
                  detail={
                    rootAdminRecord
                      ? `Последний вход: ${formatDateTime(rootAdminRecord.lastSignInAt)}`
                      : "Главный доступ уже закреплён"
                  }
                  label="Главный администратор"
                  tone={superAdminPolicyViolations ? "warning" : "success"}
                  value={rootAdminRecord?.email ?? PRIMARY_SUPER_ADMIN_EMAIL}
                />
                <StatTile
                  detail={`главный доступ: ${adminRoster.filter((item) => item.role === "super_admin").length}`}
                  label="Команда админов"
                  value={String(adminRoster.length)}
                />
                <StatTile
                  detail={`материалы: ${knowledgeChunksCount} · обновления: ${reindexActionsCount}`}
                  label="База ИИ"
                  value={String(knowledgeEmbeddingsCount)}
                />
              </div>
            </div>
          </PanelCard>

          <AdminHealthDashboard
            canRunAdminJobs={canUseSuperAdminConsole}
            canTriggerSentrySmokeTest={canUseSuperAdminConsole}
          />
        </div>
      ),
    },
    {
      key: "operations",
      label: "Очереди",
      description: "Открытые операции, ручная обработка и продуктовые сигналы.",
      content: (
        <div className="grid gap-6">
          <AdminOperationsInbox currentAdminRole={viewer.platformAdminRole ?? "analyst"} />

          <PanelCard caption="Сигналы" title="Поддержка и события безопасности">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="grid gap-3">
                <p className="text-sm font-semibold text-foreground">Действия поддержки</p>
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
                  <p className="text-sm text-muted">Действия поддержки ещё не запускались.</p>
                )}
              </div>

              <div className="grid gap-3">
                <p className="text-sm font-semibold text-foreground">События безопасности ИИ</p>
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
                    События безопасности ИИ пока не зафиксированы.
                  </p>
                )}
              </div>
            </div>
          </PanelCard>
        </div>
      ),
    },
    {
      key: "users",
      label: "Пользователи",
      description: "Каталог, команда админов и аудит доступа.",
      content: (
        <div className="grid gap-6">
          <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
            <PanelCard caption="Пользователи" title="Управление пользователями">
              <div className="grid gap-5">
                <p className="text-sm leading-7 text-muted">
                  Здесь начинается основной рабочий сценарий главного администратора:
                  перейти в каталог, открыть детальную карточку, выдать доступ,
                  проверить оплаты, выгрузки, удаление данных и историю операций.
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
                    Моя карточка
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

            <div className="grid gap-6">
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
                              <p className="mt-1 font-semibold text-foreground">
                                главный доступ
                              </p>
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
                        <p className="mt-2 text-muted">{formatDateTime(entry.created_at)}</p>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-muted">История изменений доступа пока пуста.</p>
                  )}
                </div>
              </PanelCard>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "ai",
      label: "ИИ",
      description: "База знаний, операции ИИ и проверки качества.",
      content: (
        <div className="grid gap-6">
          <PanelCard caption="ИИ" title="ИИ и база знаний">
            <div className="grid gap-5">
              <div className="flex flex-wrap gap-2">
                <span className="pill">
                  Служебные действия: {canQueueSupportActions ? "доступно" : "только просмотр"}
                </span>
                <span className="pill">
                  Обновление базы знаний: {canRunKnowledgeReindex ? "доступно" : "только просмотр"}
                </span>
                <span className="pill">
                  Проверки ИИ: {canQueueAiEvalRuns ? "доступно" : "только просмотр"}
                </span>
              </div>

              <p className="text-sm leading-7 text-muted">
                Отсюда запускаются проверки ИИ и обновление базы знаний. Блок вынесен
                отдельно, чтобы не смешивать работу с пользователями и системные задачи.
              </p>

              <AdminAiOperations
                currentAdminRole={viewer.platformAdminRole ?? "analyst"}
                defaultTargetUserId={viewer.user.id}
              />
            </div>
          </PanelCard>

          <AdminAiEvalRuns
            currentAdminRole={viewer.platformAdminRole ?? "analyst"}
            initialRuns={aiEvalRuns}
          />
        </div>
      ),
    },
  ];

  if (canUseSuperAdminConsole) {
    sections.push({
      key: "root",
      label: "Главный доступ",
      description: "Закрепление главной роли и контроль политики доступа.",
      content: (
        <PanelCard caption="Главный доступ" title="Главный администратор закреплён">
          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-emerald-200/70 bg-emerald-50/70 p-5 text-sm">
              <p className="font-semibold text-foreground">
                Главный администратор: {PRIMARY_SUPER_ADMIN_EMAIL}
              </p>
              <p className="mt-3 leading-7 text-muted">
                Главный доступ закреплён только за этим email. Другой пользователь
                не сможет получить эту роль через панель.
              </p>
            </article>

            <article className="rounded-3xl border border-border bg-white/60 p-5 text-sm">
              <p className="font-semibold text-foreground">Сводка по главному доступу</p>
              <p className="mt-3 text-muted">
                Пользователь:{" "}
                <span className="font-semibold text-foreground">
                  {viewer.user.email ?? PRIMARY_SUPER_ADMIN_EMAIL}
                </span>
              </p>
              <p className="mt-2 text-muted">
                Предложения ИИ: <span className="text-foreground">{aiPlanProposalsCount}</span>
              </p>
              <p className="mt-2 text-muted">
                События безопасности ИИ:{" "}
                <span className="text-foreground">{aiSafetyEventsCount}</span>
              </p>
            </article>
          </div>
        </PanelCard>
      ),
    });
  }

  return (
    <PageWorkspace
      badges={badges}
      description="Панель собрана под единый сценарий главного администратора: пользователи, очереди, диагностика системы, аудит и операции ИИ без перегруженной стены блоков. На мобильном экране открывается только нужный раздел."
      metrics={heroMetrics.map((metric) => ({
        label: metric.label,
        note: metric.detail,
        value: metric.value,
      }))}
      sections={sections}
      storageKey="admin-page"
      title="Один центр управления для пользователей, задач и AI"
    />
  );
}
