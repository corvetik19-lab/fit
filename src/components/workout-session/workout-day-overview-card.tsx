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
    <section className="grid gap-4">
      <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,var(--primary-container),var(--accent))] px-6 py-6 text-[color:var(--on-primary)] shadow-[0_32px_72px_-52px_rgba(0,64,224,0.58)]">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[color:var(--primary-fixed)]">
              День тренировки
            </p>
            <h2 className="mt-2 font-headline text-[2rem] font-bold leading-tight text-[color:var(--on-primary)]">
              {dayLabels[day.day_of_week] ?? `День ${day.day_of_week}`}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--primary-fixed)]">
              {day.program_title} · {formatWeekRange(day)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/14 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--on-primary)] backdrop-blur">
              {dayStatusLabels[day.status] ?? day.status}
            </span>
            <span className="rounded-full bg-white/14 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--on-primary)] backdrop-blur">
              {day.is_locked ? "Неделя зафиксирована" : "Черновик недели"}
            </span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Упражнений", String(day.exercises.length)],
            ["Подходов", `${completedSetsCount}/${totalSetsCount}`],
            ["Таймер", formatDurationSeconds(day.session_duration_seconds ?? 0)],
          ].map(([label, value]) => (
            <article
              className="rounded-[1.3rem] bg-white/12 px-4 py-4 backdrop-blur"
              key={label}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--primary-fixed)]">
                {label}
              </p>
              <p className="mt-2 font-headline text-2xl font-bold text-[color:var(--on-primary)]">
                {value}
              </p>
            </article>
          ))}
        </div>
      </div>

      <section className="rounded-[1.8rem] bg-[color:var(--surface-bright)] px-6 py-6 shadow-[0_24px_64px_-50px_rgba(24,29,63,0.22)]">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Обзор дня
            </p>
            <h3 className="mt-2 font-headline text-[1.7rem] font-bold text-[color:var(--foreground)]">
              Статус выполнения
            </h3>
            <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
              Последнее локальное сохранение: {formatSnapshotTime(lastSnapshotAt)}
            </p>
          </div>

          <Link
            className="inline-flex rounded-[1rem] bg-[color:var(--surface-container-high)] px-4 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-container-highest)] lg:hidden"
            href={`${workoutDayHref}?focus=1` as Route}
          >
            Открыть focus-режим
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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
            ["Заполнено подходов", `${completedSetsCount} из ${totalSetsCount}`],
          ].map(([label, value]) => (
            <article
              className="rounded-[1.3rem] bg-[color:var(--surface-container-low)] px-4 py-4"
              key={label}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                {label}
              </p>
              <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">{value}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex rounded-[1rem] bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-[color:var(--on-primary)] shadow-[0_22px_48px_-34px_rgba(0,64,224,0.55)] transition hover:opacity-95 lg:hidden"
            href={`${workoutDayHref}?focus=1` as Route}
          >
            Развернуть на весь экран
          </Link>
          {statusActions}
        </div>

        {notices}
      </section>
    </section>
  );
}
