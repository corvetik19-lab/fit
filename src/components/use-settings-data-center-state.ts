"use client";

import { startTransition, useCallback, useMemo, useState } from "react";

import type { SettingsDataSnapshot } from "@/lib/settings-data";

type SettingsDataCenterResponse = {
  data?: SettingsDataSnapshot;
  message?: string;
} | null;

type SettingsDataRequestConfig = {
  body?: Record<string, unknown>;
  method: "DELETE" | "GET" | "POST";
  successMessage: string;
};

async function readJsonSafely(response: Response) {
  return (await response.json().catch(() => null)) as SettingsDataCenterResponse;
}

export function useSettingsDataCenterState(initialSnapshot: SettingsDataSnapshot) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [deletionReason, setDeletionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const latestExport = useMemo(() => snapshot.exportJobs[0] ?? null, [snapshot]);
  const hasActiveExport = useMemo(
    () =>
      snapshot.exportJobs.some(
        (job) => job.status === "queued" || job.status === "processing",
      ),
    [snapshot],
  );
  const hasActiveDeletion = useMemo(
    () =>
      snapshot.deletionRequest?.status === "queued" ||
      snapshot.deletionRequest?.status === "holding",
    [snapshot],
  );

  const runRequest = useCallback(
    (url: string, { body, method, successMessage }: SettingsDataRequestConfig) => {
      setError(null);
      setNotice(null);
      setIsPending(true);

      startTransition(async () => {
        try {
          const response = await fetch(url, {
            method,
            cache: "no-store",
            body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
            headers:
              method === "POST"
                ? {
                    "Content-Type": "application/json",
                  }
                : undefined,
          });

          const payload = await readJsonSafely(response);

          if (!response.ok || !payload?.data) {
            setError(payload?.message ?? "Не удалось обновить данные.");
            return;
          }

          setSnapshot(payload.data);
          setNotice(successMessage);

          if (body?.action === "request_deletion") {
            setDeletionReason("");
          }
        } finally {
          setIsPending(false);
        }
      });
    },
    [],
  );

  const refreshSnapshot = useCallback(() => {
    runRequest("/api/settings/data", {
      method: "GET",
      successMessage: "Статусы синхронизированы.",
    });
  }, [runRequest]);

  const queueExport = useCallback(() => {
    runRequest("/api/settings/data", {
      body: {
        action: "queue_export",
      },
      method: "POST",
      successMessage: "Запрос на выгрузку поставлен в очередь.",
    });
  }, [runRequest]);

  const requestDeletion = useCallback(() => {
    runRequest("/api/settings/data", {
      body: {
        action: "request_deletion",
        reason: deletionReason.trim() || undefined,
      },
      method: "POST",
      successMessage: "Запрос на удаление отправлен и переведен в hold.",
    });
  }, [deletionReason, runRequest]);

  const cancelDeletion = useCallback(() => {
    runRequest("/api/settings/data", {
      method: "DELETE",
      successMessage: "Запрос на удаление отменен.",
    });
  }, [runRequest]);

  return {
    cancelDeletion,
    deletionReason,
    error,
    hasActiveDeletion,
    hasActiveExport,
    isPending,
    latestExport,
    notice,
    queueExport,
    refreshSnapshot,
    requestDeletion,
    setDeletionReason,
    snapshot,
  };
}
