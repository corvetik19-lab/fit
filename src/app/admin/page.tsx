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
    return "РќРµС‚ РґР°РЅРЅС‹С…";
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
      return "РЎСѓРїРµСЂ-Р°РґРјРёРЅ";
    case "support_admin":
      return "РџРѕРґРґРµСЂР¶РєР°";
    case "analyst":
      return "РђРЅР°Р»РёС‚РёРє";
    default:
      return value;
  }
}

function formatSupportAction(value: string) {
  switch (value) {
    case "billing_access_review":
      return "РџСЂРѕРІРµСЂРєР° billing-РґРѕСЃС‚СѓРїР°";
    case "purge_user_data":
      return "РџРѕР»РЅР°СЏ РѕС‡РёСЃС‚РєР° РґР°РЅРЅС‹С…";
    case "reindex_knowledge":
      return "РџРµСЂРµРёРЅРґРµРєСЃР°С†РёСЏ Р±Р°Р·С‹ Р·РЅР°РЅРёР№";
    case "resync_user_context":
      return "РџРµСЂРµСЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ РєРѕРЅС‚РµРєСЃС‚Р°";
    case "restore_user":
      return "Р’РѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ";
    case "suspend_user":
      return "Р‘Р»РѕРєРёСЂРѕРІРєР° РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ";
    default:
      return value;
  }
}

function formatStatus(value: string) {
  switch (value) {
    case "queued":
      return "РІ РѕС‡РµСЂРµРґРё";
    case "running":
      return "РІ СЂР°Р±РѕС‚Рµ";
    case "processing":
      return "РІ РѕР±СЂР°Р±РѕС‚РєРµ";
    case "completed":
      return "Р·Р°РІРµСЂС€РµРЅРѕ";
    case "failed":
      return "РѕС€РёР±РєР°";
    case "holding":
      return "РЅР° СѓРґРµСЂР¶Р°РЅРёРё";
    case "canceled":
      return "РѕС‚РјРµРЅРµРЅРѕ";
    case "active":
      return "Р°РєС‚РёРІРЅРѕ";
    case "trial":
      return "trial";
    case "past_due":
      return "past_due";
    default:
      return value;
  }
}

function formatRouteKey(value: string) {
  switch (value) {
    case "ai_chat":
      return "AI-С‡Р°С‚";
    case "meal_plan":
      return "РџР»Р°РЅ РїРёС‚Р°РЅРёСЏ";
    case "workout_plan":
      return "РџР»Р°РЅ С‚СЂРµРЅРёСЂРѕРІРѕРє";
    case "meal_photo":
      return "Р¤РѕС‚Рѕ-Р°РЅР°Р»РёР· РµРґС‹";
    default:
      return value;
  }
}

function formatAuditAction(value: string) {
  switch (value) {
    case "admin_role_granted":
      return "Р’С‹РґР°С‡Р° admin-РґРѕСЃС‚СѓРїР°";
    case "admin_role_updated":
      return "РР·РјРµРЅРµРЅРёРµ admin-СЂРѕР»Рё";
    case "admin_role_confirmed":
      return "РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ admin-СЂРѕР»Рё";
    case "admin_role_revoked":
      return "РћС‚Р·С‹РІ admin-РґРѕСЃС‚СѓРїР°";
    case "primary_super_admin_enforced":
      return "Р¤РёРєСЃР°С†РёСЏ primary super-admin";
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
      <AppShell eyebrow="РђРґРјРёРЅ" title="Р”РѕСЃС‚СѓРї Рє admin-РїР°РЅРµР»Рё">
        <PanelCard caption="Р”РѕСЃС‚СѓРї" title="Root-admin Р·Р°РєСЂРµРїР»С‘РЅ Р·Р° РѕРґРЅРёРј Р°РєРєР°СѓРЅС‚РѕРј">
          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-border bg-white/60 p-5 text-sm">
              <p className="font-semibold text-foreground">
                Admin-РїР°РЅРµР»СЊ РїСЂРµРґРЅР°Р·РЅР°С‡РµРЅР° РґР»СЏ root-РєРѕРЅС‚СѓСЂР° РїР»Р°С‚С„РѕСЂРјС‹.
              </p>
              <p className="mt-3 leading-7 text-muted">
                Primary super-admin Р¶С‘СЃС‚РєРѕ Р·Р°РєСЂРµРїР»С‘РЅ Р·Р°{" "}
                <span className="font-semibold text-foreground">
                  {PRIMARY_SUPER_ADMIN_EMAIL}
                </span>
                . Р•СЃР»Рё С‚С‹ РІРѕС€С‘Р» РїРѕРґ СЌС‚РёРј email Рё РІСЃС‘ РµС‰С‘ РЅРµ РІРёРґРёС€СЊ РґРѕСЃС‚СѓРї, РјРѕР¶РЅРѕ
                РІС‹РїРѕР»РЅРёС‚СЊ bootstrap РёР»Рё РїСЂРѕСЃС‚Рѕ РѕР±РЅРѕРІРёС‚СЊ СЃРµСЃСЃРёСЋ РїРѕСЃР»Рµ РјРёРіСЂР°С†РёРё.
              </p>
            </article>

            <article className="rounded-3xl border border-border bg-white/60 p-5 text-sm">
              <p className="font-semibold text-foreground">
                РўРµРєСѓС‰РёР№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ
              </p>
              <p className="mt-3 text-muted">
                {viewer.user.email ?? "Email РЅРµ РЅР°Р№РґРµРЅ"}
              </p>
              <p className="mt-2 text-muted">
                РџРѕСЃР»РµРґРЅРёР№ РІС…РѕРґ:{" "}
                <span className="text-foreground">
                  {formatDateTime(viewer.user.last_sign_in_at)}
                </span>
              </p>
              <div className="mt-4">
                <AdminBootstrapForm
                  userEmail={viewer.user.email ?? "РЅРµРёР·РІРµСЃС‚РЅРѕ"}
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
      label: "РџРѕР»СЊР·РѕРІР°С‚РµР»Рё",
      value: String(usersCountResult.count ?? 0),
      detail: "Р°РєС‚РёРІРЅР°СЏ Р±Р°Р·Р° РїСЂРѕС„РёР»РµР№",
    },
    {
      label: "РђРєС‚РёРІРЅС‹Рµ РЅРµРґРµР»Рё",
      value: String(activeProgramsCountResult.count ?? 0),
      detail: "РїСЂРѕРіСЂР°РјРјС‹ СЃРѕ СЃС‚Р°С‚СѓСЃРѕРј active",
    },
    {
      label: "AI СЃРѕРѕР±С‰РµРЅРёСЏ",
      value: String(aiChatMessagesCountResult.count ?? 0),
      detail: "Р¶РёРІРѕР№ usage СЃСЂРµР· РїСЂРѕРґСѓРєС‚Р°",
    },
    {
      label: "Контроль root-политики",
      value: String(superAdminPolicyViolations),
      detail: superAdminPolicyViolations
        ? "РІ Р‘Р” РµСЃС‚СЊ Р»РёС€РЅРёРµ super_admin"
        : "root-РїРѕР»РёС‚РёРєР° РІ РЅРѕСЂРјРµ",
      tone: superAdminPolicyViolations ? ("warning" as const) : ("success" as const),
    },
  ];

  return (
    <AppShell eyebrow="РђРґРјРёРЅ" title="РћРїРµСЂР°С†РёРѕРЅРЅР°СЏ РїР°РЅРµР»СЊ fit">
      <section className="card overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className="pill">{formatAdminRole(viewer.platformAdminRole ?? "analyst")}</span>
              <span className="pill">Root: {PRIMARY_SUPER_ADMIN_EMAIL}</span>
              {canUseSuperAdminConsole ? <span className="pill">РџРѕР»РЅС‹Р№ РєРѕРЅС‚СѓСЂ</span> : null}
            </div>

            <div className="space-y-3">
              <h2 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                РћРґРёРЅ СЂР°Р±РѕС‡РёР№ С†РµРЅС‚СЂ СѓРїСЂР°РІР»РµРЅРёСЏ РґР»СЏ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№, РѕРїРµСЂР°С†РёР№ Рё AI-РєРѕРЅС‚СѓСЂР°.
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
                РџР°РЅРµР»СЊ СЃРѕР±СЂР°РЅР° РїРѕРґ РѕРґРёРЅ root-admin СЃС†РµРЅР°СЂРёР№: Р±С‹СЃС‚СЂС‹Р№ РїРµСЂРµС…РѕРґ РІ
                user
                management, РєРѕРЅС‚СЂРѕР»СЊ РѕС‡РµСЂРµРґРµР№, health-РґРёР°РіРЅРѕСЃС‚РёРєР°, Р°СѓРґРёС‚ Рё AI
                operations Р±РµР· РїР»РѕС‚РЅРѕР№ СЃС‚РµРЅС‹ РѕРґРёРЅР°РєРѕРІС‹С… Р±Р»РѕРєРѕРІ.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                href={"/admin/users" as Route}
              >
                РћС‚РєСЂС‹С‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№
              </Link>
              <Link
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70"
                href={`/admin/users/${viewer.user.id}` as Route}
              >
                РњРѕСЏ admin-РєР°СЂС‚РѕС‡РєР°
              </Link>
              <Link
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70"
                href={"/dashboard" as Route}
              >
                Р’РµСЂРЅСѓС‚СЊСЃСЏ РІ РїСЂРѕРґСѓРєС‚
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile
              label="РўРµРєСѓС‰РёР№ РѕРїРµСЂР°С‚РѕСЂ"
              value={viewer.user.email ?? "email не найден"}
              detail={`Р РѕР»СЊ: ${formatAdminRole(viewer.platformAdminRole ?? "analyst")}`}
            />
            <StatTile
              label="Главный супер-админ"
              value={rootAdminRecord?.email ?? PRIMARY_SUPER_ADMIN_EMAIL}
              detail={
                rootAdminRecord
                  ? `РџРѕСЃР»РµРґРЅРёР№ РІС…РѕРґ: ${formatDateTime(rootAdminRecord.lastSignInAt)}`
                  : "Root-РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ СѓР¶Рµ Р·Р°РєСЂРµРїР»С‘РЅ РјРёРіСЂР°С†РёРµР№"
              }
              tone={superAdminPolicyViolations ? "warning" : "success"}
            />
            <StatTile
              label="РљРѕРјР°РЅРґР° Р°РґРјРёРЅРѕРІ"
              value={String(adminRoster.length)}
              detail={`super_admin: ${adminRoster.filter((item) => item.role === "super_admin").length}`}
            />
            <StatTile
              label="База знаний"
              value={String(knowledgeEmbeddingsCountResult.count ?? 0)}
              detail={`chunks: ${knowledgeChunksCountResult.count ?? 0} В· reindex jobs: ${reindexActionsCountResult.count ?? 0}`}
            />
          </div>
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

      <AdminHealthDashboard canTriggerSentrySmokeTest={canUseSuperAdminConsole} />

      <AdminOperationsInbox
        currentAdminRole={viewer.platformAdminRole ?? "analyst"}
      />

      <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
        <PanelCard caption="РџРѕР»СЊР·РѕРІР°С‚РµР»Рё" title="РЈРїСЂР°РІР»РµРЅРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏРјРё">
          <div className="grid gap-5">
            <p className="text-sm leading-7 text-muted">
              Р—РґРµСЃСЊ РЅР°С‡РёРЅР°РµС‚СЃСЏ РѕСЃРЅРѕРІРЅРѕР№ СЂР°Р±РѕС‡РёР№ СЃС†РµРЅР°СЂРёР№ root-admin: РїРµСЂРµР№С‚Рё РІ
              РєР°С‚Р°Р»РѕРі, РѕС‚РєСЂС‹С‚СЊ РґРµС‚Р°Р»СЊРЅСѓСЋ РєР°СЂС‚РѕС‡РєСѓ, РІС‹РґР°С‚СЊ РґРѕСЃС‚СѓРї, РїСЂРѕРІРµСЂРёС‚СЊ billing,
              export, deletion Рё РёСЃС‚РѕСЂРёСЋ РѕРїРµСЂР°С†РёР№.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                href={"/admin/users" as Route}
              >
                РџРѕР»РЅС‹Р№ РєР°С‚Р°Р»РѕРі
              </Link>
              <Link
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70"
                href={`/admin/users/${viewer.user.id}` as Route}
              >
                Root-РєР°СЂС‚РѕС‡РєР°
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
                      {user.full_name ?? "Р‘РµР· РёРјРµРЅРё"}
                    </p>
                    <p className="mt-1 break-all text-muted">{user.user_id}</p>
                    <p className="mt-2 text-muted">
                      РЎРѕР·РґР°РЅ: {formatDateTime(user.created_at)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted">РџРѕРєР° РЅРµС‚ РїСЂРѕС„РёР»РµР№ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№.</p>
              )}
            </div>
          </div>
        </PanelCard>

        <PanelCard caption="AI Ops" title="AI Рё knowledge operations">
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
              РћС‚СЃСЋРґР° Р·Р°РїСѓСЃРєР°СЋС‚СЃСЏ manual AI/knowledge РѕРїРµСЂР°С†РёРё. Р‘Р»РѕРє РѕСЃС‚Р°РІР»РµРЅ
              РѕС‚РґРµР»СЊРЅС‹Рј, С‡С‚РѕР±С‹ РЅРµ СЃРјРµС€РёРІР°С‚СЊ user management Рё С‚РµС…РЅРёС‡РµСЃРєРёРµ РґРµР№СЃС‚РІРёСЏ
              РІ РѕРґРЅРѕР№ РєРѕР»РѕРЅРєРµ.
            </p>

            <AdminAiOperations
              currentAdminRole={viewer.platformAdminRole ?? "analyst"}
              defaultTargetUserId={viewer.user.id}
            />
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
        <PanelCard caption="РљРѕРјР°РЅРґР°" title="РљС‚Рѕ СѓРїСЂР°РІР»СЏРµС‚ РїР»Р°С‚С„РѕСЂРјРѕР№">
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
              <p className="text-sm text-muted">РќР°Р·РЅР°С‡РµРЅРЅС‹С… Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂРѕРІ РїРѕРєР° РЅРµС‚.</p>
            )}
          </div>
        </PanelCard>

        <PanelCard caption="РђСѓРґРёС‚" title="РџРѕСЃР»РµРґРЅРёРµ РёР·РјРµРЅРµРЅРёСЏ РґРѕСЃС‚СѓРїР°">
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
                    РџСЂРёС‡РёРЅР°: {entry.reason ?? "Р‘РµР· РїРѕСЏСЃРЅРµРЅРёСЏ"}
                  </p>
                  <p className="mt-1 break-all text-muted">
                    Кто изменил: {entry.actor_user_id ?? "РЅРµ СѓРєР°Р·Р°РЅ"}
                  </p>
                  <p className="mt-1 break-all text-muted">
                    Для кого: {entry.target_user_id ?? "РЅРµ СѓРєР°Р·Р°РЅ"}
                  </p>
                  <p className="mt-2 text-muted">
                    {formatDateTime(entry.created_at)}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-muted">
                Audit log РїРѕ РґРѕСЃС‚СѓРїР°Рј РїРѕРєР° РїСѓСЃС‚.
              </p>
            )}
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
        <PanelCard caption="РЎРёРіРЅР°Р»С‹" title="РџРѕСЃР»РµРґРЅРёРµ product-СЃРёРіРЅР°Р»С‹">
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
                      {formatStatus(action.status)} В· {formatDateTime(action.created_at)}
                    </p>
                    <p className="mt-1 break-all text-muted">
                      РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ: {action.target_user_id ?? "РЅРµ СѓРєР°Р·Р°РЅ"}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-muted">
                  Support actions РµС‰С‘ РЅРµ Р·Р°РїСѓСЃРєР°Р»РёСЃСЊ.
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
                      {formatRouteKey(event.route_key)} В· {event.action}
                    </p>
                    <p className="mt-1 text-muted">
                      {formatDateTime(event.created_at)}
                    </p>
                    <p className="mt-2 text-muted">
                      {event.prompt_excerpt || "Р¤СЂР°РіРјРµРЅС‚ Р·Р°РїСЂРѕСЃР° РЅРµ СЃРѕС…СЂР°РЅС‘РЅ."}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-muted">
                  AI safety events РїРѕРєР° РЅРµ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹.
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
        <PanelCard caption="Root policy" title="Primary super-admin Р·Р°РєСЂРµРїР»С‘РЅ">
          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-emerald-200/70 bg-emerald-50/70 p-5 text-sm">
              <p className="font-semibold text-foreground">
                Р•РґРёРЅСЃС‚РІРµРЅРЅС‹Р№ super_admin: {PRIMARY_SUPER_ADMIN_EMAIL}
              </p>
              <p className="mt-3 leading-7 text-muted">
                Р‘Р°Р·Р° Рё runtime С‚РµРїРµСЂСЊ СЃРёРЅС…СЂРѕРЅРЅРѕ Р·Р°РєСЂРµРїР»СЏСЋС‚ root-РґРѕСЃС‚СѓРї С‚РѕР»СЊРєРѕ Р·Р°
                СЌС‚РёРј email. Р”СЂСѓРіРѕР№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ СЃРјРѕР¶РµС‚ СЃС‚Р°С‚СЊ `super_admin`
                С‡РµСЂРµР· UI РёР»Рё РѕР±С‹С‡РЅС‹Рµ admin routes.
              </p>
            </article>

            <article className="rounded-3xl border border-border bg-white/60 p-5 text-sm">
              <p className="font-semibold text-foreground">РЎСЂРµР· root-РєРѕРЅС‚СѓСЂР°</p>
              <p className="mt-3 text-muted">
                РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ:{" "}
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
      ) : null}
    </AppShell>
  );
}

