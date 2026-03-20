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
    ? "card sticky top-[calc(0.75rem+env(safe-area-inset-top))] z-20 overflow-hidden px-4 py-3"
    : "card sticky top-[calc(0.75rem+env(safe-area-inset-top))] z-20 overflow-hidden p-4 sm:p-5";

  return (
    <section className={sectionClassName}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Текущая тренировка
          </p>
          <h2 className="mt-2 truncate text-xl font-semibold text-foreground">
            {dayLabels[day.day_of_week] ?? `День ${day.day_of_week}`}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-expanded={!isFocusHeaderCollapsed}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/80 text-foreground transition hover:bg-white"
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
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
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

      <div className="mt-4 flex items-center justify-between gap-3 rounded-3xl border border-border bg-white/70 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/85 text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/85 text-foreground transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
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
