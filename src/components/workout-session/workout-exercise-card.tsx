"use client";

import type { Dispatch, SetStateAction } from "react";

import {
  formatPlannedRepTarget,
  getActualRepOptions,
} from "@/lib/workout/rep-ranges";
import type { WorkoutDayDetail } from "@/lib/workout/weekly-programs";
import {
  formatOptionalRpe,
  formatOptionalWeight,
  getRpeOptions,
} from "@/components/workout-session/session-utils";

type WorkoutExercise = WorkoutDayDetail["exercises"][number];

export function WorkoutExerciseCard({
  actualRepsBySetId,
  actualRpeBySetId,
  actualWeightBySetId,
  dayIsLocked,
  exercise,
  index,
  inputClassName,
  isExerciseComplete,
  isExerciseDirty,
  isExerciseEditable,
  isExerciseReadyToSave,
  isMobileFocusMode,
  isPending,
  isSyncing,
  onSaveExercise,
  onSetExerciseEditing,
  setActualRepsBySetId,
  setActualRpeBySetId,
  setActualWeightBySetId,
  totalExercises,
}: {
  actualRepsBySetId: Record<string, string>;
  actualRpeBySetId: Record<string, string>;
  actualWeightBySetId: Record<string, string>;
  dayIsLocked: boolean;
  exercise: WorkoutExercise;
  index: number;
  inputClassName: string;
  isExerciseComplete: boolean;
  isExerciseDirty: boolean;
  isExerciseEditable: boolean;
  isExerciseReadyToSave: boolean;
  isMobileFocusMode: boolean;
  isPending: boolean;
  isSyncing: boolean;
  onSaveExercise: (exercise: WorkoutExercise) => void;
  onSetExerciseEditing: (exerciseId: string, isEditing: boolean) => void;
  setActualRepsBySetId: Dispatch<SetStateAction<Record<string, string>>>;
  setActualRpeBySetId: Dispatch<SetStateAction<Record<string, string>>>;
  setActualWeightBySetId: Dispatch<SetStateAction<Record<string, string>>>;
  totalExercises: number;
}) {
  return (
    <article
      className="card p-4 sm:p-6"
      data-complete={isExerciseComplete ? "true" : "false"}
      data-editable={isExerciseEditable ? "true" : "false"}
      data-testid={`workout-exercise-card-${index + 1}`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            {isMobileFocusMode ? `Упражнение ${index + 1} из ${totalExercises}` : "Упражнение"}
          </p>
          <h3 className="mt-2 break-words text-xl font-semibold text-foreground sm:text-2xl">
            {exercise.exercise_title_snapshot}
          </h3>
          <p className="mt-2 text-sm text-muted">
            Запланировано подходов: {exercise.sets_count}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="pill">
            {isExerciseComplete ? "Сохранено" : "Текущий шаг"}
          </span>

          {isExerciseComplete && !isExerciseEditable ? (
            <button
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid={`workout-exercise-edit-${index + 1}`}
              disabled={!dayIsLocked || isPending || isSyncing}
              onClick={() => onSetExerciseEditing(exercise.id, true)}
              type="button"
            >
              Редактировать
            </button>
          ) : null}

          {isExerciseEditable ? (
            <button
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid={`workout-exercise-save-${index + 1}`}
              disabled={!dayIsLocked || isPending || isSyncing || !isExerciseReadyToSave}
              onClick={() => onSaveExercise(exercise)}
              type="button"
            >
              {isExerciseComplete ? "Сохранить изменения" : "Сохранить упражнение"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3">
        {exercise.sets.map((set) => (
          <div
            className="rounded-2xl border border-border bg-white/60 p-4"
            key={set.id}
          >
            <div className="grid gap-3 lg:grid-cols-[0.8fr_1fr_1fr_1fr] lg:items-end">
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
                  data-testid={`workout-set-${set.id}-reps`}
                  disabled={!dayIsLocked || isPending || isSyncing || !isExerciseEditable}
                  onChange={(event) =>
                    setActualRepsBySetId((current) => ({
                      ...current,
                      [set.id]: event.target.value,
                    }))
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
                  data-testid={`workout-set-${set.id}-weight`}
                  disabled={!dayIsLocked || isPending || isSyncing || !isExerciseEditable}
                  inputMode="decimal"
                  onChange={(event) =>
                    setActualWeightBySetId((current) => ({
                      ...current,
                      [set.id]: event.target.value,
                    }))
                  }
                  placeholder="Например, 70"
                  value={actualWeightBySetId[set.id] ?? ""}
                />
              </label>

              <label className="grid gap-2 text-sm text-muted">
                RPE
                <select
                  className={inputClassName}
                  data-testid={`workout-set-${set.id}-rpe`}
                  disabled={!dayIsLocked || isPending || isSyncing || !isExerciseEditable}
                  onChange={(event) =>
                    setActualRpeBySetId((current) => ({
                      ...current,
                      [set.id]: event.target.value,
                    }))
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
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
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
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted">
        {isExerciseComplete && !isExerciseDirty ? (
          <span>Упражнение завершено и сохранено.</span>
        ) : (
          <span>
            Сначала заполни повторы, вес и RPE во всех подходах, затем сохрани упражнение.
          </span>
        )}
      </div>
    </article>
  );
}
