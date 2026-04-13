"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  WorkoutDayDetail,
} from "@/lib/workout/weekly-programs";
import { buildWorkoutDayDerivedState } from "@/components/workout-session/derived-state";
import {
  areExerciseDraftValuesSaved,
  getFirstIncompleteExerciseIndex,
  getInitialActualRepsMap,
  getInitialActualRpeMap,
  getInitialActualWeightMap,
  isCompletedWorkoutExercise,
  isExerciseDraftReadyToSave,
} from "@/components/workout-session/session-utils";
import { WorkoutDayNotices } from "@/components/workout-session/workout-day-notices";
import { WorkoutDayContextCard } from "@/components/workout-session/workout-day-context-card";
import { WorkoutDayOverviewCard } from "@/components/workout-session/workout-day-overview-card";
import { WorkoutExerciseCard } from "@/components/workout-session/workout-exercise-card";
import { WorkoutFocusHeader } from "@/components/workout-session/workout-focus-header";
import { WorkoutStepStrip } from "@/components/workout-session/workout-step-strip";
import { WorkoutStatusActions } from "@/components/workout-session/workout-status-actions";
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
    },
    [applyTimerStateForDay],
  );

  const {
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
    replaceOfflineDayState,
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

  const dayNotices = (
    <WorkoutDayNotices
      dayIsLocked={day.is_locked}
      error={error}
      isOnline={isOnline}
      notice={notice}
      pendingMutationCount={pendingMutationCount}
    />
  );
  const compactStatusActions = (
    <WorkoutStatusActions
      canFinishWorkout={canFinishWorkout}
      canResetWorkoutDay={canResetWorkoutDay}
      compact={true}
      dayIsLocked={day.is_locked}
      dayStatus={day.status}
      isOnline={isOnline}
      isPending={isPending}
      isSyncing={isSyncing}
      onCompleteWorkout={() => void completeWorkout()}
      onFlushQueuedMutations={() => {
        void flushQueuedMutations();
      }}
      onResetWorkoutDay={() => void resetWorkoutDay()}
      onUpdateDayStatus={updateDayStatus}
      pendingMutationCount={pendingMutationCount}
    />
  );
  const fullStatusActions = (
    <WorkoutStatusActions
      canFinishWorkout={canFinishWorkout}
      canResetWorkoutDay={canResetWorkoutDay}
      dayIsLocked={day.is_locked}
      dayStatus={day.status}
      isOnline={isOnline}
      isPending={isPending}
      isSyncing={isSyncing}
      onCompleteWorkout={() => void completeWorkout()}
      onFlushQueuedMutations={() => {
        void flushQueuedMutations();
      }}
      onResetWorkoutDay={() => void resetWorkoutDay()}
      onUpdateDayStatus={updateDayStatus}
      pendingMutationCount={pendingMutationCount}
    />
  );

  return (
    <div className="grid gap-6">
      {isMobileFocusMode ? (
        <WorkoutFocusHeader
          activeExerciseTitle={activeExercise?.exercise_title_snapshot ?? null}
          completedExercisesCount={completedExercisesCount}
          completedSetsCount={completedSetsCount}
          currentExerciseIsComplete={currentExerciseIsComplete}
          currentSessionDurationSeconds={currentSessionDurationSeconds}
          day={day}
          isFocusHeaderCollapsed={isFocusHeaderCollapsed}
          isPending={isPending}
          isSyncing={isSyncing}
          isTimerRunning={isTimerRunning}
          notices={dayNotices}
          onPauseTimer={() => {
            void pauseSessionTimer();
          }}
          onResetTimer={() => {
            void resetSessionTimer();
          }}
          onReturnToRegularMode={() => {
            void returnToRegularMode();
          }}
          onStartTimer={() => {
            setError(null);
            setNotice(null);
            startSessionTimer();
          }}
          onToggleCollapsed={() =>
            setIsFocusHeaderCollapsed((current) => !current)
          }
          safeActiveExerciseIndex={safeActiveExerciseIndex}
          statusActions={compactStatusActions}
          stepStrip={
            <WorkoutStepStrip
              exercises={day.exercises}
              onSelectExercise={setActiveExerciseIndex}
              safeActiveExerciseIndex={safeActiveExerciseIndex}
              unlockedExerciseCount={unlockedExerciseCount}
            />
          }
          totalExercises={day.exercises.length}
          totalSetsCount={totalSetsCount}
        />
      ) : null}

      {!isMobileFocusMode ? (
        <WorkoutDayOverviewCard
          avgActualRpe={avgActualRpe}
          completedSetsCount={completedSetsCount}
          day={day}
          lastSnapshotAt={lastSnapshotAt}
          notices={dayNotices}
          statusActions={fullStatusActions}
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
          <section className="rounded-[1.8rem] bg-[color:var(--surface-bright)] px-6 py-6 shadow-[0_24px_64px_-50px_rgba(24,29,63,0.22)]">
            <p className="text-sm leading-7 text-[color:var(--muted)]">
              В этом тренировочном дне пока нет упражнений.
            </p>
          </section>
        )}
      </section>
    </div>
  );
}
