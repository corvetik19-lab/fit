"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  AdminUserDetailData,
  AdminUserDetailResponse,
} from "@/components/admin-user-detail-model";

export type AdminUserDetailSection =
  | "profile"
  | "activity"
  | "operations"
  | "billing";

export const adminUserDetailSections: Array<{
  description: string;
  key: AdminUserDetailSection;
  label: string;
}> = [
  {
    key: "profile",
    label: "Профиль",
    description: "Основные данные, цели и служебные действия.",
  },
  {
    key: "activity",
    label: "Активность",
    description: "Тренировки, питание, ИИ и жизненный цикл.",
  },
  {
    key: "operations",
    label: "Операции",
    description: "Очереди, выгрузки, удаление и аудит.",
  },
  {
    key: "billing",
    label: "Оплата",
    description: "Подписка, доступы и история оплаты.",
  },
];

export function useAdminUserDetailState(userId: string) {
  const [detail, setDetail] = useState<AdminUserDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDegraded, setIsDegraded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [activeSection, setActiveSection] =
    useState<AdminUserDetailSection>("profile");

  useEffect(() => {
    let isActive = true;

    async function loadDetail() {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          cache: "no-store",
        });
        const payload = (await response
          .json()
          .catch(() => null)) as AdminUserDetailResponse;

        if (!response.ok) {
          if (isActive) {
            setError(
              payload?.message ?? "Не удалось загрузить карточку пользователя.",
            );
            setDetail(null);
            setIsDegraded(false);
          }
          return;
        }

        if (isActive) {
          setDetail(payload?.data ?? null);
          setError(null);
          setIsDegraded(Boolean(payload?.meta?.degraded));
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

  const reload = useCallback(() => {
    setReloadVersion((current) => current + 1);
  }, []);

  return {
    activeSection,
    detail,
    error,
    isDegraded,
    isLoading,
    reload,
    setActiveSection,
  };
}
