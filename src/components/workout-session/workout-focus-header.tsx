import type { ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";

import type { WorkoutDayDetail } from "@/lib/workout/weekly-programs";
import {
  dayLabels,
  dayStatusLabels,
  formatDurationSeconds,
} from "@/components/workout-session/session-utils";

type WorkoutFocusHeaderProps = {
  activeExerciseTitle: string | null;
  completedExercisesCount: number;
  completedSetsCount: number;
  currentExerciseIsComplete: boolean;
  currentSessionDurationSeconds: number;
  day: WorkoutDayDetail;
  isFocusHeaderCollapsed: boolean;
  isPending: boolean;
  isSyncing: boolean;
  isTimerRunning: boolean;
  notices: ReactNode;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  onReturnToRegularMode: () => void;
  onStartTimer: () => void;
  onToggleCollapsed: () => void;
  safeActiveExerciseIndex: number;
  statusActions: ReactNode;
  stepStrip: ReactNode;
  totalExercises: number;
  totalSetsCount: number;
};

export function WorkoutFocusHeader({
  activeExerciseTitle,
  completedExercisesCount,
  completedSetsCount,
  currentExerciseIsComplete,
  currentSessionDurationSeconds,
  day,
  isFocusHeaderCollapsed,
  isPending,
  isSyncing,
  isTimerRunning,
  notices,
  onPauseTimer,
  onResetTimer,
  onReturnToRegularMode,
  onStartTimer,
  onToggleCollapsed,
  safeActiveExerciseIndex,
  statusActions,
  stepStrip,
  totalExercises,
  totalSetsCount,
}: WorkoutFocusHeaderProps) {
  const sectionClassName = isFocusHeaderCollapsed
    ? "card card--hero sticky top-[calc(0.75rem+env(safe-area-inset-top))] z-20 overflow-hidden px-4 py-3"
    : "card card--hero sticky top-[calc(0.75rem+env(safe-area-inset-top))] z-20 overflow-hidden p-4 sm:p-5";

  return (
    <section className={sectionClassName}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="workspace-kicker">
            Текущая тренировка
          </p>
          <h2 className="app-display mt-2 truncate text-xl font-semibold text-foreground sm:text-2xl">
            {dayLabels[day.day_of_week] ?? `День ${day.day_of_week}`}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-expanded={!isFocusHeaderCollapsed}
            className="action-button action-button--secondary h-11 w-11 p-0"
            data-testid="workout-focus-header-toggle"
            onClick={onToggleCollapsed}
            type="button"
          >
            {isFocusHeaderCollapsed ? (
              <ChevronDown size={18} strokeWidth={2.2} />
            ) : (
              <ChevronUp size={18} strokeWidth={2.2} />
            )}
          </button>
          <button
            className="action-button action-button--secondary px-4 py-2 text-sm"
            data-testid="workout-regular-mode-button"
            onClick={onReturnToRegularMode}
            type="button"
          >
            Обычный вид
          </button>
        </div>
      </div>

      {!isFocusHeaderCollapsed && activeExerciseTitle ? (
        <p className="mt-3 text-sm text-muted">
          {currentExerciseIsComplete
            ? `${activeExerciseTitle} · шаг сохранён`
            : `${activeExerciseTitle} · шаг ${safeActiveExerciseIndex + 1} из ${totalExercises}`}
        </p>
      ) : null}

      <div className="surface-panel surface-panel--accent mt-4 flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="workspace-kicker">
            Таймер
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {formatDurationSeconds(currentSessionDurationSeconds)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label={
              isTimerRunning
                ? "Поставить таймер на паузу"
                : "Запустить таймер тренировки"
            }
            className="action-button action-button--secondary h-11 w-11 p-0"
            data-testid="workout-timer-toggle"
            disabled={!day.is_locked || isPending || isSyncing}
            onClick={isTimerRunning ? onPauseTimer : onStartTimer}
            type="button"
          >
            {isTimerRunning ? (
              <Pause size={18} strokeWidth={2.3} />
            ) : (
              <Play size={18} strokeWidth={2.3} />
            )}
          </button>
          <button
            aria-label="Сбросить таймер тренировки"
            className="action-button action-button--secondary h-11 w-11 p-0"
            data-testid="workout-timer-reset"
            disabled={
              !day.is_locked ||
              isPending ||
              isSyncing ||
              currentSessionDurationSeconds === 0
            }
            onClick={onResetTimer}
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
            <span className="pill">{`Сохранено упражнений: ${completedExercisesCount} из ${totalExercises}`}</span>
          </div>

          {stepStrip}
          <div className="mt-4 flex flex-wrap gap-2">{statusActions}</div>
          {notices}
        </>
      ) : null}
    </section>
  );
}
