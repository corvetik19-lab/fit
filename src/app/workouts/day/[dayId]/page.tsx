import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
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
      compactHeader={isFocusMode}
      eyebrow="Тренировка"
      hideAssistantWidget={isFocusMode}
      immersive={isFocusMode}
      title="День тренировки"
    >
      {!isFocusMode ? (
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
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
