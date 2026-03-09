"use client";

import type { Route } from "next";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

type AdminUserRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  admin_role: "super_admin" | "support_admin" | "analyst" | null;
};

const createdAtFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const roleLabels: Record<string, string> = {
  super_admin: "Супер-админ",
  support_admin: "Поддержка",
  analyst: "Аналитик",
  user: "Пользователь",
};

export function AdminUsersDirectory() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "super_admin" | "support_admin" | "analyst" | "user"
  >("all");
  const deferredSearchQuery = useDeferredValue(searchQuery);

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

        const queryString = searchParams.toString();
        const response = await fetch(
          queryString ? `/api/admin/users?${queryString}` : "/api/admin/users",
          {
            cache: "no-store",
          },
        );
        const payload = (await response.json().catch(() => null)) as
          | { data?: AdminUserRow[]; message?: string }
          | null;

        if (!response.ok) {
          if (isActive) {
            setError(payload?.message ?? "Не удалось загрузить пользователей.");
            setUsers([]);
          }
          return;
        }

        if (isActive) {
          setUsers(payload?.data ?? []);
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
  }, [deferredSearchQuery, roleFilter]);

  const summary = useMemo(() => {
    return {
      total: users.length,
      superAdmins: users.filter((user) => user.admin_role === "super_admin").length,
      supportAdmins: users.filter((user) => user.admin_role === "support_admin").length,
      analysts: users.filter((user) => user.admin_role === "analyst").length,
    };
  }, [users]);

  const isFiltered = Boolean(searchQuery.trim()) || roleFilter !== "all";

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
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Каталог
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Пользователи и admin-доступы
          </h2>
        </div>
        <div className="pill">{summary.total}</div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="grid gap-2 text-sm text-muted">
          Поиск по имени, email или UUID
          <input
            className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Например: corvetik1@yandex.ru"
            type="text"
            value={searchQuery}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted">
          Фильтр по роли
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
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Найдено", String(summary.total)],
          ["Супер-админы", String(summary.superAdmins)],
          ["Поддержка", String(summary.supportAdmins)],
          ["Аналитики", String(summary.analysts)],
        ].map(([label, value]) => (
          <article className="kpi p-4" key={label}>
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-3">
        {users.length ? (
          users.map((user) => (
            <article
              className="rounded-2xl border border-border bg-white/60 p-4"
              key={user.user_id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    className="text-lg font-semibold text-foreground transition hover:text-accent"
                    href={`/admin/users/${user.user_id}` as Route}
                  >
                    {user.full_name ?? "Без имени"}
                  </Link>
                  <p className="mt-1 break-all text-sm text-muted">
                    {user.email ?? "Email не найден"}
                  </p>
                  <p className="mt-1 break-all text-xs text-muted">{user.user_id}</p>
                </div>
                <div className="text-right text-sm text-muted">
                  <p className="font-medium text-foreground">
                    {roleLabels[user.admin_role ?? "user"] ??
                      user.admin_role ??
                      "Пользователь"}
                  </p>
                  <p className="mt-2">Создан</p>
                  <p className="mt-1 font-medium text-foreground">
                    {createdAtFormatter.format(new Date(user.created_at))}
                  </p>
                  <p className="mt-2">Последний вход</p>
                  <p className="mt-1 font-medium text-foreground">
                    {user.last_sign_in_at
                      ? createdAtFormatter.format(new Date(user.last_sign_in_at))
                      : "Нет данных"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="pill">
                  {roleLabels[user.admin_role ?? "user"] ??
                    user.admin_role ??
                    "Пользователь"}
                </span>
                <Link
                  className="inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70"
                  href={`/admin/users/${user.user_id}` as Route}
                >
                  Управлять доступом
                </Link>
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm leading-7 text-muted">
            {isFiltered
              ? "По текущему поиску и фильтру ничего не найдено."
              : "В профилях пока нет данных. Как только пользователи пройдут онбординг, они появятся здесь."}
          </p>
        )}
      </div>
    </section>
  );
}
