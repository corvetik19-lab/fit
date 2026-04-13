type WorkoutStatusActionsProps = {
  canFinishWorkout: boolean;
  canResetWorkoutDay: boolean;
  compact?: boolean;
  dayIsLocked: boolean;
  dayStatus: string;
  isOnline: boolean;
  isPending: boolean;
  isSyncing: boolean;
  onCompleteWorkout: () => void;
  onFlushQueuedMutations: () => void;
  onResetWorkoutDay: () => void;
  onUpdateDayStatus: (status: "done" | "in_progress" | "planned") => void;
  pendingMutationCount: number;
};

export function WorkoutStatusActions({
  canFinishWorkout,
  canResetWorkoutDay,
  compact = false,
  dayIsLocked,
  dayStatus,
  isOnline,
  isPending,
  isSyncing,
  onCompleteWorkout,
  onFlushQueuedMutations,
  onResetWorkoutDay,
  onUpdateDayStatus,
  pendingMutationCount,
}: WorkoutStatusActionsProps) {
  const primaryButtonClassName = compact
    ? "rounded-[1rem] bg-[color:var(--accent)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--on-primary)] shadow-[0_20px_40px_-30px_rgba(0,64,224,0.55)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
    : "rounded-[1rem] bg-[color:var(--accent)] px-5 py-3.5 text-sm font-semibold text-[color:var(--on-primary)] shadow-[0_20px_40px_-30px_rgba(0,64,224,0.55)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55";
  const secondaryButtonClassName = compact
    ? "rounded-[1rem] bg-[color:var(--surface-container-high)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-container-highest)] disabled:cursor-not-allowed disabled:opacity-55"
    : "rounded-[1rem] bg-[color:var(--surface-container-high)] px-5 py-3.5 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-container-highest)] disabled:cursor-not-allowed disabled:opacity-55";

  return (
    <>
      {dayStatus === "planned" ? (
        <button
          className={primaryButtonClassName}
          data-testid="workout-start-button"
          disabled={isPending || isSyncing || !dayIsLocked}
          onClick={() => onUpdateDayStatus("in_progress")}
          type="button"
        >
          Начать тренировку
        </button>
      ) : null}

      {dayStatus === "in_progress" ? (
        <button
          className={primaryButtonClassName}
          data-testid="workout-finish-button"
          disabled={isPending || isSyncing || !canFinishWorkout}
          onClick={onCompleteWorkout}
          type="button"
        >
          Завершить
        </button>
      ) : null}

      {dayStatus === "done" ? (
        <button
          className={secondaryButtonClassName}
          disabled={isPending || isSyncing}
          onClick={() => onUpdateDayStatus("in_progress")}
          type="button"
        >
          Вернуть в процесс
        </button>
      ) : null}

      {pendingMutationCount > 0 && isOnline ? (
        <button
          className={secondaryButtonClassName}
          disabled={isPending || isSyncing}
          onClick={onFlushQueuedMutations}
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
        data-testid="workout-reset-button"
        disabled={!canResetWorkoutDay || isPending || isSyncing}
        onClick={onResetWorkoutDay}
        type="button"
      >
        {compact ? "Сбросить" : "Обнулить тренировку"}
      </button>
    </>
  );
}
