"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown, ChevronUp, Pause, Play, RotateCcw } from "lucide-react";

import {
  cacheWorkoutDaySnapshot,
  cleanupStaleOfflineState,
  flushOfflineMutations,
  getCachedWorkoutDaySnapshot,
  getPendingOfflineMutationCount,
  listQueuedWorkoutMutationsForDay,
  pullWorkoutDaySnapshot,
  queueWorkoutDayExecutionMutation,
  queueWorkoutSetActualRepsMutation,
} from "@/lib/offline/workout-sync";
import type { OfflineMutation } from "@/lib/offline/db";
import {
  formatPlannedRepTarget,
  getActualRepOptions,
} from "@/lib/workout/rep-ranges";
import type {
  WeeklyProgramExerciseSummary,
  WeeklyProgramSetSummary,
  WorkoutDayDetail,
} from "@/lib/workout/weekly-programs";

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

const textAreaClassName = `${inputClassName} min-h-28 resize-y`;

const dayLabels: Record<number, string> = {
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
  7: "Воскресенье",
};

const dayStatusLabels: Record<string, string> = {
  planned: "Запланирован",
  in_progress: "В процессе",
  done: "Завершён",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
});

const snapshotTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const WORKOUT_TIMER_MAX_SECONDS = 2 * 60 * 60;
const WORKOUT_TIMER_STORAGE_KEY_PREFIX = "fit-workout-timer:";

type PersistedWorkoutTimer = {
  baseSeconds: number;
  startedAt: number;
};

function getWorkoutTimerStorageKey(dayId: string) {
  return `${WORKOUT_TIMER_STORAGE_KEY_PREFIX}${dayId}`;
}

function loadPersistedWorkoutTimer(dayId: string): PersistedWorkoutTimer | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getWorkoutTimerStorageKey(dayId));

    if (!rawValue) {
      return null;
    }

    const value = JSON.parse(rawValue) as Partial<PersistedWorkoutTimer>;

    if (
      typeof value.baseSeconds !== "number" ||
      !Number.isFinite(value.baseSeconds) ||
      typeof value.startedAt !== "number" ||
      !Number.isFinite(value.startedAt)
    ) {
      window.localStorage.removeItem(getWorkoutTimerStorageKey(dayId));
      return null;
    }

    return {
      baseSeconds: Math.max(0, Math.floor(value.baseSeconds)),
      startedAt: value.startedAt,
    };
  } catch {
    window.localStorage.removeItem(getWorkoutTimerStorageKey(dayId));
    return null;
  }
}

function persistWorkoutTimer(dayId: string, timer: PersistedWorkoutTimer) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getWorkoutTimerStorageKey(dayId),
    JSON.stringify(timer),
  );
}

function clearPersistedWorkoutTimer(dayId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getWorkoutTimerStorageKey(dayId));
}

function getRunningTimerSeconds(baseSeconds: number, startedAt: number) {
  return baseSeconds + Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
}

function hasRunningTimerExpired(baseSeconds: number, startedAt: number) {
  return getRunningTimerSeconds(baseSeconds, startedAt) >= WORKOUT_TIMER_MAX_SECONDS;
}

function formatWeekRange(day: WorkoutDayDetail) {
  const startDate = dateFormatter.format(
    new Date(`${day.week_start_date}T00:00:00`),
  );
  const endDate = dateFormatter.format(new Date(`${day.week_end_date}T00:00:00`));
  return `${startDate} - ${endDate}`;
}

function formatSnapshotTime(value: string | null) {
  if (!value) {
    return "локальная копия ещё не сохранена";
  }

  return snapshotTimeFormatter.format(new Date(value));
}

function formatOptionalWeight(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return `${value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })} кг`;
}

function formatOptionalRpe(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

function formatOptionalRestSeconds(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  if (value < 60) {
    return `${value} сек`;
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return seconds > 0 ? `${minutes} мин ${seconds} сек` : `${minutes} мин`;
}

function formatDurationSeconds(value: number) {
  const safeValue = Math.max(0, value);
  const hours = Math.floor(safeValue / 3600);
  const minutes = Math.floor((safeValue % 3600) / 60);
  const seconds = safeValue % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((part) => part.toString().padStart(2, "0"))
      .join(":");
  }

  return [minutes, seconds]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}

function isCompletedWorkoutSet(set: WeeklyProgramSetSummary) {
  return typeof set.actual_reps === "number";
}

function isCompletedWorkoutExercise(exercise: WeeklyProgramExerciseSummary) {
  return exercise.sets.length > 0 && exercise.sets.every(isCompletedWorkoutSet);
}

function getFirstIncompleteExerciseIndex(
  exercises: WeeklyProgramExerciseSummary[],
) {
  return exercises.findIndex((exercise) => !isCompletedWorkoutExercise(exercise));
}

function getInitialActualRepsMap(day: WorkoutDayDetail) {
  const nextState: Record<string, string> = {};

  for (const exercise of day.exercises) {
    for (const set of exercise.sets) {
      nextState[set.id] = set.actual_reps?.toString() ?? "";
    }
  }

  return nextState;
}

function getInitialActualWeightMap(day: WorkoutDayDetail) {
  const nextState: Record<string, string> = {};

  for (const exercise of day.exercises) {
    for (const set of exercise.sets) {
      nextState[set.id] =
        typeof set.actual_weight_kg === "number" ? set.actual_weight_kg.toString() : "";
    }
  }

  return nextState;
}

function getInitialActualRpeMap(day: WorkoutDayDetail) {
  const nextState: Record<string, string> = {};

  for (const exercise of day.exercises) {
    for (const set of exercise.sets) {
      nextState[set.id] =
        typeof set.actual_rpe === "number" ? set.actual_rpe.toString() : "";
    }
  }

  return nextState;
}

function getInitialRestSecondsMap(day: WorkoutDayDetail) {
  const nextState: Record<string, string> = {};

  for (const exercise of day.exercises) {
    for (const set of exercise.sets) {
      nextState[set.id] =
        typeof set.rest_seconds === "number" ? set.rest_seconds.toString() : "";
    }
  }

  return nextState;
}

function getInitialSetNoteMap(day: WorkoutDayDetail) {
  const nextState: Record<string, string> = {};

  for (const exercise of day.exercises) {
    for (const set of exercise.sets) {
      nextState[set.id] = set.set_note ?? "";
    }
  }

  return nextState;
}

function getRpeOptions() {
  return Array.from({ length: 11 }, (_, index) => 5 + index * 0.5);
}

function applyWorkoutDayExecution(
  day: WorkoutDayDetail,
  input: {
    status?: WorkoutDayDetail["status"];
    bodyWeightKg?: number | null;
    sessionNote?: string | null;
    sessionDurationSeconds?: number | null;
  },
) {
  return {
    ...day,
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.bodyWeightKg !== undefined
      ? { body_weight_kg: input.bodyWeightKg }
      : {}),
    ...(input.sessionNote !== undefined ? { session_note: input.sessionNote } : {}),
    ...(input.sessionDurationSeconds !== undefined
      ? { session_duration_seconds: input.sessionDurationSeconds }
      : {}),
  };
}

function applyWorkoutSetPerformance(
  day: WorkoutDayDetail,
  setId: string,
  actualReps: number | null,
  actualWeightKg: number | null,
  actualRpe: number | null,
  restSeconds: number | null,
  setNote: string | null,
) {
  return {
    ...day,
    exercises: day.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) =>
        set.id === setId
          ? {
              ...set,
              actual_reps: actualReps,
              actual_weight_kg: actualWeightKg,
              actual_rpe: actualRpe,
              rest_seconds: restSeconds,
              set_note: setNote,
            }
          : set,
      ),
    })),
  };
}

function parseOptionalWeight(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized.length) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseOptionalRpe(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized.length) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function applyQueuedMutations(day: WorkoutDayDetail, mutations: OfflineMutation[]) {
  return mutations.reduce((currentDay, mutation) => {
    if (mutation.entity === "workout_day_status") {
      return applyWorkoutDayExecution(currentDay, {
        status: mutation.payload.status,
      });
    }

    if (mutation.entity === "workout_day_execution") {
      return applyWorkoutDayExecution(currentDay, {
        status: mutation.payload.status,
        bodyWeightKg: mutation.payload.bodyWeightKg,
        sessionNote: mutation.payload.sessionNote,
        sessionDurationSeconds: mutation.payload.sessionDurationSeconds,
      });
    }

    return applyWorkoutSetPerformance(
      currentDay,
      mutation.payload.setId,
      mutation.payload.actualReps,
      mutation.payload.actualWeightKg,
      mutation.payload.actualRpe,
      mutation.payload.restSeconds,
      mutation.payload.setNote,
    );
  }, day);
}

export function WorkoutDaySession({
  initialDay,
  isFocusMode = false,
}: {
  initialDay: WorkoutDayDetail;
  isFocusMode?: boolean;
}) {
  const router = useRouter();
  const [day, setDay] = useState(initialDay);
  const [actualRepsBySetId, setActualRepsBySetId] = useState<Record<string, string>>(
    () => getInitialActualRepsMap(initialDay),
  );
  const [actualWeightBySetId, setActualWeightBySetId] = useState<Record<string, string>>(
    () => getInitialActualWeightMap(initialDay),
  );
  const [actualRpeBySetId, setActualRpeBySetId] = useState<Record<string, string>>(
    () => getInitialActualRpeMap(initialDay),
  );
  const [restSecondsBySetId, setRestSecondsBySetId] = useState<Record<string, string>>(
    () => getInitialRestSecondsMap(initialDay),
  );
  const [setNotesBySetId, setSetNotesBySetId] = useState<Record<string, string>>(
    () => getInitialSetNoteMap(initialDay),
  );
  const [dayBodyWeightValue, setDayBodyWeightValue] = useState(
    () =>
      typeof initialDay.body_weight_kg === "number"
        ? initialDay.body_weight_kg.toString()
        : "",
  );
  const [daySessionNoteValue, setDaySessionNoteValue] = useState(
    () => initialDay.session_note ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingMutationCount, setPendingMutationCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<string | null>(null);
  const pullCursorRef = useRef<string | null>(null);
  const pullPromiseRef = useRef<Promise<WorkoutDayDetail | null> | null>(null);
  const lastPullStartedAtRef = useRef(0);
  const hasBootstrappedSyncRef = useRef(false);
  const [isFocusHeaderCollapsed, setIsFocusHeaderCollapsed] = useState(false);
  const [timerBaseSeconds, setTimerBaseSeconds] = useState(
    () => initialDay.session_duration_seconds ?? 0,
  );
  const [timerLiveSeconds, setTimerLiveSeconds] = useState(
    () => initialDay.session_duration_seconds ?? 0,
  );
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [shouldPersistExpiredTimerReset, setShouldPersistExpiredTimerReset] =
    useState(false);
  const expiredTimerResetDayIdRef = useRef<string | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(() => {
    const nextIndex = getFirstIncompleteExerciseIndex(initialDay.exercises);
    return nextIndex === -1 ? 0 : nextIndex;
  });

  const workoutSets = useMemo(
    () => day.exercises.flatMap((exercise) => exercise.sets),
    [day.exercises],
  );
  const isMobileFocusMode = isFocusMode;
  const workoutDayHref = `/workouts/day/${day.id}` as Route;
  const isTimerRunning = timerStartedAt !== null;
  const firstIncompleteExerciseIndex = useMemo(
    () => getFirstIncompleteExerciseIndex(day.exercises),
    [day.exercises],
  );
  const unlockedExerciseCount = useMemo(() => {
    if (!day.exercises.length) {
      return 0;
    }

    return firstIncompleteExerciseIndex === -1
      ? day.exercises.length
      : firstIncompleteExerciseIndex + 1;
  }, [day.exercises.length, firstIncompleteExerciseIndex]);
  const safeActiveExerciseIndex = useMemo(() => {
    if (!day.exercises.length) {
      return 0;
    }

    return Math.min(
      activeExerciseIndex,
      Math.max(0, unlockedExerciseCount - 1),
    );
  }, [activeExerciseIndex, day.exercises.length, unlockedExerciseCount]);
  const activeExercise =
    isMobileFocusMode && day.exercises.length
      ? day.exercises[safeActiveExerciseIndex] ?? null
      : null;
  const unlockedExercises = useMemo(
    () => day.exercises.slice(0, unlockedExerciseCount),
    [day.exercises, unlockedExerciseCount],
  );
  const visibleExerciseEntries = useMemo(
    () =>
      isMobileFocusMode
        ? activeExercise
          ? [{ exercise: activeExercise, index: safeActiveExerciseIndex }]
          : []
        : day.exercises.map((exercise, index) => ({ exercise, index })),
    [activeExercise, day.exercises, isMobileFocusMode, safeActiveExerciseIndex],
  );
  const currentSessionDurationSeconds = isTimerRunning
    ? timerLiveSeconds
    : timerBaseSeconds;

  const applyTimerStateForDay = useCallback((nextDay: WorkoutDayDetail) => {
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

  const completedSetsCount = useMemo(
    () =>
      workoutSets.filter((set) => {
        const repsValue = actualRepsBySetId[set.id]?.trim() ?? "";
        const weightValue = actualWeightBySetId[set.id]?.trim() ?? "";
        const rpeValue = actualRpeBySetId[set.id]?.trim() ?? "";
        const restValue = restSecondsBySetId[set.id]?.trim() ?? "";
        const noteValue = setNotesBySetId[set.id]?.trim() ?? "";
        return Boolean(repsValue || weightValue || rpeValue || restValue || noteValue);
      }).length,
    [
      actualRepsBySetId,
      actualRpeBySetId,
      actualWeightBySetId,
      restSecondsBySetId,
      setNotesBySetId,
      workoutSets,
    ],
  );

  const totalSetsCount = workoutSets.length;

  const totalTonnageKg = useMemo(
    () =>
      workoutSets.reduce((sum, set) => {
        const reps = typeof set.actual_reps === "number" ? set.actual_reps : null;
        const weight =
          typeof set.actual_weight_kg === "number" ? set.actual_weight_kg : null;

        if (reps === null || weight === null) {
          return sum;
        }

        return sum + reps * weight;
      }, 0),
    [workoutSets],
  );

  const avgActualRpe = useMemo(() => {
    const rpeValues = workoutSets.flatMap((set) =>
      typeof set.actual_rpe === "number" ? [set.actual_rpe] : [],
    );

    if (!rpeValues.length) {
      return null;
    }

    return Number(
      (
        rpeValues.reduce((sum, value) => sum + value, 0) / rpeValues.length
      ).toFixed(1),
    );
  }, [workoutSets]);

  const completedExercisesCount = useMemo(
    () =>
      day.exercises.filter((exercise) => isCompletedWorkoutExercise(exercise))
        .length,
    [day.exercises],
  );

  const currentExerciseIsComplete = activeExercise
    ? isCompletedWorkoutExercise(activeExercise)
    : false;

  function setActualRepsValue(setId: string, value: string) {
    setActualRepsBySetId((current) => ({
      ...current,
      [setId]: value,
    }));
  }

  function setActualWeightValue(setId: string, value: string) {
    setActualWeightBySetId((current) => ({
      ...current,
      [setId]: value,
    }));
  }

  function setActualRpeValue(setId: string, value: string) {
    setActualRpeBySetId((current) => ({
      ...current,
      [setId]: value,
    }));
  }

  function setRestSecondsValue(setId: string, value: string) {
    setRestSecondsBySetId((current) => ({
      ...current,
      [setId]: value,
    }));
  }

  function setSetNoteValue(setId: string, value: string) {
    setSetNotesBySetId((current) => ({
      ...current,
      [setId]: value,
    }));
  }

  const persistWorkoutDay = useCallback(async (nextDay: WorkoutDayDetail) => {
    const updatedAt = await cacheWorkoutDaySnapshot(nextDay);
    setLastSnapshotAt(updatedAt);
  }, []);

  const applyDaySnapshot = useCallback(
    async (nextDay: WorkoutDayDetail) => {
      setDay(nextDay);
      setActualRepsBySetId(getInitialActualRepsMap(nextDay));
      setActualWeightBySetId(getInitialActualWeightMap(nextDay));
      setActualRpeBySetId(getInitialActualRpeMap(nextDay));
      setRestSecondsBySetId(getInitialRestSecondsMap(nextDay));
      setSetNotesBySetId(getInitialSetNoteMap(nextDay));
      setDayBodyWeightValue(
        typeof nextDay.body_weight_kg === "number"
          ? nextDay.body_weight_kg.toString()
          : "",
      );
      setDaySessionNoteValue(nextDay.session_note ?? "");
      applyTimerStateForDay(nextDay);
      const nextExerciseIndex = getFirstIncompleteExerciseIndex(nextDay.exercises);
      setActiveExerciseIndex(nextExerciseIndex === -1 ? 0 : nextExerciseIndex);
      await persistWorkoutDay(nextDay);
    },
    [applyTimerStateForDay, persistWorkoutDay],
  );

  const refreshPendingMutationCount = useCallback(async () => {
    const count = await getPendingOfflineMutationCount();
    setPendingMutationCount(count);
  }, []);

  const hydrateLocalDay = useCallback(async () => {
    await cleanupStaleOfflineState();

    const [cachedSnapshot, queuedMutations] = await Promise.all([
      getCachedWorkoutDaySnapshot(initialDay.id),
      listQueuedWorkoutMutationsForDay(initialDay.id),
    ]);
    const baseDay = cachedSnapshot.day ?? initialDay;
    const hydratedDay = applyQueuedMutations(baseDay, queuedMutations);

    setDay(hydratedDay);
    setActualRepsBySetId(getInitialActualRepsMap(hydratedDay));
    setActualWeightBySetId(getInitialActualWeightMap(hydratedDay));
    setActualRpeBySetId(getInitialActualRpeMap(hydratedDay));
    setRestSecondsBySetId(getInitialRestSecondsMap(hydratedDay));
    setSetNotesBySetId(getInitialSetNoteMap(hydratedDay));
    setDayBodyWeightValue(
      typeof hydratedDay.body_weight_kg === "number"
        ? hydratedDay.body_weight_kg.toString()
        : "",
    );
    setDaySessionNoteValue(hydratedDay.session_note ?? "");
    applyTimerStateForDay(hydratedDay);
    const nextExerciseIndex = getFirstIncompleteExerciseIndex(hydratedDay.exercises);
    setActiveExerciseIndex(nextExerciseIndex === -1 ? 0 : nextExerciseIndex);
    setLastSnapshotAt(cachedSnapshot.updatedAt);
    await persistWorkoutDay(hydratedDay);
    await refreshPendingMutationCount();
  }, [applyTimerStateForDay, initialDay, persistWorkoutDay, refreshPendingMutationCount]);

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
        setError(
          rejectedMutations[0]?.message ??
            "Не все изменения удалось отправить. Попробуй ещё раз позже.",
        );
      } else if (result.applied > 0) {
        setNotice("Изменения отправлены.");
      } else if (result.discardedStale > 0) {
        setNotice(
          `Очищено устаревших локальных изменений: ${result.discardedStale}.`,
        );
      }

      if (result.applied > 0 || rejectedMutations.length > 0) {
        await pullLatestDaySnapshot({ force: true }).catch(() => null);
      }
    } catch {
      await refreshPendingMutationCount();
    } finally {
      setIsSyncing(false);
    }
  }, [pullLatestDaySnapshot, refreshPendingMutationCount]);

  useEffect(() => {
    setDay(initialDay);
    setActualRepsBySetId(getInitialActualRepsMap(initialDay));
    setActualWeightBySetId(getInitialActualWeightMap(initialDay));
    setActualRpeBySetId(getInitialActualRpeMap(initialDay));
    setRestSecondsBySetId(getInitialRestSecondsMap(initialDay));
    setSetNotesBySetId(getInitialSetNoteMap(initialDay));
    setDayBodyWeightValue(
      typeof initialDay.body_weight_kg === "number"
        ? initialDay.body_weight_kg.toString()
        : "",
    );
    setDaySessionNoteValue(initialDay.session_note ?? "");
    applyTimerStateForDay(initialDay);
    const nextExerciseIndex = getFirstIncompleteExerciseIndex(initialDay.exercises);
    setActiveExerciseIndex(nextExerciseIndex === -1 ? 0 : nextExerciseIndex);
    pullCursorRef.current = null;

    void hydrateLocalDay();
  }, [applyTimerStateForDay, hydrateLocalDay, initialDay]);

  useEffect(() => {
    if (timerStartedAt === null) {
      setTimerLiveSeconds(timerBaseSeconds);
      return;
    }

    const syncTimer = () => {
      if (hasRunningTimerExpired(timerBaseSeconds, timerStartedAt)) {
        clearPersistedWorkoutTimer(day.id);
        expiredTimerResetDayIdRef.current = day.id;
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
  }, [day.id, timerBaseSeconds, timerStartedAt]);

  useEffect(() => {
    if (!isMobileFocusMode || !day.exercises.length) {
      return;
    }

    setActiveExerciseIndex((currentIndex) => {
      const maxUnlockedIndex = Math.max(0, unlockedExerciseCount - 1);
      const safeIndex = Math.min(currentIndex, maxUnlockedIndex);
      const currentExercise = day.exercises[safeIndex];

      if (
        currentExercise &&
        isCompletedWorkoutExercise(currentExercise) &&
        safeIndex < maxUnlockedIndex
      ) {
        return safeIndex + 1;
      }

      if (safeIndex < 0) {
        return 0;
      }

      return safeIndex;
    });
  }, [day.exercises, isMobileFocusMode, unlockedExerciseCount]);

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

  const persistDayExecution = useCallback(async (
    nextDay: WorkoutDayDetail,
    noticeMessage: string | null,
    offlineNoticeMessage: string | null,
  ) => {
    await persistWorkoutDay(nextDay);

    if (!navigator.onLine) {
      await queueWorkoutDayExecutionMutation({
        dayId: nextDay.id,
        status: nextDay.status as "planned" | "in_progress" | "done",
        bodyWeightKg: nextDay.body_weight_kg,
        sessionNote: nextDay.session_note,
        sessionDurationSeconds: nextDay.session_duration_seconds,
      });
      await refreshPendingMutationCount();
      setIsOnline(false);
      if (offlineNoticeMessage) {
        setNotice(offlineNoticeMessage);
      }
      return;
    }

    const response = await fetch(`/api/workout-days/${nextDay.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: nextDay.status,
        bodyWeightKg: nextDay.body_weight_kg,
        sessionNote: nextDay.session_note,
        sessionDurationSeconds: nextDay.session_duration_seconds,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    if (!response.ok) {
      throw new Error(payload?.message ?? "Не удалось сохранить день тренировки.");
    }

    setIsOnline(true);
    if (noticeMessage) {
      setNotice(noticeMessage);
    }
    await pullLatestDaySnapshot({ force: true }).catch(() => null);
  }, [persistWorkoutDay, pullLatestDaySnapshot, refreshPendingMutationCount]);

  const saveSessionDuration = useCallback(async (
    nextSeconds: number,
    noticeMessage: string | null,
    offlineNoticeMessage: string | null,
  ) => {
    setError(null);
    if (noticeMessage) {
      setNotice(null);
    }
    setIsPending(true);

    const previousDay = day;
    const previousDuration = day.session_duration_seconds ?? 0;
    const optimisticDay = applyWorkoutDayExecution(day, {
      sessionDurationSeconds: nextSeconds,
    });

    setDay(optimisticDay);
    setTimerBaseSeconds(nextSeconds);
    setTimerLiveSeconds(nextSeconds);

    try {
      await persistDayExecution(optimisticDay, noticeMessage, offlineNoticeMessage);
    } catch (error) {
      setDay(previousDay);
      await persistWorkoutDay(previousDay);
      setTimerBaseSeconds(previousDuration);
      setTimerLiveSeconds(previousDuration);
      setError(
        error instanceof Error
          ? error.message
          : "Не удалось сохранить таймер тренировки.",
      );
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [day, persistDayExecution, persistWorkoutDay]);

  useEffect(() => {
    if (!shouldPersistExpiredTimerReset) {
      return;
    }

    setShouldPersistExpiredTimerReset(false);
    setNotice("Таймер автоматически сброшен через 2 часа.");

    void saveSessionDuration(
      0,
      null,
      "Таймер автоматически сброшен на устройстве и отправится позже.",
    )
      .catch(() => null)
      .finally(() => {
        expiredTimerResetDayIdRef.current = null;
      });
  }, [saveSessionDuration, shouldPersistExpiredTimerReset]);

  function updateDayStatus(nextStatus: "planned" | "in_progress" | "done") {
    setError(null);
    setNotice(null);
    setIsPending(true);

    const previousDay = day;
    const optimisticDay = applyWorkoutDayExecution(day, {
      status: nextStatus,
    });
    setDay(optimisticDay);

    startTransition(async () => {
      try {
        await persistDayExecution(
          optimisticDay,
          "Статус дня обновлён.",
          "Статус сохранён на устройстве и отправится, когда связь вернётся.",
        );
      } catch (error) {
        setDay(previousDay);
        await persistWorkoutDay(previousDay);
        setError(
          error instanceof Error
            ? error.message
            : "Не удалось обновить статус дня.",
        );
      } finally {
        setIsPending(false);
      }
    });
  }

  function saveDayContext() {
    setError(null);
    setNotice(null);
    setIsPending(true);

    const parsedBodyWeight = parseOptionalWeight(dayBodyWeightValue);
    if (
      parsedBodyWeight !== null &&
      (!Number.isFinite(parsedBodyWeight) || parsedBodyWeight < 0 || parsedBodyWeight > 500)
    ) {
      setError("Вес тела должен быть числом от 0 до 500 кг.");
      setIsPending(false);
      return;
    }

    const trimmedSessionNote = daySessionNoteValue.trim();
    if (trimmedSessionNote.length > 4000) {
      setError("Заметка о тренировке должна быть не длиннее 4000 символов.");
      setIsPending(false);
      return;
    }

    const previousDay = day;
    const optimisticDay = applyWorkoutDayExecution(day, {
      bodyWeightKg: parsedBodyWeight,
      sessionNote: trimmedSessionNote || null,
    });
    setDay(optimisticDay);

    startTransition(async () => {
      try {
        await persistDayExecution(
          optimisticDay,
          "Контекст тренировки сохранён.",
          "Контекст тренировки сохранён на устройстве и отправится позже.",
        );
      } catch (error) {
        setDay(previousDay);
        await persistWorkoutDay(previousDay);
        setDayBodyWeightValue(
          typeof previousDay.body_weight_kg === "number"
            ? previousDay.body_weight_kg.toString()
            : "",
        );
        setDaySessionNoteValue(previousDay.session_note ?? "");
        setError(
          error instanceof Error
            ? error.message
            : "Не удалось сохранить контекст тренировки.",
        );
      } finally {
        setIsPending(false);
      }
    });
  }

  function saveSet(setId: string) {
    setError(null);
    setNotice(null);
    setIsPending(true);

    const rawReps = actualRepsBySetId[setId]?.trim() ?? "";
    const rawWeight = actualWeightBySetId[setId]?.trim() ?? "";
    const rawRpe = actualRpeBySetId[setId]?.trim() ?? "";
    const rawRestSeconds = restSecondsBySetId[setId]?.trim() ?? "";
    const rawSetNote = setNotesBySetId[setId] ?? "";

    const actualReps = rawReps.length ? Number(rawReps) : null;
    const actualWeightKg = parseOptionalWeight(rawWeight);
    const actualRpe = parseOptionalRpe(rawRpe);
    const restSeconds = rawRestSeconds.length ? Number(rawRestSeconds) : null;
    const trimmedSetNote = rawSetNote.trim();

    if (actualReps !== null && (!Number.isInteger(actualReps) || actualReps < 0)) {
      setError("Фактические повторы должны быть целым числом 0 или больше.");
      setIsPending(false);
      return;
    }

    if (
      actualWeightKg !== null &&
      (!Number.isFinite(actualWeightKg) || actualWeightKg < 0 || actualWeightKg > 1000)
    ) {
      setError("Фактический вес должен быть числом от 0 до 1000 кг.");
      setIsPending(false);
      return;
    }

    if (
      actualRpe !== null &&
      (!Number.isFinite(actualRpe) || actualRpe < 1 || actualRpe > 10)
    ) {
      setError("RPE должен быть числом от 1 до 10.");
      setIsPending(false);
      return;
    }

    if (
      restSeconds !== null &&
      (!Number.isInteger(restSeconds) || restSeconds < 0 || restSeconds > 3600)
    ) {
      setError("Отдых между подходами должен быть целым числом от 0 до 3600 секунд.");
      setIsPending(false);
      return;
    }

    if (trimmedSetNote.length > 1000) {
      setError("Заметка к подходу должна быть не длиннее 1000 символов.");
      setIsPending(false);
      return;
    }

    const previousDay = day;
    const previousSet = workoutSets.find((set) => set.id === setId);
    const previousActualReps = previousSet?.actual_reps ?? null;
    const previousActualWeightKg = previousSet?.actual_weight_kg ?? null;
    const previousActualRpe = previousSet?.actual_rpe ?? null;
    const previousRestSeconds = previousSet?.rest_seconds ?? null;
    const previousSetNote = previousSet?.set_note ?? null;
    const shouldPromoteDayStatus = day.status === "planned";
    const optimisticSetDay = applyWorkoutSetPerformance(
      day,
      setId,
      actualReps,
      actualWeightKg,
      actualRpe,
      restSeconds,
      trimmedSetNote || null,
    );
    const optimisticDay = shouldPromoteDayStatus
      ? applyWorkoutDayExecution(optimisticSetDay, {
          status: "in_progress",
        })
      : optimisticSetDay;

    setDay(optimisticDay);

    startTransition(async () => {
      try {
        await persistWorkoutDay(optimisticDay);

        if (!navigator.onLine) {
          await queueWorkoutSetActualRepsMutation({
            dayId: day.id,
            setId,
            actualReps,
            actualWeightKg,
            actualRpe,
            restSeconds,
            setNote: trimmedSetNote || null,
          });

          if (shouldPromoteDayStatus) {
            await queueWorkoutDayExecutionMutation({
              dayId: day.id,
              status: "in_progress",
              bodyWeightKg: optimisticDay.body_weight_kg,
              sessionNote: optimisticDay.session_note,
              sessionDurationSeconds: optimisticDay.session_duration_seconds,
            });
          }

          await refreshPendingMutationCount();
          setIsOnline(false);
          setNotice(
            "Показатели подхода сохранены на устройстве и отправятся, когда связь вернётся.",
          );
          return;
        }

        const response = await fetch(`/api/workout-sets/${setId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actualReps,
            actualWeightKg,
            actualRpe,
            restSeconds,
            setNote: trimmedSetNote || null,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          throw new Error(
            payload?.message ?? "Не удалось сохранить показатели подхода.",
          );
        }

        if (shouldPromoteDayStatus) {
          try {
            await persistDayExecution(
              applyWorkoutDayExecution(optimisticDay, {
                status: "in_progress",
              }),
              "Подход сохранён, день переведён в работу.",
              "Подход сохранён на устройстве. Статус дня отправится позже.",
            );
          } catch {
            await queueWorkoutDayExecutionMutation({
              dayId: optimisticDay.id,
              status: "in_progress",
              bodyWeightKg: optimisticDay.body_weight_kg,
              sessionNote: optimisticDay.session_note,
              sessionDurationSeconds: optimisticDay.session_duration_seconds,
            });
            await refreshPendingMutationCount();
            setNotice(
              "Подход сохранён. Статус дня отправится автоматически чуть позже.",
            );
            setIsOnline(true);
          }
        } else {
          setIsOnline(true);
          setNotice("Показатели подхода сохранены.");
          await pullLatestDaySnapshot({ force: true }).catch(() => null);
        }
      } catch (error) {
        setDay(previousDay);
        await persistWorkoutDay(previousDay);
        setActualRepsBySetId((current) => ({
          ...current,
          [setId]: previousActualReps?.toString() ?? "",
        }));
        setActualWeightBySetId((current) => ({
          ...current,
          [setId]:
            typeof previousActualWeightKg === "number"
              ? previousActualWeightKg.toString()
              : "",
        }));
        setActualRpeBySetId((current) => ({
          ...current,
          [setId]:
            typeof previousActualRpe === "number" ? previousActualRpe.toString() : "",
        }));
        setRestSecondsBySetId((current) => ({
          ...current,
          [setId]:
            typeof previousRestSeconds === "number"
              ? previousRestSeconds.toString()
              : "",
        }));
        setSetNotesBySetId((current) => ({
          ...current,
          [setId]: previousSetNote ?? "",
        }));
        setError(
          error instanceof Error
            ? error.message
            : "Не удалось сохранить показатели подхода.",
        );
      } finally {
        setIsPending(false);
      }
    });
  }

  function startSessionTimer() {
    if (isTimerRunning) {
      return;
    }

    setError(null);
    setNotice(null);
    const startedAt = Date.now();
    expiredTimerResetDayIdRef.current = null;
    persistWorkoutTimer(day.id, {
      baseSeconds: timerBaseSeconds,
      startedAt,
    });
    setTimerStartedAt(startedAt);
  }

  function getResolvedCurrentSessionDurationSeconds() {
    if (timerStartedAt === null) {
      return timerBaseSeconds;
    }

    if (hasRunningTimerExpired(timerBaseSeconds, timerStartedAt)) {
      return 0;
    }

    return getRunningTimerSeconds(timerBaseSeconds, timerStartedAt);
  }

  async function pauseSessionTimer(options?: { silent?: boolean }) {
    if (timerStartedAt === null) {
      return;
    }

    const nextSeconds =
      hasRunningTimerExpired(timerBaseSeconds, timerStartedAt)
        ? 0
        : getRunningTimerSeconds(timerBaseSeconds, timerStartedAt);

    clearPersistedWorkoutTimer(day.id);
    expiredTimerResetDayIdRef.current = null;
    setTimerStartedAt(null);

    await saveSessionDuration(
      nextSeconds,
      options?.silent ? null : "Таймер тренировки сохранён.",
      options?.silent ? null : "Таймер сохранён на устройстве и отправится позже.",
    );
  }

  async function resetSessionTimer() {
    clearPersistedWorkoutTimer(day.id);
    expiredTimerResetDayIdRef.current = null;
    setTimerStartedAt(null);
    await saveSessionDuration(
      0,
      "Таймер тренировки сброшен.",
      "Сброс таймера сохранён на устройстве и отправится позже.",
    );
  }

  function completeWorkout() {
    setError(null);
    setNotice(null);
    setIsPending(true);

    const previousDay = day;
    const previousTimerStartedAt = timerStartedAt;
    const previousTimerBaseSeconds = timerBaseSeconds;
    const previousTimerLiveSeconds = timerLiveSeconds;
    const shouldAskAboutTimer =
      timerStartedAt !== null || currentSessionDurationSeconds > 0;
    const shouldSaveTimer = shouldAskAboutTimer
      ? window.confirm("Сохранить время тренировки перед завершением?")
      : true;
    const nextSessionDurationSeconds = shouldSaveTimer
      ? getResolvedCurrentSessionDurationSeconds()
      : 0;

    clearPersistedWorkoutTimer(day.id);
    expiredTimerResetDayIdRef.current = null;
    setTimerStartedAt(null);
    setTimerBaseSeconds(nextSessionDurationSeconds);
    setTimerLiveSeconds(nextSessionDurationSeconds);

    const optimisticDay = applyWorkoutDayExecution(day, {
      status: "done",
      sessionDurationSeconds: nextSessionDurationSeconds,
    });

    setDay(optimisticDay);

    startTransition(async () => {
      try {
        await persistDayExecution(
          optimisticDay,
          shouldAskAboutTimer
            ? shouldSaveTimer
              ? "Тренировка завершена, время сохранено."
              : "Тренировка завершена без сохранения времени."
            : "Тренировка завершена.",
          shouldAskAboutTimer
            ? shouldSaveTimer
              ? "Тренировка завершена. Время сохранено на устройстве и отправится позже."
              : "Тренировка завершена без сохранения времени. Изменение отправится позже."
            : "Тренировка завершена на устройстве и отправится позже.",
        );
      } catch (error) {
        setDay(previousDay);
        await persistWorkoutDay(previousDay);
        setTimerStartedAt(previousTimerStartedAt);
        setTimerBaseSeconds(previousTimerBaseSeconds);
        setTimerLiveSeconds(previousTimerLiveSeconds);

        if (previousTimerStartedAt !== null) {
          persistWorkoutTimer(day.id, {
            baseSeconds: previousTimerBaseSeconds,
            startedAt: previousTimerStartedAt,
          });
        }

        setError(
          error instanceof Error
            ? error.message
            : "Не удалось завершить тренировку.",
        );
      } finally {
        setIsPending(false);
      }
    });
  }

  async function returnToRegularMode() {
    if (isTimerRunning) {
      try {
        await pauseSessionTimer({ silent: true });
      } catch {
        return;
      }
    }

    router.push(workoutDayHref);
  }

  function renderStatusActions({
    compact = false,
  }: {
    compact?: boolean;
  }) {
    const primaryButtonClassName = compact
      ? "rounded-full bg-accent px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      : "rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
    const secondaryButtonClassName = compact
      ? "rounded-full border border-border px-4 py-2.5 text-xs font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
      : "rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60";

    return (
      <>
        {day.status === "planned" ? (
          <button
            className={primaryButtonClassName}
            disabled={isPending || isSyncing || !day.is_locked}
            onClick={() => updateDayStatus("in_progress")}
            type="button"
          >
            Начать тренировку
          </button>
        ) : null}

        {day.status === "in_progress" ? (
          <>
            <button
              className={primaryButtonClassName}
              disabled={isPending || isSyncing}
              onClick={() => completeWorkout()}
              type="button"
              >
              Завершить
            </button>
            <button
              className={secondaryButtonClassName}
              disabled={isPending || isSyncing}
              onClick={() => updateDayStatus("planned")}
              type="button"
            >
              Вернуть в план
            </button>
          </>
        ) : null}

        {day.status === "done" ? (
          <button
            className={secondaryButtonClassName}
            disabled={isPending || isSyncing}
            onClick={() => updateDayStatus("in_progress")}
            type="button"
          >
            Вернуть в процесс
          </button>
        ) : null}

        {pendingMutationCount > 0 && isOnline ? (
          <button
            className={secondaryButtonClassName}
            disabled={isPending || isSyncing}
            onClick={() => {
              void flushQueuedMutations();
            }}
            type="button"
          >
            {isSyncing
              ? "Отправляю..."
              : compact
                ? `Синхр. (${pendingMutationCount})`
                : `Отправить изменения (${pendingMutationCount})`}
          </button>
        ) : null}
      </>
    );
  }

  function renderDayNotices() {
    return (
      <>
        {!day.is_locked ? (
          <p className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Отмечать выполнение можно после фиксации недели.
          </p>
        ) : null}

        {!isOnline ? (
          <p className="mt-4 rounded-2xl border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Нет связи. Изменения по этой тренировке сохраняются на устройстве и
            отправятся автоматически, когда интернет вернётся.
          </p>
        ) : null}

        {pendingMutationCount > 0 ? (
          <p className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Ждут отправки с этого устройства: {pendingMutationCount}.
          </p>
        ) : null}

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
      </>
    );
  }

  return (
    <div className="grid gap-6">
      {isMobileFocusMode ? (
        <section className="card sticky top-[calc(0.75rem+env(safe-area-inset-top))] z-20 overflow-hidden p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                Текущая тренировка
              </p>
              <h2 className="mt-2 truncate text-xl font-semibold text-foreground">
                {dayLabels[day.day_of_week] ?? `День ${day.day_of_week}`}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                aria-expanded={!isFocusHeaderCollapsed}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/80 text-foreground transition hover:bg-white"
                onClick={() => setIsFocusHeaderCollapsed((current) => !current)}
                type="button"
              >
                {isFocusHeaderCollapsed ? (
                  <ChevronDown size={18} strokeWidth={2.2} />
                ) : (
                  <ChevronUp size={18} strokeWidth={2.2} />
                )}
              </button>
              <button
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
                onClick={() => {
                  void returnToRegularMode();
                }}
                type="button"
              >
                Обычный вид
              </button>
            </div>
          </div>

          {activeExercise ? (
            <p className="mt-3 text-sm text-muted">
              {currentExerciseIsComplete
                ? `${activeExercise.exercise_title_snapshot} · можно переходить дальше`
                : `${activeExercise.exercise_title_snapshot} · шаг ${safeActiveExerciseIndex + 1} из ${day.exercises.length}`}
            </p>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3 rounded-3xl border border-border bg-white/70 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Таймер
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatDurationSeconds(currentSessionDurationSeconds)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/85 text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!day.is_locked || isPending || isSyncing}
                onClick={() => {
                  if (isTimerRunning) {
                    void pauseSessionTimer();
                    return;
                  }

                  startSessionTimer();
                }}
                type="button"
              >
                {isTimerRunning ? (
                  <Pause size={18} strokeWidth={2.3} />
                ) : (
                  <Play size={18} strokeWidth={2.3} />
                )}
              </button>
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/85 text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  !day.is_locked ||
                  isPending ||
                  isSyncing ||
                  currentSessionDurationSeconds === 0
                }
                onClick={() => {
                  void resetSessionTimer();
                }}
                type="button"
              >
                <RotateCcw size={18} strokeWidth={2.1} />
              </button>
            </div>
          </div>

          {!isFocusHeaderCollapsed ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="pill">
                  {dayStatusLabels[day.status] ?? day.status}
                </span>
                <span className="pill">{`${completedSetsCount}/${totalSetsCount} подходов`}</span>
                <span className="pill">{`Готово ${completedExercisesCount}/${day.exercises.length} упражнений`}</span>
              </div>

              {unlockedExercises.length ? (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Шаги тренировки
                  </p>
                  <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
                    {unlockedExercises.map((exercise, index) => {
                      const isActive = index === safeActiveExerciseIndex;
                      const isComplete = isCompletedWorkoutExercise(exercise);

                      return (
                        <button
                          aria-pressed={isActive}
                          className={`min-w-[7.5rem] shrink-0 rounded-2xl border px-3 py-2 text-left transition ${
                            isActive
                              ? "border-accent/30 bg-accent-soft text-foreground shadow-[0_16px_36px_-30px_rgba(20,97,75,0.45)]"
                              : "border-border bg-white/80 text-foreground hover:bg-white"
                          }`}
                          key={exercise.id}
                          onClick={() => setActiveExerciseIndex(index)}
                          type="button"
                        >
                          <span className="block text-xs uppercase tracking-[0.18em] text-muted">
                            {`Упражнение ${index + 1}`}
                          </span>
                          <span className="mt-1 block truncate text-sm font-semibold">
                            {exercise.exercise_title_snapshot}
                          </span>
                          <span className="mt-1 block text-xs text-muted">
                            {isComplete ? "завершено" : isActive ? "текущий шаг" : "доступно"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {renderStatusActions({ compact: true })}
              </div>

              {!isFocusHeaderCollapsed ? renderDayNotices() : null}
            </>
          ) : null}
        </section>
      ) : null}

      {!isMobileFocusMode ? (
      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              День тренировки
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {dayLabels[day.day_of_week] ?? `День ${day.day_of_week}`}
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              {day.program_title} · {formatWeekRange(day)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="pill">
              {dayStatusLabels[day.status] ?? day.status}
            </span>
            <span className="pill">
              {day.is_locked ? "Неделя зафиксирована" : "Черновик недели"}
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-6">
          {[
            ["Упражнений", String(day.exercises.length)],
            ["Подходов", String(totalSetsCount)],
            ["Заполнено", `${completedSetsCount}/${totalSetsCount}`],
            [
              "Тоннаж",
              totalTonnageKg > 0
                ? `${Math.round(totalTonnageKg).toLocaleString("ru-RU")} кг`
                : "нет данных",
            ],
            ["Средний RPE", avgActualRpe !== null ? formatOptionalRpe(avgActualRpe) : "нет данных"],
            ["Таймер", formatDurationSeconds(day.session_duration_seconds ?? 0)],
          ].map(([label, value]) => (
            <article className="kpi p-4" key={label}>
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
            </article>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted">
          Последнее сохранение на устройстве: {formatSnapshotTime(lastSnapshotAt)}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 lg:hidden"
            href={`${workoutDayHref}?focus=1`}
          >
            Развернуть на весь экран
          </Link>

          {day.status === "planned" ? (
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending || isSyncing || !day.is_locked}
              onClick={() => updateDayStatus("in_progress")}
              type="button"
            >
              Начать тренировку
            </button>
          ) : null}

          {day.status === "in_progress" ? (
            <>
              <button
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending || isSyncing}
                onClick={() => updateDayStatus("done")}
                type="button"
              >
                Отметить как завершённую
              </button>
              <button
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending || isSyncing}
                onClick={() => updateDayStatus("planned")}
                type="button"
              >
                Вернуть в запланированные
              </button>
            </>
          ) : null}

          {day.status === "done" ? (
            <button
              className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending || isSyncing}
              onClick={() => updateDayStatus("in_progress")}
              type="button"
            >
              Вернуть в процесс
            </button>
          ) : null}

          {pendingMutationCount > 0 && isOnline ? (
            <button
              className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending || isSyncing}
              onClick={() => {
                void flushQueuedMutations();
              }}
              type="button"
            >
              {isSyncing
                ? "Отправляю..."
                : `Отправить изменения (${pendingMutationCount})`}
            </button>
          ) : null}
        </div>

        {!day.is_locked ? (
          <p className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Отмечать выполнение можно после фиксации недели.
          </p>
        ) : null}

        {!isOnline ? (
          <p className="mt-4 rounded-2xl border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Нет связи. Изменения по этой тренировке сохраняются на устройстве и
            отправятся автоматически, когда интернет вернётся.
          </p>
        ) : null}

        {pendingMutationCount > 0 ? (
          <p className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Ждут отправки с этого устройства: {pendingMutationCount}.
          </p>
        ) : null}

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
      ) : null}

      {!isMobileFocusMode ? (
      <section className="card p-6">
        <div className="mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Контекст дня
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-foreground">
            Вес тела и заметка
          </h3>
          <p className="mt-2 text-sm leading-7 text-muted">
            Эти данные помогают видеть самочувствие, восстановление и давать AI
            более точные рекомендации по тренировке.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr_auto] md:items-end">
          <label className="grid gap-2 text-sm text-muted">
            Вес тела утром, кг
            <input
              className={inputClassName}
              disabled={!day.is_locked || isPending || isSyncing}
              inputMode="decimal"
              onChange={(event) => setDayBodyWeightValue(event.target.value)}
              placeholder="Например, 82.4"
              value={dayBodyWeightValue}
            />
          </label>

          <label className="grid gap-2 text-sm text-muted">
            Заметка по тренировке
            <textarea
              className={textAreaClassName}
              disabled={!day.is_locked || isPending || isSyncing}
              onChange={(event) => setDaySessionNoteValue(event.target.value)}
              placeholder="Как самочувствие, сон, стресс, что далось тяжело или легко"
              value={daySessionNoteValue}
            />
          </label>

          <button
            className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!day.is_locked || isPending || isSyncing}
            onClick={saveDayContext}
            type="button"
          >
            Сохранить контекст
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white/60 p-4 text-sm text-muted">
            <p>Сохранённый вес: <span className="font-semibold text-foreground">{formatOptionalWeight(day.body_weight_kg)}</span></p>
          </div>
          <div className="rounded-2xl border border-border bg-white/60 p-4 text-sm text-muted">
            <p className="font-medium text-foreground">Сохранённая заметка</p>
            <p className="mt-2 leading-7">
              {day.session_note?.trim() || "Заметка пока не сохранена."}
            </p>
          </div>
        </div>
      </section>
      ) : null}

      <section className="grid gap-4">
        {visibleExerciseEntries.length ? (
          visibleExerciseEntries.map(({ exercise, index }) => (
            <article className="card p-4 sm:p-6" key={exercise.id}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                    {isMobileFocusMode
                      ? `Упражнение ${index + 1} из ${day.exercises.length}`
                      : "Упражнение"}
                  </p>
                  <h3 className="mt-2 break-words text-xl font-semibold text-foreground sm:text-2xl">
                    {exercise.exercise_title_snapshot}
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    Запланировано подходов: {exercise.sets_count}
                  </p>
                </div>

                {isMobileFocusMode ? (
                  <span className="pill" title={currentExerciseIsComplete ? "Упражнение завершено" : "Текущий шаг"}>
                    {currentExerciseIsComplete ? "Готово" : "Текущий шаг"}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3">
                {exercise.sets.map((set) => (
                  <div
                    className="rounded-2xl border border-border bg-white/60 p-4"
                    key={set.id}
                  >
                    <div className="grid gap-3 lg:grid-cols-[0.8fr_0.9fr_0.9fr_0.8fr_0.8fr_auto] lg:items-end">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          Подход {set.set_number}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          План: {formatPlannedRepTarget(set)} повторов
                        </p>
                      </div>

                      <label className="grid gap-2 text-sm text-muted">
                        Повторы
                        <select
                          className={inputClassName}
                          disabled={!day.is_locked || isPending || isSyncing}
                          onChange={(event) =>
                            setActualRepsValue(set.id, event.target.value)
                          }
                          value={actualRepsBySetId[set.id] ?? ""}
                        >
                          <option value="">Выбери повторы</option>
                          {getActualRepOptions(set).map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-2 text-sm text-muted">
                        Вес, кг
                        <input
                          className={inputClassName}
                          disabled={!day.is_locked || isPending || isSyncing}
                          inputMode="decimal"
                          onChange={(event) =>
                            setActualWeightValue(set.id, event.target.value)
                          }
                          placeholder="Например, 70"
                          value={actualWeightBySetId[set.id] ?? ""}
                        />
                      </label>

                      <label className="grid gap-2 text-sm text-muted">
                        RPE
                        <select
                          className={inputClassName}
                          disabled={!day.is_locked || isPending || isSyncing}
                          onChange={(event) =>
                            setActualRpeValue(set.id, event.target.value)
                          }
                          value={actualRpeBySetId[set.id] ?? ""}
                        >
                          <option value="">Выбери RPE</option>
                          {getRpeOptions().map((value) => (
                            <option key={value} value={value}>
                              {value.toLocaleString("ru-RU", {
                                minimumFractionDigits: value % 1 === 0 ? 0 : 1,
                                maximumFractionDigits: 1,
                              })}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-2 text-sm text-muted">
                        Отдых, сек
                        <input
                          className={inputClassName}
                          disabled={!day.is_locked || isPending || isSyncing}
                          inputMode="numeric"
                          onChange={(event) =>
                            setRestSecondsValue(set.id, event.target.value)
                          }
                          placeholder="Например, 120"
                          value={restSecondsBySetId[set.id] ?? ""}
                        />
                      </label>

                      <button
                        className="w-full rounded-full border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
                        disabled={!day.is_locked || isPending || isSyncing}
                        onClick={() => saveSet(set.id)}
                        type="button"
                      >
                        Сохранить
                      </button>
                    </div>

                    <label className="mt-3 grid gap-2 text-sm text-muted">
                      Заметка к подходу
                      <textarea
                        className={`${textAreaClassName} min-h-24`}
                        disabled={!day.is_locked || isPending || isSyncing}
                        onChange={(event) =>
                          setSetNoteValue(set.id, event.target.value)
                        }
                        placeholder="Например, тяжело пошла последняя пара повторов или отдых был короче обычного"
                        value={setNotesBySetId[set.id] ?? ""}
                      />
                    </label>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <div className="rounded-2xl border border-border/70 bg-white/70 px-4 py-3 text-sm text-muted">
                        Последние повторы:{" "}
                        <span className="font-semibold text-foreground">
                          {set.actual_reps ?? "нет данных"}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-white/70 px-4 py-3 text-sm text-muted">
                        Последний вес:{" "}
                        <span className="font-semibold text-foreground">
                          {formatOptionalWeight(set.actual_weight_kg)}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-white/70 px-4 py-3 text-sm text-muted">
                        Последний RPE:{" "}
                        <span className="font-semibold text-foreground">
                          {formatOptionalRpe(set.actual_rpe)}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-white/70 px-4 py-3 text-sm text-muted">
                        Последний отдых:{" "}
                        <span className="font-semibold text-foreground">
                          {formatOptionalRestSeconds(set.rest_seconds)}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-white/70 px-4 py-3 text-sm text-muted sm:col-span-2 xl:col-span-2">
                        <p className="font-medium text-foreground">Последняя заметка</p>
                        <p className="mt-2 leading-6">
                          {set.set_note?.trim() || "Заметка к подходу пока не сохранена."}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))
        ) : (
          <section className="card p-6">
            <p className="text-sm leading-7 text-muted">
              В этом тренировочном дне пока нет упражнений.
            </p>
          </section>
        )}
      </section>
    </div>
  );
}
