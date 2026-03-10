"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminRoleManager } from "@/components/admin-role-manager";
import { AdminUserActions } from "@/components/admin-user-actions";

type PlatformAdminRole = "super_admin" | "support_admin" | "analyst";
type JsonRecord = Record<string, unknown> | null;
type UserReference = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type AdminUserDetailData = {
  id: string;
  currentAdminRole: PlatformAdminRole;
  authUser: {
    email: string | null;
    created_at: string;
    last_sign_in_at: string | null;
  } | null;
  profile: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  onboarding: {
    age: number | null;
    sex: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    fitness_level: string | null;
    equipment: string[];
    injuries: string[];
    dietary_preferences: string[];
    created_at: string;
    updated_at: string;
  } | null;
  latestGoal: {
    goal_type: string;
    target_weight_kg: number | null;
    weekly_training_days: number | null;
    created_at: string;
    updated_at: string;
  } | null;
  adminRole: {
    role: string;
    created_at: string;
  } | null;
  adminState: {
    is_suspended: boolean;
    metadata: JsonRecord;
    restored_at: string | null;
    state_reason: string | null;
    suspended_at: string | null;
  } | null;
  superAdminPolicy: {
    primaryEmail: string;
    targetCanBeSuperAdmin: boolean;
  };
  stats: {
    workout: {
      activeExercises: number;
      activePrograms: number;
      completedDays: number;
      inProgressDays: number;
      latestWorkoutAt: string | null;
      loggedSets: number;
      programs: number;
      templates: number;
    };
    nutrition: {
      foods: number;
      latestMealAt: string | null;
      mealItems: number;
      meals: number;
      recipes: number;
      summaryDays: number;
      templates: number;
    };
    ai: {
      chatMessages: number;
      chatSessions: number;
      contextSnapshots: number;
      knowledgeChunks: number;
      latestAiAt: string | null;
      proposals: number;
      safetyEvents: number;
    };
    lifecycle: {
      bodyMetrics: number;
      deletionRequest: {
        id: string;
        requested_by: string | null;
        requested_by_user: UserReference | null;
        status: string;
        hold_until: string | null;
        created_at: string;
        updated_at: string;
      } | null;
      deletionRequests: number;
      entitlements: number;
      exportJobs: number;
      latestExportJob: {
        id: string;
        requested_by: string | null;
        requested_by_user: UserReference | null;
        format: string;
        status: string;
        artifact_path: string | null;
        created_at: string;
        updated_at: string;
      } | null;
      latestProfileUpdateAt: string | null;
      latestSubscription: {
        id: string;
        status: string;
        provider: string;
        provider_customer_id: string | null;
        provider_subscription_id: string | null;
        current_period_start: string | null;
        current_period_end: string | null;
        updated_at: string;
      } | null;
      recentEntitlements: Array<{
        id: string;
        feature_key: string;
        limit_value: number | null;
        is_enabled: boolean;
        updated_at: string;
      }>;
      recentSubscriptionEvents: Array<{
        id: string;
        event_type: string;
        provider_event_id: string | null;
        payload: JsonRecord;
        actor_user_id: string | null;
        actor_user: UserReference | null;
        created_at: string;
        updated_at: string;
      }>;
      recentUsageCounters: Array<{
        id: string;
        metric_key: string;
        metric_window: string;
        usage_count: number;
        reset_at: string | null;
        updated_at: string;
      }>;
      subscriptions: number;
      usageCounters: number;
    };
  };
  recentSupportActions: Array<{
    id: string;
    action: string;
    status: string;
    payload: JsonRecord;
    actor_user_id: string | null;
    actor_user: UserReference | null;
    resolved_by_user: UserReference | null;
    created_at: string;
    updated_at: string;
  }>;
  recentExportJobs: Array<{
    id: string;
    requested_by: string | null;
    requested_by_user: UserReference | null;
    format: string;
    status: string;
    artifact_path: string | null;
    created_at: string;
    updated_at: string;
  }>;
  recentOperationAuditLogs: Array<{
    id: string;
    action: string;
    reason: string | null;
    payload: JsonRecord;
    actor_user_id: string | null;
    actor_user: UserReference | null;
    created_at: string;
    updated_at: string;
  }>;
  recentAdminAuditLogs: Array<{
    id: string;
    action: string;
    reason: string | null;
    payload: JsonRecord;
    actor_user_id: string | null;
    actor_user: UserReference | null;
    created_at: string;
    updated_at: string;
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const goalTypeLabels: Record<string, string> = {
  fat_loss: "РЎРЅРёР¶РµРЅРёРµ РІРµСЃР°",
  maintenance: "РџРѕРґРґРµСЂР¶Р°РЅРёРµ С„РѕСЂРјС‹",
  muscle_gain: "РќР°Р±РѕСЂ РјС‹С€С†",
  performance: "Р РµР·СѓР»СЊС‚Р°С‚ Рё РІС‹РЅРѕСЃР»РёРІРѕСЃС‚СЊ",
};

const sexLabels: Record<string, string> = {
  female: "Р–РµРЅС‰РёРЅР°",
  male: "РњСѓР¶С‡РёРЅР°",
  other: "Р”СЂСѓРіРѕРµ",
  prefer_not_to_say: "РќРµ СѓРєР°Р·Р°РЅРѕ",
};

const fitnessLevelLabels: Record<string, string> = {
  beginner: "РќР°С‡РёРЅР°СЋС‰РёР№",
  intermediate: "РЎСЂРµРґРЅРёР№",
  advanced: "РџСЂРѕРґРІРёРЅСѓС‚С‹Р№",
};

const adminRoleLabels: Record<string, string> = {
  super_admin: "РЎСѓРїРµСЂ-Р°РґРјРёРЅ",
  support_admin: "РџРѕРґРґРµСЂР¶РєР°",
  analyst: "РђРЅР°Р»РёС‚РёРє",
  user: "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ",
};

const statusLabels: Record<string, string> = {
  active: "активно",
  canceled: "РѕС‚РјРµРЅРµРЅРѕ",
  canceled_subscription: "подписка отменена",
  completed: "Р·Р°РІРµСЂС€РµРЅРѕ",
  failed: "РѕС€РёР±РєР°",
  holding: "РЅР° СѓРґРµСЂР¶Р°РЅРёРё",
  past_due: "нужна оплата",
  processing: "РІ РѕР±СЂР°Р±РѕС‚РєРµ",
  queued: "РІ РѕС‡РµСЂРµРґРё",
  trial: "пробный период",
};

const auditActionLabels: Record<string, string> = {
  admin_reconcile_stripe_subscription: "Ручная синхронизация подписки Stripe",
  cancel_deletion_request: "Отмена запроса на удаление",
  deletion_request_status_updated: "Изменение статуса запроса на удаление",
  export_job_status_updated: "Изменение статуса выгрузки данных",
  queue_deletion_purge_action: "Постановка очистки данных",
  queue_deletion_request: "Создан запрос на удаление",
  queue_export_job: "Создана выгрузка данных",
  support_action_status_updated: "Изменение статуса служебного действия",
};

const supportActionLabels: Record<string, string> = {
  billing_access_review: "Запрос на проверку доступа",
  enable_entitlement: "Открыть доступ к функции",
  grant_trial: "Выдать пробный доступ",
  purge_user_data: "Полная очистка данных",
  restore_user: "Р’РѕСЃСЃС‚Р°РЅРѕРІРёС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ",
  resync_user_context: "РџРµСЂРµСЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°С‚СЊ РєРѕРЅС‚РµРєСЃС‚",
  suspend_user: "Р—Р°РјРѕСЂРѕР·РёС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ",
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "РќРµС‚ РґР°РЅРЅС‹С…";
  }

  return dateFormatter.format(new Date(value));
}

function formatStatus(value: string | null | undefined) {
  if (!value) {
    return "РќРµС‚ РґР°РЅРЅС‹С…";
  }

  return statusLabels[value] ?? value;
}

function formatSnakeLabel(value: string | null | undefined) {
  if (!value) {
    return "РќРµС‚ РґР°РЅРЅС‹С…";
  }

  return value.replaceAll("_", " ");
}

function formatAuditAction(value: string) {
  if (value === "user_reconciled_stripe_checkout_return") {
    return "Синхронизация возврата из Stripe";
  }

  if (value === "user_requested_billing_access_review") {
    return "Запрос на проверку доступа";
  }

  return auditActionLabels[value] ?? formatSnakeLabel(value);
}

function formatSupportAction(value: string) {
  return supportActionLabels[value] ?? formatSnakeLabel(value);
}

function renderList(items: string[] | undefined) {
  if (!items?.length) {
    return "РќРµ Р·Р°РїРѕР»РЅРµРЅРѕ";
  }

  return items.join(", ");
}

function getUserLabel(user: UserReference | null, fallbackId?: string | null) {
  return user?.full_name ?? user?.email ?? fallbackId ?? "РќРµС‚ РґР°РЅРЅС‹С…";
}

function getPayloadString(payload: JsonRecord, key: string) {
  const value = payload?.[key];
  return typeof value === "string" ? value : null;
}

function getPayloadBoolean(payload: JsonRecord, key: string) {
  const value = payload?.[key];
  return typeof value === "boolean" ? value : null;
}

function getPayloadStringList(payload: JsonRecord, key: string) {
  const value = payload?.[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
      <p className="text-muted">{label}</p>
      <p className="mt-2 font-semibold text-foreground">{value}</p>
    </article>
  );
}

function KeyValueCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
      <p className="font-semibold text-foreground">{title}</p>
      <div className="mt-3 grid gap-2">
        {rows.map((row) => (
          <p className="text-muted" key={row.label}>
            {row.label}: <span className="text-foreground">{row.value}</span>
          </p>
        ))}
      </div>
    </article>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-7 text-muted">{children}</p>;
}

export function AdminUserDetail({
  currentUserId,
  currentUserEmail,
  currentUserRole,
  userId,
}: {
  currentUserId: string;
  currentUserEmail: string | null;
  currentUserRole: PlatformAdminRole;
  userId: string;
}) {
  const [detail, setDetail] = useState<AdminUserDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadDetail() {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | { data?: AdminUserDetailData; message?: string }
          | null;

        if (!response.ok) {
          if (isActive) {
            setError(payload?.message ?? "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РєР°СЂС‚РѕС‡РєСѓ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.");
            setDetail(null);
          }
          return;
        }

        if (isActive) {
          setDetail(payload?.data ?? null);
          setError(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      isActive = false;
    };
  }, [reloadVersion, userId]);

  if (isLoading) {
    return (
      <section className="card p-6">
        <p className="text-sm text-muted">Р—Р°РіСЂСѓР¶Р°СЋ РєР°СЂС‚РѕС‡РєСѓ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ...</p>
      </section>
    );
  }

  if (error || !detail) {
    return (
      <section className="card p-6">
        <Link
          className="mb-4 inline-flex rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
          href={"/admin/users" as Route}
        >
          РќР°Р·Р°Рґ Рє РєР°С‚Р°Р»РѕРіСѓ
        </Link>
        <p className="rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "РљР°СЂС‚РѕС‡РєР° РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РЅРµ РЅР°Р№РґРµРЅР°."}
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {detail.profile?.full_name ?? "Р‘РµР· РёРјРµРЅРё"}
            </h2>
            <p className="mt-2 break-all text-sm text-muted">{detail.id}</p>
            <p className="mt-2 break-all text-sm text-muted">
              {detail.authUser?.email ?? "Email РЅРµ РЅР°Р№РґРµРЅ"}
            </p>
          </div>
          <Link
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
            href={"/admin/users" as Route}
          >
            РќР°Р·Р°Рґ Рє РєР°С‚Р°Р»РѕРіСѓ
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["РЈРїСЂР°Р¶РЅРµРЅРёСЏ", String(detail.stats.workout.activeExercises)],
            ["РџСЂРѕРіСЂР°РјРјС‹", String(detail.stats.workout.programs)],
            ["РџСЂРёРµРјС‹ РїРёС‰Рё", String(detail.stats.nutrition.meals)],
            ["AI-С‡Р°С‚С‹", String(detail.stats.ai.chatSessions)],
            ["Подходы", String(detail.stats.workout.loggedSets)],
            [
              "Р РѕР»СЊ РґРѕСЃС‚СѓРїР°",
              adminRoleLabels[detail.adminRole?.role ?? "user"] ??
                detail.adminRole?.role ??
                "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ",
            ],
          ].map(([label, value]) => (
            <article className="kpi p-4" key={label}>
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
            </article>
          ))}
        </div>

        {!detail.superAdminPolicy.targetCanBeSuperAdmin ? (
          <p className="mt-4 rounded-2xl border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Р­С‚РѕС‚ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ `super_admin`. РљРѕСЂРЅРµРІРѕР№ super-admin Р·Р°РєСЂРµРїР»РµРЅ
            С‚РѕР»СЊРєРѕ Р·Р° {detail.superAdminPolicy.primaryEmail}.
          </p>
        ) : null}

        {detail.adminState?.is_suspended ? (
          <p className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            РђРєРєР°СѓРЅС‚ СЃРµР№С‡Р°СЃ РІ suspended state. Suspended at:{" "}
            {formatDateTime(detail.adminState.suspended_at)}. РџСЂРёС‡РёРЅР°:{" "}
            {detail.adminState.state_reason ?? "РЅРµ СѓРєР°Р·Р°РЅР°"}.
          </p>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="card p-6">
          <div className="mb-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              РЎСЂРµР· РїСЂРѕС„РёР»СЏ
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Р‘Р°Р·РѕРІС‹Р№ РєРѕРЅС‚РµРєСЃС‚ Рё С†РµР»Рё
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <KeyValueCard
              title="РџСЂРѕС„РёР»СЊ"
              rows={[
                {
                  label: "Email",
                  value: detail.authUser?.email ?? "РќРµС‚ РґР°РЅРЅС‹С…",
                },
                {
                  label: "РџРѕСЃР»РµРґРЅРёР№ РІС…РѕРґ",
                  value: formatDateTime(detail.authUser?.last_sign_in_at),
                },
                {
                  label: "РЎРѕР·РґР°РЅ",
                  value: formatDateTime(detail.authUser?.created_at),
                },
                {
                  label: "РџСЂРѕС„РёР»СЊ РѕР±РЅРѕРІР»РµРЅ",
                  value: formatDateTime(detail.profile?.updated_at),
                },
                {
                  label: "РЎРѕСЃС‚РѕСЏРЅРёРµ Р°РєРєР°СѓРЅС‚Р°",
                  value: detail.adminState?.is_suspended
                    ? "suspended"
                    : "active",
                },
              ]}
            />

            <KeyValueCard
              title="Р¦РµР»Рё"
              rows={[
                {
                  label: "РўРёРї С†РµР»Рё",
                  value: detail.latestGoal?.goal_type
                    ? goalTypeLabels[detail.latestGoal.goal_type] ??
                      detail.latestGoal.goal_type
                    : "РќРµ Р·Р°РїРѕР»РЅРµРЅРѕ",
                },
                {
                  label: "РўСЂРµРЅРёСЂРѕРІРѕРє РІ РЅРµРґРµР»СЋ",
                  value: String(
                    detail.latestGoal?.weekly_training_days ?? "РќРµ Р·Р°РїРѕР»РЅРµРЅРѕ",
                  ),
                },
                {
                  label: "Р¦РµР»РµРІРѕР№ РІРµСЃ",
                  value:
                    detail.latestGoal?.target_weight_kg !== null &&
                    detail.latestGoal?.target_weight_kg !== undefined
                      ? `${detail.latestGoal.target_weight_kg} РєРі`
                      : "РќРµ Р·Р°РїРѕР»РЅРµРЅРѕ",
                },
              ]}
            />

            <KeyValueCard
              title="РћРЅР±РѕСЂРґРёРЅРі"
              rows={[
                {
                  label: "Р’РѕР·СЂР°СЃС‚",
                  value: String(detail.onboarding?.age ?? "РќРµ Р·Р°РїРѕР»РЅРµРЅРѕ"),
                },
                {
                  label: "РџРѕР»",
                  value: detail.onboarding?.sex
                    ? sexLabels[detail.onboarding.sex] ?? detail.onboarding.sex
                    : "РќРµ Р·Р°РїРѕР»РЅРµРЅРѕ",
                },
                {
                  label: "Р РѕСЃС‚",
                  value:
                    detail.onboarding?.height_cm !== null &&
                    detail.onboarding?.height_cm !== undefined
                      ? `${detail.onboarding.height_cm} СЃРј`
                      : "РќРµ Р·Р°РїРѕР»РЅРµРЅРѕ",
                },
                {
                  label: "Р’РµСЃ",
                  value:
                    detail.onboarding?.weight_kg !== null &&
                    detail.onboarding?.weight_kg !== undefined
                      ? `${detail.onboarding.weight_kg} РєРі`
                      : "РќРµ Р·Р°РїРѕР»РЅРµРЅРѕ",
                },
                {
                  label: "РЈСЂРѕРІРµРЅСЊ",
                  value: detail.onboarding?.fitness_level
                    ? fitnessLevelLabels[detail.onboarding.fitness_level] ??
                      detail.onboarding.fitness_level
                    : "РќРµ Р·Р°РїРѕР»РЅРµРЅРѕ",
                },
              ]}
            />

            <KeyValueCard
              title="РљРѕРЅС‚РµРєСЃС‚"
              rows={[
                {
                  label: "РћР±РѕСЂСѓРґРѕРІР°РЅРёРµ",
                  value: renderList(detail.onboarding?.equipment),
                },
                {
                  label: "РћРіСЂР°РЅРёС‡РµРЅРёСЏ",
                  value: renderList(detail.onboarding?.injuries),
                },
                {
                  label: "РџРёС‚Р°РЅРёРµ",
                  value: renderList(detail.onboarding?.dietary_preferences),
                },
              ]}
            />
          </div>
        </section>

        <div className="grid gap-6">
          <AdminRoleManager
            currentAdminRole={currentUserRole}
            currentUserEmail={currentUserEmail}
            isSelf={currentUserId === userId}
            onUpdated={() => setReloadVersion((current) => current + 1)}
            targetAdminRole={
              detail.adminRole?.role as PlatformAdminRole | null
            }
            userEmail={detail.authUser?.email ?? null}
            userId={userId}
          />

          <AdminUserActions
            currentAdminRole={currentUserRole}
            currentUserEmail={currentUserEmail}
            onUpdated={() => setReloadVersion((current) => current + 1)}
            userId={userId}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <div className="mb-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Workout
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              РЎС‚Р°С‚РёСЃС‚РёРєР° С‚СЂРµРЅРёСЂРѕРІРѕРє
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["РђРєС‚РёРІРЅС‹Рµ СѓРїСЂР°Р¶РЅРµРЅРёСЏ", String(detail.stats.workout.activeExercises)],
              ["РЁР°Р±Р»РѕРЅС‹", String(detail.stats.workout.templates)],
              ["РџСЂРѕРіСЂР°РјРјС‹", String(detail.stats.workout.programs)],
              ["РђРєС‚РёРІРЅС‹Рµ РЅРµРґРµР»Рё", String(detail.stats.workout.activePrograms)],
              ["Р—Р°РІРµСЂС€РµРЅРЅС‹Рµ РґРЅРё", String(detail.stats.workout.completedDays)],
              ["Р”РЅРё РІ РїСЂРѕС†РµСЃСЃРµ", String(detail.stats.workout.inProgressDays)],
              ["РЎРѕС…СЂР°РЅРµРЅРЅС‹Рµ РїРѕРґС…РѕРґС‹", String(detail.stats.workout.loggedSets)],
              ["РџРѕСЃР»РµРґРЅСЏСЏ Р°РєС‚РёРІРЅРѕСЃС‚СЊ", formatDateTime(detail.stats.workout.latestWorkoutAt)],
            ].map(([label, value]) => (
              <MetricCard key={label} label={label} value={value} />
            ))}
          </div>
        </section>

        <section className="card p-6">
          <div className="mb-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Nutrition
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              РЎС‚Р°С‚РёСЃС‚РёРєР° РїРёС‚Р°РЅРёСЏ
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["РџСЂРѕРґСѓРєС‚С‹", String(detail.stats.nutrition.foods)],
              ["РџСЂРёРµРјС‹ РїРёС‰Рё", String(detail.stats.nutrition.meals)],
              ["РџРѕР·РёС†РёРё РІ РїСЂРёРµРјР°С…", String(detail.stats.nutrition.mealItems)],
              ["Р РµС†РµРїС‚С‹", String(detail.stats.nutrition.recipes)],
              ["РЁР°Р±Р»РѕРЅС‹ РїРёС‚Р°РЅРёСЏ", String(detail.stats.nutrition.templates)],
              ["Nutrition days", String(detail.stats.nutrition.summaryDays)],
              ["РџРѕСЃР»РµРґРЅРёР№ meal log", formatDateTime(detail.stats.nutrition.latestMealAt)],
            ].map(([label, value]) => (
              <MetricCard key={label} label={label} value={value} />
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <div className="mb-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              AI
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              AI и база знаний
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Диалоги", String(detail.stats.ai.chatSessions)],
              ["Сообщения", String(detail.stats.ai.chatMessages)],
              ["Планы", String(detail.stats.ai.proposals)],
              ["События безопасности", String(detail.stats.ai.safetyEvents)],
              ["Снимки контекста", String(detail.stats.ai.contextSnapshots)],
              ["Фрагменты базы", String(detail.stats.ai.knowledgeChunks)],
              ["РџРѕСЃР»РµРґРЅРёР№ AI event", formatDateTime(detail.stats.ai.latestAiAt)],
            ].map(([label, value]) => (
              <MetricCard key={label} label={label} value={value} />
            ))}
          </div>
        </section>

        <section className="card p-6">
          <div className="mb-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Lifecycle
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Р”Р°РЅРЅС‹Рµ, Р±РёР»Р»РёРЅРі Рё Р¶РёР·РЅРµРЅРЅС‹Р№ С†РёРєР»
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Измерения тела", String(detail.stats.lifecycle.bodyMetrics)],
              ["Выгрузки", String(detail.stats.lifecycle.exportJobs)],
              ["Удаления", String(detail.stats.lifecycle.deletionRequests)],
              ["Подписки", String(detail.stats.lifecycle.subscriptions)],
              ["Доступы", String(detail.stats.lifecycle.entitlements)],
              ["Счётчики использования", String(detail.stats.lifecycle.usageCounters)],
              [
                "РџРѕСЃР»РµРґРЅРµРµ РѕР±РЅРѕРІР»РµРЅРёРµ РїСЂРѕС„РёР»СЏ",
                formatDateTime(detail.stats.lifecycle.latestProfileUpdateAt),
              ],
            ].map(([label, value]) => (
              <MetricCard key={label} label={label} value={value} />
            ))}
          </div>
        </section>
      </div>

      <section className="card p-6">
        <div className="mb-5">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Операции
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Очереди, выгрузки и ручные действия
          </h2>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="grid gap-4">
            <KeyValueCard
              title="Текущая выгрузка"
              rows={[
                {
                  label: "РЎС‚Р°С‚СѓСЃ",
                  value: formatStatus(detail.stats.lifecycle.latestExportJob?.status),
                },
                {
                  label: "Р¤РѕСЂРјР°С‚",
                  value:
                    detail.stats.lifecycle.latestExportJob?.format ?? "РќРµС‚ РґР°РЅРЅС‹С…",
                },
                {
                  label: "РљС‚Рѕ Р·Р°РїСЂРѕСЃРёР»",
                  value: getUserLabel(
                    detail.stats.lifecycle.latestExportJob?.requested_by_user ?? null,
                    detail.stats.lifecycle.latestExportJob?.requested_by ?? null,
                  ),
                },
                {
                  label: "РћР±РЅРѕРІР»РµРЅ",
                  value: formatDateTime(
                    detail.stats.lifecycle.latestExportJob?.updated_at,
                  ),
                },
              ]}
            />

            <KeyValueCard
              title="Текущий запрос на удаление"
              rows={[
                {
                  label: "РЎС‚Р°С‚СѓСЃ",
                  value: formatStatus(detail.stats.lifecycle.deletionRequest?.status),
                },
                {
                  label: "Удержание до",
                  value: formatDateTime(
                    detail.stats.lifecycle.deletionRequest?.hold_until,
                  ),
                },
                {
                  label: "РџРѕСЃР»РµРґРЅРёР№ РѕРїРµСЂР°С‚РѕСЂ",
                  value: getUserLabel(
                    detail.stats.lifecycle.deletionRequest?.requested_by_user ?? null,
                    detail.stats.lifecycle.deletionRequest?.requested_by ?? null,
                  ),
                },
                {
                  label: "РћР±РЅРѕРІР»РµРЅ",
                  value: formatDateTime(
                    detail.stats.lifecycle.deletionRequest?.updated_at,
                  ),
                },
              ]}
            />
          </div>

          <article className="rounded-3xl border border-border bg-white/60 p-4 text-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">История выгрузок</p>
                <p className="mt-1 text-xs text-muted">
                  РџРѕСЃР»РµРґРЅРёРµ РІС‹РіСЂСѓР·РєРё Рё РёС… С‚РµРєСѓС‰РёР№ СЃС‚Р°С‚СѓСЃ
                </p>
              </div>
              <div className="pill">{detail.recentExportJobs.length}</div>
            </div>

            <div className="grid gap-3">
              {detail.recentExportJobs.length ? (
                detail.recentExportJobs.map((job) => (
                  <div
                    className="rounded-2xl border border-border/80 bg-white/80 px-4 py-3"
                    key={job.id}
                  >
                    <p className="font-medium text-foreground">
                      {job.format} В· {formatStatus(job.status)}
                    </p>
                    <p className="mt-1 text-muted">
                      Р—Р°РїСЂРѕСЃРёР»:{" "}
                      <span className="text-foreground">
                        {getUserLabel(job.requested_by_user, job.requested_by)}
                      </span>
                    </p>
                    <p className="mt-1 text-muted">
                      РЎРѕР·РґР°РЅ:{" "}
                      <span className="text-foreground">
                        {formatDateTime(job.created_at)}
                      </span>
                    </p>
                    <p className="mt-1 text-muted">
                      РћР±РЅРѕРІР»РµРЅ:{" "}
                      <span className="text-foreground">
                        {formatDateTime(job.updated_at)}
                      </span>
                    </p>
                    {job.artifact_path ? (
                      <p className="mt-1 break-all text-muted">
                        Файл:{" "}
                        <span className="text-foreground">{job.artifact_path}</span>
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState>Р­РєСЃРїРѕСЂС‚РѕРІ РїРѕ СЌС‚РѕРјСѓ РїРѕР»СЊР·РѕРІР°С‚РµР»СЋ РїРѕРєР° РЅРµ Р±С‹Р»Рѕ.</EmptyState>
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-border bg-white/60 p-4 text-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">История служебных действий</p>
                <p className="mt-1 text-xs text-muted">
                  Очередь, решения и комментарии по ручным действиям
                </p>
              </div>
              <div className="pill">{detail.recentSupportActions.length}</div>
            </div>

            <div className="grid gap-3">
              {detail.recentSupportActions.length ? (
                detail.recentSupportActions.map((action) => {
                  const resolutionNote = getPayloadString(
                    action.payload,
                    "resolutionNote",
                  );
                  const resolvedAt = getPayloadString(action.payload, "resolvedAt");

                  return (
                    <div
                      className="rounded-2xl border border-border/80 bg-white/80 px-4 py-3"
                      key={action.id}
                    >
                      <p className="font-medium text-foreground">
                        {formatSupportAction(action.action)}
                      </p>
                      <p className="mt-1 text-muted">
                        РЎС‚Р°С‚СѓСЃ:{" "}
                        <span className="text-foreground">
                          {formatStatus(action.status)}
                        </span>
                      </p>
                      <p className="mt-1 text-muted">
                        РРЅРёС†РёР°С‚РѕСЂ:{" "}
                        <span className="text-foreground">
                          {getUserLabel(action.actor_user, action.actor_user_id)}
                        </span>
                      </p>
                      {action.resolved_by_user ? (
                        <p className="mt-1 text-muted">
                          Р—Р°РєСЂС‹Р»:{" "}
                          <span className="text-foreground">
                            {getUserLabel(action.resolved_by_user)}
                          </span>
                        </p>
                      ) : null}
                      {resolutionNote ? (
                        <p className="mt-1 text-muted">
                          Комментарий:{" "}
                          <span className="text-foreground">{resolutionNote}</span>
                        </p>
                      ) : null}
                      <p className="mt-1 text-muted">
                        РЎРѕР·РґР°РЅ:{" "}
                        <span className="text-foreground">
                          {formatDateTime(action.created_at)}
                        </span>
                      </p>
                      <p className="mt-1 text-muted">
                        РћР±РЅРѕРІР»РµРЅ:{" "}
                        <span className="text-foreground">
                          {formatDateTime(action.updated_at)}
                        </span>
                      </p>
                      {resolvedAt ? (
                        <p className="mt-1 text-muted">
                          Решено:{" "}
                          <span className="text-foreground">
                            {formatDateTime(resolvedAt)}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <EmptyState>Для этого пользователя пока не запускались служебные действия.</EmptyState>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="card p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              История операций
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Выгрузка данных и удаление аккаунта
            </h2>
          </div>
          <div className="pill">{detail.recentOperationAuditLogs.length}</div>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          {detail.recentOperationAuditLogs.length ? (
            detail.recentOperationAuditLogs.map((entry) => {
              const fromStatus = getPayloadString(entry.payload, "fromStatus");
              const toStatus = getPayloadString(entry.payload, "toStatus");
              const holdUntil = getPayloadString(entry.payload, "holdUntil");
              const format = getPayloadString(entry.payload, "format");
              const note = getPayloadString(entry.payload, "note");

              return (
                <article
                  className="rounded-2xl border border-border bg-white/60 p-4 text-sm"
                  key={entry.id}
                >
                  <p className="font-semibold text-foreground">
                    {formatAuditAction(entry.action)}
                  </p>
                  <p className="mt-1 text-muted">
                    РћРїРµСЂР°С‚РѕСЂ:{" "}
                    <span className="text-foreground">
                      {getUserLabel(entry.actor_user, entry.actor_user_id)}
                    </span>
                  </p>
                  <p className="mt-1 text-muted">
                    РљРѕРіРґР°:{" "}
                    <span className="text-foreground">
                      {formatDateTime(entry.created_at)}
                    </span>
                  </p>
                  {fromStatus || toStatus ? (
                    <p className="mt-1 text-muted">
                      РџРµСЂРµС…РѕРґ:{" "}
                      <span className="text-foreground">
                        {formatStatus(fromStatus)} в†’ {formatStatus(toStatus)}
                      </span>
                    </p>
                  ) : null}
                  {format ? (
                    <p className="mt-1 text-muted">
                      Р¤РѕСЂРјР°С‚: <span className="text-foreground">{format}</span>
                    </p>
                  ) : null}
                  {holdUntil ? (
                    <p className="mt-1 text-muted">
                      Удержание до:{" "}
                      <span className="text-foreground">
                        {formatDateTime(holdUntil)}
                      </span>
                    </p>
                  ) : null}
                  <p className="mt-1 text-muted">
                    РџСЂРёС‡РёРЅР°:{" "}
                    <span className="text-foreground">
                      {entry.reason ?? "Р‘РµР· РїРѕСЏСЃРЅРµРЅРёСЏ"}
                    </span>
                  </p>
                  {note ? (
                    <p className="mt-1 text-muted">
                      Комментарий: <span className="text-foreground">{note}</span>
                    </p>
                  ) : null}
                </article>
              );
            })
          ) : (
            <EmptyState>
              История выгрузок и удаления для этого пользователя пока пуста.
            </EmptyState>
          )}
        </div>
      </section>

      <section className="card p-6">
        <div className="mb-5">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Оплата и доступ
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Подписка, лимиты и история доступа
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KeyValueCard
            title="РўРµРєСѓС‰Р°СЏ РїРѕРґРїРёСЃРєР°"
            rows={[
              {
                label: "РЎС‚Р°С‚СѓСЃ",
                value: formatStatus(detail.stats.lifecycle.latestSubscription?.status),
              },
              {
                label: "РџСЂРѕРІР°Р№РґРµСЂ",
                value:
                  detail.stats.lifecycle.latestSubscription?.provider ?? "РќРµС‚ РґР°РЅРЅС‹С…",
              },
              {
                label: "РџРµСЂРёРѕРґ РґРѕ",
                value: formatDateTime(
                  detail.stats.lifecycle.latestSubscription?.current_period_end,
                ),
              },
              {
                label: "РћР±РЅРѕРІР»РµРЅРѕ",
                value: formatDateTime(
                  detail.stats.lifecycle.latestSubscription?.updated_at,
                ),
              },
            ]}
          />

          <KeyValueCard
            title="Данные Stripe"
            rows={[
              {
                label: "ID клиента",
                value:
                  detail.stats.lifecycle.latestSubscription?.provider_customer_id ??
                  "Р СњР ВµРЎвЂљ Р Т‘Р В°Р Р…Р Р…РЎвЂ№РЎвЂ¦",
              },
              {
                label: "ID подписки",
                value:
                  detail.stats.lifecycle.latestSubscription?.provider_subscription_id ??
                  "Р СњР ВµРЎвЂљ Р Т‘Р В°Р Р…Р Р…РЎвЂ№РЎвЂ¦",
              },
              {
                label: "Р СџР ВµРЎР‚Р С‘Р С•Р Т‘ РЎРѓ",
                value: formatDateTime(
                  detail.stats.lifecycle.latestSubscription?.current_period_start,
                ),
              },
              {
                label: "Тип провайдера",
                value:
                  detail.stats.lifecycle.latestSubscription?.provider === "stripe"
                    ? "Stripe"
                    : detail.stats.lifecycle.latestSubscription?.provider ??
                      "Р СњР ВµРЎвЂљ Р Т‘Р В°Р Р…Р Р…РЎвЂ№РЎвЂ¦",
              },
            ]}
          />

          <KeyValueCard
            title="Доступ и счётчики"
            rows={[
              {
                label: "Доступы",
                value: String(detail.stats.lifecycle.entitlements),
              },
              {
                label: "Счётчики использования",
                value: String(detail.stats.lifecycle.usageCounters),
              },
              {
                label: "Выгрузки",
                value: String(detail.stats.lifecycle.exportJobs),
              },
              {
                label: "Удаления",
                value: String(detail.stats.lifecycle.deletionRequests),
              },
            ]}
          />

          <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm md:col-span-2">
            <p className="font-semibold text-foreground">Открытые функции</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {detail.stats.lifecycle.recentEntitlements.length ? (
                detail.stats.lifecycle.recentEntitlements.map((entitlement) => (
                  <div
                    className="rounded-2xl border border-border/80 bg-white/80 px-4 py-3"
                    key={entitlement.id}
                  >
                    <p className="font-medium text-foreground">
                      {entitlement.feature_key}
                    </p>
                    <p className="mt-1 text-muted">
                      РЎС‚Р°С‚СѓСЃ:{" "}
                      <span className="text-foreground">
                        {entitlement.is_enabled ? "включено" : "выключено"}
                      </span>
                    </p>
                    <p className="mt-1 text-muted">
                      Р›РёРјРёС‚:{" "}
                      <span className="text-foreground">
                        {entitlement.limit_value ?? "Р±РµР· Р»РёРјРёС‚Р°"}
                      </span>
                    </p>
                    <p className="mt-1 text-muted">
                      РћР±РЅРѕРІР»РµРЅРѕ:{" "}
                      <span className="text-foreground">
                        {formatDateTime(entitlement.updated_at)}
                      </span>
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState>Для этого пользователя пока нет настроенных доступов.</EmptyState>
              )}
            </div>
          </article>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
            <p className="font-semibold text-foreground">Счётчики использования</p>
            <div className="mt-3 grid gap-3">
              {detail.stats.lifecycle.recentUsageCounters.length ? (
                detail.stats.lifecycle.recentUsageCounters.map((counter) => (
                  <div
                    className="rounded-2xl border border-border/80 bg-white/80 px-4 py-3"
                    key={counter.id}
                  >
                    <p className="font-medium text-foreground">
                      {counter.metric_key}
                    </p>
                    <p className="mt-1 text-muted">
                      Период:{" "}
                      <span className="text-foreground">{counter.metric_window}</span>
                    </p>
                    <p className="mt-1 text-muted">
                      Использовано:{" "}
                      <span className="text-foreground">{counter.usage_count}</span>
                    </p>
                    <p className="mt-1 text-muted">
                      Сброс:{" "}
                      <span className="text-foreground">
                        {formatDateTime(counter.reset_at)}
                      </span>
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState>Счётчики использования пока не созданы.</EmptyState>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
            <p className="font-semibold text-foreground">История подписки</p>
            <div className="mt-3 grid gap-3">
              {detail.stats.lifecycle.recentSubscriptionEvents.length ? (
                detail.stats.lifecycle.recentSubscriptionEvents.map((event) => (
                  <div
                    className="rounded-2xl border border-border/80 bg-white/80 px-4 py-3"
                    key={event.id}
                  >
                    <p className="font-medium text-foreground">
                      {formatSnakeLabel(event.event_type)}
                    </p>
                    <p className="mt-1 text-muted">
                      Когда:{" "}
                      <span className="text-foreground">
                        {formatDateTime(event.created_at)}
                      </span>
                    </p>
                    <p className="mt-1 text-muted">
                      Кто изменил:{" "}
                      <span className="text-foreground">
                        {getUserLabel(event.actor_user, event.actor_user_id)}
                      </span>
                    </p>
                    <p className="mt-1 text-muted">
                      Статус:{" "}
                      <span className="text-foreground">
                        {formatStatus(getPayloadString(event.payload, "status"))}
                      </span>
                    </p>
                    {getPayloadString(event.payload, "provider") ? (
                      <p className="mt-1 text-muted">
                        Провайдер:{" "}
                        <span className="text-foreground">
                          {getPayloadString(event.payload, "provider")}
                        </span>
                      </p>
                    ) : null}
                    {getPayloadString(event.payload, "batchId") ? (
                      <p className="mt-1 text-muted">
                        Пакет:{" "}
                        <span className="text-foreground">
                          {getPayloadString(event.payload, "batchId")}
                        </span>
                      </p>
                    ) : null}
                    {getPayloadString(event.payload, "providerSubscriptionId") ? (
                      <p className="mt-1 break-all text-muted">
                        ID подписки:{" "}
                        <span className="text-foreground">
                          {getPayloadString(event.payload, "providerSubscriptionId")}
                        </span>
                      </p>
                    ) : null}
                    {getPayloadString(event.payload, "providerCustomerId") ? (
                      <p className="mt-1 break-all text-muted">
                        ID клиента:{" "}
                        <span className="text-foreground">
                          {getPayloadString(event.payload, "providerCustomerId")}
                        </span>
                      </p>
                    ) : null}
                    {event.provider_event_id ? (
                      <p className="mt-1 break-all text-muted">
                        ID события:{" "}
                        <span className="text-foreground">
                          {event.provider_event_id}
                        </span>
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState>События по подписке пока не зафиксированы.</EmptyState>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="card p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Аудит
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Последние административные изменения
            </h2>
          </div>
          <div className="pill">{detail.recentAdminAuditLogs.length}</div>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          {detail.recentAdminAuditLogs.length ? (
            detail.recentAdminAuditLogs.map((entry) => (
              <article
                className="rounded-2xl border border-border bg-white/60 p-4 text-sm"
                key={entry.id}
              >
                <p className="font-semibold text-foreground">
                  {formatAuditAction(entry.action)}
                </p>
                <p className="mt-1 text-muted">
                  РћРїРµСЂР°С‚РѕСЂ:{" "}
                  <span className="text-foreground">
                    {getUserLabel(entry.actor_user, entry.actor_user_id)}
                  </span>
                </p>
                <p className="mt-1 text-muted">
                  РџСЂРёС‡РёРЅР°:{" "}
                  <span className="text-foreground">
                    {entry.reason ?? "Р‘РµР· РїРѕСЏСЃРЅРµРЅРёСЏ"}
                  </span>
                </p>
                <p className="mt-1 text-muted">
                  РљРѕРіРґР°:{" "}
                  <span className="text-foreground">
                    {formatDateTime(entry.created_at)}
                  </span>
                </p>
                {getPayloadStringList(entry.payload, "requestedFeatures").length ? (
                  <p className="mt-1 text-muted">
                    Запрошенные функции:{" "}
                    <span className="text-foreground">
                      {getPayloadStringList(entry.payload, "requestedFeatures")
                        .map(formatSnakeLabel)
                        .join(", ")}
                    </span>
                  </p>
                ) : null}
                {getPayloadString(entry.payload, "paymentStatus") ? (
                  <p className="mt-1 text-muted">
                    Статус оплаты:{" "}
                    <span className="text-foreground">
                      {getPayloadString(entry.payload, "paymentStatus")}
                    </span>
                  </p>
                ) : null}
                {getPayloadString(entry.payload, "sessionStatus") ? (
                  <p className="mt-1 text-muted">
                    Статус сессии:{" "}
                    <span className="text-foreground">
                      {getPayloadString(entry.payload, "sessionStatus")}
                    </span>
                  </p>
                ) : null}
                {getPayloadBoolean(entry.payload, "reconciled") !== null ? (
                  <p className="mt-1 text-muted">
                    Синхронизировано:{" "}
                    <span className="text-foreground">
                      {getPayloadBoolean(entry.payload, "reconciled")
                        ? "да"
                        : "нет"}
                    </span>
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState>
              Для этого пользователя пока нет административных изменений и смен ролей.
            </EmptyState>
          )}
        </div>
      </section>
    </div>
  );
}

