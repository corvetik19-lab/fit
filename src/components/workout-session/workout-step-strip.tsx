"use client";

import { CheckCircle2, Lock } from "lucide-react";

import type { WorkoutDayDetail } from "@/lib/workout/weekly-programs";
import { isCompletedWorkoutExercise } from "@/components/workout-session/session-utils";

type WorkoutExercise = WorkoutDayDetail["exercises"][number];

export function WorkoutStepStrip({
  exercises,
  safeActiveExerciseIndex,
  unlockedExerciseCount,
  onSelectExercise,
}: {
  exercises: WorkoutExercise[];
  safeActiveExerciseIndex: number;
  unlockedExerciseCount: number;
  onSelectExercise: (index: number) => void;
}) {
  if (exercises.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="workspace-kicker">Шаги тренировки</p>
        <p className="text-xs text-muted">Открываются по порядку</p>
      </div>

      <div className="flex gap-1.5" aria-hidden="true">
        {exercises.map((exercise, index) => {
          const isStepUnlocked = index < unlockedExerciseCount;
          const isActive = isStepUnlocked && index === safeActiveExerciseIndex;
          const isExerciseStepComplete = isCompletedWorkoutExercise(exercise);

          return (
            <div
              className={`h-1.5 flex-1 rounded-full transition ${
                isExerciseStepComplete || isActive
                  ? "bg-accent"
                  : isStepUnlocked
                    ? "bg-[color:var(--accent-soft)]"
                    : "bg-border"
              }`}
              key={`workout-step-bar-${exercise.id}`}
            />
          );
        })}
      </div>

      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
        {exercises.map((exercise, index) => {
          const isStepUnlocked = index < unlockedExerciseCount;
          const isActive = isStepUnlocked && index === safeActiveExerciseIndex;
          const isExerciseStepComplete = isCompletedWorkoutExercise(exercise);

          return (
            <button
              aria-pressed={isActive}
              className={`min-w-[4.25rem] shrink-0 rounded-[1rem] px-3 py-2.5 text-center transition ${
                isActive
                  ? "bg-accent text-white shadow-[0_22px_40px_-30px_rgba(8,145,255,0.58)]"
                  : isStepUnlocked
                    ? "bg-white text-foreground hover:bg-[color:var(--surface-elevated)]"
                    : "bg-[color:var(--surface-soft)] text-muted opacity-75"
              }`}
              data-complete={isExerciseStepComplete ? "true" : "false"}
              data-locked={isStepUnlocked ? "false" : "true"}
              data-testid={`workout-step-${index + 1}`}
              disabled={!isStepUnlocked}
              key={exercise.id}
              onClick={() => {
                if (isStepUnlocked) {
                  onSelectExercise(index);
                }
              }}
              type="button"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="flex min-h-5 items-center justify-center text-base font-bold leading-none">
                  {isExerciseStepComplete ? (
                    <CheckCircle2 size={18} strokeWidth={2.3} />
                  ) : !isStepUnlocked ? (
                    <Lock size={16} strokeWidth={2.2} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">
                  {isExerciseStepComplete
                    ? "Готов"
                    : isActive
                      ? "Сейчас"
                      : isStepUnlocked
                        ? "Открыт"
                        : "Ждёт"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
        {exercises.map((exercise, index) => {
          const isStepUnlocked = index < unlockedExerciseCount;
          const isActive = isStepUnlocked && index === safeActiveExerciseIndex;
          const isExerciseStepComplete = isCompletedWorkoutExercise(exercise);

          return (
            <button
              aria-pressed={isActive}
              className={`min-w-[8.9rem] shrink-0 rounded-[1.1rem] px-3 py-2.5 text-left transition ${
                isActive
                  ? "bg-[color:var(--accent-soft)] text-foreground"
                  : isStepUnlocked
                    ? "bg-white text-foreground hover:bg-[color:var(--surface-elevated)]"
                    : "bg-[color:var(--surface-soft)] text-muted opacity-75"
              }`}
              data-complete={isExerciseStepComplete ? "true" : "false"}
              data-locked={isStepUnlocked ? "false" : "true"}
              data-testid={`workout-step-card-${index + 1}`}
              disabled={!isStepUnlocked}
              key={`${exercise.id}-label`}
              onClick={() => {
                if (isStepUnlocked) {
                  onSelectExercise(index);
                }
              }}
              type="button"
            >
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                  Шаг {index + 1}
                </span>
                <span className="mt-1 block truncate text-sm font-semibold">
                  {exercise.exercise_title_snapshot}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
