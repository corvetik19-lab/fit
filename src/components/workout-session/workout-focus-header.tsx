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
  const dayTitle = dayLabels[day.day_of_week] ?? `День ${day.day_of_week}`;

  return (
    <section className="sticky top-[calc(0.5rem+env(safe-area-inset-top))] z-20">
      <div className="surface-panel overflow-hidden p-3.5 sm:p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-sm font-semibold text-[color:var(--on-primary)] shadow-[0_20px_40px_-28px_rgba(32,99,175,0.52)] sm:h-10 sm:w-10 sm:text-base">
                fit
              </span>
              <div className="min-w-0">
                <p className="workspace-kicker">Фокус тренировки</p>
                <p className="truncate text-sm font-medium text-muted">{dayTitle}</p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-1.5 sm:items-center sm:gap-2">
            <button
              aria-label="Вернуться к обычному виду"
              className="action-button action-button--secondary h-9 whitespace-nowrap rounded-full px-2.5 text-[11px] sm:h-10 sm:px-3 sm:text-sm"
              data-testid="workout-regular-mode-button"
              onClick={onReturnToRegularMode}
              type="button"
            >
              Список
            </button>
            <button
              aria-expanded={!isFocusHeaderCollapsed}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[0.9rem] bg-[color:var(--surface-elevated)] text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-container-highest)] sm:h-10 sm:w-10"
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
          </div>
        </div>

        {!isFocusHeaderCollapsed ? (
          <>
            <div className="mt-3.5 grid gap-2.5 sm:grid-cols-[1.2fr_0.8fr]">
              <div className="metric-tile p-3.5">
                <p className="workspace-kicker">{`Упражнение ${safeActiveExerciseIndex + 1} из ${totalExercises}`}</p>
                <h2 className="mt-1.5 text-xl font-semibold leading-tight text-foreground sm:text-[1.65rem]">
                  {activeExerciseTitle ?? "Продолжай текущий шаг"}
                </h2>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <span className="pill">{dayStatusLabels[day.status] ?? day.status}</span>
                  <span className="pill">
                    {currentExerciseIsComplete ? "Шаг сохранён" : "В работе"}
                  </span>
                </div>
              </div>

              <div className="surface-panel surface-panel--accent p-3.5">
                <p className="workspace-kicker">Таймер</p>
                <p className="mt-1.5 text-[1.65rem] font-semibold tracking-[-0.04em] text-[color:var(--on-primary)]">
                  {formatDurationSeconds(currentSessionDurationSeconds)}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    aria-label={
                      isTimerRunning
                        ? "Поставить таймер на паузу"
                        : "Запустить таймер тренировки"
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[0.85rem] bg-white/14 text-[color:var(--on-primary)] backdrop-blur transition hover:bg-white/22 disabled:cursor-not-allowed disabled:opacity-50"
                    data-testid="workout-timer-toggle"
                    disabled={!day.is_locked || isPending || isSyncing}
                    onClick={isTimerRunning ? onPauseTimer : onStartTimer}
                    type="button"
                  >
                    {isTimerRunning ? (
                      <Pause size={18} strokeWidth={2.2} />
                    ) : (
                      <Play size={18} strokeWidth={2.2} />
                    )}
                  </button>
                  <button
                    aria-label="Сбросить таймер тренировки"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[0.85rem] bg-white/14 text-[color:var(--on-primary)] backdrop-blur transition hover:bg-white/22 disabled:cursor-not-allowed disabled:opacity-50"
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
                    <RotateCcw size={18} strokeWidth={2.05} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-3 gap-2">
              <div className="metric-tile p-2.5">
                <p className="workspace-kicker">Подходы</p>
                <p className="mt-1.5 text-base font-semibold text-foreground">
                  {completedSetsCount}
                  <span className="ml-1 text-sm text-muted">/ {totalSetsCount}</span>
                </p>
              </div>
              <div className="metric-tile p-2.5">
                <p className="workspace-kicker">Упражнения</p>
                <p className="mt-1.5 text-base font-semibold text-foreground">
                  {completedExercisesCount}
                  <span className="ml-1 text-sm text-muted">/ {totalExercises}</span>
                </p>
              </div>
              <div className="metric-tile p-2.5">
                <p className="workspace-kicker">Шаг</p>
                <p className="mt-1.5 text-sm font-semibold text-foreground">
                  {currentExerciseIsComplete ? "Готов" : "Продолжай"}
                </p>
              </div>
            </div>

            <div className="mt-3.5">{stepStrip}</div>
            <div className="mt-3.5 flex flex-wrap gap-2">{statusActions}</div>
            <div className="mt-3.5">{notices}</div>
          </>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="workspace-kicker">{`Упражнение ${safeActiveExerciseIndex + 1} из ${totalExercises}`}</p>
              <p className="mt-1 truncate text-sm font-medium text-foreground">
                {activeExerciseTitle ?? "Продолжай текущий шаг"}
              </p>
            </div>
            <div className="metric-tile px-3 py-2">
              <p className="workspace-kicker">Таймер</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatDurationSeconds(currentSessionDurationSeconds)}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
