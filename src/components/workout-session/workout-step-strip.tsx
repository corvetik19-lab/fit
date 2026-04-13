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
    <div className="mt-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[color:var(--muted)]">
          Шаги тренировки
        </p>
        <p className="text-xs text-[color:var(--muted)]">Открываются по порядку</p>
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
                  ? "bg-[color:var(--accent)]"
                  : isStepUnlocked
                    ? "bg-[color:var(--primary-fixed)]"
                    : "bg-[color:var(--surface-container-highest)]"
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
              className={`min-w-[4.25rem] shrink-0 rounded-[1rem] px-3 py-3 text-center transition ${
                isActive
                  ? "bg-[color:var(--accent)] text-[color:var(--on-primary)] shadow-[0_22px_40px_-30px_rgba(0,64,224,0.58)]"
                  : isStepUnlocked
                    ? "bg-[color:var(--surface-container-high)] text-[color:var(--foreground)] hover:bg-[color:var(--surface-container-highest)]"
                    : "bg-[color:var(--surface-container-low)] text-slate-400 opacity-90"
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
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
                  {isExerciseStepComplete
                    ? "Ок"
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
              className={`min-w-[8.9rem] shrink-0 rounded-[1.2rem] px-3 py-3 text-left transition ${
                isActive
                  ? "bg-[color:var(--surface-container-high)] text-[color:var(--foreground)]"
                  : isStepUnlocked
                    ? "bg-[color:var(--surface-container-low)] text-[color:var(--foreground)] hover:bg-[color:var(--surface-container-high)]"
                    : "bg-[color:var(--surface-container-low)] text-slate-400 opacity-85"
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
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  {`Шаг ${index + 1}`}
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
