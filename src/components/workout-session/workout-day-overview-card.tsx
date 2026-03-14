"use client";

import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";

import type { WorkoutDayDetail } from "@/lib/workout/weekly-programs";
import {
  dayLabels,
  dayStatusLabels,
  formatDurationSeconds,
  formatOptionalRpe,
  formatSnapshotTime,
  formatWeekRange,
} from "@/components/workout-session/session-utils";

export function WorkoutDayOverviewCard({
  avgActualRpe,
  completedSetsCount,
  day,
  lastSnapshotAt,
  notices,
  statusActions,
  totalSetsCount,
  totalTonnageKg,
  workoutDayHref,
}: {
  avgActualRpe: number | null;
  completedSetsCount: number;
  day: WorkoutDayDetail;
  lastSnapshotAt: string | null;
  notices: ReactNode;
  statusActions: ReactNode;
  totalSetsCount: number;
  totalTonnageKg: number;
  workoutDayHref: Route;
}) {
  return (
    <section className="card p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            День тренировки
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            {dayLabels[day.day_of_week] ?? `День ${day.day_of_week}`}
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            {day.program_title} · {formatWeekRange(day)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="pill">{dayStatusLabels[day.status] ?? day.status}</span>
          <span className="pill">
            {day.is_locked ? "Неделя зафиксирована" : "Черновик недели"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        {[
          ["Упражнений", String(day.exercises.length)],
          ["Подходов", String(totalSetsCount)],
          ["Заполнено", `${completedSetsCount}/${totalSetsCount}`],
          [
            "Тоннаж",
            totalTonnageKg > 0
              ? `${Math.round(totalTonnageKg).toLocaleString("ru-RU")} кг`
              : "нет данных",
          ],
          ["Средний RPE", avgActualRpe !== null ? formatOptionalRpe(avgActualRpe) : "нет данных"],
          ["Таймер", formatDurationSeconds(day.session_duration_seconds ?? 0)],
        ].map(([label, value]) => (
          <article className="kpi p-4" key={label}>
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
          </article>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted">
        Последнее локальное сохранение: {formatSnapshotTime(lastSnapshotAt)}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 lg:hidden"
          href={`${workoutDayHref}?focus=1` as Route}
        >
          Развернуть на весь экран
        </Link>
        {statusActions}
      </div>

      {notices}
    </section>
  );
}
