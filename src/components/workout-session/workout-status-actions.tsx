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
    ? "action-button action-button--primary px-4 py-2.5 text-xs"
    : "action-button action-button--primary";
  const secondaryButtonClassName = compact
    ? "action-button action-button--secondary px-4 py-2.5 text-xs"
    : "action-button action-button--secondary";

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
          Начать
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
          Вернуть в работу
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
            ? "Синхронизация..."
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
        {compact ? "Сброс" : "Сбросить день"}
      </button>
    </>
  );
}
