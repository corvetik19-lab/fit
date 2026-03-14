"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";

import type {
  WorkoutDayDetail,
} from "@/lib/workout/weekly-programs";
import { buildWorkoutDayDerivedState } from "@/components/workout-session/derived-state";
import {
  areExerciseDraftValuesSaved,
  dayLabels,
  dayStatusLabels,
  formatDurationSeconds,
  getFirstIncompleteExerciseIndex,
  getInitialActualRepsMap,
  getInitialActualRpeMap,
  getInitialActualWeightMap,
  isCompletedWorkoutExercise,
  isExerciseDraftReadyToSave,
} from "@/components/workout-session/session-utils";
import { WorkoutDayContextCard } from "@/components/workout-session/workout-day-context-card";
import { WorkoutDayOverviewCard } from "@/components/workout-session/workout-day-overview-card";
import { WorkoutExerciseCard } from "@/components/workout-session/workout-exercise-card";
import { WorkoutStepStrip } from "@/components/workout-session/workout-step-strip";
import { useWorkoutSessionActions } from "@/components/workout-session/use-workout-session-actions";
import { useWorkoutDaySync } from "@/components/workout-session/use-workout-day-sync";
import { useWorkoutSessionTimer } from "@/components/workout-session/use-workout-session-timer";

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

const textAreaClassName = `${inputClassName} min-h-28 resize-y`;


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
  const [editableExerciseIds, setEditableExerciseIds] = useState<Record<string, boolean>>(
    {},
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
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(() => {
    const nextIndex = getFirstIncompleteExerciseIndex(initialDay.exercises);
    return nextIndex === -1 ? 0 : nextIndex;
  });

  const isMobileFocusMode = isFocusMode;
  const workoutDayHref = `/workouts/day/${day.id}` as Route;
  const {
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
  } = useWorkoutSessionTimer({
    dayId: day.id,
    initialSessionDurationSeconds: initialDay.session_duration_seconds,
  });

  const hydrateDayState = useCallback(
    (nextDay: WorkoutDayDetail) => {
      setDay(nextDay);
      setActualRepsBySetId(getInitialActualRepsMap(nextDay));
      setActualWeightBySetId(getInitialActualWeightMap(nextDay));
      setActualRpeBySetId(getInitialActualRpeMap(nextDay));
      setEditableExerciseIds({});
      setDayBodyWeightValue(
        typeof nextDay.body_weight_kg === "number"
          ? nextDay.body_weight_kg.toString()
          : "",
      );
      setDaySessionNoteValue(nextDay.session_note ?? "");
      applyTimerStateForDay(nextDay);
      const nextExerciseIndex = getFirstIncompleteExerciseIndex(nextDay.exercises);
      setActiveExerciseIndex(nextExerciseIndex === -1 ? 0 : nextExerciseIndex);
    },
    [applyTimerStateForDay],
  );

  const {
    applyDaySnapshot,
    flushQueuedMutations,
    hydrateLocalDay,
    isOnline,
    isSyncing,
    lastSnapshotAt,
    markOffline,
    markOnline,
    pendingMutationCount,
    persistWorkoutDay,
    pullLatestDaySnapshot,
    refreshPendingMutationCount,
    resetPullCursor,
  } = useWorkoutDaySync({
    applyHydratedDay: hydrateDayState,
    initialDay,
    onError: setError,
    onNotice: setNotice,
  });

  const {
    unlockedExerciseCount,
    safeActiveExerciseIndex,
    activeExercise,
    visibleExerciseEntries,
    completedSetsCount,
    totalSetsCount,
    totalTonnageKg,
    avgActualRpe,
    completedExercisesCount,
    currentExerciseIsComplete,
    canFinishWorkout,
    canResetWorkoutDay,
  } = useMemo(
    () =>
      buildWorkoutDayDerivedState({
        day,
        activeExerciseIndex,
        actualRepsBySetId,
        actualWeightBySetId,
        actualRpeBySetId,
        isMobileFocusMode,
        currentSessionDurationSeconds,
      }),
    [
      activeExerciseIndex,
      actualRepsBySetId,
      actualRpeBySetId,
      actualWeightBySetId,
      currentSessionDurationSeconds,
      day,
      isMobileFocusMode,
    ],
  );

  useEffect(() => {
    // Local execution state must be rehydrated whenever the canonical day snapshot changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    hydrateDayState(initialDay);
    resetPullCursor();
    void hydrateLocalDay();
  }, [hydrateDayState, hydrateLocalDay, initialDay, resetPullCursor]);

  useEffect(() => {
    if (!isMobileFocusMode || !day.exercises.length) {
      return;
    }

    // Focus mode keeps one active step and clamps it when the unlocked range changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const {
    completeWorkout,
    pauseSessionTimer,
    resetSessionTimer,
    resetWorkoutDay,
    saveDayContext,
    saveExercise,
    setExerciseEditing,
    updateDayStatus,
  } = useWorkoutSessionActions({
    actualRepsBySetId,
    actualRpeBySetId,
    actualWeightBySetId,
    applyDaySnapshot,
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
    resetPullCursor,
    restoreRunningTimer,
    setDay,
    setDayBodyWeightValue,
    setDaySessionNoteValue,
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
  });

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
          <button
            className={primaryButtonClassName}
            disabled={isPending || isSyncing || !canFinishWorkout}
            onClick={() => completeWorkout()}
            type="button"
          >
            Завершить
          </button>
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

        <button
          className={secondaryButtonClassName}
          disabled={!canResetWorkoutDay || isPending || isSyncing}
          onClick={() => resetWorkoutDay()}
          type="button"
        >
          {compact ? "Обнулить" : "Обнулить тренировку"}
        </button>
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
                ? `${activeExercise.exercise_title_snapshot} · шаг сохранён`
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

                  setError(null);
                  setNotice(null);
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
                <span className="pill">{`Заполнено подходов: ${completedSetsCount} из ${totalSetsCount}`}</span>
                <span className="pill">{`Сохранено упражнений: ${completedExercisesCount} из ${day.exercises.length}`}</span>
              </div>

              <WorkoutStepStrip
                exercises={day.exercises}
                onSelectExercise={setActiveExerciseIndex}
                safeActiveExerciseIndex={safeActiveExerciseIndex}
                unlockedExerciseCount={unlockedExerciseCount}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {renderStatusActions({ compact: true })}
              </div>

              {!isFocusHeaderCollapsed ? renderDayNotices() : null}
            </>
          ) : null}
        </section>
      ) : null}

      {!isMobileFocusMode ? (
        <WorkoutDayOverviewCard
          avgActualRpe={avgActualRpe}
          completedSetsCount={completedSetsCount}
          day={day}
          lastSnapshotAt={lastSnapshotAt}
          notices={renderDayNotices()}
          statusActions={renderStatusActions({ compact: false })}
          totalSetsCount={totalSetsCount}
          totalTonnageKg={totalTonnageKg}
          workoutDayHref={workoutDayHref}
        />
      ) : null}

      {!isMobileFocusMode ? (
        <WorkoutDayContextCard
          dayBodyWeightValue={dayBodyWeightValue}
          dayIsLocked={day.is_locked}
          daySessionNoteValue={daySessionNoteValue}
          inputClassName={inputClassName}
          isPending={isPending}
          isSyncing={isSyncing}
          onBodyWeightChange={setDayBodyWeightValue}
          onSave={saveDayContext}
          onSessionNoteChange={setDaySessionNoteValue}
          textAreaClassName={textAreaClassName}
        />
      ) : null}

      <section className="grid gap-4">
        {visibleExerciseEntries.length ? (
          visibleExerciseEntries.map(({ exercise, index }) => {
            const isExerciseComplete = isCompletedWorkoutExercise(exercise);
            const isExerciseEditable =
              !isExerciseComplete || editableExerciseIds[exercise.id] === true;
            const isExerciseReadyToSave = isExerciseDraftReadyToSave(
              exercise,
              actualRepsBySetId,
              actualWeightBySetId,
              actualRpeBySetId,
            );
            const isExerciseDirty = !areExerciseDraftValuesSaved(
              exercise,
              actualRepsBySetId,
              actualWeightBySetId,
              actualRpeBySetId,
            );

            return (
              <WorkoutExerciseCard
                actualRepsBySetId={actualRepsBySetId}
                actualRpeBySetId={actualRpeBySetId}
                actualWeightBySetId={actualWeightBySetId}
                dayIsLocked={day.is_locked}
                exercise={exercise}
                index={index}
                inputClassName={inputClassName}
                isExerciseComplete={isExerciseComplete}
                isExerciseDirty={isExerciseDirty}
                isExerciseEditable={isExerciseEditable}
                isExerciseReadyToSave={isExerciseReadyToSave}
                isMobileFocusMode={isMobileFocusMode}
                isPending={isPending}
                isSyncing={isSyncing}
                key={exercise.id}
                onSaveExercise={saveExercise}
                onSetExerciseEditing={setExerciseEditing}
                setActualRepsBySetId={setActualRepsBySetId}
                setActualRpeBySetId={setActualRpeBySetId}
                setActualWeightBySetId={setActualWeightBySetId}
                totalExercises={day.exercises.length}
              />
            );
          })
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
