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
}: {
  params: Promise<{ dayId: string }>;
}) {
  const viewer = await requireReadyViewer();
  const { dayId } = await params;
  const supabase = await createServerSupabaseClient();
  const workoutDay = await getWorkoutDayDetail(supabase, viewer.user.id, dayId);

  if (!workoutDay) {
    notFound();
  }

  return (
    <AppShell eyebrow="Тренировка" title="День тренировки">
      <div className="flex flex-wrap gap-3">
        <Link
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
          href={"/workouts" as Route}
        >
          Назад к неделям
        </Link>
      </div>

      <WorkoutDaySession initialDay={workoutDay} />
    </AppShell>
  );
}
