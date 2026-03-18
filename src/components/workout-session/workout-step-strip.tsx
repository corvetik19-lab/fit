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
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Шаги тренировки</p>
        <p className="text-xs text-muted">Открывается по порядку</p>
      </div>

      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {exercises.map((exercise, index) => {
          const isStepUnlocked = index < unlockedExerciseCount;
          const isActive = isStepUnlocked && index === safeActiveExerciseIndex;
          const isExerciseStepComplete = isCompletedWorkoutExercise(exercise);

          return (
            <button
              aria-pressed={isActive}
              className={`min-w-[7.75rem] shrink-0 rounded-2xl border px-3 py-2 text-left transition ${
                isActive
                  ? "border-accent/30 bg-accent-soft text-foreground shadow-[0_16px_36px_-30px_rgba(20,97,75,0.45)]"
                  : isStepUnlocked
                    ? "border-border bg-white/80 text-foreground hover:bg-white"
                    : "border-border/80 bg-slate-100/90 text-slate-400 opacity-90"
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
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="block text-xs uppercase tracking-[0.18em] text-muted">
                    {`Шаг ${index + 1}`}
                  </span>
                  <span className="mt-1 block truncate text-sm font-semibold">
                    {exercise.exercise_title_snapshot}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {isExerciseStepComplete
                      ? "Сохранено"
                      : isActive
                        ? "Текущий шаг"
                        : isStepUnlocked
                          ? "Доступно"
                          : "Закрыто"}
                  </span>
                </div>

                {isExerciseStepComplete ? (
                  <CheckCircle2
                    className="shrink-0 text-emerald-600"
                    size={18}
                    strokeWidth={2.2}
                  />
                ) : !isStepUnlocked ? (
                  <Lock className="shrink-0 text-slate-400" size={16} strokeWidth={2.2} />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
