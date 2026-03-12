"use client";

import { useEffect, useState } from "react";

import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  canUseRootAdminControls,
  isPrimarySuperAdminEmail,
} from "@/lib/admin-permissions";

type AdminRoleManagerProps = {
  userId: string;
  userEmail: string | null;
  currentUserEmail: string | null;
  currentAdminRole: "super_admin" | "support_admin" | "analyst" | null;
  targetAdminRole: "super_admin" | "support_admin" | "analyst" | null;
  isSelf: boolean;
  onUpdated: () => void;
};

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

const roleLabels: Record<string, string> = {
  super_admin: "Супер-админ",
  support_admin: "Поддержка",
  analyst: "Аналитик",
};

async function readJsonSafely(response: Response) {
  return (await response.json().catch(() => null)) as { message?: string } | null;
}

export function AdminRoleManager({
  userId,
  userEmail,
  currentUserEmail,
  currentAdminRole,
  targetAdminRole,
  isSelf,
  onUpdated,
}: AdminRoleManagerProps) {
  const [selectedRole, setSelectedRole] = useState<
    "super_admin" | "support_admin" | "analyst"
  >(targetAdminRole ?? "support_admin");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const canManageRoles = canUseRootAdminControls(
    currentAdminRole,
    currentUserEmail,
  );
  const targetCanBeSuperAdmin = isPrimarySuperAdminEmail(userEmail);
  const primaryActionLabel = !targetAdminRole
    ? "Выдать доступ"
    : targetAdminRole === selectedRole
      ? "Подтвердить роль"
      : "Сохранить роль";

  useEffect(() => {
    setSelectedRole(targetAdminRole ?? "support_admin");
  }, [targetAdminRole]);

  useEffect(() => {
    if (!targetCanBeSuperAdmin && selectedRole === "super_admin") {
      setSelectedRole("support_admin");
    }
  }, [selectedRole, targetCanBeSuperAdmin]);

  async function applyRole() {
    if (!canManageRoles || isPending) {
      return;
    }

    setError(null);
    setNotice(null);
    setIsPending(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: selectedRole,
          reason,
        }),
      });

      const payload = await readJsonSafely(response);

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось обновить роль.");
        return;
      }

      setNotice("Роль сохранена.");
      setReason("");
      onUpdated();
    } finally {
      setIsPending(false);
    }
  }

  async function revokeRole() {
    if (!canManageRoles || isPending || !targetAdminRole) {
      return;
    }

    setError(null);
    setNotice(null);
    setIsPending(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason,
        }),
      });

      const payload = await readJsonSafely(response);

      if (!response.ok) {
        setError(payload?.message ?? "Не удалось убрать права администратора.");
        return;
      }

      setNotice("Права администратора убраны.");
      setReason("");
      onUpdated();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="card p-6">
      <div className="mb-5">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
          Доступ
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">
          Роль администратора
        </h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Пользователь: <span className="text-foreground">{userEmail ?? userId}</span>
        </p>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
          <p className="text-muted">Текущая роль</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {targetAdminRole
              ? roleLabels[targetAdminRole] ?? targetAdminRole
              : "Обычный пользователь"}
          </p>
        </article>

        <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
          <p className="text-muted">Ваш уровень доступа</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {currentAdminRole
              ? roleLabels[currentAdminRole] ?? currentAdminRole
              : "Нет доступа"}
          </p>
          <p className="mt-2 text-muted">
            Все изменения сохраняются в истории действий.
          </p>
        </article>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm text-muted">
          Назначить роль
          <select
            className={inputClassName}
            disabled={!canManageRoles || isPending}
            onChange={(event) =>
              setSelectedRole(
                event.target.value as "super_admin" | "support_admin" | "analyst",
              )
            }
            value={selectedRole}
          >
            <option value="support_admin">Поддержка</option>
            <option value="analyst">Аналитик</option>
            <option disabled={!targetCanBeSuperAdmin} value="super_admin">
              Супер-админ
            </option>
          </select>
        </label>

        {!targetCanBeSuperAdmin ? (
          <p className="rounded-2xl border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Главный доступ закреплён только за {PRIMARY_SUPER_ADMIN_EMAIL}.
          </p>
        ) : null}

        <label className="grid gap-2 text-sm text-muted">
          Комментарий
          <textarea
            className={`${inputClassName} min-h-24 resize-y`}
            disabled={!canManageRoles || isPending}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Например: дать доступ сотруднику поддержки"
            value={reason}
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canManageRoles || isPending}
            onClick={() => void applyRole()}
            type="button"
          >
            {primaryActionLabel}
          </button>

          <button
            className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canManageRoles || isPending || !targetAdminRole || isSelf}
            onClick={() => void revokeRole()}
            type="button"
          >
            Убрать доступ
          </button>
        </div>

        {!canManageRoles ? (
          <p className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Роли может менять только главный супер-админ {PRIMARY_SUPER_ADMIN_EMAIL}.
          </p>
        ) : null}

        {isSelf ? (
          <p className="rounded-2xl border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Главный супер-админ не может убрать свой собственный доступ.
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="mt-4 rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
