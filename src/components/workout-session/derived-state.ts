import type {
  WeeklyProgramExerciseSummary,
  WorkoutDayDetail,
} from "@/lib/workout/weekly-programs";

import {
  areExerciseDraftValuesSaved,
  getFirstIncompleteExerciseIndex,
  isCompletedWorkoutExercise,
  isCompletedWorkoutSet,
} from "@/components/workout-session/session-utils";

type BuildWorkoutDayDerivedStateArgs = {
  day: WorkoutDayDetail;
  activeExerciseIndex: number;
  actualRepsBySetId: Record<string, string>;
  actualWeightBySetId: Record<string, string>;
  actualRpeBySetId: Record<string, string>;
  isMobileFocusMode: boolean;
  currentSessionDurationSeconds: number;
};

export type WorkoutDayDerivedState = {
  workoutSets: WorkoutDayDetail["exercises"][number]["sets"];
  firstIncompleteExerciseIndex: number;
  unlockedExerciseCount: number;
  safeActiveExerciseIndex: number;
  activeExercise: WeeklyProgramExerciseSummary | null;
  visibleExerciseEntries: Array<{
    exercise: WeeklyProgramExerciseSummary;
    index: number;
  }>;
  completedSetsCount: number;
  totalSetsCount: number;
  totalTonnageKg: number;
  avgActualRpe: number | null;
  completedExercisesCount: number;
  currentExerciseIsComplete: boolean;
  allExercisesCompleted: boolean;
  hasUnsavedExerciseChanges: boolean;
  canFinishWorkout: boolean;
  canResetWorkoutDay: boolean;
};

export function buildWorkoutDayDerivedState({
  day,
  activeExerciseIndex,
  actualRepsBySetId,
  actualWeightBySetId,
  actualRpeBySetId,
  isMobileFocusMode,
  currentSessionDurationSeconds,
}: BuildWorkoutDayDerivedStateArgs): WorkoutDayDerivedState {
  const workoutSets = day.exercises.flatMap((exercise) => exercise.sets);
  const firstIncompleteExerciseIndex = getFirstIncompleteExerciseIndex(day.exercises);
  const unlockedExerciseCount = !day.exercises.length
    ? 0
    : firstIncompleteExerciseIndex === -1
      ? day.exercises.length
      : firstIncompleteExerciseIndex + 1;
  const safeActiveExerciseIndex = !day.exercises.length
    ? 0
    : Math.min(activeExerciseIndex, Math.max(0, unlockedExerciseCount - 1));
  const activeExercise =
    isMobileFocusMode && day.exercises.length
      ? day.exercises[safeActiveExerciseIndex] ?? null
      : null;
  const visibleExerciseEntries = isMobileFocusMode
    ? activeExercise
      ? [{ exercise: activeExercise, index: safeActiveExerciseIndex }]
      : []
    : day.exercises.map((exercise, index) => ({ exercise, index }));
  const completedSetsCount = workoutSets.filter((set) =>
    isCompletedWorkoutSet(set),
  ).length;
  const totalSetsCount = workoutSets.length;
  const totalTonnageKg = workoutSets.reduce((sum, set) => {
    const reps = typeof set.actual_reps === "number" ? set.actual_reps : null;
    const weight =
      typeof set.actual_weight_kg === "number" ? set.actual_weight_kg : null;

    if (reps === null || weight === null) {
      return sum;
    }

    return sum + reps * weight;
  }, 0);
  const rpeValues = workoutSets.flatMap((set) =>
    typeof set.actual_rpe === "number" ? [set.actual_rpe] : [],
  );
  const avgActualRpe = rpeValues.length
    ? Number(
        (
          rpeValues.reduce((sum, value) => sum + value, 0) / rpeValues.length
        ).toFixed(1),
      )
    : null;
  const completedExercisesCount = day.exercises.filter((exercise) =>
    isCompletedWorkoutExercise(exercise),
  ).length;
  const currentExerciseIsComplete = activeExercise
    ? isCompletedWorkoutExercise(activeExercise)
    : false;
  const allExercisesCompleted =
    day.exercises.length > 0 && completedExercisesCount === day.exercises.length;
  const hasUnsavedExerciseChanges = day.exercises.some((exercise) =>
    !areExerciseDraftValuesSaved(
      exercise,
      actualRepsBySetId,
      actualWeightBySetId,
      actualRpeBySetId,
    ),
  );
  const canFinishWorkout = allExercisesCompleted && !hasUnsavedExerciseChanges;
  const canResetWorkoutDay =
    day.is_locked &&
    (day.status !== "planned" ||
      completedSetsCount > 0 ||
      completedExercisesCount > 0 ||
      currentSessionDurationSeconds > 0 ||
      (typeof day.body_weight_kg === "number" && day.body_weight_kg > 0) ||
      Boolean(day.session_note?.trim()));

  return {
    workoutSets,
    firstIncompleteExerciseIndex,
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
    allExercisesCompleted,
    hasUnsavedExerciseChanges,
    canFinishWorkout,
    canResetWorkoutDay,
  };
}
