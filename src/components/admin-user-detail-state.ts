"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  AdminUserDetailData,
  AdminUserDetailResponse,
} from "@/components/admin-user-detail-model";
import { withTransientRetry } from "@/lib/runtime-retry";

export type AdminUserDetailSection =
  | "profile"
  | "activity"
  | "content"
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
    description: "Основные данные, цели и ручные действия по аккаунту.",
  },
  {
    key: "activity",
    label: "Активность",
    description: "Тренировки, питание, AI и общий жизненный цикл.",
  },
  {
    key: "content",
    label: "Контент",
    description: "Изображения упражнений и продуктов, которые видит пользователь.",
  },
  {
    key: "operations",
    label: "Операции",
    description: "Выгрузки, удаление данных, очереди и аудит.",
  },
  {
    key: "billing",
    label: "Оплата",
    description: "Подписка, доступы, лимиты и события оплаты.",
  },
];

export function useAdminUserDetailState(
  userId: string,
  options?: {
    initialDetail?: AdminUserDetailData | null;
    initialError?: string | null;
    initialIsDegraded?: boolean;
  },
) {
  const hasInitialPayload =
    Object.prototype.hasOwnProperty.call(options ?? {}, "initialDetail") ||
    Object.prototype.hasOwnProperty.call(options ?? {}, "initialError");
  const [detail, setDetail] = useState<AdminUserDetailData | null>(
    options?.initialDetail ?? null,
  );
  const [error, setError] = useState<string | null>(options?.initialError ?? null);
  const [isDegraded, setIsDegraded] = useState(options?.initialIsDegraded ?? false);
  const [isLoading, setIsLoading] = useState(!hasInitialPayload);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [activeSection, setActiveSection] =
    useState<AdminUserDetailSection>("profile");

  useEffect(() => {
    if (hasInitialPayload && reloadVersion === 0) {
      return;
    }

    let isActive = true;

    async function loadDetail() {
      setIsLoading(true);

      try {
        const response = await withTransientRetry(() =>
          fetch(`/api/admin/users/${userId}`, {
            cache: "no-store",
          }),
        );
        const payload = (await response
          .json()
          .catch(() => null)) as AdminUserDetailResponse;

        if (!response.ok) {
          if (isActive) {
            setError(payload?.message ?? "Не удалось загрузить карточку пользователя.");
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
      } catch (error) {
        if (isActive) {
          setError(
            error instanceof Error
              ? error.message
              : "Не удалось загрузить карточку пользователя.",
          );
          setDetail(null);
          setIsDegraded(false);
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
  }, [hasInitialPayload, reloadVersion, userId]);

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
