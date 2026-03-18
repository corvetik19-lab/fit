"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

import {
  queueWorkoutDayExecutionMutation,
  queueWorkoutSetActualRepsMutation,
} from "@/lib/offline/workout-sync";
import type {
  WeeklyProgramExerciseSummary,
  WorkoutDayDetail,
} from "@/lib/workout/weekly-programs";
import {
  applyWorkoutDayExecution,
  applyWorkoutSetPerformance,
  getFirstIncompleteExerciseIndex,
  isExerciseDraftReadyToSave,
  parseOptionalRpe,
  parseOptionalWeight,
  type ExerciseDraft,
} from "@/components/workout-session/session-utils";

type SaveTimerOptions = {
  silent?: boolean;
};

export function useWorkoutSessionActions({
  actualRepsBySetId,
  actualRpeBySetId,
  actualWeightBySetId,
  canFinishWorkout,
  clearActiveTimer,
  currentSessionDurationSeconds,
  day,
  dayBodyWeightValue,
  daySessionNoteValue,
  editableExerciseIds,
  expiredTimerResetDayIdRef,
  getResolvedCurrentSessionDurationSeconds,
  isSyncing,
  markOffline,
  markOnline,
  persistWorkoutDay,
  pullLatestDaySnapshot,
  refreshPendingMutationCount,
  replaceOfflineDayState,
  resetPullCursor,
  restoreRunningTimer,
  setDay,
  setDayBodyWeightValue,
  setDaySessionNoteValue,
  setActiveExerciseIndex,
  setEditableExerciseIds,
  setError,
  setIsPending,
  setNotice,
  setShouldPersistExpiredTimerReset,
  setTimerBaseSeconds,
  setTimerLiveSeconds,
  setTimerStartedAt,
  shouldPersistExpiredTimerReset,
  timerBaseSeconds,
  timerLiveSeconds,
  timerStartedAt,
}: {
  actualRepsBySetId: Record<string, string>;
  actualRpeBySetId: Record<string, string>;
  actualWeightBySetId: Record<string, string>;
  canFinishWorkout: boolean;
  clearActiveTimer: () => void;
  currentSessionDurationSeconds: number;
  day: WorkoutDayDetail;
  dayBodyWeightValue: string;
  daySessionNoteValue: string;
  editableExerciseIds: Record<string, boolean>;
  expiredTimerResetDayIdRef: MutableRefObject<string | null>;
  getResolvedCurrentSessionDurationSeconds: () => number;
  isSyncing: boolean;
  markOffline: () => void;
  markOnline: () => void;
  persistWorkoutDay: (nextDay: WorkoutDayDetail) => Promise<void>;
  pullLatestDaySnapshot: (options?: { force?: boolean }) => Promise<WorkoutDayDetail | null>;
  refreshPendingMutationCount: () => Promise<void>;
  replaceOfflineDayState: (nextDay: WorkoutDayDetail) => Promise<{
    clearedMutations: number;
    updatedAt: string;
  }>;
  resetPullCursor: () => void;
  restoreRunningTimer: (timer: { baseSeconds: number; startedAt: number }) => void;
  setDay: (nextDay: WorkoutDayDetail) => void;
  setDayBodyWeightValue: (value: string) => void;
  setDaySessionNoteValue: (value: string) => void;
  setActiveExerciseIndex: Dispatch<SetStateAction<number>>;
  setEditableExerciseIds: Dispatch<SetStateAction<Record<string, boolean>>>;
  setError: (value: string | null) => void;
  setIsPending: (value: boolean) => void;
  setNotice: (value: string | null) => void;
  setShouldPersistExpiredTimerReset: (value: boolean) => void;
  setTimerBaseSeconds: (value: number) => void;
  setTimerLiveSeconds: (value: number) => void;
  setTimerStartedAt: (value: number | null) => void;
  shouldPersistExpiredTimerReset: boolean;
  timerBaseSeconds: number;
  timerLiveSeconds: number;
  timerStartedAt: number | null;
}) {
  const persistDayExecution = useCallback(
    async (
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
        markOffline();
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

      markOnline();
      if (noticeMessage) {
        setNotice(noticeMessage);
      }
      await pullLatestDaySnapshot({ force: true }).catch(() => null);
    },
    [
      markOffline,
      markOnline,
      persistWorkoutDay,
      pullLatestDaySnapshot,
      refreshPendingMutationCount,
      setNotice,
    ],
  );

  const saveSessionDuration = useCallback(
    async (
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
    },
    [
      day,
      persistDayExecution,
      persistWorkoutDay,
      setDay,
      setError,
      setIsPending,
      setNotice,
      setTimerBaseSeconds,
      setTimerLiveSeconds,
    ],
  );

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
  }, [
    expiredTimerResetDayIdRef,
    saveSessionDuration,
    setNotice,
    setShouldPersistExpiredTimerReset,
    shouldPersistExpiredTimerReset,
  ]);

  const updateDayStatus = useCallback(
    (nextStatus: "planned" | "in_progress" | "done") => {
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
            "Статус дня обновлен.",
            "Статус сохранен на устройстве и отправится, когда связь вернется.",
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
    },
    [day, persistDayExecution, persistWorkoutDay, setDay, setError, setIsPending, setNotice],
  );

  const saveDayContext = useCallback(() => {
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
          "Контекст тренировки сохранен.",
          "Контекст тренировки сохранен на устройстве и отправится позже.",
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
  }, [
    day,
    dayBodyWeightValue,
    daySessionNoteValue,
    persistDayExecution,
    persistWorkoutDay,
    setDay,
    setDayBodyWeightValue,
    setDaySessionNoteValue,
    setError,
    setIsPending,
    setNotice,
  ]);

  const setExerciseEditing = useCallback(
    (exerciseId: string, isEditing: boolean) => {
      setEditableExerciseIds((current) => ({
        ...current,
        [exerciseId]: isEditing,
      }));
    },
    [setEditableExerciseIds],
  );

  const saveExercise = useCallback(
    (exercise: WeeklyProgramExerciseSummary) => {
      setError(null);
      setNotice(null);
      setIsPending(true);

      const previousDay = day;
      const previousEditableExerciseIds = editableExerciseIds;

      let drafts: ExerciseDraft[];

      try {
        if (
          !isExerciseDraftReadyToSave(
            exercise,
            actualRepsBySetId,
            actualWeightBySetId,
            actualRpeBySetId,
          )
        ) {
          throw new Error(
            "Заполни повторы, вес и RPE во всех подходах упражнения.",
          );
        }

        drafts = exercise.sets.map((set) => {
          const actualRepsRaw = actualRepsBySetId[set.id]?.trim() ?? "";
          const actualWeightRaw = actualWeightBySetId[set.id]?.trim() ?? "";
          const actualRpeRaw = actualRpeBySetId[set.id]?.trim() ?? "";
          const actualReps = actualRepsRaw.length ? Number(actualRepsRaw) : null;
          const actualWeightKg = parseOptionalWeight(actualWeightRaw);
          const actualRpe = parseOptionalRpe(actualRpeRaw);

          if (actualReps === null) {
            throw new Error("Укажи повторы во всех подходах упражнения.");
          }

          if (!Number.isInteger(actualReps) || actualReps < 0) {
            throw new Error("Повторы должны быть целым числом 0 или больше.");
          }

          if (
            actualWeightKg !== null &&
            (!Number.isFinite(actualWeightKg) || actualWeightKg < 0 || actualWeightKg > 1000)
          ) {
            throw new Error("Вес должен быть числом от 0 до 1000 кг.");
          }

          if (
            actualRpe !== null &&
            (!Number.isFinite(actualRpe) || actualRpe < 1 || actualRpe > 10)
          ) {
            throw new Error("RPE должен быть числом от 1 до 10.");
          }

          return {
            setId: set.id,
            actualReps,
            actualWeightKg,
            actualRpe,
          };
        });
      } catch (validationError) {
        setError(
          validationError instanceof Error
            ? validationError.message
            : "Проверь значения по упражнению и попробуй еще раз.",
        );
        setIsPending(false);
        return;
      }

      const shouldPromoteDayStatus = day.status === "planned";
      let optimisticDay = day;

      for (const draft of drafts) {
        optimisticDay = applyWorkoutSetPerformance(
          optimisticDay,
          draft.setId,
          draft.actualReps,
          draft.actualWeightKg,
          draft.actualRpe,
        );
      }

      if (shouldPromoteDayStatus) {
        optimisticDay = applyWorkoutDayExecution(optimisticDay, {
          status: "in_progress",
        });
      }

      setDay(optimisticDay);
      const nextExerciseIndex = getFirstIncompleteExerciseIndex(
        optimisticDay.exercises,
      );
      if (nextExerciseIndex !== -1) {
        setActiveExerciseIndex(nextExerciseIndex);
      }
      setEditableExerciseIds((current) => ({
        ...current,
        [exercise.id]: false,
      }));

      startTransition(async () => {
        try {
          await persistWorkoutDay(optimisticDay);

          if (!navigator.onLine) {
            for (const draft of drafts) {
              await queueWorkoutSetActualRepsMutation({
                dayId: day.id,
                setId: draft.setId,
                actualReps: draft.actualReps,
                actualWeightKg: draft.actualWeightKg,
                actualRpe: draft.actualRpe,
              });
            }

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
            markOffline();
            setNotice(
              "Упражнение сохранено на устройстве и отправится позже.",
            );
            return;
          }

          for (const draft of drafts) {
            const response = await fetch(`/api/workout-sets/${draft.setId}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                actualReps: draft.actualReps,
                actualWeightKg: draft.actualWeightKg,
                actualRpe: draft.actualRpe,
              }),
            });

            const payload = (await response.json().catch(() => null)) as
              | { message?: string }
              | null;

            if (!response.ok) {
              throw new Error(payload?.message ?? "Не удалось сохранить упражнение.");
            }
          }

          if (shouldPromoteDayStatus) {
            await persistDayExecution(
              optimisticDay,
              "Упражнение сохранено. Тренировка переведена в работу.",
              "Упражнение сохранено локально. Статус тренировки отправится позже.",
            );
          } else {
            markOnline();
            setNotice("Упражнение сохранено.");
            await pullLatestDaySnapshot({ force: true }).catch(() => null);
          }
        } catch (saveError) {
          setDay(previousDay);
          setEditableExerciseIds(previousEditableExerciseIds);
          await persistWorkoutDay(previousDay);
          setError(
            saveError instanceof Error
              ? saveError.message
              : "Не удалось сохранить упражнение.",
          );
        } finally {
          setIsPending(false);
        }
      });
    },
    [
      actualRepsBySetId,
      actualRpeBySetId,
      actualWeightBySetId,
      day,
      editableExerciseIds,
      markOffline,
      markOnline,
      persistDayExecution,
      persistWorkoutDay,
      pullLatestDaySnapshot,
      refreshPendingMutationCount,
      setDay,
      setEditableExerciseIds,
      setError,
      setActiveExerciseIndex,
      setIsPending,
      setNotice,
    ],
  );

  const pauseSessionTimer = useCallback(
    async (options?: SaveTimerOptions) => {
      if (timerStartedAt === null) {
        return;
      }

      const nextSeconds = getResolvedCurrentSessionDurationSeconds();
      clearActiveTimer();

      await saveSessionDuration(
        nextSeconds,
        options?.silent ? null : "Таймер тренировки сохранен.",
        options?.silent ? null : "Таймер сохранен на устройстве и отправится позже.",
      );
    },
    [
      clearActiveTimer,
      getResolvedCurrentSessionDurationSeconds,
      saveSessionDuration,
      timerStartedAt,
    ],
  );

  const resetSessionTimer = useCallback(async () => {
    clearActiveTimer();
    await saveSessionDuration(
      0,
      "Таймер тренировки сброшен.",
      "Сброс таймера сохранен на устройстве и отправится позже.",
    );
  }, [clearActiveTimer, saveSessionDuration]);

  const completeWorkout = useCallback(() => {
    if (!canFinishWorkout) {
      setError(
        "Сначала сохрани все упражнения. Кнопка завершения откроется после этого.",
      );
      return;
    }

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

    clearActiveTimer();
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
              ? "Тренировка завершена. Время сохранено локально и отправится позже."
              : "Тренировка завершена без сохранения времени. Изменение отправится позже."
            : "Тренировка завершена локально и отправится позже.",
        );
      } catch (error) {
        setDay(previousDay);
        await persistWorkoutDay(previousDay);
        setTimerStartedAt(previousTimerStartedAt);
        setTimerBaseSeconds(previousTimerBaseSeconds);
        setTimerLiveSeconds(previousTimerLiveSeconds);

        if (previousTimerStartedAt !== null) {
          restoreRunningTimer({
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
  }, [
    canFinishWorkout,
    clearActiveTimer,
    currentSessionDurationSeconds,
    day,
    getResolvedCurrentSessionDurationSeconds,
    persistDayExecution,
    persistWorkoutDay,
    restoreRunningTimer,
    setDay,
    setError,
    setIsPending,
    setNotice,
    setTimerBaseSeconds,
    setTimerLiveSeconds,
    setTimerStartedAt,
    timerBaseSeconds,
    timerLiveSeconds,
    timerStartedAt,
  ]);

  const resetWorkoutDay = useCallback(() => {
    if (isSyncing) {
      return;
    }

    if (!navigator.onLine) {
      setError("Для полного обнуления тренировки нужна связь с интернетом.");
      return;
    }

    const shouldReset = window.confirm(
      "Обнулить тренировку и начать заново? Все сохраненные повторы, вес, RPE и время по этому дню будут очищены.",
    );

    if (!shouldReset) {
      return;
    }

    setError(null);
    setNotice(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/workout-days/${day.id}/reset`, {
          method: "POST",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => null)) as
          | {
              data?: WorkoutDayDetail;
              message?: string;
            }
          | null;

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.message ?? "Не удалось обнулить тренировку.");
        }

        clearActiveTimer();
        setShouldPersistExpiredTimerReset(false);
        await replaceOfflineDayState(payload.data);
        resetPullCursor();
        setNotice("Тренировка обнулена. Можно начать заново.");
      } catch (resetError) {
        setError(
          resetError instanceof Error
            ? resetError.message
            : "Не удалось обнулить тренировку.",
        );
      } finally {
        setIsPending(false);
      }
    });
  }, [
    clearActiveTimer,
    day.id,
    isSyncing,
    replaceOfflineDayState,
    resetPullCursor,
    setError,
    setIsPending,
    setNotice,
    setShouldPersistExpiredTimerReset,
  ]);

  return {
    completeWorkout,
    pauseSessionTimer,
    resetSessionTimer,
    resetWorkoutDay,
    saveDayContext,
    saveExercise,
    saveSessionDuration,
    setExerciseEditing,
    updateDayStatus,
  };
}
