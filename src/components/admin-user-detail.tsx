"use client";

import type { Route } from "next";
import Link from "next/link";

import { AdminUserContentSection } from "@/components/admin-user-detail-content-assets";
import {
  AdminUserActivitySection,
  AdminUserBillingSection,
  AdminUserOperationsSection,
  AdminUserProfileSection,
} from "@/components/admin-user-detail-sections";
import {
  adminUserDetailSections,
  useAdminUserDetailState,
} from "@/components/admin-user-detail-state";
import {
  adminRoleLabels,
  formatDateTime,
  type PlatformAdminRole,
} from "@/components/admin-user-detail-model";
import { canUseRootAdminControls } from "@/lib/admin-permissions";

function SummaryMetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="surface-panel surface-panel--soft p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </article>
  );
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
  const {
    activeSection,
    detail,
    error,
    isDegraded,
    isLoading,
    reload,
    setActiveSection,
  } = useAdminUserDetailState(userId);
  const canViewRoleDetails = canUseRootAdminControls(
    currentUserRole,
    currentUserEmail,
  );
  const canManageContentAssets = canViewRoleDetails;

  if (isLoading) {
    return (
      <section className="card p-6">
        <p className="text-sm text-muted">Загружаю карточку пользователя...</p>
      </section>
    );
  }

  if (error || !detail) {
    return (
      <section className="card p-6">
        <Link
          className="action-button action-button--secondary mb-4 inline-flex"
          href={"/admin/users" as Route}
        >
          Назад к каталогу
        </Link>
        <p className="rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Карточка пользователя не найдена."}
        </p>
      </section>
    );
  }

  const activeSectionMeta = adminUserDetailSections.find(
    (section) => section.key === activeSection,
  );

  const summaryMetrics = [
    ["Упражнения", String(detail.stats.workout.activeExercises)],
    ["Программы", String(detail.stats.workout.programs)],
    ["Приёмы пищи", String(detail.stats.nutrition.meals)],
    ["Чаты AI", String(detail.stats.ai.chatSessions)],
    ["Подходы", String(detail.stats.workout.loggedSets)],
    canViewRoleDetails
      ? [
          "Роль",
          adminRoleLabels[detail.adminRole?.role ?? "user"] ??
            detail.adminRole?.role ??
            "Пользователь",
        ]
      : [
          "Статус аккаунта",
          detail.adminState?.is_suspended ? "Ограничен" : "Активен",
        ],
  ];

  return (
    <div className="grid gap-6">
      <section className="card card--hero p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="workspace-kicker">Пользователь</p>
            <h2 className="app-display mt-3 text-2xl text-foreground sm:text-3xl">
              {detail.profile?.full_name ?? "Без имени"}
            </h2>
            <p className="mt-2 break-all text-sm text-muted">{detail.id}</p>
            <p className="mt-2 break-all text-sm text-muted">
              {detail.authUser?.email ?? "Email не найден"}
            </p>
          </div>
          <Link
            className="action-button action-button--secondary"
            href={"/admin/users" as Route}
          >
            Назад к каталогу
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {summaryMetrics.map(([label, value]) => (
            <SummaryMetricCard key={label} label={label} value={value} />
          ))}
        </div>

        {isDegraded ? (
          <p
            className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            data-testid="admin-user-detail-degraded-banner"
          >
            Часть служебных данных временно недоступна. Карточка показана из
            резервного снимка.
          </p>
        ) : null}

        {canViewRoleDetails && !detail.superAdminPolicy.targetCanBeSuperAdmin ? (
          <p className="mt-4 rounded-2xl border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Главный доступ нельзя назначить этому пользователю. Он закреплён только
            за {detail.superAdminPolicy.primaryEmail}.
          </p>
        ) : null}

        {detail.adminState?.is_suspended ? (
          <p className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Аккаунт сейчас ограничен. С какого момента:{" "}
            {formatDateTime(detail.adminState.suspended_at)}. Причина:{" "}
            {detail.adminState.state_reason ?? "не указана"}.
          </p>
        ) : null}
      </section>

      <section className="surface-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Разделы карточки
            </p>
            <h2
              className="mt-2 text-xl font-semibold text-foreground"
              data-testid="admin-user-detail-section-heading"
            >
              Открывай только нужный операторский контекст
            </h2>
          </div>
          <span className="pill">{activeSectionMeta?.label ?? "Профиль"}</span>
        </div>

        <div className="mt-4 grid gap-3 md:flex md:flex-wrap">
          {adminUserDetailSections.map(({ key, label, description }) => {
            const isActive = activeSection === key;

            return (
              <button
                aria-pressed={isActive}
                className={`w-full rounded-3xl border px-4 py-3 text-left transition md:w-auto md:min-w-[14rem] ${
                  isActive
                    ? "border-accent/20 bg-[color-mix(in_srgb,var(--accent-soft)_78%,white)] text-foreground shadow-[0_16px_38px_-34px_rgba(20,58,160,0.22)]"
                    : "border-border bg-white/72 text-foreground hover:bg-white"
                }`}
                data-testid={`admin-user-detail-section-${key}`}
                key={key}
                onClick={() => setActiveSection(key)}
                type="button"
              >
                <span className="block text-sm font-semibold">{label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">
                  {description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {activeSection === "profile" ? (
        <AdminUserProfileSection
          canViewRoleDetails={canViewRoleDetails}
          currentAdminRole={currentUserRole}
          currentUserEmail={currentUserEmail}
          currentUserId={currentUserId}
          detail={detail}
          onUpdated={reload}
          userId={userId}
        />
      ) : null}

      {activeSection === "activity" ? (
        <AdminUserActivitySection detail={detail} />
      ) : null}

      {activeSection === "content" ? (
        <AdminUserContentSection
          canManageContentAssets={canManageContentAssets}
          detail={detail}
          onUpdated={reload}
          userId={userId}
        />
      ) : null}

      {activeSection === "operations" ? (
        <AdminUserOperationsSection detail={detail} />
      ) : null}

      {activeSection === "billing" ? (
        <AdminUserBillingSection detail={detail} />
      ) : null}
    </div>
  );
}
