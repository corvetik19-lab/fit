"use client";

import type { Route } from "next";
import Link from "next/link";

import {
  AdminUsersBulkActionsPanel,
  AdminUsersBulkHistoryPanel,
} from "@/components/admin-users-bulk-actions";
import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  canUseRootAdminControls,
  type PlatformAdminRole,
} from "@/lib/admin-permissions";
import {
  activityLabels,
  activitySourceLabels,
  activityToneClasses,
  formatDate,
  formatDateTime,
  formatStatus,
  roleLabels,
  type ActivityBucket,
  type ActivityFilter,
  type AdminUsersSortKey,
} from "@/components/admin-users-directory-model";
import { useAdminUsersDirectoryState } from "@/components/use-admin-users-directory-state";

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
    <article className="surface-panel p-5">
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
  const canRunBulkActions = canUseRootAdminControls(
    currentAdminRole,
    currentUserEmail,
  );
  const canViewRoleDetails = canRunBulkActions;
  const {
    activeFilterSummary,
    activityFilter,
    allVisibleSelected,
    bulkAction,
    bulkFeatureKey,
    bulkLimitValue,
    bulkNotice,
    bulkReason,
    bulkTrialDays,
    catalogSummary,
    clearSelection,
    error,
    isBulkPending,
    isDegraded,
    isFiltered,
    isLoading,
    recentBulkWaves,
    reloadCatalog,
    resetFilters,
    roleFilter,
    searchQuery,
    segments,
    selectedUserIds,
    setActivityFilter,
    setBulkAction,
    setBulkFeatureKey,
    setBulkLimitValue,
    setBulkReason,
    setBulkTrialDays,
    setRoleFilter,
    setSearchQuery,
    setSortKey,
    sortKey,
    submitBulkAction,
    summary,
    toggleUserSelection,
    toggleVisibleSelection,
    users,
  } = useAdminUsersDirectoryState({
    canRunBulkActions,
    canViewRoleDetails,
  });

  if (isLoading) {
    return (
      <section className="card p-6">
        <p className="text-sm text-muted">Загружаю каталог пользователей...</p>
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
    <section className="card card--hero p-6 sm:p-8">
      <div className="grid gap-6 2xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className="pill">Пользователи</span>
            <span className="pill">Каталог: {summary.total}</span>
            {canViewRoleDetails ? (
              <span className="pill">Роли и доступы видны только вам</span>
            ) : null}
          </div>

          <div className="space-y-3">
            <h2 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Пользователи, доступы, подписки и очередь действий в одном рабочем экране.
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
              Здесь удобно искать пользователя, смотреть его активность, состояние подписки,
              очередь задач и сразу переходить в подробную карточку без лишнего служебного шума.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="action-button action-button--primary" onClick={reloadCatalog} type="button">
              Обновить каталог
            </button>
            {isFiltered ? (
              <button
                className="action-button action-button--secondary"
                onClick={resetFilters}
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
            detail={
              canViewRoleDetails
                ? "главный доступ закреплён только за corvetik1@yandex.ru"
                : "пользователи с последней активностью за 7 дней"
            }
            label={canViewRoleDetails ? "Главный администратор" : "Активны за неделю"}
            value={String(canViewRoleDetails ? summary.superAdmins : summary.active7d)}
          />
          <DirectoryMetricCard
            detail="пользователи с активной подпиской или пробным доступом"
            label="Платящие и пробные"
            value={String(summary.paid)}
          />
        </div>
      </div>

      {isDegraded ? (
        <div className="mt-6 rounded-[28px] border border-amber-300/70 bg-amber-50/90 px-5 py-4 text-sm text-amber-900">
          Каталог пользователей показан из резервного снимка. Часть служебных источников
          временно не ответила, поэтому отдельные сигналы и сводки могут быть неполными.
        </div>
      ) : null}

      <div className="surface-panel mt-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Фильтры
            </p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">
              Быстрый отбор по активности и важным случаям
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

        {canViewRoleDetails ? (
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
        ) : null}

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
          ["Найдено", String(summary.total), "пользователей в текущем списке"],
          ["Активны 7 дней", String(summary.active7d), "живая пользовательская активность"],
          ["С очередью", String(summary.backlog), "поддержка, выгрузка и удаление"],
          ["Без входов", String(summary.neverSignedIn), "аккаунты без авторизации"],
          ["Платящие", String(summary.paid), "активная подписка или пробный период"],
          [
            "Админ-аккаунты",
            String(summary.superAdmins + summary.supportAdmins + summary.analysts),
            "аккаунты с административным доступом",
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
        {canViewRoleDetails ? (
          <article className="rounded-[30px] border border-sky-300/60 bg-sky-50/85 p-5 text-sm text-sky-900">
            <p className="font-semibold text-foreground">
              Главный доступ закреплён отдельно и защищён от случайных изменений.
            </p>
            <p className="mt-2 leading-7">
              Этот уровень доступа закреплён за <strong>{PRIMARY_SUPER_ADMIN_EMAIL}</strong>.
              Остальным пользователям можно назначать только обычные административные роли.
            </p>
          </article>
        ) : (
          <article className="rounded-[30px] border border-border bg-white/72 p-5 text-sm">
            <p className="font-semibold text-foreground">
              Каталог показывает только рабочие данные по пользователям.
            </p>
            <p className="mt-2 leading-7 text-muted">
              Здесь можно искать пользователя, смотреть активность, подписку и очередь задач
              без лишних системных деталей.
            </p>
          </article>
        )}

        <article className="rounded-[30px] border border-border bg-white/72 p-5 text-sm">
          <p className="font-semibold text-foreground">Что видно в одном экране</p>
          <p className="mt-2 leading-7 text-muted">
            Активность по тренировкам, питанию и ИИ, очередь задач, выгрузка данных, удаление,
            состояние подписки и пользователи, которым нужна проверка в первую очередь.
          </p>
        </article>
      </div>

      <div className="mt-6 grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
        <AdminUsersBulkActionsPanel
          allVisibleSelected={allVisibleSelected}
          bulkAction={bulkAction}
          bulkFeatureKey={bulkFeatureKey}
          bulkLimitValue={bulkLimitValue}
          bulkNotice={bulkNotice}
          bulkReason={bulkReason}
          bulkTrialDays={bulkTrialDays}
          canRunBulkActions={canRunBulkActions}
          isBulkPending={isBulkPending}
          onBulkActionChange={setBulkAction}
          onBulkFeatureKeyChange={setBulkFeatureKey}
          onBulkLimitValueChange={setBulkLimitValue}
          onBulkReasonChange={setBulkReason}
          onBulkTrialDaysChange={setBulkTrialDays}
          onClearSelection={clearSelection}
          onSubmit={submitBulkAction}
          onToggleVisibleSelection={toggleVisibleSelection}
          selectedUserCount={selectedUserIds.length}
        />

        <AdminUsersBulkHistoryPanel recentBulkWaves={recentBulkWaves} />
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
                      {canViewRoleDetails ? (
                        <p className="font-semibold text-foreground">
                          {roleLabels[user.admin_role] ?? user.admin_role}
                        </p>
                      ) : (
                        <p className="font-semibold text-foreground">
                          Задач в очереди: {user.pending_support_actions}
                        </p>
                      )}
                      {canViewRoleDetails ? (
                        <p className="mt-1 text-muted">
                          В очереди: {user.pending_support_actions}
                        </p>
                      ) : null}
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
                  {canViewRoleDetails ? <span className="pill">{roleLabel}</span> : null}
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








