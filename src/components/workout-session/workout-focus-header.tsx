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
  const stepTitle = activeExerciseTitle ?? "Продолжай текущий шаг";

  return (
    <section className="sticky top-[calc(0.5rem+env(safe-area-inset-top))] z-20">
      <div className="surface-panel overflow-hidden p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.85rem] bg-[linear-gradient(135deg,#2563EB,#0891FF,#2DD4BF)] text-[11px] font-black text-white shadow-[0_20px_40px_-28px_rgba(8,145,255,0.52)]">
              fo
            </span>
            <div className="min-w-0">
              <p className="workspace-kicker">Фокус тренировки</p>
              <p className="truncate text-sm font-medium text-muted">{dayTitle}</p>
            </div>
          </div>

          <div className="flex shrink-0 gap-1.5">
            <button
              aria-label="Вернуться к обычному виду"
              className="action-button action-button--secondary h-9 whitespace-nowrap rounded-full px-3 text-xs"
              data-testid="workout-regular-mode-button"
              onClick={onReturnToRegularMode}
              type="button"
            >
              Список
            </button>
            <button
              aria-expanded={!isFocusHeaderCollapsed}
              aria-label={
                isFocusHeaderCollapsed ? "Развернуть шапку" : "Свернуть шапку"
              }
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] bg-[color:var(--surface-elevated)] text-foreground transition hover:bg-[color:var(--surface-strong)]"
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
            <div className="mt-3 grid gap-2.5 sm:grid-cols-[1.25fr_0.75fr]">
              <div className="metric-tile min-w-0 p-3">
                <p className="workspace-kicker">
                  Упражнение {safeActiveExerciseIndex + 1} из {totalExercises}
                </p>
                <h2 className="mt-1.5 text-lg font-semibold leading-tight text-foreground sm:text-2xl">
                  {stepTitle}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="pill">
                    {dayStatusLabels[day.status] ?? day.status}
                  </span>
                  <span className="pill">
                    {currentExerciseIsComplete ? "Шаг сохранён" : "В работе"}
                  </span>
                </div>
              </div>

              <div className="surface-panel surface-panel--accent min-w-0 p-3">
                <p className="workspace-kicker">Таймер</p>
                <p className="mt-1 text-[1.55rem] font-semibold tracking-[-0.04em] text-foreground">
                  {formatDurationSeconds(currentSessionDurationSeconds)}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    aria-label={
                      isTimerRunning
                        ? "Поставить таймер на паузу"
                        : "Запустить таймер тренировки"
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[0.85rem] bg-white/80 text-accent-strong backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[0.85rem] bg-white/80 text-accent-strong backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
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

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="metric-tile p-2.5">
                <p className="workspace-kicker">Подходы</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {completedSetsCount}
                  <span className="ml-1 text-sm text-muted">/ {totalSetsCount}</span>
                </p>
              </div>
              <div className="metric-tile p-2.5">
                <p className="workspace-kicker">Упражнения</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {completedExercisesCount}
                  <span className="ml-1 text-sm text-muted">/ {totalExercises}</span>
                </p>
              </div>
              <div className="metric-tile p-2.5">
                <p className="workspace-kicker">Шаг</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {currentExerciseIsComplete ? "Готов" : "Продолжай"}
                </p>
              </div>
            </div>

            <div className="mt-3">{stepStrip}</div>
            <div className="mt-3 flex flex-wrap gap-2">{statusActions}</div>
            {day.status === "done" ? (
              <p className="mt-3 rounded-2xl border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {currentSessionDurationSeconds > 0
                  ? "Тренировка завершена, время сохранено."
                  : "Тренировка завершена."}
              </p>
            ) : null}
            <div className="mt-3">{notices}</div>
          </>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="workspace-kicker">
                Упражнение {safeActiveExerciseIndex + 1} из {totalExercises}
              </p>
              <p className="mt-1 truncate text-sm font-medium text-foreground">
                {stepTitle}
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
