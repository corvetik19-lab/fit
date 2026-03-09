import type { Route } from "next";
import Link from "next/link";

import { AdminAiOperations } from "@/components/admin-ai-operations";
import { AdminBootstrapForm } from "@/components/admin-bootstrap-form";
import { AppShell } from "@/components/app-shell";
import { PanelCard } from "@/components/panel-card";
import { hasAiGatewayEnv, hasSupabasePublicEnv, serverEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireViewer } from "@/lib/viewer";

function formatDateTime(value: string) {
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
    case "reindex_knowledge":
      return "Переиндексация базы знаний";
    case "recompute_summaries":
      return "Пересчёт сводок";
    case "resync_user":
      return "Повторная синхронизация пользователя";
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
    case "completed":
      return "завершено";
    case "failed":
      return "ошибка";
    case "active":
      return "активно";
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
    default:
      return value;
  }
}

export default async function AdminPage() {
  const viewer = await requireViewer();

  if (!viewer.isPlatformAdmin) {
    return (
      <AppShell eyebrow="Админ" title="Супер-админ платформы">
        <PanelCard caption="Доступ" title="Назначение первого супер-админа">
          <p className="mb-4 text-sm leading-7 text-muted">
            Текущий пользователь уже авторизован, но записи в `platform_admins`
            для него пока нет. Для локальной разработки можно назначить себя
            первым `super_admin` через `ADMIN_BOOTSTRAP_TOKEN`.
          </p>
          <AdminBootstrapForm userEmail={viewer.user.email ?? "неизвестно"} />
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
    aiChatSessionsResult,
    usersCountResult,
    activeProgramsCountResult,
    aiChatMessagesCountResult,
    aiPlanProposalsCountResult,
    aiSafetyEventsCountResult,
    knowledgeChunksCountResult,
    knowledgeEmbeddingsCountResult,
    reindexActionsCountResult,
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
      .limit(8),
    adminSupabase
      .from("support_actions")
      .select("id, action, status, created_at, target_user_id")
      .order("created_at", { ascending: false })
      .limit(8),
    adminSupabase
      .from("ai_eval_runs")
      .select("id, label, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    adminSupabase
      .from("ai_safety_events")
      .select("id, route_key, action, prompt_excerpt, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    adminSupabase
      .from("ai_chat_sessions")
      .select("id, user_id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(8),
    adminSupabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),
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
  ]);

  const users = usersResult.data ?? [];
  const admins = adminsResult.data ?? [];
  const supportActions = supportActionsResult.data ?? [];
  const aiEvalRuns = aiEvalRunsResult.data ?? [];
  const aiSafetyEvents = aiSafetyEventsResult.data ?? [];
  const aiChatSessions = aiChatSessionsResult.data ?? [];

  const kpis = [
    ["Пользователи", String(usersCountResult.count ?? 0)],
    ["Активные недели", String(activeProgramsCountResult.count ?? 0)],
    ["AI-сообщения", String(aiChatMessagesCountResult.count ?? 0)],
    ["AI-предложения", String(aiPlanProposalsCountResult.count ?? 0)],
    ["Safety events", String(aiSafetyEventsCountResult.count ?? 0)],
    ["Knowledge chunks", String(knowledgeChunksCountResult.count ?? 0)],
    ["Knowledge embeddings", String(knowledgeEmbeddingsCountResult.count ?? 0)],
    ["Reindex-задачи", String(reindexActionsCountResult.count ?? 0)],
  ];

  const readiness: Array<{ label: string; ready: boolean }> = [
    { label: "Supabase public env", ready: hasSupabasePublicEnv() },
    { label: "AI Gateway env", ready: hasAiGatewayEnv() },
    { label: "Service role", ready: Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY) },
  ];

  return (
    <AppShell eyebrow="Админ" title="Супер-админ платформы">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <PanelCard caption="Контроль" title="AI usage и состояние платформы">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map(([label, value]) => (
              <article className="kpi p-4" key={label}>
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {readiness.map(({ label, ready }) => (
              <span
                className={`rounded-full px-3 py-2 text-sm font-medium ${
                  ready
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
                key={label}
              >
                {label}: {ready ? "готово" : "не настроено"}
              </span>
            ))}
          </div>
        </PanelCard>

        <PanelCard caption="Операции" title="Управление AI и knowledge base">
          <div className="grid gap-4">
            <p className="text-sm leading-7 text-muted">
              Здесь можно вручную запускать переиндексацию пользовательской базы
              знаний, чтобы AI-чат подтягивал свежие chunks и embeddings после
              заметных изменений профиля, тренировок или питания.
            </p>
            <AdminAiOperations defaultTargetUserId={viewer.user.id} />
            <Link
              className="inline-flex w-fit rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70"
              href={"/admin/users" as Route}
            >
              Открыть каталог пользователей
            </Link>
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PanelCard caption="Пользователи" title="Последние профили">
          <div className="grid gap-3">
            {users.length ? (
              users.map((user) => (
                <div
                  className="rounded-2xl border border-border bg-white/60 px-4 py-3 text-sm"
                  key={user.user_id}
                >
                  <Link
                    className="font-semibold text-foreground transition hover:text-accent"
                    href={`/admin/users/${user.user_id}` as Route}
                  >
                    {user.full_name ?? "Без имени"}
                  </Link>
                  <p className="mt-1 text-muted">{user.user_id}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Пока нет данных о профилях.</p>
            )}
          </div>
        </PanelCard>

        <PanelCard caption="Роли" title="Текущие admin-роли">
          <div className="grid gap-3">
            {admins.length ? (
              admins.map((admin) => (
                <div
                  className="rounded-2xl border border-border bg-white/60 px-4 py-3 text-sm"
                  key={`${admin.user_id}-${admin.created_at}`}
                >
                  <p className="font-semibold text-foreground">
                    {formatAdminRole(admin.role)}
                  </p>
                  <p className="text-muted">{admin.user_id}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Пока нет назначенных админов.</p>
            )}
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PanelCard caption="Поддержка" title="Последние support actions">
          <div className="grid gap-3">
            {supportActions.length ? (
              supportActions.map((action) => (
                <div
                  className="rounded-2xl border border-border bg-white/60 px-4 py-3 text-sm"
                  key={action.id}
                >
                  <p className="font-semibold text-foreground">
                    {formatSupportAction(action.action)}
                  </p>
                  <p className="mt-1 text-muted">
                    Статус: {formatStatus(action.status)} · {formatDateTime(action.created_at)}
                  </p>
                  <p className="mt-1 text-muted">
                    Пользователь: {action.target_user_id ?? "не указан"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">
                Действия поддержки ещё не запускались.
              </p>
            )}
          </div>
        </PanelCard>

        <PanelCard caption="Безопасность" title="Последние AI safety events">
          <div className="grid gap-3">
            {aiSafetyEvents.length ? (
              aiSafetyEvents.map((event) => (
                <div
                  className="rounded-2xl border border-border bg-white/60 px-4 py-3 text-sm"
                  key={event.id}
                >
                  <p className="font-semibold text-foreground">
                    {formatRouteKey(event.route_key)} · {event.action}
                  </p>
                  <p className="mt-1 text-muted">{formatDateTime(event.created_at)}</p>
                  <p className="mt-2 text-muted">
                    {event.prompt_excerpt || "Фрагмент запроса не сохранён."}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">
                Safety events пока не зафиксированы.
              </p>
            )}
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PanelCard caption="AI-чат" title="Последние chat sessions">
          <div className="grid gap-3">
            {aiChatSessions.length ? (
              aiChatSessions.map((session) => (
                <div
                  className="rounded-2xl border border-border bg-white/60 px-4 py-3 text-sm"
                  key={session.id}
                >
                  <p className="font-semibold text-foreground">
                    {session.title || "Без заголовка"}
                  </p>
                  <p className="mt-1 text-muted">
                    Пользователь: {session.user_id}
                  </p>
                  <p className="mt-1 text-muted">
                    Обновлено: {formatDateTime(session.updated_at)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">
                Чат-сессии пока не создавались.
              </p>
            )}
          </div>
        </PanelCard>

        <PanelCard caption="AI-оценки" title="Последние AI eval runs">
          <div className="grid gap-3">
            {aiEvalRuns.length ? (
              aiEvalRuns.map((run) => (
                <div
                  className="rounded-2xl border border-border bg-white/60 px-4 py-3 text-sm"
                  key={run.id}
                >
                  <p className="font-semibold text-foreground">{run.label}</p>
                  <p className="mt-1 text-muted">
                    Статус: {formatStatus(run.status)} · {formatDateTime(run.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">AI-прогоны пока не запускались.</p>
            )}
          </div>
        </PanelCard>
      </div>
    </AppShell>
  );
}
