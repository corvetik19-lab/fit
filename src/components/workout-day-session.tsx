"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  flushOfflineMutations,
  getPendingOfflineMutationCount,
  listQueuedWorkoutMutationsForDay,
  queueWorkoutDayStatusMutation,
  queueWorkoutSetActualRepsMutation,
} from "@/lib/offline/workout-sync";
import {
  formatPlannedRepTarget,
  getActualRepOptions,
} from "@/lib/workout/rep-ranges";
import type { OfflineMutation } from "@/lib/offline/db";
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

function applyWorkoutDayStatus(
  day: WorkoutDayDetail,
  nextStatus: WorkoutDayDetail["status"],
) {
  return {
    ...day,
    status: nextStatus,
  };
}

function applyWorkoutSetActualReps(
  day: WorkoutDayDetail,
  setId: string,
  actualReps: number | null,
) {
  return {
    ...day,
    exercises: day.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) =>
        set.id === setId
          ? {
              ...set,
              actual_reps: actualReps,
            }
          : set,
      ),
    })),
  };
}

function applyQueuedMutations(day: WorkoutDayDetail, mutations: OfflineMutation[]) {
  return mutations.reduce((currentDay, mutation) => {
    if (mutation.entity === "workout_day_status") {
      return applyWorkoutDayStatus(currentDay, mutation.payload.status);
    }

    return applyWorkoutSetActualReps(
      currentDay,
      mutation.payload.setId,
      mutation.payload.actualReps,
    );
  }, day);
}

export function WorkoutDaySession({ initialDay }: { initialDay: WorkoutDayDetail }) {
  const router = useRouter();
  const [day, setDay] = useState(initialDay);
  const [actualRepsBySetId, setActualRepsBySetId] = useState<Record<string, string>>(
    () => getInitialActualRepsMap(initialDay),
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingMutationCount, setPendingMutationCount] = useState(0);
  const [isOnline, setIsOnline] = useState(
    () => (typeof navigator === "undefined" ? true : navigator.onLine),
  );

  const completedSetsCount = useMemo(
    () =>
      day.exercises.flatMap((exercise) => exercise.sets).filter((set) => {
        const currentValue = actualRepsBySetId[set.id];
        return currentValue != null && currentValue.trim().length > 0;
      }).length,
    [actualRepsBySetId, day.exercises],
  );

  const totalSetsCount = useMemo(
    () => day.exercises.flatMap((exercise) => exercise.sets).length,
    [day.exercises],
  );

  function setActualRepsValue(setId: string, value: string) {
    setActualRepsBySetId((current) => ({
      ...current,
      [setId]: value,
    }));
  }

  const refreshPendingMutationCount = useCallback(async () => {
    const count = await getPendingOfflineMutationCount();
    setPendingMutationCount(count);
  }, []);

  const hydrateQueuedMutations = useCallback(async () => {
    const queuedMutations = await listQueuedWorkoutMutationsForDay(initialDay.id);

    setDay(applyQueuedMutations(initialDay, queuedMutations));
    setActualRepsBySetId((current) => {
      const nextState = {
        ...getInitialActualRepsMap(initialDay),
        ...current,
      };

      for (const mutation of queuedMutations) {
        if (mutation.entity === "workout_set_actual_reps") {
          nextState[mutation.payload.setId] =
            mutation.payload.actualReps?.toString() ?? "";
        }
      }

      return nextState;
    });

    await refreshPendingMutationCount();
  }, [initialDay, refreshPendingMutationCount]);

  const flushQueuedMutations = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      return;
    }

    const queuedCount = await getPendingOfflineMutationCount();

    if (!queuedCount) {
      setPendingMutationCount(0);
      return;
    }

    setIsSyncing(true);

    try {
      const result = await flushOfflineMutations();
      await refreshPendingMutationCount();

      const rejectedMutations = result.processed.filter(
        (mutation) => mutation.status === "rejected",
      );

      if (rejectedMutations.length) {
        setError(
          rejectedMutations[0]?.message ??
            "Часть локальных изменений не удалось синхронизировать.",
        );
      } else if (result.applied > 0) {
        setNotice("Локальные изменения синхронизированы.");
      }

      if (result.applied > 0 || rejectedMutations.length > 0) {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      await refreshPendingMutationCount();
    } finally {
      setIsSyncing(false);
    }
  }, [refreshPendingMutationCount, router]);

  useEffect(() => {
    setDay(initialDay);
    setActualRepsBySetId(getInitialActualRepsMap(initialDay));

    void hydrateQueuedMutations();
  }, [hydrateQueuedMutations, initialDay]);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      void flushQueuedMutations();
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) {
      void flushQueuedMutations();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushQueuedMutations]);

  function updateDayStatus(nextStatus: "planned" | "in_progress" | "done") {
    setError(null);
    setNotice(null);
    setIsPending(true);
    const previousStatus = day.status;
    setDay((current) => applyWorkoutDayStatus(current, nextStatus));

    startTransition(async () => {
      try {
        if (!navigator.onLine) {
          await queueWorkoutDayStatusMutation({
            dayId: day.id,
            status: nextStatus,
          });
          await refreshPendingMutationCount();
          setNotice("Статус сохранён локально и будет синхронизирован при подключении.");
          return;
        }

        const response = await fetch(`/api/workout-days/${day.id}`, {
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
          setDay((current) => applyWorkoutDayStatus(current, previousStatus));
          setError(payload?.message ?? "Не удалось обновить статус дня.");
          return;
        }

        setIsOnline(true);
        setNotice("Статус тренировочного дня обновлён.");
      } catch {
        await queueWorkoutDayStatusMutation({
          dayId: day.id,
          status: nextStatus,
        });
        await refreshPendingMutationCount();
        setIsOnline(false);
        setNotice("Нет сети: статус сохранён локально и будет синхронизирован позже.");
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

    const previousStatus = day.status;
    const previousSet = day.exercises
      .flatMap((exercise) => exercise.sets)
      .find((set) => set.id === setId);
    const previousActualReps = previousSet?.actual_reps ?? null;
    const shouldPromoteDayStatus = day.status === "planned";

    setDay((current) => {
      const nextDay = applyWorkoutSetActualReps(current, setId, actualReps);
      return shouldPromoteDayStatus
        ? applyWorkoutDayStatus(nextDay, "in_progress")
        : nextDay;
    });

    startTransition(async () => {
      try {
        if (!navigator.onLine) {
          await queueWorkoutSetActualRepsMutation({
            dayId: day.id,
            setId,
            actualReps,
          });

          if (shouldPromoteDayStatus) {
            await queueWorkoutDayStatusMutation({
              dayId: day.id,
              status: "in_progress",
            });
          }

          await refreshPendingMutationCount();
          setNotice(
            "Повторы сохранены локально и будут синхронизированы при подключении.",
          );
          return;
        }

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
          setDay((current) => {
            const restoredDay = applyWorkoutSetActualReps(
              current,
              setId,
              previousActualReps,
            );

            return applyWorkoutDayStatus(restoredDay, previousStatus);
          });
          setActualRepsBySetId((current) => ({
            ...current,
            [setId]: previousActualReps?.toString() ?? "",
          }));
          setError(payload?.message ?? "Не удалось сохранить фактические повторы.");
          return;
        }

        if (shouldPromoteDayStatus) {
          const dayStatusResponse = await fetch(`/api/workout-days/${day.id}`, {
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
            await queueWorkoutDayStatusMutation({
              dayId: day.id,
              status: "in_progress",
            });
            await refreshPendingMutationCount();
            setNotice(
              dayStatusPayload?.message ??
                "Повторы сохранены, статус дня добавлен в локальную очередь синхронизации.",
            );
            return;
          }
        }

        setIsOnline(true);
        setNotice("Фактические повторы сохранены.");
      } catch {
        await queueWorkoutSetActualRepsMutation({
          dayId: day.id,
          setId,
          actualReps,
        });

        if (shouldPromoteDayStatus) {
          await queueWorkoutDayStatusMutation({
            dayId: day.id,
            status: "in_progress",
          });
        }

        await refreshPendingMutationCount();
        setIsOnline(false);
        setNotice(
          "Нет сети: повторы сохранены локально и будут синхронизированы позже.",
        );
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
              {dayLabels[day.day_of_week] ?? `День ${day.day_of_week}`}
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              {day.program_title} · {formatWeekRange(day)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="pill">
              {dayStatusLabels[day.status] ?? day.status}
            </span>
            <span className="pill">{day.is_locked ? "Неделя зафиксирована" : "Черновик недели"}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Упражнений", String(day.exercises.length)],
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
          {day.status === "planned" ? (
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending || isSyncing || !day.is_locked}
              onClick={() => updateDayStatus("in_progress")}
              type="button"
            >
              Начать тренировку
            </button>
          ) : null}

          {day.status === "in_progress" ? (
            <>
              <button
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending || isSyncing}
                onClick={() => updateDayStatus("done")}
                type="button"
              >
                Отметить как завершённую
              </button>
              <button
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending || isSyncing}
                onClick={() => updateDayStatus("planned")}
                type="button"
              >
                Вернуть в запланированные
              </button>
            </>
          ) : null}

          {day.status === "done" ? (
            <button
              className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending || isSyncing}
              onClick={() => updateDayStatus("in_progress")}
              type="button"
            >
              Вернуть в процесс
            </button>
          ) : null}

          {pendingMutationCount > 0 && isOnline ? (
            <button
              className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending || isSyncing}
              onClick={() => {
                void flushQueuedMutations();
              }}
              type="button"
            >
              {isSyncing
                ? "Синхронизация..."
                : `Синхронизировать (${pendingMutationCount})`}
            </button>
          ) : null}
        </div>

        {!day.is_locked ? (
          <p className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Выполнение тренировки доступно только после `Зафиксировать неделю`.
          </p>
        ) : null}

        {!isOnline ? (
          <p className="mt-4 rounded-2xl border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Нет сети. Изменения по этой тренировке будут сохраняться локально и
            отправятся на сервер после восстановления соединения.
          </p>
        ) : null}

        {pendingMutationCount > 0 ? (
          <p className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            В локальной очереди ждут синхронизации: {pendingMutationCount}.
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
        {day.exercises.length ? (
          day.exercises.map((exercise) => (
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
                          План: {formatPlannedRepTarget(set)} повторов
                        </p>
                      </div>

                      <label className="grid gap-2 text-sm text-muted">
                        Факт
                        <select
                          className={inputClassName}
                          disabled={!day.is_locked || isPending || isSyncing}
                          onChange={(event) =>
                            setActualRepsValue(set.id, event.target.value)
                          }
                          value={actualRepsBySetId[set.id] ?? ""}
                        >
                          <option value="">Выбери повторы</option>
                          {getActualRepOptions(set).map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
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
                        disabled={!day.is_locked || isPending || isSyncing}
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
