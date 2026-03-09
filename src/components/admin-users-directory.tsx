"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

type AdminUserRow = {
  user_id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

const createdAtFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function AdminUsersDirectory() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadUsers() {
      try {
        const response = await fetch("/api/admin/users", {
          cache: "no-store",
        });
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
  }, []);

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
            Последние пользователи
          </h2>
        </div>
        <div className="pill">{users.length}</div>
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
                  <p className="mt-1 break-all text-sm text-muted">{user.user_id}</p>
                </div>
                <div className="text-right text-sm text-muted">
                  <p>Создан</p>
                  <p className="mt-1 font-medium text-foreground">
                    {createdAtFormatter.format(new Date(user.created_at))}
                  </p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm leading-7 text-muted">
            В профилях пока нет данных. Как только пользователи пройдут онбординг,
            они появятся здесь.
          </p>
        )}
      </div>
    </section>
  );
}
