"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { WorkoutDayDetail } from "@/lib/workout/weekly-programs";
import {
  clearPersistedWorkoutTimer,
  getRunningTimerSeconds,
  hasRunningTimerExpired,
  loadPersistedWorkoutTimer,
  persistWorkoutTimer,
} from "@/components/workout-session/session-utils";

type TimerDaySnapshot = Pick<WorkoutDayDetail, "id" | "session_duration_seconds">;

export function useWorkoutSessionTimer({
  dayId,
  initialSessionDurationSeconds,
}: {
  dayId: string;
  initialSessionDurationSeconds: number | null;
}) {
  const [isFocusHeaderCollapsed, setIsFocusHeaderCollapsed] = useState(false);
  const [timerBaseSeconds, setTimerBaseSeconds] = useState(
    initialSessionDurationSeconds ?? 0,
  );
  const [timerLiveSeconds, setTimerLiveSeconds] = useState(
    initialSessionDurationSeconds ?? 0,
  );
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [shouldPersistExpiredTimerReset, setShouldPersistExpiredTimerReset] =
    useState(false);
  const expiredTimerResetDayIdRef = useRef<string | null>(null);

  const isTimerRunning = timerStartedAt !== null;
  const currentSessionDurationSeconds = isTimerRunning
    ? timerLiveSeconds
    : timerBaseSeconds;

  const applyTimerStateForDay = useCallback((nextDay: TimerDaySnapshot) => {
    const persistedTimer = loadPersistedWorkoutTimer(nextDay.id);

    if (!persistedTimer) {
      if (expiredTimerResetDayIdRef.current === nextDay.id) {
        setTimerStartedAt(null);
        setTimerBaseSeconds(0);
        setTimerLiveSeconds(0);
        return;
      }

      const nextSeconds = nextDay.session_duration_seconds ?? 0;
      setTimerStartedAt(null);
      setTimerBaseSeconds(nextSeconds);
      setTimerLiveSeconds(nextSeconds);
      return;
    }

    if (hasRunningTimerExpired(persistedTimer.baseSeconds, persistedTimer.startedAt)) {
      clearPersistedWorkoutTimer(nextDay.id);
      expiredTimerResetDayIdRef.current = nextDay.id;
      setTimerStartedAt(null);
      setTimerBaseSeconds(0);
      setTimerLiveSeconds(0);
      setShouldPersistExpiredTimerReset(true);
      return;
    }

    const nextSeconds = getRunningTimerSeconds(
      persistedTimer.baseSeconds,
      persistedTimer.startedAt,
    );

    setTimerStartedAt(persistedTimer.startedAt);
    setTimerBaseSeconds(persistedTimer.baseSeconds);
    setTimerLiveSeconds(nextSeconds);
  }, []);

  useEffect(() => {
    if (timerStartedAt === null) {
      return;
    }

    const syncTimer = () => {
      if (hasRunningTimerExpired(timerBaseSeconds, timerStartedAt)) {
        clearPersistedWorkoutTimer(dayId);
        expiredTimerResetDayIdRef.current = dayId;
        setTimerStartedAt(null);
        setTimerBaseSeconds(0);
        setTimerLiveSeconds(0);
        setShouldPersistExpiredTimerReset(true);
        return;
      }

      setTimerLiveSeconds(getRunningTimerSeconds(timerBaseSeconds, timerStartedAt));
    };

    syncTimer();
    const intervalId = window.setInterval(syncTimer, 1000);

    return () => window.clearInterval(intervalId);
  }, [dayId, timerBaseSeconds, timerStartedAt]);

  const startSessionTimer = useCallback(() => {
    if (timerStartedAt !== null) {
      return;
    }

    const startedAt = Date.now();
    expiredTimerResetDayIdRef.current = null;
    persistWorkoutTimer(dayId, {
      baseSeconds: timerBaseSeconds,
      startedAt,
    });
    setTimerStartedAt(startedAt);
  }, [dayId, timerBaseSeconds, timerStartedAt]);

  const restoreRunningTimer = useCallback(
    (input: { baseSeconds: number; startedAt: number }) => {
      expiredTimerResetDayIdRef.current = null;
      persistWorkoutTimer(dayId, input);
      setTimerBaseSeconds(input.baseSeconds);
      setTimerLiveSeconds(
        getRunningTimerSeconds(input.baseSeconds, input.startedAt),
      );
      setTimerStartedAt(input.startedAt);
    },
    [dayId],
  );

  const getResolvedCurrentSessionDurationSeconds = useCallback(() => {
    if (timerStartedAt === null) {
      return timerBaseSeconds;
    }

    if (hasRunningTimerExpired(timerBaseSeconds, timerStartedAt)) {
      return 0;
    }

    return getRunningTimerSeconds(timerBaseSeconds, timerStartedAt);
  }, [timerBaseSeconds, timerStartedAt]);

  const clearActiveTimer = useCallback(() => {
    clearPersistedWorkoutTimer(dayId);
    expiredTimerResetDayIdRef.current = null;
    setTimerStartedAt(null);
  }, [dayId]);

  return {
    applyTimerStateForDay,
    clearActiveTimer,
    currentSessionDurationSeconds,
    expiredTimerResetDayIdRef,
    getResolvedCurrentSessionDurationSeconds,
    isFocusHeaderCollapsed,
    isTimerRunning,
    setIsFocusHeaderCollapsed,
    setShouldPersistExpiredTimerReset,
    setTimerBaseSeconds,
    setTimerLiveSeconds,
    setTimerStartedAt,
    shouldPersistExpiredTimerReset,
    restoreRunningTimer,
    startSessionTimer,
    timerBaseSeconds,
    timerLiveSeconds,
    timerStartedAt,
  };
}
