import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell, toAppShellViewer } from "@/components/app-shell";
import { WorkoutDaySession } from "@/components/workout-day-session";
import { logger } from "@/lib/logger";
import { withTransientRetry } from "@/lib/runtime-retry";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireReadyViewer } from "@/lib/viewer";
import {
  getWorkoutDayDetail,
  type WorkoutDayDetail,
} from "@/lib/workout/weekly-programs";

const IS_PLAYWRIGHT_RUNTIME = process.env.PLAYWRIGHT_TEST_HOOKS === "1";

function createPlaywrightWorkoutDayDetail(dayId: string): WorkoutDayDetail {
  const now = new Date();
  const weekStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const toDateOnly = (value: Date) => value.toISOString().slice(0, 10);

  return {
    id: dayId,
    weekly_program_id: `${dayId}-program`,
    day_of_week: 1,
    status: "planned",
    body_weight_kg: null,
    session_note: null,
    session_duration_seconds: 0,
    program_title: "E2E focus program",
    week_start_date: toDateOnly(weekStart),
    week_end_date: toDateOnly(weekEnd),
    program_status: "active",
    is_locked: true,
    exercises: [
      {
        id: `${dayId}-exercise-1`,
        exercise_title_snapshot: "Жим гантелей",
        sets_count: 1,
        sort_order: 0,
        sets: [
          {
            id: `${dayId}-set-1`,
            set_number: 1,
            planned_reps: 10,
            planned_reps_min: 6,
            planned_reps_max: 10,
            actual_reps: null,
            actual_weight_kg: null,
            actual_rpe: null,
          },
        ],
      },
      {
        id: `${dayId}-exercise-2`,
        exercise_title_snapshot: "Тяга блока",
        sets_count: 1,
        sort_order: 1,
        sets: [
          {
            id: `${dayId}-set-2`,
            set_number: 1,
            planned_reps: 10,
            planned_reps_min: 8,
            planned_reps_max: 12,
            actual_reps: null,
            actual_weight_kg: null,
            actual_rpe: null,
          },
        ],
      },
    ],
  };
}

async function loadWorkoutDayDetail(userId: string, dayId: string) {
  const supabase = createAdminSupabaseClient();

  return withTransientRetry(
    async () => await getWorkoutDayDetail(supabase, userId, dayId),
    {
      attempts: 4,
      delaysMs: [500, 1_500, 3_000, 5_000],
    },
  );
}

export default async function WorkoutDayPage({
  params,
  searchParams,
}: {
  params: Promise<{ dayId: string }>;
  searchParams: Promise<{ focus?: string }>;
}) {
  const viewer = await requireReadyViewer();
  const { dayId } = await params;
  const { focus } = await searchParams;
  const isFocusMode = focus === "1";
  let workoutDay: WorkoutDayDetail | null = null;

  if (IS_PLAYWRIGHT_RUNTIME && dayId.startsWith("e2e-")) {
    workoutDay = createPlaywrightWorkoutDayDetail(dayId);
  } else {
    try {
      workoutDay = await loadWorkoutDayDetail(viewer.user.id, dayId);
    } catch (error) {
      logger.warn("workout day page fallback activated", {
        dayId,
        error,
        userId: viewer.user.id,
      });
    }
  }

  if (workoutDay === null) {
    if (isFocusMode) {
      return (
        <AppShell
          viewer={toAppShellViewer(viewer)}
          compactHeader={true}
          eyebrow="Тренировка"
          hideAssistantWidget={true}
          immersive={true}
          title="День тренировки"
        >
          <section className="surface-panel mx-auto max-w-xl p-5 sm:p-6">
            <p className="workspace-kicker">Временный сбой</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">
              Не удалось открыть тренировочный день
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted">
              Сервер не успел загрузить текущий день тренировки. Попробуй
              открыть экран еще раз или вернуться к списку недель.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                className="action-button action-button--primary"
                href={`/workouts/day/${dayId}?focus=1` as Route}
              >
                Повторить
              </Link>
              <Link
                className="action-button action-button--secondary"
                href={"/workouts" as Route}
              >
                К неделям
              </Link>
            </div>
          </section>
        </AppShell>
      );
    }

    notFound();
  }

  return (
    <AppShell
      viewer={toAppShellViewer(viewer)}
      compactHeader={isFocusMode}
      eyebrow="Тренировка"
      hideAssistantWidget={isFocusMode}
      immersive={isFocusMode}
      title="День тренировки"
    >
      {!isFocusMode ? (
        <div className="flex flex-wrap gap-3">
          <Link
            className="action-button action-button--secondary"
            href={"/workouts" as Route}
          >
            К неделям
          </Link>
        </div>
      ) : null}

      <WorkoutDaySession initialDay={workoutDay} isFocusMode={isFocusMode} />
    </AppShell>
  );
}
