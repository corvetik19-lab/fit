"use client";

import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import type { WorkoutDayDetail } from "@/lib/workout/weekly-programs";

const inputClassName =
  "w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

const dayLabels: Record<number, string> = {
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
  7: "Воскресенье",
};

const dayStatusLabels: Record<string, string> = {
  planned: "Запланирован",
  in_progress: "В процессе",
  done: "Завершён",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
});

function formatWeekRange(day: WorkoutDayDetail) {
  const startDate = dateFormatter.format(
    new Date(`${day.week_start_date}T00:00:00`),
  );
  const endDate = dateFormatter.format(new Date(`${day.week_end_date}T00:00:00`));
  return `${startDate} - ${endDate}`;
}

function getInitialActualRepsMap(day: WorkoutDayDetail) {
  const nextState: Record<string, string> = {};

  for (const exercise of day.exercises) {
    for (const set of exercise.sets) {
      nextState[set.id] = set.actual_reps?.toString() ?? "";
    }
  }

  return nextState;
}

export function WorkoutDaySession({ initialDay }: { initialDay: WorkoutDayDetail }) {
  const router = useRouter();
  const [actualRepsBySetId, setActualRepsBySetId] = useState<Record<string, string>>(
    () => getInitialActualRepsMap(initialDay),
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const completedSetsCount = useMemo(
    () =>
      initialDay.exercises.flatMap((exercise) => exercise.sets).filter((set) => {
        const currentValue = actualRepsBySetId[set.id];
        return currentValue != null && currentValue.trim().length > 0;
      }).length,
    [actualRepsBySetId, initialDay.exercises],
  );

  const totalSetsCount = useMemo(
    () => initialDay.exercises.flatMap((exercise) => exercise.sets).length,
    [initialDay.exercises],
  );

  function setActualRepsValue(setId: string, value: string) {
    setActualRepsBySetId((current) => ({
      ...current,
      [setId]: value,
    }));
  }

  function updateDayStatus(nextStatus: "planned" | "in_progress" | "done") {
    setError(null);
    setNotice(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/workout-days/${initialDay.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setError(payload?.message ?? "Не удалось обновить статус дня.");
          return;
        }

        setNotice("Статус тренировочного дня обновлён.");
        router.refresh();
      } finally {
        setIsPending(false);
      }
    });
  }

  function saveSet(setId: string) {
    setError(null);
    setNotice(null);
    setIsPending(true);

    const rawValue = actualRepsBySetId[setId]?.trim() ?? "";
    const actualReps = rawValue.length ? Number(rawValue) : null;

    if (actualReps !== null && (!Number.isInteger(actualReps) || actualReps < 0)) {
      setError("Фактические повторы должны быть целым числом 0 или больше.");
      setIsPending(false);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/workout-sets/${setId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actualReps,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setError(payload?.message ?? "Не удалось сохранить фактические повторы.");
          return;
        }

        if (initialDay.status === "planned") {
          const dayStatusResponse = await fetch(`/api/workout-days/${initialDay.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "in_progress",
            }),
          });

          if (!dayStatusResponse.ok) {
            const dayStatusPayload = (await dayStatusResponse
              .json()
              .catch(() => null)) as { message?: string } | null;
            setError(
              dayStatusPayload?.message ??
                "Повторы сохранены, но статус дня не удалось перевести в состояние «в процессе».",
            );
            router.refresh();
            return;
          }
        }

        setNotice("Фактические повторы сохранены.");
        router.refresh();
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <div className="grid gap-6">
      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              День тренировки
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {dayLabels[initialDay.day_of_week] ?? `День ${initialDay.day_of_week}`}
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              {initialDay.program_title} · {formatWeekRange(initialDay)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="pill">
              {dayStatusLabels[initialDay.status] ?? initialDay.status}
            </span>
            <span className="pill">{initialDay.is_locked ? "Неделя зафиксирована" : "Черновик недели"}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Упражнений", String(initialDay.exercises.length)],
            ["Подходов", String(totalSetsCount)],
            ["Заполнено", `${completedSetsCount}/${totalSetsCount}`],
          ].map(([label, value]) => (
            <article className="kpi p-4" key={label}>
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {initialDay.status === "planned" ? (
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending || !initialDay.is_locked}
              onClick={() => updateDayStatus("in_progress")}
              type="button"
            >
              Начать тренировку
            </button>
          ) : null}

          {initialDay.status === "in_progress" ? (
            <>
              <button
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
                onClick={() => updateDayStatus("done")}
                type="button"
              >
                Отметить как завершённую
              </button>
              <button
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
                onClick={() => updateDayStatus("planned")}
                type="button"
              >
                Вернуть в запланированные
              </button>
            </>
          ) : null}

          {initialDay.status === "done" ? (
            <button
              className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={() => updateDayStatus("in_progress")}
              type="button"
            >
              Вернуть в процесс
            </button>
          ) : null}
        </div>

        {!initialDay.is_locked ? (
          <p className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Выполнение тренировки доступно только после `Зафиксировать неделю`.
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {notice ? (
          <p className="mt-4 rounded-2xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4">
        {initialDay.exercises.length ? (
          initialDay.exercises.map((exercise) => (
            <article className="card p-6" key={exercise.id}>
              <div className="mb-4">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                  Упражнение
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">
                  {exercise.exercise_title_snapshot}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Запланировано подходов: {exercise.sets_count}
                </p>
              </div>

              <div className="grid gap-3">
                {exercise.sets.map((set) => (
                  <div
                    className="rounded-2xl border border-border bg-white/60 p-4"
                    key={set.id}
                  >
                    <div className="grid gap-3 md:grid-cols-[0.7fr_0.8fr_1fr_auto] md:items-end">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Подход {set.set_number}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          План: {set.planned_reps} повторов
                        </p>
                      </div>

                      <label className="grid gap-2 text-sm text-muted">
                        Факт
                        <input
                          className={inputClassName}
                          disabled={!initialDay.is_locked || isPending}
                          min={0}
                          onChange={(event) =>
                            setActualRepsValue(set.id, event.target.value)
                          }
                          placeholder="Например: 10"
                          type="number"
                          value={actualRepsBySetId[set.id] ?? ""}
                        />
                      </label>

                      <div className="text-sm text-muted">
                        {set.actual_reps != null ? (
                          <p>
                            Последнее сохранённое значение:{" "}
                            <span className="font-semibold text-foreground">
                              {set.actual_reps}
                            </span>
                          </p>
                        ) : (
                          <p>Фактические повторы ещё не сохранены.</p>
                        )}
                      </div>

                      <button
                        className="rounded-full border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!initialDay.is_locked || isPending}
                        onClick={() => saveSet(set.id)}
                        type="button"
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))
        ) : (
          <section className="card p-6">
            <p className="text-sm leading-7 text-muted">
              В этом тренировочном дне пока нет упражнений.
            </p>
          </section>
        )}
      </section>
    </div>
  );
}
