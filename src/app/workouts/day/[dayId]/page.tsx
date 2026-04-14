import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell, toAppShellViewer } from "@/components/app-shell";
import { WorkoutDaySession } from "@/components/workout-day-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireReadyViewer } from "@/lib/viewer";
import { getWorkoutDayDetail } from "@/lib/workout/weekly-programs";

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
  const supabase = await createServerSupabaseClient();
  const workoutDay = await getWorkoutDayDetail(supabase, viewer.user.id, dayId);

  if (!workoutDay) {
    notFound();
  }

  const isFocusMode = focus === "1";

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
            className="rounded-[1rem] bg-[color:var(--surface-container-high)] px-4 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-container-highest)]"
            href={"/workouts" as Route}
          >
            Назад к неделям
          </Link>
        </div>
      ) : null}

      <WorkoutDaySession initialDay={workoutDay} isFocusMode={isFocusMode} />
    </AppShell>
  );
}
