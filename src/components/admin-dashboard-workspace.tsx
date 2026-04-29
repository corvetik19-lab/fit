"use client";

import type { Route } from "next";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

import { AdminAiEvalRuns } from "@/components/admin-ai-eval-runs";
import { AdminAiOperations } from "@/components/admin-ai-operations";
import { AdminHealthDashboard } from "@/components/admin-health-dashboard";
import { AdminOperationsInbox } from "@/components/admin-operations-inbox";
import { CompactDisclosure } from "@/components/compact-disclosure";
import { PanelCard } from "@/components/panel-card";
import { RepairMojibakeTree } from "@/components/repair-mojibake-tree";

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
      return "Очистка данных пользователя";
    case "reindex_knowledge":
      return "Обновление базы знаний";
    case "resync_user_context":
      return "Пересборка контекста";
    case "restore_user":
      return "Восстановление доступа";
    case "suspend_user":
      return "Ограничение аккаунта";
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
      return "Чат AI";
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

function HeroMetricCard({
  detail,
  index,
  label,
  value,
}: {
  detail: string;
  index: number;
  label: string;
  value: string;
}) {
  const toneClass =
    index === 1
      ? "border border-sky-500/20 bg-sky-500/12 text-sky-900"
      : index === 2
        ? "border border-rose-500/20 bg-rose-500/12 text-rose-900"
        : "metric-tile text-foreground";
  const mutedClass =
    index === 1 ? "text-sky-900/75" : index === 2 ? "text-rose-900/75" : "text-muted";

  return (
    <article className={`min-w-0 rounded-[0.86rem] p-3 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`font-mono text-[10px] uppercase tracking-[0.24em] ${mutedClass}`}>
          {label}
        </p>
        <span className="pill">
          {index === 0 ? "обзор" : index === 1 ? "в фокусе" : index === 2 ? "контроль" : "сводка"}
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
      <p className={`mt-1.5 text-sm leading-5 ${mutedClass}`}>{detail}</p>
    </article>
  );
}

function SpotlightCard({
  caption,
  children,
  title,
}: {
  caption: string;
  children: ReactNode;
  title: string;
}) {
  return (
    <article className="surface-panel min-w-0 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">
        {caption}
      </p>
      <h3 className="mt-1.5 text-base font-semibold text-foreground">{title}</h3>
      <div className="mt-3 grid gap-2.5">{children}</div>
    </article>
  );
}

function ActionChip({
  children,
  href,
  testId,
  tone = "secondary",
}: {
  children: ReactNode;
  href: Route;
  testId?: string;
  tone?: "primary" | "secondary";
}) {
  return (
    <Link
      className={
        tone === "primary"
          ? "action-button action-button--primary w-full sm:w-auto"
          : "action-button action-button--secondary w-full sm:w-auto"
      }
      data-testid={testId}
      href={href}
    >
      {children}
    </Link>
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
  const searchParams = useSearchParams();
  const forceDegradedBanner =
    searchParams.get("__test_admin_dashboard_fallback") === "1";
  const showDegradedBanner = isDegraded || forceDegradedBanner;
  const operatorRole = formatAdminRole(viewer.platformAdminRole ?? "analyst");
  const rootCount = adminRoster.filter((item) => item.role === "super_admin").length;
  const recentUsers = users.slice(0, 4);
  const recentRoster = adminRoster.slice(0, 4);
  const recentAudit = adminAuditLogs.slice(0, 4);

  return (
    <RepairMojibakeTree>
      <div className="flex min-w-0 w-full flex-col gap-4">
      <section className="surface-panel min-w-0 w-full max-w-full overflow-hidden p-4">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="pill">fit Admin</span>
              <span className="pill">Роль: {operatorRole}</span>
            </div>

            <div className="space-y-2.5">
              <h1 className="max-w-4xl text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Операторский центр пользователей, AI-качества и важных процессов.
              </h1>
              <p className="max-w-3xl text-sm leading-5 text-muted">
                Здесь собраны ключевые метрики, очередь действий, здоровье AI-контура и
                быстрые переходы к пользователям без тяжёлого табличного слоя сверху.
              </p>
            </div>

            <div className="surface-panel surface-panel--soft px-3 py-2.5 text-[color:var(--accent-strong)] sm:max-w-max">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em]">
                Главный доступ
              </p>
              <p className="mt-2 break-all text-sm font-semibold tracking-[0.02em] sm:text-xs sm:uppercase sm:tracking-[0.18em]">
                {rootAdminRecord?.email ?? "super-admin"}
              </p>
            </div>

            <div className="grid gap-2.5 sm:flex sm:flex-wrap">
              <ActionChip
                href={"/admin/users" as Route}
                testId="admin-page-open-users-link"
                tone="primary"
              >
                Открыть пользователей
              </ActionChip>
              <ActionChip
                href={`/admin/users/${viewer.user.id}` as Route}
                testId="admin-page-open-self-link"
              >
                Моя карточка
              </ActionChip>
              <ActionChip
                href={"/dashboard" as Route}
                testId="admin-page-back-to-dashboard-link"
              >
                Вернуться в продукт
              </ActionChip>
            </div>
          </div>

          <div className="surface-panel surface-panel--soft min-w-0 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">
              Быстрый статус
            </p>
            <div className="mt-4 grid gap-2.5">
              <div className="metric-tile min-w-0 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Текущий оператор
                </p>
                <p className="mt-2 break-all text-lg font-semibold">
                  {viewer.user.email ?? "email не найден"}
                </p>
                <p className="mt-2 text-sm text-muted">Роль: {operatorRole}</p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="metric-tile min-w-0 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Главный доступ
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{rootCount}</p>
                  <p className="mt-1 text-sm text-muted">
                    нарушений: {superAdminPolicyViolations}
                  </p>
                </div>
                <div className="metric-tile min-w-0 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    База AI
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground">
                    {knowledgeEmbeddingsCount}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    чанков: {knowledgeChunksCount}
                  </p>
                </div>
              </div>

              <div className="metric-tile min-w-0 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Последний вход главного администратора
                </p>
                <p className="mt-2 break-all text-base font-semibold">
                  {rootAdminRecord?.email ?? "Роль super-admin ещё не назначена"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatDateTime(rootAdminRecord?.lastSignInAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {heroMetrics.map((metric, index) => (
            <HeroMetricCard
              detail={metric.detail}
              index={index}
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </div>

        {showDegradedBanner ? (
          <p
            className="mt-5 rounded-[1rem] border border-amber-400/25 bg-amber-500/12 px-4 py-3 text-sm leading-6 text-amber-900"
            data-testid="admin-page-degraded-banner"
          >
            Панель временно работает из резервного снимка. Часть служебных источников
            не ответила, поэтому показатели и списки могут быть неполными до следующего обновления.
          </p>
        ) : null}
      </section>

      <div className="grid gap-2.5 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="grid gap-2.5 min-w-0">
          <CompactDisclosure
            badge={String(supportActions.length)}
            defaultOpen
            eyebrow="Операции"
            summary="Очередь поддержки, health-check и действия оператора."
            title="Рабочий центр"
          >
            <div className="grid gap-3">
          <SpotlightCard
            caption="Операции"
            title="Сигналы, которые требуют решения прямо сейчас"
          >
            {supportActions.length ? (
              supportActions.slice(0, 3).map((action) => (
                <article
                  className="metric-tile min-w-0 px-3.5 py-3"
                  key={action.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {formatSupportAction(action.action)}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {formatStatus(action.status)} · {formatDateTime(action.created_at)}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted">
                        Пользователь: {action.target_user_id ?? "не указан"}
                      </p>
                    </div>
                    <span className="pill">{formatStatus(action.status)}</span>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm leading-7 text-muted">
                В очереди поддержки спокойно. Новые ручные действия появятся здесь сразу
                после постановки в обработку.
              </p>
            )}
          </SpotlightCard>

          <AdminOperationsInbox currentAdminRole={viewer.platformAdminRole ?? "analyst"} />

          <AdminHealthDashboard
            canRunAdminJobs={canUseSuperAdminConsole}
            canTriggerSentrySmokeTest={canUseSuperAdminConsole}
          />
            </div>
          </CompactDisclosure>
        </div>

        <div className="grid gap-2.5 min-w-0">
          <CompactDisclosure
            badge={String(aiSafetyEventsCount)}
            eyebrow="AI"
            summary="Качество ответов, eval-запуски, аудит доступа и новые профили."
            title="AI, аудит и команда"
          >
            <div className="grid gap-3">
          <SpotlightCard caption="AI" title="Качество ответов и пересборка базы знаний">
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="metric-tile min-w-0 p-3.5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  AI-сигналы
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {aiSafetyEventsCount}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  событий безопасности и ограничений контента
                </p>
              </article>
              <article className="metric-tile min-w-0 p-3.5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  AI-планы
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {aiPlanProposalsCount}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  предложений и применений под контролем оператора
                </p>
              </article>
            </div>

            <article className="metric-tile min-w-0 p-3.5 text-sm">
              <p className="font-semibold text-foreground">
                Последние обновления базы знаний
              </p>
              <p className="mt-2 text-muted">
                Чанков: <span className="text-foreground">{knowledgeChunksCount}</span> ·
                векторов: <span className="text-foreground">{knowledgeEmbeddingsCount}</span> ·
                запусков reindex: <span className="text-foreground">{reindexActionsCount}</span>
              </p>
            </article>

            <div className="flex flex-wrap gap-2">
              <span className="pill">
                Поддержка: {canQueueSupportActions ? "можно запускать" : "только просмотр"}
              </span>
              <span className="pill">
                Reindex: {canRunKnowledgeReindex ? "можно запускать" : "только просмотр"}
              </span>
              <span className="pill">
                Evals: {canQueueAiEvalRuns ? "можно запускать" : "только просмотр"}
              </span>
            </div>

            {aiSafetyEvents.length ? (
              <div className="grid gap-3">
                {aiSafetyEvents.slice(0, 3).map((event) => (
                  <article
                    className="surface-panel surface-panel--soft min-w-0 px-4 py-3 text-sm"
                    key={event.id}
                  >
                    <p className="font-semibold text-foreground">
                      {formatRouteKey(event.route_key)} · {event.action}
                    </p>
                    <p className="mt-1 text-muted">{formatDateTime(event.created_at)}</p>
                    <p className="mt-2 break-words text-muted">
                      {event.prompt_excerpt || "Фрагмент запроса не сохранён."}
                    </p>
                  </article>
                ))}
              </div>
            ) : null}

            <AdminAiOperations
              currentAdminRole={viewer.platformAdminRole ?? "analyst"}
              defaultTargetUserId={viewer.user.id}
            />
          </SpotlightCard>

          <AdminAiEvalRuns
            currentAdminRole={viewer.platformAdminRole ?? "analyst"}
            initialRuns={aiEvalRuns}
          />

          <SpotlightCard caption="Люди" title="Команда доступа и недавний аудит">
            <div className="grid gap-3">
              {recentRoster.map((admin) => (
                <article
                  className="metric-tile min-w-0 px-3.5 py-3 text-sm"
                  key={`${admin.user_id}-${admin.created_at}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all font-semibold text-foreground">
                        {admin.email ?? admin.user_id}
                      </p>
                      <p className="mt-1 text-muted">{formatAdminRole(admin.role)}</p>
                    </div>
                    {admin.role === "super_admin" ? (
                      <span className="pill">главный доступ</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Последний вход: {formatDateTime(admin.lastSignInAt)}
                  </p>
                </article>
              ))}
            </div>

            <div className="grid gap-3">
              {recentAudit.length ? (
                recentAudit.map((entry) => (
                  <article
                    className="surface-panel surface-panel--soft min-w-0 px-4 py-3 text-sm"
                    key={entry.id}
                  >
                    <p className="font-semibold text-foreground">
                      {formatAuditAction(entry.action)}
                    </p>
                    <p className="mt-1 break-words text-muted">
                      {entry.reason ?? "Без пояснения"} · {formatDateTime(entry.created_at)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-7 text-muted">
                  Недавних административных событий пока нет.
                </p>
              )}
            </div>
          </SpotlightCard>

          {canUseSuperAdminConsole ? (
            <SpotlightCard caption="Root" title="Политика главного доступа">
              <article className="surface-panel surface-panel--soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Закреплённый супер-админ
                </p>
                <p className="mt-3 break-all text-lg font-semibold">
                  {rootAdminRecord?.email ?? "Роль super-admin уже назначена"}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Эту роль нельзя переназначить на другой email через интерфейс. Остальным
                  аккаунтам доступны обычные административные роли с аудитом.
                </p>
              </article>
            </SpotlightCard>
          ) : null}

          {recentUsers.length ? (
            <PanelCard caption="Новые профили" title="Последние созданные пользователи">
              <div className="grid gap-3">
                {recentUsers.map((user) => (
                  <Link
                    className="metric-tile min-w-0 px-3.5 py-3 text-sm transition hover:translate-y-[-1px]"
                    href={`/admin/users/${user.user_id}` as Route}
                    key={user.user_id}
                  >
                    <p className="font-semibold text-foreground">
                      {user.full_name ?? "Без имени"}
                    </p>
                    <p className="mt-1 break-all text-muted">{user.user_id}</p>
                    <p className="mt-2 text-xs text-muted">
                      Создан: {formatDateTime(user.created_at)}
                    </p>
                  </Link>
                ))}
              </div>
            </PanelCard>
          ) : null}
            </div>
          </CompactDisclosure>
        </div>
      </div>
      </div>
    </RepairMojibakeTree>
  );
}
