"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminRoleManager } from "@/components/admin-role-manager";
import { AdminUserActions } from "@/components/admin-user-actions";

type AdminUserDetailData = {
  id: string;
  currentAdminRole: "super_admin" | "support_admin" | "analyst";
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
  stats: {
    activeExercises: number;
    programs: number;
  };
  recentSupportActions: Array<{
    id: string;
    action: string;
    status: string;
    created_at: string;
  }>;
  recentAdminAuditLogs: Array<{
    id: string;
    action: string;
    reason: string | null;
    created_at: string;
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
  fat_loss: "Снижение веса",
  maintenance: "Поддержание",
  muscle_gain: "Набор мышц",
  performance: "Результативность",
};

const sexLabels: Record<string, string> = {
  female: "Женщина",
  male: "Мужчина",
  other: "Другое",
  prefer_not_to_say: "Не указано",
};

const fitnessLevelLabels: Record<string, string> = {
  beginner: "Начинающий",
  intermediate: "Средний",
  advanced: "Продвинутый",
};

const adminRoleLabels: Record<string, string> = {
  super_admin: "Супер-админ",
  support_admin: "Админ поддержки",
  analyst: "Аналитик",
  user: "Пользователь",
};

function renderList(items: string[] | undefined) {
  if (!items?.length) {
    return "Не заполнено";
  }

  return items.join(", ");
}

export function AdminUserDetail({
  currentUserId,
  currentUserRole,
  userId,
}: {
  currentUserId: string;
  currentUserRole: "super_admin" | "support_admin" | "analyst";
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
            setError(payload?.message ?? "Не удалось загрузить карточку пользователя.");
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
        <p className="text-sm text-muted">Загружаю карточку пользователя...</p>
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
          Назад к каталогу
        </Link>
        <p className="rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Карточка пользователя не найдена."}
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
              Пользователь
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {detail.profile?.full_name ?? "Без имени"}
            </h2>
            <p className="mt-2 break-all text-sm text-muted">{detail.id}</p>
          </div>
          <Link
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
            href={"/admin/users" as Route}
          >
            Назад к каталогу
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[ 
            ["Активные упражнения", String(detail.stats.activeExercises)],
            ["Программы", String(detail.stats.programs)],
            [
              "Роль админа",
              adminRoleLabels[detail.adminRole?.role ?? "user"] ??
                detail.adminRole?.role ??
                "Пользователь",
            ],
          ].map(([label, value]) => (
            <article className="kpi p-4" key={label}>
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="card p-6">
          <div className="mb-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Срез профиля
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Базовый контекст и цели
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Профиль</p>
              <p className="mt-3 text-muted">
                Email:{" "}
                <span className="text-foreground">
                  {detail.authUser?.email ?? "Нет данных"}
                </span>
              </p>
              <p className="mt-2 text-muted">
                Последний вход:{" "}
                <span className="text-foreground">
                  {detail.authUser?.last_sign_in_at
                    ? dateFormatter.format(new Date(detail.authUser.last_sign_in_at))
                    : "Нет данных"}
                </span>
              </p>
              <p className="mt-3 text-muted">
                Создан:{" "}
                <span className="text-foreground">
                  {detail.profile?.created_at
                    ? dateFormatter.format(new Date(detail.profile.created_at))
                    : "Нет данных"}
                </span>
              </p>
              <p className="mt-2 text-muted">
                Обновлён:{" "}
                <span className="text-foreground">
                  {detail.profile?.updated_at
                    ? dateFormatter.format(new Date(detail.profile.updated_at))
                    : "Нет данных"}
                </span>
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Цель</p>
              <p className="mt-3 text-muted">
                Тип цели:{" "}
                <span className="text-foreground">
                  {detail.latestGoal?.goal_type
                    ? goalTypeLabels[detail.latestGoal.goal_type] ??
                      detail.latestGoal.goal_type
                    : "Не заполнено"}
                </span>
              </p>
              <p className="mt-2 text-muted">
                Тренировок в неделю:{" "}
                <span className="text-foreground">
                  {detail.latestGoal?.weekly_training_days ?? "Не заполнено"}
                </span>
              </p>
              <p className="mt-2 text-muted">
                Целевой вес:{" "}
                <span className="text-foreground">
                  {detail.latestGoal?.target_weight_kg ?? "Не заполнено"}
                </span>
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Онбординг</p>
              <p className="mt-3 text-muted">
                Возраст: <span className="text-foreground">{detail.onboarding?.age ?? "Не заполнено"}</span>
              </p>
              <p className="mt-2 text-muted">
                Пол: <span className="text-foreground">{detail.onboarding?.sex ? sexLabels[detail.onboarding.sex] ?? detail.onboarding.sex : "Не заполнено"}</span>
              </p>
              <p className="mt-2 text-muted">
                Рост:{" "}
                <span className="text-foreground">
                  {detail.onboarding?.height_cm ?? "Не заполнено"}
                </span>
              </p>
              <p className="mt-2 text-muted">
                Вес:{" "}
                <span className="text-foreground">
                  {detail.onboarding?.weight_kg ?? "Не заполнено"}
                </span>
              </p>
              <p className="mt-2 text-muted">
                Уровень:{" "}
                <span className="text-foreground">
                  {detail.onboarding?.fitness_level
                    ? fitnessLevelLabels[detail.onboarding.fitness_level] ??
                      detail.onboarding.fitness_level
                    : "Не заполнено"}
                </span>
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Контекст</p>
              <p className="mt-3 text-muted">
                Оборудование:{" "}
                <span className="text-foreground">
                  {renderList(detail.onboarding?.equipment)}
                </span>
              </p>
              <p className="mt-2 text-muted">
                Ограничения:{" "}
                <span className="text-foreground">
                  {renderList(detail.onboarding?.injuries)}
                </span>
              </p>
              <p className="mt-2 text-muted">
                Питание:{" "}
                <span className="text-foreground">
                  {renderList(detail.onboarding?.dietary_preferences)}
                </span>
              </p>
            </article>
          </div>
        </section>

        <div className="grid gap-6">
          <AdminRoleManager
            currentAdminRole={currentUserRole}
            isSelf={currentUserId === userId}
            onUpdated={() => setReloadVersion((current) => current + 1)}
            targetAdminRole={detail.adminRole?.role as "super_admin" | "support_admin" | "analyst" | null}
            userEmail={detail.authUser?.email ?? null}
            userId={userId}
          />

          <AdminUserActions
            onUpdated={() => setReloadVersion((current) => current + 1)}
            userId={userId}
          />

          <section className="card p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                  История поддержки
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">
                  Последние операции в очереди
                </h2>
              </div>
              <div className="pill">{detail.recentSupportActions.length}</div>
            </div>

            <div className="grid gap-3">
              {detail.recentSupportActions.length ? (
                detail.recentSupportActions.map((action) => (
                  <article
                    className="rounded-2xl border border-border bg-white/60 p-4 text-sm"
                    key={action.id}
                  >
                    <p className="font-semibold text-foreground">{action.action}</p>
                    <p className="mt-1 text-muted">{action.status}</p>
                    <p className="mt-2 text-muted">
                      {dateFormatter.format(new Date(action.created_at))}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-7 text-muted">
                  Действия поддержки для этого пользователя пока не запускались.
                </p>
              )}
            </div>
          </section>

          <section className="card p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                  Аудит
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">
                  Последние admin-изменения
                </h2>
              </div>
              <div className="pill">{detail.recentAdminAuditLogs.length}</div>
            </div>

            <div className="grid gap-3">
              {detail.recentAdminAuditLogs.length ? (
                detail.recentAdminAuditLogs.map((entry) => (
                  <article
                    className="rounded-2xl border border-border bg-white/60 p-4 text-sm"
                    key={entry.id}
                  >
                    <p className="font-semibold text-foreground">{entry.action}</p>
                    <p className="mt-1 text-muted">
                      {entry.reason ?? "Без пояснения"}
                    </p>
                    <p className="mt-2 text-muted">
                      {dateFormatter.format(new Date(entry.created_at))}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-7 text-muted">
                  Изменений ролей и административных действий по этому пользователю пока нет.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
