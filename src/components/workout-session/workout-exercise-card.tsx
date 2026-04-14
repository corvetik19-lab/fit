"use client";

import type { Dispatch, SetStateAction } from "react";
import { CheckCircle2 } from "lucide-react";

import {
  formatPlannedRepTarget,
  getActualRepOptions,
} from "@/lib/workout/rep-ranges";
import type { WorkoutDayDetail } from "@/lib/workout/weekly-programs";
import {
  formatOptionalRpe,
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
  const activeEditableSetId = isExerciseEditable
    ? (exercise.sets.find((set) => {
        const repsValue = actualRepsBySetId[set.id] ?? "";
        const weightValue = actualWeightBySetId[set.id] ?? "";
        const rpeValue = actualRpeBySetId[set.id] ?? "";

        return !(repsValue.trim() && weightValue.trim() && rpeValue.trim());
      })?.id ?? exercise.sets[exercise.sets.length - 1]?.id ?? null)
    : null;

  return (
    <article
      className={`card p-4 sm:p-5 ${
        isMobileFocusMode ? "border-[color:var(--accent-soft)]/40" : ""
      }`}
      data-complete={isExerciseComplete ? "true" : "false"}
      data-editable={isExerciseEditable ? "true" : "false"}
      data-testid={`workout-exercise-card-${index + 1}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="workspace-kicker">
            {isMobileFocusMode ? `Упражнение ${index + 1} из ${totalExercises}` : "Упражнение"}
          </p>
          <h3 className="mt-2 text-xl font-semibold leading-tight text-foreground sm:text-2xl">
            {exercise.exercise_title_snapshot}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="pill">{`${exercise.sets_count} подход.`}</span>
            <span className="pill">{isExerciseComplete ? "Сохранено" : "Активный шаг"}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isExerciseComplete && !isExerciseEditable ? (
            <button
              className="action-button action-button--secondary px-4 py-2.5 text-sm"
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
              className="action-button action-button--primary px-4 py-2.5 text-sm"
              data-testid={`workout-exercise-save-${index + 1}`}
              disabled={!dayIsLocked || isPending || isSyncing || !isExerciseReadyToSave}
              onClick={() => onSaveExercise(exercise)}
              type="button"
            >
              {isExerciseComplete ? "Сохранить изменения" : "Сохранить"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="grid grid-cols-[0.95fr_1fr_1fr_0.8fr] gap-3 px-2 text-center">
          <p className="text-left text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Сет
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Вес
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Повторы
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            RPE
          </p>
        </div>

        {exercise.sets.map((set) => (
          <WorkoutSetRow
            actualRepsBySetId={actualRepsBySetId}
            actualRpeBySetId={actualRpeBySetId}
            actualWeightBySetId={actualWeightBySetId}
            activeEditableSetId={activeEditableSetId}
            dayIsLocked={dayIsLocked}
            inputClassName={inputClassName}
            isExerciseEditable={isExerciseEditable}
            isPending={isPending}
            isSyncing={isSyncing}
            key={set.id}
            set={set}
            setActualRepsBySetId={setActualRepsBySetId}
            setActualRpeBySetId={setActualRpeBySetId}
            setActualWeightBySetId={setActualWeightBySetId}
          />
        ))}
      </div>

      <div className="surface-panel mt-4 p-4">
        <p className="workspace-kicker">Подсказка</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          {isExerciseComplete && !isExerciseDirty
            ? "Шаг уже сохранён. Если нужно поправить цифры, открой редактирование и сохрани упражнение заново."
            : "Сначала заполни повторы, вес и RPE во всех подходах. После сохранения откроется следующий шаг."}
        </p>
      </div>
    </article>
  );
}

function WorkoutSetRow({
  actualRepsBySetId,
  actualRpeBySetId,
  actualWeightBySetId,
  activeEditableSetId,
  dayIsLocked,
  inputClassName,
  isExerciseEditable,
  isPending,
  isSyncing,
  set,
  setActualRepsBySetId,
  setActualRpeBySetId,
  setActualWeightBySetId,
}: {
  actualRepsBySetId: Record<string, string>;
  actualRpeBySetId: Record<string, string>;
  actualWeightBySetId: Record<string, string>;
  activeEditableSetId: string | null;
  dayIsLocked: boolean;
  inputClassName: string;
  isExerciseEditable: boolean;
  isPending: boolean;
  isSyncing: boolean;
  set: WorkoutExercise["sets"][number];
  setActualRepsBySetId: Dispatch<SetStateAction<Record<string, string>>>;
  setActualRpeBySetId: Dispatch<SetStateAction<Record<string, string>>>;
  setActualWeightBySetId: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  const repsValue = actualRepsBySetId[set.id] ?? "";
  const weightValue = actualWeightBySetId[set.id] ?? "";
  const rpeValue = actualRpeBySetId[set.id] ?? "";
  const hasPersistedValues =
    set.actual_reps !== null &&
    set.actual_weight_kg !== null &&
    set.actual_rpe !== null &&
    !isExerciseEditable;
  const isActiveEntry = isExerciseEditable && activeEditableSetId === set.id;
  const isFutureRow = !isExerciseEditable && !hasPersistedValues;
  const rowClassName = hasPersistedValues
    ? "bg-[color:var(--surface-container-low)]"
    : isActiveEntry
      ? "bg-[color:var(--surface-container-high)] ring-1 ring-[color:var(--accent)]"
      : isFutureRow
        ? "bg-[color:var(--surface-container-low)] opacity-55"
        : "bg-[color:var(--surface-container-high)]";

  return (
    <div className={`rounded-[1.15rem] px-3 py-4 transition ${rowClassName}`}>
      <div className="grid grid-cols-[0.95fr_1fr_1fr_0.8fr] items-center gap-3 text-center">
        <div className="flex items-center gap-2 text-left">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold ${
              hasPersistedValues || isActiveEntry
                ? "bg-[color:var(--accent)] text-[color:var(--on-primary)]"
                : "bg-[color:var(--outline)] text-white"
            }`}
          >
            {set.set_number}
          </span>
          {hasPersistedValues ? (
            <CheckCircle2 className="text-[color:var(--accent)]" size={18} strokeWidth={2.15} />
          ) : null}
        </div>

        <div className="flex justify-center">
          {isExerciseEditable ? (
            <input
              className={`${inputClassName} h-11 rounded-[0.95rem] border-0 bg-transparent px-0 py-0 text-center font-semibold shadow-none focus:ring-0`}
              data-testid={`workout-set-${set.id}-weight`}
              disabled={!dayIsLocked || isPending || isSyncing || !isExerciseEditable}
              inputMode="decimal"
              onChange={(event) =>
                setActualWeightBySetId((current) => ({
                  ...current,
                  [set.id]: event.target.value,
                }))
              }
              placeholder={set.actual_weight_kg?.toString() ?? "—"}
              value={weightValue}
            />
          ) : (
            <p className="text-lg font-semibold text-foreground">
              {set.actual_weight_kg ?? "—"}
            </p>
          )}
        </div>

        <div className="flex justify-center">
          {isExerciseEditable ? (
            <select
              className={`${inputClassName} h-11 rounded-[0.95rem] border-0 bg-transparent px-0 py-0 text-center font-semibold text-[color:var(--accent)] shadow-none focus:ring-0`}
              data-testid={`workout-set-${set.id}-reps`}
              disabled={!dayIsLocked || isPending || isSyncing || !isExerciseEditable}
              onChange={(event) =>
                setActualRepsBySetId((current) => ({
                  ...current,
                  [set.id]: event.target.value,
                }))
              }
              value={repsValue}
            >
              <option value="">—</option>
              {getActualRepOptions(set).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-lg font-semibold text-[color:var(--accent)]">
              {set.actual_reps ?? "—"}
            </p>
          )}
        </div>

        <div className="flex justify-center">
          {isExerciseEditable ? (
            <select
              className={`${inputClassName} h-11 rounded-[0.95rem] border-0 bg-transparent px-0 py-0 text-center font-semibold shadow-none focus:ring-0`}
              data-testid={`workout-set-${set.id}-rpe`}
              disabled={!dayIsLocked || isPending || isSyncing || !isExerciseEditable}
              onChange={(event) =>
                setActualRpeBySetId((current) => ({
                  ...current,
                  [set.id]: event.target.value,
                }))
              }
              value={rpeValue}
            >
              <option value="">—</option>
              {getRpeOptions().map((value) => (
                <option key={value} value={value}>
                  {value.toLocaleString("ru-RU", {
                    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
                    maximumFractionDigits: 1,
                  })}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-lg font-semibold text-[color:var(--on-surface-variant)]">
              {set.actual_rpe ?? "—"}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 px-1">
        <p className="text-xs text-muted">План: {formatPlannedRepTarget(set)} повторов</p>
        <p className="text-xs text-muted">Последний RPE: {formatOptionalRpe(set.actual_rpe)}</p>
      </div>
    </div>
  );
}
