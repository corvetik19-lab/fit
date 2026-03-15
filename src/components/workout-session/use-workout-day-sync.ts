"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  cacheWorkoutDaySnapshot,
  cleanupStaleOfflineState,
  flushOfflineMutations,
  getCachedWorkoutDaySnapshot,
  getPendingOfflineMutationCount,
  listQueuedWorkoutMutationsForDay,
  pullWorkoutDaySnapshot,
  replaceWorkoutDayOfflineState,
} from "@/lib/offline/workout-sync";
import type { WorkoutDayDetail } from "@/lib/workout/weekly-programs";
import { applyQueuedMutations } from "@/components/workout-session/session-utils";

export function useWorkoutDaySync({
  applyHydratedDay,
  initialDay,
  onError,
  onNotice,
}: {
  applyHydratedDay: (nextDay: WorkoutDayDetail) => void;
  initialDay: WorkoutDayDetail;
  onError: (message: string) => void;
  onNotice: (message: string) => void;
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingMutationCount, setPendingMutationCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<string | null>(null);
  const pullCursorRef = useRef<string | null>(null);
  const pullPromiseRef = useRef<Promise<WorkoutDayDetail | null> | null>(null);
  const lastPullStartedAtRef = useRef(0);
  const hasBootstrappedSyncRef = useRef(false);

  const persistWorkoutDay = useCallback(async (nextDay: WorkoutDayDetail) => {
    const updatedAt = await cacheWorkoutDaySnapshot(nextDay);
    setLastSnapshotAt(updatedAt);
  }, []);

  const applyDaySnapshot = useCallback(
    async (nextDay: WorkoutDayDetail) => {
      applyHydratedDay(nextDay);
      await persistWorkoutDay(nextDay);
    },
    [applyHydratedDay, persistWorkoutDay],
  );

  const refreshPendingMutationCount = useCallback(async () => {
    const count = await getPendingOfflineMutationCount();
    setPendingMutationCount(count);
  }, []);

  const replaceOfflineDayState = useCallback(
    async (nextDay: WorkoutDayDetail) => {
      const result = await replaceWorkoutDayOfflineState(nextDay);
      applyHydratedDay(nextDay);
      setLastSnapshotAt(result.updatedAt);
      await refreshPendingMutationCount();

      return result;
    },
    [applyHydratedDay, refreshPendingMutationCount],
  );

  const hydrateLocalDay = useCallback(async () => {
    await cleanupStaleOfflineState();

    const [cachedSnapshot, queuedMutations] = await Promise.all([
      getCachedWorkoutDaySnapshot(initialDay.id),
      listQueuedWorkoutMutationsForDay(initialDay.id),
    ]);
    const baseDay = cachedSnapshot.day ?? initialDay;
    const hydratedDay = applyQueuedMutations(baseDay, queuedMutations);

    applyHydratedDay(hydratedDay);
    setLastSnapshotAt(cachedSnapshot.updatedAt);
    await persistWorkoutDay(hydratedDay);
    await refreshPendingMutationCount();
  }, [applyHydratedDay, initialDay, persistWorkoutDay, refreshPendingMutationCount]);

  const pullLatestDaySnapshot = useCallback(
    async (options?: { force?: boolean }) => {
      if (pullPromiseRef.current) {
        return pullPromiseRef.current;
      }

      const shouldThrottle = !options?.force;
      const now = Date.now();

      if (shouldThrottle && now - lastPullStartedAtRef.current < 10000) {
        return null;
      }

      lastPullStartedAtRef.current = now;

      const runPull = async () => {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          setIsOnline(false);
          return null;
        }

        const result = await pullWorkoutDaySnapshot(
          initialDay.id,
          pullCursorRef.current,
        );

        if (result.snapshot) {
          await applyDaySnapshot(result.snapshot);
        }

        pullCursorRef.current = result.nextCursor ?? null;
        setIsOnline(true);

        return result.snapshot;
      };

      const request = runPull();
      pullPromiseRef.current = request;

      try {
        return await request;
      } finally {
        pullPromiseRef.current = null;
      }
    },
    [applyDaySnapshot, initialDay.id],
  );

  const flushQueuedMutations = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      return;
    }

    const queuedCount = await getPendingOfflineMutationCount();

    if (!queuedCount) {
      setPendingMutationCount(0);
      return;
    }

    setIsSyncing(true);

    try {
      const result = await flushOfflineMutations();
      await refreshPendingMutationCount();

      const rejectedMutations = result.processed.filter(
        (mutation) => mutation.status === "rejected",
      );

      if (rejectedMutations.length) {
        onError(
          rejectedMutations[0]?.message ??
            "Не все изменения удалось отправить. Попробуй ещё раз позже.",
        );
      } else if (result.applied > 0) {
        onNotice("Изменения отправлены.");
      } else if (result.discardedStale > 0) {
        onNotice(`Очищено устаревших локальных изменений: ${result.discardedStale}.`);
      }

      if (result.applied > 0 || rejectedMutations.length > 0) {
        await pullLatestDaySnapshot({ force: true }).catch(() => null);
      }
    } catch {
      await refreshPendingMutationCount();
    } finally {
      setIsSyncing(false);
    }
  }, [onError, onNotice, pullLatestDaySnapshot, refreshPendingMutationCount]);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      void flushQueuedMutations();
      void pullLatestDaySnapshot({ force: true }).catch(() => null);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOnline(navigator.onLine);

    if (!hasBootstrappedSyncRef.current && navigator.onLine) {
      hasBootstrappedSyncRef.current = true;
      void flushQueuedMutations();
      void pullLatestDaySnapshot().catch(() => null);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushQueuedMutations, pullLatestDaySnapshot]);

  const resetPullCursor = useCallback(() => {
    pullCursorRef.current = null;
  }, []);

  return {
    applyDaySnapshot,
    flushQueuedMutations,
    hydrateLocalDay,
    isOnline,
    isSyncing,
    lastSnapshotAt,
    markOffline: () => setIsOnline(false),
    markOnline: () => setIsOnline(true),
    pendingMutationCount,
    persistWorkoutDay,
    pullLatestDaySnapshot,
    refreshPendingMutationCount,
    replaceOfflineDayState,
    resetPullCursor,
  };
}
