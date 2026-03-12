"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
import type { WorkoutDayDetail } from "@/lib/workout/weekly-programs";

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
  },
) {
  return {
    ...day,
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.bodyWeightKg !== undefined
      ? { body_weight_kg: input.bodyWeightKg }
      : {}),
    ...(input.sessionNote !== undefined ? { session_note: input.sessionNote } : {}),
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

export function WorkoutDaySession({ initialDay }: { initialDay: WorkoutDayDetail }) {
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
  const [isOnline, setIsOnline] = useState(
    () => (typeof navigator === "undefined" ? true : navigator.onLine),
  );
  const [pullCursor, setPullCursor] = useState<string | null>(null);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<string | null>(null);

  const workoutSets = useMemo(
    () => day.exercises.flatMap((exercise) => exercise.sets),
    [day.exercises],
  );

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
      await persistWorkoutDay(nextDay);
    },
    [persistWorkoutDay],
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
    setLastSnapshotAt(cachedSnapshot.updatedAt);
    await persistWorkoutDay(hydratedDay);
    await refreshPendingMutationCount();
  }, [initialDay, persistWorkoutDay, refreshPendingMutationCount]);

  const pullLatestDaySnapshot = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      return null;
    }

    const result = await pullWorkoutDaySnapshot(initialDay.id, pullCursor);

    if (result.snapshot) {
      await applyDaySnapshot(result.snapshot);
    }

    setPullCursor(result.nextCursor ?? null);
    setIsOnline(true);

    return result.snapshot;
  }, [applyDaySnapshot, initialDay.id, pullCursor]);

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
        await pullLatestDaySnapshot().catch(() => null);
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
    setPullCursor(null);

    void hydrateLocalDay();
  }, [hydrateLocalDay, initialDay]);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      void flushQueuedMutations();
      void pullLatestDaySnapshot().catch(() => null);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) {
      void flushQueuedMutations();
      void pullLatestDaySnapshot().catch(() => null);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushQueuedMutations, pullLatestDaySnapshot]);

  async function persistDayExecution(
    nextDay: WorkoutDayDetail,
    noticeMessage: string,
    offlineNoticeMessage: string,
  ) {
    await persistWorkoutDay(nextDay);

    if (!navigator.onLine) {
      await queueWorkoutDayExecutionMutation({
        dayId: nextDay.id,
        status: nextDay.status as "planned" | "in_progress" | "done",
        bodyWeightKg: nextDay.body_weight_kg,
        sessionNote: nextDay.session_note,
      });
      await refreshPendingMutationCount();
      setIsOnline(false);
      setNotice(offlineNoticeMessage);
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
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    if (!response.ok) {
      throw new Error(payload?.message ?? "Не удалось сохранить день тренировки.");
    }

    setIsOnline(true);
    setNotice(noticeMessage);
    await pullLatestDaySnapshot().catch(() => null);
  }

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
          await pullLatestDaySnapshot().catch(() => null);
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

  return (
    <div className="grid gap-6">
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

        <div className="grid gap-4 md:grid-cols-5">
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

      <section className="grid gap-4">
        {day.exercises.length ? (
          day.exercises.map((exercise) => (
            <article className="card p-6" key={exercise.id}>
              <div className="mb-4">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                  Упражнение
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">
                  {exercise.exercise_title_snapshot}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Запланировано подходов: {exercise.sets_count}
                </p>
              </div>

              <div className="grid gap-3">
                {exercise.sets.map((set) => (
                  <div
                    className="rounded-2xl border border-border bg-white/60 p-4"
                    key={set.id}
                  >
                    <div className="grid gap-3 xl:grid-cols-[0.8fr_0.9fr_0.9fr_0.8fr_0.8fr_auto] xl:items-end">
                      <div>
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
                        className="rounded-full border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
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

                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
                      <div className="rounded-2xl border border-border/70 bg-white/70 px-4 py-3 text-sm text-muted md:col-span-2 xl:col-span-2">
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
