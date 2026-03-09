"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import type { WeeklyProgramSummary } from "@/lib/workout/weekly-programs";
import type { WorkoutTemplateSummary } from "@/lib/workout/templates";

type ExerciseOption = {
  id: string;
  title: string;
  muscle_group: string;
};

type BuilderExercise = {
  localId: string;
  exerciseLibraryId: string;
  setsCount: string;
  plannedReps: string;
};

type BuilderDay = {
  localId: string;
  dayOfWeek: string;
  exercises: BuilderExercise[];
};

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

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  active: "Активна",
  completed: "Завершена",
  archived: "Архив",
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

function createLocalId() {
  return crypto.randomUUID();
}

function createExerciseEntry(): BuilderExercise {
  return {
    localId: createLocalId(),
    exerciseLibraryId: "",
    setsCount: "4",
    plannedReps: "10",
  };
}

function createDayEntry(): BuilderDay {
  return {
    localId: createLocalId(),
    dayOfWeek: "",
    exercises: [createExerciseEntry()],
  };
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentWeekStartDate() {
  const nextDate = new Date();
  const offset = (nextDate.getDay() + 6) % 7;
  nextDate.setDate(nextDate.getDate() - offset);
  return formatDateInputValue(nextDate);
}

function renderProgramRange(program: WeeklyProgramSummary) {
  const startDate = dateFormatter.format(
    new Date(`${program.week_start_date}T00:00:00`),
  );
  const endDate = dateFormatter.format(
    new Date(`${program.week_end_date}T00:00:00`),
  );
  return `${startDate} - ${endDate}`;
}

function addDays(dateValue: string, daysToAdd: number) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day));
  nextDate.setUTCDate(nextDate.getUTCDate() + daysToAdd);
  return nextDate.toISOString().slice(0, 10);
}

export function WeeklyProgramBuilder({
  initialPrograms,
  activeExercises,
  initialTemplates,
}: {
  initialPrograms: WeeklyProgramSummary[];
  activeExercises: ExerciseOption[];
  initialTemplates: WorkoutTemplateSummary[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("Моя новая неделя");
  const [weekStartDate, setWeekStartDate] = useState(getCurrentWeekStartDate());
  const [days, setDays] = useState<BuilderDay[]>([createDayEntry()]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const activeProgram =
    initialPrograms.find((program) => program.status === "active") ?? null;

  function resetBuilder() {
    setTitle("Моя новая неделя");
    setWeekStartDate(getCurrentWeekStartDate());
    setDays([createDayEntry()]);
  }

  function updateDayField(dayId: string, nextDayOfWeek: string) {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.localId === dayId ? { ...day, dayOfWeek: nextDayOfWeek } : day,
      ),
    );
  }

  function addDay() {
    setDays((currentDays) => [...currentDays, createDayEntry()]);
  }

  function removeDay(dayId: string) {
    setDays((currentDays) =>
      currentDays.filter((day) => day.localId !== dayId),
    );
  }

  function addExercise(dayId: string) {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.localId === dayId
          ? { ...day, exercises: [...day.exercises, createExerciseEntry()] }
          : day,
      ),
    );
  }

  function removeExercise(dayId: string, exerciseId: string) {
    setDays((currentDays) =>
      currentDays.map((day) => {
        if (day.localId !== dayId) {
          return day;
        }

        return {
          ...day,
          exercises: day.exercises.filter(
            (exercise) => exercise.localId !== exerciseId,
          ),
        };
      }),
    );
  }

  function updateExerciseField(
    dayId: string,
    exerciseId: string,
    field: keyof Omit<BuilderExercise, "localId">,
    value: string,
  ) {
    setDays((currentDays) =>
      currentDays.map((day) => {
        if (day.localId !== dayId) {
          return day;
        }

        return {
          ...day,
          exercises: day.exercises.map((exercise) =>
            exercise.localId === exerciseId
              ? { ...exercise, [field]: value }
              : exercise,
          ),
        };
      }),
    );
  }

  function submit() {
    setError(null);
    setNotice(null);

    if (!activeExercises.length) {
      setError("Сначала добавь хотя бы одно активное упражнение в библиотеку.");
      return;
    }

    const normalizedDays: Array<{
      dayOfWeek: number;
      exercises: Array<{
        exerciseLibraryId: string;
        setsCount: number;
        plannedReps: number;
      }>;
    }> = [];
    const usedDays = new Set<number>();

    for (const day of days) {
      const nextDayOfWeek = Number(day.dayOfWeek);

      if (
        !Number.isInteger(nextDayOfWeek) ||
        nextDayOfWeek < 1 ||
        nextDayOfWeek > 7
      ) {
        setError("Для каждого дня нужно выбрать день недели.");
        return;
      }

      if (usedDays.has(nextDayOfWeek)) {
        setError("Один и тот же день недели нельзя использовать дважды.");
        return;
      }

      usedDays.add(nextDayOfWeek);

      if (!day.exercises.length) {
        setError("В каждом тренировочном дне должно быть хотя бы одно упражнение.");
        return;
      }

      const normalizedExercises = [];

      for (const exercise of day.exercises) {
        const setsCount = Number(exercise.setsCount);
        const plannedReps = Number(exercise.plannedReps);

        if (!exercise.exerciseLibraryId) {
          setError("Выбери упражнение для каждого слота внутри дня.");
          return;
        }

        if (!Number.isInteger(setsCount) || setsCount < 1) {
          setError("Количество подходов должно быть положительным целым числом.");
          return;
        }

        if (!Number.isInteger(plannedReps) || plannedReps < 1) {
          setError("Плановые повторы должны быть положительным целым числом.");
          return;
        }

        normalizedExercises.push({
          exerciseLibraryId: exercise.exerciseLibraryId,
          setsCount,
          plannedReps,
        });
      }

      normalizedDays.push({
        dayOfWeek: nextDayOfWeek,
        exercises: normalizedExercises,
      });
    }

    setIsPending(true);

    startTransition(async () => {
      try {
        const response = await fetch("/api/weekly-programs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            weekStartDate,
            days: normalizedDays,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setError(payload?.message ?? "Не удалось сохранить недельную программу.");
          return;
        }

        setNotice("Черновик программы сохранён.");
        resetBuilder();
        router.refresh();
      } finally {
        setIsPending(false);
      }
    });
  }

  function lockProgram(programId: string) {
    setError(null);
    setNotice(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/weekly-programs/${programId}/lock`, {
          method: "POST",
        });

        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setError(payload?.message ?? "Не удалось зафиксировать недельную программу.");
          return;
        }

        setNotice("Программа зафиксирована и переведена в активную.");
        router.refresh();
      } finally {
        setIsPending(false);
      }
    });
  }

  function cloneProgram(program: WeeklyProgramSummary) {
    setError(null);
    setNotice(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/weekly-programs/${program.id}/clone`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            weekStartDate: addDays(program.week_start_date, 7),
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setError(payload?.message ?? "Не удалось клонировать недельную программу.");
          return;
        }

        setNotice("Программа клонирована как новый черновик на следующую неделю.");
        router.refresh();
      } finally {
        setIsPending(false);
      }
    });
  }

  function saveTemplate(program: WeeklyProgramSummary) {
    setError(null);
    setNotice(null);
    setIsPending(true);

    startTransition(async () => {
      try {
        const response = await fetch("/api/workout-templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            programId: program.id,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setError(payload?.message ?? "Не удалось сохранить шаблон тренировки.");
          return;
        }

        setNotice("Шаблон тренировки сохранён.");
        router.refresh();
      } finally {
        setIsPending(false);
      }
    });
  }

  function applyTemplate(template: WorkoutTemplateSummary) {
    const nextDays = template.payload.days.map((day) => ({
      localId: createLocalId(),
      dayOfWeek: day.dayOfWeek.toString(),
      exercises: day.exercises.map((exercise) => ({
        localId: createLocalId(),
        exerciseLibraryId: exercise.exerciseLibraryId ?? "",
        setsCount: exercise.setsCount.toString(),
        plannedReps: exercise.plannedReps.toString(),
      })),
    }));

    setDays(nextDays.length ? nextDays : [createDayEntry()]);
    setTitle(template.title);
    setError(null);
    setNotice("Шаблон загружен в конструктор. Проверь неделю и сохрани черновик.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="card p-6">
        <div className="mb-5">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Конструктор недели
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Собрать черновик недели
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Здесь собирается структура недели: дни, упражнения и плановые
            повторы. Фиксация недели и экран выполнения идут следующим отдельным
            срезом.
          </p>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm text-muted">
            Название программы
            <input
              className={inputClassName}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Неделя 1 - верх/низ"
              type="text"
              value={title}
            />
          </label>

          <label className="grid gap-2 text-sm text-muted">
            Начало недели
            <input
              className={inputClassName}
              onChange={(event) => setWeekStartDate(event.target.value)}
              type="date"
              value={weekStartDate}
            />
          </label>
        </div>

        <div className="mt-6 grid gap-5">
          {days.map((day, index) => (
            <section
              className="rounded-3xl border border-border bg-white/60 p-4"
              key={day.localId}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Тренировочный день {index + 1}
                  </p>
                  <p className="text-sm text-muted">
                    Выбери день недели и наполни его упражнениями.
                  </p>
                </div>
                {days.length > 1 ? (
                  <button
                    className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
                    onClick={() => removeDay(day.localId)}
                    type="button"
                  >
                    Удалить день
                  </button>
                ) : null}
              </div>

              <label className="grid gap-2 text-sm text-muted">
                День недели
                <select
                  className={inputClassName}
                  onChange={(event) => updateDayField(day.localId, event.target.value)}
                  value={day.dayOfWeek}
                >
                  <option value="">Выбери день</option>
                  {Object.entries(dayLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-4 grid gap-4">
                {day.exercises.map((exercise, exerciseIndex) => (
                  <div
                    className="rounded-2xl border border-border bg-white/80 p-4"
                    key={exercise.localId}
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        Упражнение {exerciseIndex + 1}
                      </p>
                      {day.exercises.length > 1 ? (
                        <button
                          className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
                          onClick={() => removeExercise(day.localId, exercise.localId)}
                          type="button"
                        >
                          Удалить
                        </button>
                      ) : null}
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="grid gap-2 text-sm text-muted md:col-span-3">
                        Упражнение
                        <select
                          className={inputClassName}
                          onChange={(event) =>
                            updateExerciseField(
                              day.localId,
                              exercise.localId,
                              "exerciseLibraryId",
                              event.target.value,
                            )
                          }
                          value={exercise.exerciseLibraryId}
                        >
                          <option value="">Выбери упражнение</option>
                          {activeExercises.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.title} · {option.muscle_group}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-2 text-sm text-muted">
                        Подходов
                        <input
                          className={inputClassName}
                          min={1}
                          onChange={(event) =>
                            updateExerciseField(
                              day.localId,
                              exercise.localId,
                              "setsCount",
                              event.target.value,
                            )
                          }
                          type="number"
                          value={exercise.setsCount}
                        />
                      </label>

                      <label className="grid gap-2 text-sm text-muted">
                        Повторов в подходе
                        <input
                          className={inputClassName}
                          min={1}
                          onChange={(event) =>
                            updateExerciseField(
                              day.localId,
                              exercise.localId,
                              "plannedReps",
                              event.target.value,
                            )
                          }
                          type="number"
                          value={exercise.plannedReps}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70"
                onClick={() => addExercise(day.localId)}
                type="button"
              >
                Добавить упражнение в день
              </button>
            </section>
          ))}
        </div>

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

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending || !title.trim() || !weekStartDate}
            onClick={submit}
            type="button"
          >
            {isPending ? "Сохраняю черновик..." : "Сохранить черновик недели"}
          </button>
          <button
            className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/70"
            onClick={addDay}
            type="button"
          >
            Добавить тренировочный день
          </button>
        </div>
      </section>

      <section className="card p-6">
        <div className="grid gap-6">
          <section className="rounded-3xl border border-border bg-white/60 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                  Моя неделя
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">
                  Текущая активная неделя
                </h2>
              </div>
              <div className="pill">{activeProgram ? "Активна" : "Пусто"}</div>
            </div>

            {activeProgram ? (
              <div className="grid gap-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {activeProgram.title}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {renderProgramRange(activeProgram)}
                  </p>
                </div>

                {activeProgram.days.map((day) => (
                  <article
                    className="rounded-2xl border border-border bg-white/80 px-4 py-3"
                    key={day.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        {dayLabels[day.day_of_week] ?? `День ${day.day_of_week}`}
                      </p>
                        <span className="pill">
                          {dayStatusLabels[day.status] ?? day.status}
                        </span>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      Упражнений: {day.exercises.length}
                    </p>
                    <Link
                      className="mt-3 inline-flex rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
                      href={`/workouts/day/${day.id}` as Route}
                    >
                      Открыть день тренировки
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-muted">
                Пока нет активной недели. Сохрани черновик программы и нажми
                `Зафиксировать неделю`, чтобы перевести её в активную.
              </p>
            )}
          </section>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                Программы
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                Последние программы недели
              </h2>
            </div>
            <div className="pill">{initialPrograms.length}</div>
          </div>
        </div>

        <section className="mb-6 rounded-3xl border border-border bg-white/60 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                Шаблоны
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                Шаблоны тренировок
              </h2>
            </div>
            <div className="pill">{initialTemplates.length}</div>
          </div>

          <div className="grid gap-3">
            {initialTemplates.length ? (
              initialTemplates.map((template) => (
                <article
                  className="rounded-2xl border border-border bg-white/80 p-4"
                  key={template.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{template.title}</p>
                      <p className="mt-1 text-sm text-muted">
                        Тренировочных дней: {template.payload.days.length}
                      </p>
                    </div>
                    <button
                      className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
                      onClick={() => applyTemplate(template)}
                      type="button"
                    >
                      Использовать шаблон
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm leading-7 text-muted">
                Пока нет сохранённых шаблонов. Сохрани любую недельную программу
                как шаблон и используй её повторно в конструкторе.
              </p>
            )}
          </div>
        </section>

        <div className="grid gap-4">
          {initialPrograms.length ? (
            initialPrograms.map((program) => (
              <article
                className="rounded-2xl border border-border bg-white/60 p-4"
                key={program.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {program.title}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {renderProgramRange(program)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isPending}
                      onClick={() => cloneProgram(program)}
                      type="button"
                    >
                      Клонировать +7 дней
                    </button>
                    <button
                      className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isPending}
                      onClick={() => saveTemplate(program)}
                      type="button"
                    >
                      Сохранить как шаблон
                    </button>
                    <span className="pill">
                      {statusLabels[program.status] ?? program.status}
                    </span>
                    <span className="pill">
                      {program.is_locked ? "Зафиксирована" : "Можно редактировать"}
                    </span>
                    {!program.is_locked && program.status === "draft" ? (
                      <button
                        className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isPending}
                        onClick={() => lockProgram(program.id)}
                        type="button"
                      >
                        Зафиксировать неделю
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {program.days.length ? (
                    program.days.map((day) => (
                      <div
                        className="rounded-2xl border border-border bg-white/80 px-4 py-3"
                        key={day.id}
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {dayLabels[day.day_of_week] ?? `День ${day.day_of_week}`}
                        </p>
                        <div className="mt-2 grid gap-2 text-sm text-muted">
                          {day.exercises.map((exercise) => (
                            <p key={exercise.id}>
                              {exercise.exercise_title_snapshot} · {exercise.sets_count} x{" "}
                              {exercise.sets[0]?.planned_reps ?? "?"}
                            </p>
                          ))}
                        </div>
                        {program.is_locked ? (
                          <Link
                            className="mt-3 inline-flex rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
                            href={`/workouts/day/${day.id}` as Route}
                          >
                            Перейти к выполнению
                          </Link>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-7 text-muted">
                      В этой программе пока нет сохранённых тренировочных дней.
                    </p>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-border bg-white/60 p-4 text-sm leading-7 text-muted">
              Пока нет сохранённых недельных программ. Сначала собери первый
              черновик, затем появятся фиксация недели, экран выполнения и история.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
