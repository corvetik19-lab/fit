import type { ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Pause,
  Play,
  RotateCcw,
  Settings2,
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
  const sectionClassName = isFocusHeaderCollapsed
    ? "sticky top-[calc(0.75rem+env(safe-area-inset-top))] z-20 overflow-hidden rounded-[2rem] bg-[color:var(--surface-bright)] px-4 py-4 shadow-[0_26px_70px_-54px_rgba(24,29,63,0.38)]"
    : "sticky top-[calc(0.75rem+env(safe-area-inset-top))] z-20 overflow-hidden rounded-[2rem] bg-[color:var(--surface-bright)] px-4 py-5 shadow-[0_26px_70px_-54px_rgba(24,29,63,0.38)] sm:px-5";

  return (
    <section className={sectionClassName}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="font-headline text-[1.9rem] font-black leading-none text-[color:var(--accent)]">
            fit
          </span>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
            Training Lab
          </p>
        </div>

        <div className="min-w-0 flex-1 text-center">
          <p className="font-headline text-base font-bold uppercase tracking-[0.16em] text-[color:var(--accent)]">
            {dayTitle}
          </p>
          <p className="mt-1 font-headline text-xs font-bold text-[color:var(--muted)]">
            {formatDurationSeconds(currentSessionDurationSeconds)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden h-11 w-11 items-center justify-center rounded-[1.15rem] bg-[color:var(--surface-container-high)] text-[color:var(--accent)] sm:flex">
            <Settings2 size={18} strokeWidth={2.15} />
          </div>
          <button
            aria-label="Обычный вид"
            className="inline-flex h-11 items-center justify-center rounded-[1.15rem] bg-[color:var(--surface-container-high)] px-3 text-xs font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-container-highest)] sm:hidden"
            data-testid="workout-regular-mode-button"
            onClick={onReturnToRegularMode}
            type="button"
          >
            Вид
          </button>
          <button
            aria-expanded={!isFocusHeaderCollapsed}
            className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] bg-[color:var(--surface-container-high)] text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-container-highest)]"
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
            className="hidden rounded-[1.15rem] bg-[color:var(--surface-container-high)] px-4 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-container-highest)] sm:inline-flex"
            data-testid="workout-regular-mode-button"
            onClick={onReturnToRegularMode}
            type="button"
          >
            Обычный вид
          </button>
        </div>
      </div>

      {!isFocusHeaderCollapsed ? (
        <>
          <div className="mt-5 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: totalExercises }).map((_, index) => {
              const isCompletedSegment = index < completedExercisesCount;
              const isActiveSegment =
                !isCompletedSegment && index === safeActiveExerciseIndex;

              return (
                <div
                  className={`h-1.5 flex-1 rounded-full transition ${
                    isCompletedSegment || isActiveSegment
                      ? "bg-[color:var(--accent)]"
                      : "bg-[color:var(--surface-container-highest)]"
                  }`}
                  key={`segment-${index + 1}`}
                />
              );
            })}
          </div>

          <header className="mt-7 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[color:var(--accent)]">
                {`Упражнение ${safeActiveExerciseIndex + 1} из ${totalExercises}`}
              </p>
              <h2 className="mt-2 font-headline text-[1.95rem] font-bold leading-tight text-[color:var(--foreground)]">
                {activeExerciseTitle ?? "Текущий шаг"}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[color:var(--surface-container-high)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--on-surface-variant)]">
                  {dayStatusLabels[day.status] ?? day.status}
                </span>
                <span className="rounded-full bg-[color:var(--surface-container-high)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--on-surface-variant)]">
                  {currentExerciseIsComplete ? "Шаг сохранён" : "В работе"}
                </span>
              </div>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-[color:var(--surface-container-high)] text-[color:var(--accent)]">
              <Dumbbell size={20} strokeWidth={2.15} />
            </div>
          </header>

          <div className="mt-6 overflow-hidden rounded-[1.6rem] bg-[linear-gradient(135deg,var(--primary-container),var(--accent))] px-5 py-5 text-[color:var(--on-primary)] shadow-[0_30px_64px_-46px_rgba(0,64,224,0.62)]">
            <p className="text-center text-[10px] font-extrabold uppercase tracking-[0.28em] text-[color:var(--primary-fixed)]">
              Таймер
            </p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <p className="font-headline text-[3rem] font-black tracking-[-0.05em] text-[color:var(--on-primary)] sm:text-[3.35rem]">
                {formatDurationSeconds(currentSessionDurationSeconds)}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                aria-label={
                  isTimerRunning
                    ? "Поставить таймер на паузу"
                    : "Запустить таймер тренировки"
                }
                className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-white/18 text-[color:var(--on-primary)] backdrop-blur transition hover:bg-white/26 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-white/18 text-[color:var(--on-primary)] backdrop-blur transition hover:bg-white/26 disabled:cursor-not-allowed disabled:opacity-50"
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

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.2rem] bg-[color:var(--surface-container-low)] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Подходы
              </p>
              <p className="mt-2 font-headline text-2xl font-bold text-[color:var(--foreground)]">
                {completedSetsCount}
                <span className="ml-1 text-base text-[color:var(--muted)]">/ {totalSetsCount}</span>
              </p>
            </div>
            <div className="rounded-[1.2rem] bg-[color:var(--surface-container-low)] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Упражнения
              </p>
              <p className="mt-2 font-headline text-2xl font-bold text-[color:var(--foreground)]">
                {completedExercisesCount}
                <span className="ml-1 text-base text-[color:var(--muted)]">/ {totalExercises}</span>
              </p>
            </div>
            <div className="rounded-[1.2rem] bg-[color:var(--surface-container-low)] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Состояние
              </p>
              <p className="mt-2 font-headline text-xl font-bold text-[color:var(--foreground)]">
                {currentExerciseIsComplete ? "Шаг сохранён" : "Продолжай подходы"}
              </p>
            </div>
          </div>

          {stepStrip}
          <div className="mt-5 flex flex-wrap gap-2">{statusActions}</div>
          {notices}
        </>
      ) : (
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[color:var(--accent)]">
              {`Упражнение ${safeActiveExerciseIndex + 1} из ${totalExercises}`}
            </p>
            <p className="mt-1 truncate text-sm font-medium text-[color:var(--muted)]">
              {activeExerciseTitle ?? "Продолжай текущий шаг"}
            </p>
          </div>

          <div className="rounded-[1rem] bg-[color:var(--surface-container-high)] px-3 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Таймер
            </p>
            <p className="font-headline text-lg font-bold text-[color:var(--foreground)]">
              {formatDurationSeconds(currentSessionDurationSeconds)}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
