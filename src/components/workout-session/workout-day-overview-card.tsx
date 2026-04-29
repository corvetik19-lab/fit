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
    <section className="grid gap-3">
      <div className="surface-panel overflow-hidden p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="workspace-kicker">День тренировки</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
              {dayLabels[day.day_of_week] ?? `День ${day.day_of_week}`}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted">
              {day.program_title} · {formatWeekRange(day)}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="pill">{dayStatusLabels[day.status] ?? day.status}</span>
            <span className="pill">
              {day.is_locked ? "Неделя зафиксирована" : "Черновик недели"}
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["Упражнения", String(day.exercises.length)],
            ["Подходы", `${completedSetsCount}/${totalSetsCount}`],
            ["Таймер", formatDurationSeconds(day.session_duration_seconds ?? 0)],
          ].map(([label, value]) => (
            <article className="metric-tile p-2.5" key={label}>
              <p className="workspace-kicker">{label}</p>
              <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
            </article>
          ))}
        </div>
      </div>

      <section className="surface-panel p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="workspace-kicker">Обзор дня</p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              Выполнение
            </h3>
            <p className="mt-1 text-sm leading-5 text-muted">
              Последнее локальное сохранение: {formatSnapshotTime(lastSnapshotAt)}
            </p>
          </div>

          <Link
            className="action-button action-button--secondary shrink-0 px-3 py-2 text-xs"
            href={`${workoutDayHref}?focus=1` as Route}
          >
            Focus
          </Link>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            [
              "Тоннаж",
              totalTonnageKg > 0
                ? `${Math.round(totalTonnageKg).toLocaleString("ru-RU")} кг`
                : "нет данных",
            ],
            [
              "Средний RPE",
              avgActualRpe !== null ? formatOptionalRpe(avgActualRpe) : "нет данных",
            ],
            ["Подходы", `${completedSetsCount} из ${totalSetsCount}`],
          ].map(([label, value]) => (
            <article className="metric-tile p-2.5" key={label}>
              <p className="workspace-kicker">{label}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
            </article>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">{statusActions}</div>
        <div className="mt-3">{notices}</div>
      </section>
    </section>
  );
}
