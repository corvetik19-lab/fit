"use client";

import type { Route } from "next";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  canUseRootAdminControls,
  type PlatformAdminRole,
} from "@/lib/admin-permissions";

type AdminRole = "super_admin" | "support_admin" | "analyst" | null;
type ActivityBucket = "today" | "seven_days" | "thirty_days" | "stale" | "never";
type ActivitySource = "workout" | "nutrition" | "ai" | "auth" | "profile" | null;
type ActivityFilter =
  | "all"
  | "active_7d"
  | "idle_30d"
  | "never_signed_in"
  | "backlog"
  | "paid";
type AdminUsersSortKey =
  | "created_desc"
  | "activity_desc"
  | "sign_in_desc"
  | "workout_desc"
  | "ai_desc"
  | "backlog_desc";
type BulkAction =
  | "queue_export"
  | "queue_resync"
  | "queue_suspend"
  | "grant_trial"
  | "enable_entitlement";

type AdminUserRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  admin_role: AdminRole;
  activity: {
    bucket: ActivityBucket;
    last_activity_at: string | null;
    source: ActivitySource;
  };
  workout: {
    active_programs: number;
    completed_days: number;
    in_progress_days: number;
    logged_sets: number;
    last_workout_at: string | null;
  };
  nutrition: {
    meals: number;
    last_meal_at: string | null;
  };
  ai: {
    messages: number;
    last_ai_at: string | null;
  };
  operations: {
    pending_support_actions: number;
    export_status: string | null;
    export_updated_at: string | null;
    deletion_status: string | null;
    deletion_hold_until: string | null;
    deletion_updated_at: string | null;
    has_backlog: boolean;
  };
  billing: {
    subscription_status: string | null;
    subscription_provider: string | null;
    current_period_end: string | null;
    is_active: boolean;
  };
  flags: {
    has_profile: boolean;
    never_signed_in: boolean;
    is_primary_super_admin: boolean;
  };
};

type AdminUsersSummary = {
  totalUsers: number;
  filteredUsers: number;
  adminCounts: {
    superAdmins: number;
    supportAdmins: number;
    analysts: number;
  };
  activityBuckets: {
    today: number;
    sevenDays: number;
    thirtyDays: number;
    stale: number;
    never: number;
  };
  operations: {
    usersWithBacklog: number;
    pendingSupportActions: number;
    queuedExports: number;
    activeDeletionHolds: number;
  };
  billing: {
    activeSubscriptions: number;
    paidButStale: number;
  };
  hygiene: {
    neverSignedIn: number;
    withoutProfile: number;
    rootPolicyViolations: number;
  };
};

type AdminUsersSegments = {
  priorityQueue: Array<{
    user_id: string;
    display_name: string;
    email: string | null;
    admin_role: NonNullable<AdminRole> | "user";
    activity_bucket: ActivityBucket;
    pending_support_actions: number;
    export_status: string | null;
    deletion_status: string | null;
    subscription_status: string | null;
  }>;
  inactivePaid: Array<{
    user_id: string;
    display_name: string;
    email: string | null;
    activity_bucket: ActivityBucket;
    last_activity_at: string | null;
    subscription_status: string | null;
    current_period_end: string | null;
  }>;
  newestUsers: Array<{
    user_id: string;
    display_name: string;
    email: string | null;
    created_at: string;
    never_signed_in: boolean;
    has_profile: boolean;
  }>;
  topWorkoutUsers: Array<{
    user_id: string;
    display_name: string;
    email: string | null;
    logged_sets: number;
    completed_days: number;
    active_programs: number;
  }>;
};

type RecentBulkWave = {
  action: string;
  actor_user_id: string | null;
  batch_id: string | null;
  created_at: string;
  failed: number;
  id: string;
  processed: number;
  reason: string | null;
  succeeded: number;
  user_count: number;
};

const emptySummary: AdminUsersSummary = {
  totalUsers: 0,
  filteredUsers: 0,
  adminCounts: {
    superAdmins: 0,
    supportAdmins: 0,
    analysts: 0,
  },
  activityBuckets: {
    today: 0,
    sevenDays: 0,
    thirtyDays: 0,
    stale: 0,
    never: 0,
  },
  operations: {
    usersWithBacklog: 0,
    pendingSupportActions: 0,
    queuedExports: 0,
    activeDeletionHolds: 0,
  },
  billing: {
    activeSubscriptions: 0,
    paidButStale: 0,
  },
  hygiene: {
    neverSignedIn: 0,
    withoutProfile: 0,
    rootPolicyViolations: 0,
  },
};

const emptySegments: AdminUsersSegments = {
  priorityQueue: [],
  inactivePaid: [],
  newestUsers: [],
  topWorkoutUsers: [],
};

const createdAtFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const roleLabels: Record<NonNullable<AdminRole> | "user", string> = {
  super_admin: "Супер-админ",
  support_admin: "Поддержка",
  analyst: "Аналитик",
  user: "Пользователь",
};

const activityLabels: Record<ActivityBucket, string> = {
  today: "Активен сегодня",
  seven_days: "Активен 7 дней",
  thirty_days: "Активен 30 дней",
  stale: "Тишина 30+ дней",
  never: "Нет сигналов",
};

const activitySourceLabels: Record<Exclude<ActivitySource, null>, string> = {
  workout: "тренировки",
  nutrition: "питание",
  ai: "ИИ",
  auth: "авторизация",
  profile: "профиль",
};

const activityToneClasses: Record<ActivityBucket, string> = {
  today: "border-emerald-300/70 bg-emerald-50 text-emerald-800",
  seven_days: "border-sky-300/70 bg-sky-50 text-sky-800",
  thirty_days: "border-amber-300/70 bg-amber-50 text-amber-800",
  stale: "border-rose-300/70 bg-rose-50 text-rose-800",
  never: "border-slate-300/70 bg-slate-100 text-slate-700",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Нет данных";
  }

  return createdAtFormatter.format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Нет данных";
  }

  return dateTimeFormatter.format(new Date(value));
}

function formatStatus(value: string | null) {
  if (!value) {
    return "нет";
  }

  return value.replaceAll("_", " ");
}

function formatBulkAction(value: string) {
  switch (value) {
    case "queue_export":
      return "Поставить выгрузку";
    case "queue_resync":
      return "Пересобрать контекст";
    case "queue_suspend":
      return "Ограничить аккаунт";
    case "grant_trial":
      return "Выдать пробный доступ";
    case "enable_entitlement":
      return "Открыть доступ к функции";
    default:
      return value.replaceAll("_", " ");
  }
}

function DirectoryMetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="rounded-3xl border border-border bg-white/72 p-5 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.28)]">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-muted">{detail}</p> : null}
    </article>
  );
}

export function AdminUsersDirectory({
  currentAdminRole,
  currentUserEmail,
}: {
  currentAdminRole: PlatformAdminRole;
  currentUserEmail: string | null;
}) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [catalogSummary, setCatalogSummary] =
    useState<AdminUsersSummary>(emptySummary);
  const [segments, setSegments] = useState<AdminUsersSegments>(emptySegments);
  const [recentBulkWaves, setRecentBulkWaves] = useState<RecentBulkWave[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "super_admin" | "support_admin" | "analyst" | "user"
  >("all");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [sortKey, setSortKey] = useState<AdminUsersSortKey>("created_desc");
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>("queue_export");
  const [bulkReason, setBulkReason] = useState("");
  const [bulkTrialDays, setBulkTrialDays] = useState("14");
  const [bulkFeatureKey, setBulkFeatureKey] = useState("ai_chat");
  const [bulkLimitValue, setBulkLimitValue] = useState("");
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);
  const [isBulkPending, setIsBulkPending] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const canRunBulkActions = canUseRootAdminControls(
    currentAdminRole,
    currentUserEmail,
  );

  useEffect(() => {
    let isActive = true;

    async function loadUsers() {
      setIsLoading(true);

      try {
        const searchParams = new URLSearchParams();

        if (deferredSearchQuery.trim()) {
          searchParams.set("q", deferredSearchQuery.trim());
        }

        if (roleFilter !== "all") {
          searchParams.set("role", roleFilter);
        }

        if (activityFilter !== "all") {
          searchParams.set("activity", activityFilter);
        }

        if (sortKey !== "created_desc") {
          searchParams.set("sort", sortKey);
        }

        const queryString = searchParams.toString();
        const response = await fetch(
          queryString ? `/api/admin/users?${queryString}` : "/api/admin/users",
          {
            cache: "no-store",
          },
        );
        const payload = (await response.json().catch(() => null)) as
          | {
              data?: AdminUserRow[];
              message?: string;
              summary?: AdminUsersSummary;
              segments?: AdminUsersSegments;
              recentBulkWaves?: RecentBulkWave[];
            }
          | null;

        if (!response.ok) {
          if (isActive) {
            setError(payload?.message ?? "Не удалось загрузить пользователей.");
            setUsers([]);
            setCatalogSummary(emptySummary);
            setSegments(emptySegments);
            setRecentBulkWaves([]);
          }
          return;
        }

        if (isActive) {
          setUsers(payload?.data ?? []);
          setCatalogSummary(payload?.summary ?? emptySummary);
          setSegments(payload?.segments ?? emptySegments);
          setRecentBulkWaves(payload?.recentBulkWaves ?? []);
          setSelectedUserIds((currentSelected) =>
            currentSelected.filter((id) =>
              (payload?.data ?? []).some((user) => user.user_id === id),
            ),
          );
          setError(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      isActive = false;
    };
  }, [activityFilter, deferredSearchQuery, reloadToken, roleFilter, sortKey]);

  const summary = useMemo(() => {
    return {
      total: users.length,
      superAdmins: catalogSummary.adminCounts.superAdmins,
      supportAdmins: catalogSummary.adminCounts.supportAdmins,
      analysts: catalogSummary.adminCounts.analysts,
      active7d: users.filter((user) =>
        user.activity.bucket === "today" || user.activity.bucket === "seven_days",
      ).length,
      backlog: users.filter((user) => user.operations.has_backlog).length,
      neverSignedIn: users.filter((user) => user.flags.never_signed_in).length,
      paid: users.filter((user) => user.billing.is_active).length,
    };
  }, [catalogSummary.adminCounts, users]);

  const isFiltered =
    Boolean(searchQuery.trim()) || roleFilter !== "all" || activityFilter !== "all";
  const visibleUserIds = users.map((user) => user.user_id);
  const allVisibleSelected =
    visibleUserIds.length > 0 &&
    visibleUserIds.every((id) => selectedUserIds.includes(id));
  const activeFilterSummary = [
    searchQuery.trim() ? `Поиск: ${searchQuery.trim()}` : null,
    roleFilter !== "all" ? `Роль: ${roleLabels[roleFilter] ?? roleFilter}` : null,
    activityFilter !== "all"
      ? `Активность: ${activityFilter.replaceAll("_", " ")}`
      : null,
    sortKey !== "created_desc" ? `Сортировка: ${sortKey.replaceAll("_", " ")}` : null,
  ].filter((item): item is string => Boolean(item));

  function toggleUserSelection(userId: string) {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((value) => value !== userId)
        : [...current, userId],
    );
  }

  function toggleVisibleSelection() {
    setSelectedUserIds((current) => {
      const allVisibleSelectedForCurrentView =
        visibleUserIds.length > 0 &&
        visibleUserIds.every((id) => current.includes(id));

      if (allVisibleSelectedForCurrentView) {
        return current.filter((id) => !visibleUserIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleUserIds]));
    });
  }

  function submitBulkAction() {
    if (!canRunBulkActions || !selectedUserIds.length) {
      return;
    }

    setError(null);
    setBulkNotice(null);
    setIsBulkPending(true);

    const body: Record<string, unknown> = {
      action: bulkAction,
      reason: bulkReason.trim() || undefined,
      user_ids: selectedUserIds,
    };

    if (bulkAction === "grant_trial") {
      body.duration_days = Number(bulkTrialDays) || 14;
    }

    if (bulkAction === "enable_entitlement") {
      body.feature_key = bulkFeatureKey.trim();
      body.limit_value = bulkLimitValue.trim() === "" ? null : Number(bulkLimitValue);
    }

    void (async () => {
      try {
        const response = await fetch("/api/admin/users/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        const payload = (await response.json().catch(() => null)) as
          | {
              data?: { succeeded?: number; failed?: number };
              message?: string;
            }
          | null;

        if (!response.ok) {
          setError(payload?.message ?? "Не удалось выполнить массовое действие.");
          return;
        }

        setBulkNotice(
          `Готово: ${payload?.data?.succeeded ?? 0} успешно, ${payload?.data?.failed ?? 0} с ошибкой.`,
        );
        setSelectedUserIds([]);
        setReloadToken((value) => value + 1);
      } finally {
        setIsBulkPending(false);
      }
    })();
  }

  if (isLoading) {
    return (
      <section className="card p-6">
        <p className="text-sm text-muted">Загружаю операционную панель пользователей...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card p-6">
        <p className="rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      </section>
    );
  }

  return (
    <section className="card p-6 sm:p-8">
      <div className="grid gap-6 2xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className="pill">Пользователи</span>
            <span className="pill">Каталог: {summary.total}</span>
              <span className="pill">Роль: {roleLabels[currentAdminRole] ?? currentAdminRole}</span>
              {canRunBulkActions ? <span className="pill">Главный доступ</span> : null}
          </div>

          <div className="space-y-3">
            <h2 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Пользователи, доступы, подписки и очередь действий в одном рабочем экране.
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
              Здесь удобно искать пользователя, смотреть его активность, состояние подписки,
              очередь задач и сразу переходить в подробную карточку без служебного шума и лишних экранов.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              onClick={() => setReloadToken((value) => value + 1)}
              type="button"
            >
              Обновить каталог
            </button>
            {isFiltered ? (
              <button
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("all");
                  setActivityFilter("all");
                  setSortKey("created_desc");
                }}
                type="button"
              >
                Сбросить фильтры
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DirectoryMetricCard
            detail="активные профили в текущем представлении"
            label="Видимых пользователей"
            value={String(summary.total)}
          />
          <DirectoryMetricCard
            detail="пользователи с задачами по поддержке, выгрузке или удалению"
            label="С очередью"
            value={String(summary.backlog)}
          />
          <DirectoryMetricCard
            detail="роль закреплена только за corvetik1@yandex.ru"
            label="Главный администратор"
            value={String(summary.superAdmins)}
          />
          <DirectoryMetricCard
            detail="пользователи с активной подпиской или пробным доступом"
            label="Платящие и пробные"
            value={String(summary.paid)}
          />
        </div>
      </div>

      <div className="mt-6 rounded-[30px] border border-border bg-white/72 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Фильтры
            </p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">
              Быстрый отбор по роли, активности и риску
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilterSummary.length ? (
              activeFilterSummary.map((item) => (
                <span className="pill" key={item}>
                  {item}
                </span>
              ))
            ) : (
              <span className="pill">Без дополнительных фильтров</span>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_220px_220px_220px]">
        <label className="grid gap-2 text-sm text-muted lg:col-span-1">
          Поиск по имени, email или ID
          <input
            className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Например: corvetik1@yandex.ru"
            type="text"
            value={searchQuery}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Роль
          <select
            className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            onChange={(event) =>
              setRoleFilter(
                event.target.value as
                  | "all"
                  | "super_admin"
                  | "support_admin"
                  | "analyst"
                  | "user",
              )
            }
            value={roleFilter}
          >
            <option value="all">Все роли</option>
            <option value="super_admin">Супер-админ</option>
            <option value="support_admin">Поддержка</option>
            <option value="analyst">Аналитик</option>
            <option value="user">Пользователь</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Активность
          <select
            className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            onChange={(event) => setActivityFilter(event.target.value as ActivityFilter)}
            value={activityFilter}
          >
            <option value="all">Все сигналы</option>
            <option value="active_7d">Активны за 7 дней</option>
            <option value="idle_30d">Тишина 30+ дней</option>
            <option value="never_signed_in">Без входов</option>
            <option value="backlog">Только с очередью</option>
            <option value="paid">С активной подпиской</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Сортировка
          <select
            className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            onChange={(event) => setSortKey(event.target.value as AdminUsersSortKey)}
            value={sortKey}
          >
            <option value="created_desc">Сначала новые</option>
            <option value="activity_desc">По активности</option>
            <option value="sign_in_desc">По последнему входу</option>
            <option value="workout_desc">По тренировкам</option>
            <option value="ai_desc">По сигналам ИИ</option>
            <option value="backlog_desc">По очереди и подписке</option>
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-6">
        {[
          ["Найдено", String(summary.total), "пользователей по текущему срезу"],
          ["Активны 7 дней", String(summary.active7d), "живая пользовательская активность"],
          ["С очередью", String(summary.backlog), "поддержка, выгрузка и удаление"],
          ["Без входов", String(summary.neverSignedIn), "аккаунты без авторизации"],
          ["Платящие", String(summary.paid), "активная подписка или пробный период"],
          [
            "Админ-аккаунты",
            String(summary.superAdmins + summary.supportAdmins + summary.analysts),
            "операционный контур доступа",
          ],
        ].map(([label, value, detail]) => (
          <DirectoryMetricCard
            detail={detail}
            key={label}
            label={label}
            value={value}
          />
        ))}
      </div>
      </div>

      <div className="mt-6 grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[30px] border border-sky-300/60 bg-sky-50/85 p-5 text-sm text-sky-900">
            <p className="font-semibold text-foreground">
              Политика главного администратора закреплена и в системе, и в базе.
            </p>
            <p className="mt-2 leading-7">
              Главный доступ закреплён за <strong>{PRIMARY_SUPER_ADMIN_EMAIL}</strong>.
              Остальным пользователям можно выдавать только обычные административные
              роли, поэтому главный доступ не потеряется случайно.
            </p>
          </article>

        <article className="rounded-[30px] border border-border bg-white/72 p-5 text-sm">
          <p className="font-semibold text-foreground">Что видно в одном экране</p>
          <p className="mt-2 leading-7 text-muted">
            Активность по тренировкам, питанию и ИИ, очередь задач, выгрузка данных, удаление,
            состояние подписки и пользователи, которым нужна проверка в первую очередь.
          </p>
        </article>
      </div>

      <div className="mt-6 grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[30px] border border-border bg-white/72 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                Массовые действия
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                Массовые действия по выбранным пользователям
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="pill">Выбрано: {selectedUserIds.length}</span>
              <button
                className="inline-flex rounded-full border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-white/70"
                onClick={toggleVisibleSelection}
                type="button"
              >
                {allVisibleSelected ? "Снять видимые" : "Выбрать видимые"}
              </button>
              <button
                className="inline-flex rounded-full border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-white/70"
                onClick={() => setSelectedUserIds([])}
                type="button"
              >
                Очистить
              </button>
            </div>
          </div>

          {!canRunBulkActions ? (
            <p className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Массовые действия доступны только основному супер-админу `corvetik1@yandex.ru`.
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr_220px_220px]">
          <label className="grid gap-2 text-sm text-muted">
            Действие
            <select
              className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
              disabled={!canRunBulkActions || isBulkPending}
              onChange={(event) => setBulkAction(event.target.value as BulkAction)}
              value={bulkAction}
            >
              <option value="queue_export">Поставить выгрузку</option>
              <option value="queue_resync">Пересобрать контекст</option>
              <option value="queue_suspend">Ограничить аккаунт</option>
              <option value="grant_trial">Выдать пробный доступ</option>
              <option value="enable_entitlement">Открыть доступ к функции</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm text-muted">
            Причина
            <input
              className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
              disabled={!canRunBulkActions || isBulkPending}
              onChange={(event) => setBulkReason(event.target.value)}
              placeholder="Например: весенний триал или повторная синхронизация"
              type="text"
              value={bulkReason}
            />
          </label>

          <label className="grid gap-2 text-sm text-muted">
                Дней доступа
            <input
              className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
              disabled={!canRunBulkActions || isBulkPending || bulkAction !== "grant_trial"}
              onChange={(event) => setBulkTrialDays(event.target.value)}
              placeholder="14"
              type="number"
              value={bulkTrialDays}
            />
          </label>

          <label className="grid gap-2 text-sm text-muted">
                Функция
            <input
              className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
              disabled={!canRunBulkActions || isBulkPending || bulkAction !== "enable_entitlement"}
              onChange={(event) => setBulkFeatureKey(event.target.value)}
              placeholder="Например: ai_chat"
              type="text"
              value={bulkFeatureKey}
            />
          </label>
          </div>

          {bulkAction === "enable_entitlement" ? (
            <div className="mt-3 grid gap-3 lg:grid-cols-[220px_1fr]">
              <label className="grid gap-2 text-sm text-muted">
                Лимит
                <input
                  className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                  disabled={!canRunBulkActions || isBulkPending}
                  onChange={(event) => setBulkLimitValue(event.target.value)}
                  placeholder="1000"
                  type="number"
                  value={bulkLimitValue}
                />
              </label>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canRunBulkActions || isBulkPending || !selectedUserIds.length}
              onClick={submitBulkAction}
              type="button"
            >
              {isBulkPending ? "Обработка..." : "Запустить действие"}
            </button>
            {bulkNotice ? (
              <p className="rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {bulkNotice}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[30px] border border-border bg-white/72 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                История массовых действий
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                Последние групповые операции
              </h3>
            </div>
            <div className="pill">{recentBulkWaves.length}</div>
          </div>

          <div className="mt-4 grid gap-3">
            {recentBulkWaves.length ? (
              recentBulkWaves.map((wave) => (
                <article
                  className="rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm"
                  key={wave.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{formatBulkAction(wave.action)}</p>
                      <p className="mt-1 text-muted">
                        Пакет: {wave.batch_id ?? "нет"} · {formatDateTime(wave.created_at)}
                      </p>
                      <p className="mt-1 text-muted">
                        Причина: {wave.reason ?? "без причины"}
                      </p>
                    </div>
                    <div className="text-left text-sm text-muted sm:text-right">
                      <p className="font-semibold text-foreground">
                        {wave.succeeded}/{wave.processed}
                      </p>
                      <p className="mt-1">успешно / обработано</p>
                      <p className="mt-1">
                        ошибок: {wave.failed} · пользователей: {wave.user_count}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm leading-7 text-muted">
                История массовых действий пока пуста.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[28px] border border-border bg-white/70 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                Cohorts
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                Распределение по активности и качеству данных
              </h3>
            </div>
            <div className="pill">Всего: {catalogSummary.totalUsers}</div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: "Сегодня",
                value: catalogSummary.activityBuckets.today,
                bucket: "today" as ActivityBucket,
              },
              {
                label: "7 дней",
                value: catalogSummary.activityBuckets.sevenDays,
                bucket: "seven_days" as ActivityBucket,
              },
              {
                label: "30 дней",
                value: catalogSummary.activityBuckets.thirtyDays,
                bucket: "thirty_days" as ActivityBucket,
              },
              {
                label: "30+ дней",
                value: catalogSummary.activityBuckets.stale,
                bucket: "stale" as ActivityBucket,
              },
              {
                label: "Нет сигналов",
                value: catalogSummary.activityBuckets.never,
                bucket: "never" as ActivityBucket,
              },
            ].map(({ label, value, bucket }) => (
              <button
                className={`rounded-2xl border px-4 py-4 text-left transition hover:translate-y-[-1px] ${activityToneClasses[bucket]}`}
                key={label}
                onClick={() => {
                  if (bucket === "today" || bucket === "seven_days") {
                    setActivityFilter("active_7d");
                    return;
                  }

                  if (bucket === "stale") {
                    setActivityFilter("idle_30d");
                    return;
                  }

                  if (bucket === "never") {
                    setActivityFilter("never_signed_in");
                    return;
                  }

                  setActivityFilter("all");
                }}
                type="button"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                  {label}
                </p>
                <p className="mt-3 text-2xl font-semibold">{value}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              ["Без профиля", catalogSummary.hygiene.withoutProfile],
              ["Без входов", catalogSummary.hygiene.neverSignedIn],
              ["Нарушения главного доступа", catalogSummary.hygiene.rootPolicyViolations],
            ].map(([label, value]) => (
              <div
                className="rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm"
                key={label}
              >
                <p className="text-muted">{label}</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-border bg-white/70 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                Операции
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                Главные приоритеты
              </h3>
            </div>
            <button
              className="inline-flex rounded-full border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-white/70"
              onClick={() => setActivityFilter("backlog")}
              type="button"
            >
              Показать очередь
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["Пользователей с очередью", catalogSummary.operations.usersWithBacklog],
              ["Служебных задач в очереди", catalogSummary.operations.pendingSupportActions],
              ["Активных выгрузок", catalogSummary.operations.queuedExports],
              ["Активных удержаний удаления", catalogSummary.operations.activeDeletionHolds],
              ["Активных подписок", catalogSummary.billing.activeSubscriptions],
              ["Платящих без активности", catalogSummary.billing.paidButStale],
            ].map(([label, value]) => (
              <div
                className="rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm"
                key={label}
              >
                <p className="text-muted">{label}</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-2">
        <article className="rounded-[28px] border border-border bg-white/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                Приоритет
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                Кого нужно разбирать сейчас
              </h3>
            </div>
            <div className="pill">{segments.priorityQueue.length}</div>
          </div>

          <div className="mt-4 grid gap-3">
            {segments.priorityQueue.length ? (
              segments.priorityQueue.map((user) => (
                <Link
                  className="rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm transition hover:border-accent/40 hover:bg-white"
                  href={`/admin/users/${user.user_id}` as Route}
                  key={user.user_id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{user.display_name}</p>
                      <p className="mt-1 break-all text-muted">
                        {user.email ?? user.user_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {roleLabels[user.admin_role] ?? user.admin_role}
                      </p>
                      <p className="mt-1 text-muted">
                        В очереди: {user.pending_support_actions}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${activityToneClasses[user.activity_bucket]}`}
                    >
                      {activityLabels[user.activity_bucket]}
                    </span>
                    <span className="pill">Выгрузка: {formatStatus(user.export_status)}</span>
                    <span className="pill">
                      Удаление: {formatStatus(user.deletion_status)}
                    </span>
                    <span className="pill">
                      Подписка: {formatStatus(user.subscription_status)}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm leading-7 text-muted">
                Сейчас нет пользователей с очередью задач.
              </p>
            )}
          </div>
        </article>

        <div className="grid gap-4">
          <article className="rounded-[28px] border border-border bg-white/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                  Риск оплаты
                </p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">
                  Платящие без активности
                </h3>
              </div>
              <button
                className="inline-flex rounded-full border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-white/70"
                onClick={() => setActivityFilter("paid")}
                type="button"
              >
                Показать платящих
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {segments.inactivePaid.length ? (
                segments.inactivePaid.map((user) => (
                  <Link
                    className="rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm transition hover:border-accent/40 hover:bg-white"
                    href={`/admin/users/${user.user_id}` as Route}
                    key={user.user_id}
                  >
                    <p className="font-semibold text-foreground">{user.display_name}</p>
                    <p className="mt-1 break-all text-muted">{user.email ?? user.user_id}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${activityToneClasses[user.activity_bucket]}`}
                      >
                        {activityLabels[user.activity_bucket]}
                      </span>
                      <span className="pill">
                        Подписка: {formatStatus(user.subscription_status)}
                      </span>
                      <span className="pill">
                        Активность: {formatDateTime(user.last_activity_at)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm leading-7 text-muted">
                  Платящих пользователей без активности сейчас нет.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-[28px] border border-border bg-white/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                  Новые и активные
                </p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">
                  Новые аккаунты и самые активные в тренировках
                </h3>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="grid gap-3">
                {segments.newestUsers.map((user) => (
                  <Link
                    className="rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm transition hover:border-accent/40 hover:bg-white"
                    href={`/admin/users/${user.user_id}` as Route}
                    key={user.user_id}
                  >
                    <p className="font-semibold text-foreground">{user.display_name}</p>
                    <p className="mt-1 break-all text-muted">{user.email ?? user.user_id}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="pill">Создан: {formatDate(user.created_at)}</span>
                      {user.never_signed_in ? (
                        <span className="pill">Без входов</span>
                      ) : null}
                      {!user.has_profile ? (
                        <span className="pill">Без профиля</span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>

              <div className="grid gap-3">
                {segments.topWorkoutUsers.map((user) => (
                  <Link
                    className="rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm transition hover:border-accent/40 hover:bg-white"
                    href={`/admin/users/${user.user_id}` as Route}
                    key={user.user_id}
                  >
                    <p className="font-semibold text-foreground">{user.display_name}</p>
                    <p className="mt-1 break-all text-muted">{user.email ?? user.user_id}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="pill">Сеты: {user.logged_sets}</span>
                      <span className="pill">Дни: {user.completed_days}</span>
                      <span className="pill">Программы: {user.active_programs}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>

      <div className="grid gap-5">
        {users.length ? (
          users.map((user) => {
            const roleLabel =
              roleLabels[user.admin_role ?? "user"] ??
              user.admin_role ??
              "Пользователь";

            return (
              <article
                className="rounded-[28px] border border-border bg-white/70 p-5 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.28)]"
                key={user.user_id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <input
                      checked={selectedUserIds.includes(user.user_id)}
                      className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-accent"
                      onChange={() => toggleUserSelection(user.user_id)}
                      type="checkbox"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        className="text-lg font-semibold text-foreground transition hover:text-accent"
                        href={`/admin/users/${user.user_id}` as Route}
                      >
                        {user.full_name ?? "Без имени"}
                      </Link>
                      <p className="mt-1 break-all text-sm text-muted">
                        {user.email ?? "Email не найден"}
                      </p>
                      <p className="mt-1 break-all font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                        {user.user_id}
                      </p>
                    </div>
                  </div>

                  <div className="text-left text-sm text-muted sm:text-right">
                    <p className="font-medium text-foreground">{roleLabel}</p>
                    <p className="mt-2">Создан</p>
                    <p className="mt-1 font-medium text-foreground">
                      {formatDate(user.created_at)}
                    </p>
                    <p className="mt-2">Последний вход</p>
                    <p className="mt-1 font-medium text-foreground">
                      {formatDate(user.last_sign_in_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="pill">{roleLabel}</span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${activityToneClasses[user.activity.bucket]}`}
                  >
                    {activityLabels[user.activity.bucket]}
                  </span>
                  {user.flags.is_primary_super_admin ? (
                    <span className="rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                      Главный супер-админ
                    </span>
                  ) : null}
                  {user.operations.has_backlog ? (
                    <span className="rounded-full border border-rose-300/70 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">
                      Есть очередь
                    </span>
                  ) : null}
                  {user.billing.is_active ? (
                    <span className="rounded-full border border-emerald-300/70 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Подписка активна
                    </span>
                  ) : null}
                  {user.flags.never_signed_in ? (
                    <span className="rounded-full border border-slate-300/70 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      Без входов
                    </span>
                  ) : null}
                  {!user.flags.has_profile ? (
                    <span className="rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                      Без профиля
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <article className="rounded-2xl border border-border bg-white/80 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                      Тренировки
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {user.workout.logged_sets}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      логов сетов, {user.workout.completed_days} завершённых дней
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      Активных программ: {user.workout.active_programs}
                    </p>
                  </article>

                  <article className="rounded-2xl border border-border bg-white/80 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                      Питание
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {user.nutrition.meals}
                    </p>
                    <p className="mt-1 text-sm text-muted">логов приёмов пищи</p>
                    <p className="mt-2 text-xs text-muted">
                      Последний приём: {formatDateTime(user.nutrition.last_meal_at)}
                    </p>
                  </article>

                  <article className="rounded-2xl border border-border bg-white/80 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                      ИИ
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {user.ai.messages}
                    </p>
                    <p className="mt-1 text-sm text-muted">сообщений и сигналов ИИ</p>
                    <p className="mt-2 text-xs text-muted">
                      Последний сигнал ИИ: {formatDateTime(user.ai.last_ai_at)}
                    </p>
                  </article>

                  <article className="rounded-2xl border border-border bg-white/80 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                      Операции
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {user.operations.pending_support_actions}
                    </p>
                    <p className="mt-1 text-sm text-muted">задач сейчас в очереди</p>
                    <p className="mt-2 text-xs text-muted">
                      Выгрузка: {formatStatus(user.operations.export_status)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Удаление: {formatStatus(user.operations.deletion_status)}
                    </p>
                  </article>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4 text-sm text-muted">
                  <div className="flex flex-wrap gap-4">
                    <span>
                      Последняя активность:{" "}
                      <strong className="text-foreground">
                        {formatDateTime(
                          user.activity.last_activity_at ?? user.last_sign_in_at,
                        )}
                      </strong>
                    </span>
                    <span>
                      Источник:{" "}
                      <strong className="text-foreground">
                        {user.activity.source
                          ? activitySourceLabels[user.activity.source]
                          : "нет данных"}
                      </strong>
                    </span>
                    <span>
                      Подписка:{" "}
                      <strong className="text-foreground">
                        {formatStatus(user.billing.subscription_status)}
                      </strong>
                    </span>
                    {user.billing.subscription_provider ? (
                      <span>
                        Способ оплаты:{" "}
                        <strong className="text-foreground">
                          {user.billing.subscription_provider}
                        </strong>
                      </span>
                    ) : null}
                    {user.operations.deletion_hold_until ? (
                      <span>
                        Удержание до:{" "}
                        <strong className="text-foreground">
                          {formatDate(user.operations.deletion_hold_until)}
                        </strong>
                      </span>
                    ) : null}
                  </div>

                  <Link
                    className="inline-flex rounded-full border border-border px-4 py-2 font-semibold text-foreground transition hover:bg-white/70"
                    href={`/admin/users/${user.user_id}` as Route}
                  >
                    Открыть карточку
                  </Link>
                </div>
              </article>
            );
          })
        ) : (
          <p className="text-sm leading-7 text-muted">
            {isFiltered
              ? "По текущему поиску и фильтрам ничего не найдено."
              : "В профилях пока нет данных. Как только пользователи пройдут онбординг и начнут активность, они появятся здесь."}
          </p>
        )}
      </div>
    </section>
  );
}








