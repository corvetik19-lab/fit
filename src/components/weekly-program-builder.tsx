"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { startTransition, useState } from "react";

import type { WeeklyProgramOverviewSummary } from "@/lib/workout/weekly-programs";
import {
  defaultRepRangePresetKey,
  repRangePresets,
  resolveRepRangePreset,
  type RepRangePresetKey,
} from "@/lib/workout/rep-ranges";
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
  repRangeKey: RepRangePresetKey;
};

type BuilderDay = {
  localId: string;
  dayOfWeek: string;
  exercises: BuilderExercise[];
};

type BuilderPanelKey = "builder" | "active" | "templates" | "history";

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

function createLocalId(prefix: string, stableKey?: string) {
  return stableKey ? `${prefix}-${stableKey}` : crypto.randomUUID();
}

function createExerciseEntry(stableKey?: string): BuilderExercise {
  return {
    localId: createLocalId("exercise", stableKey),
    exerciseLibraryId: "",
    setsCount: "4",
    repRangeKey: defaultRepRangePresetKey,
  };
}

function createDayEntry(stableKey?: string): BuilderDay {
  return {
    localId: createLocalId("day", stableKey),
    dayOfWeek: "",
    exercises: [createExerciseEntry(stableKey ? `${stableKey}-1` : undefined)],
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

function renderProgramRange(program: WeeklyProgramOverviewSummary) {
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
  initialPrograms: WeeklyProgramOverviewSummary[];
  activeExercises: ExerciseOption[];
  initialTemplates: WorkoutTemplateSummary[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("Моя новая неделя");
  const [weekStartDate, setWeekStartDate] = useState(getCurrentWeekStartDate());
  const [days, setDays] = useState<BuilderDay[]>([createDayEntry("1")]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [activePanelKey, setActivePanelKey] =
    useState<BuilderPanelKey>("builder");
  const [isMobilePanelMenuOpen, setIsMobilePanelMenuOpen] = useState(false);
  const activeProgram =
    initialPrograms.find((program) => program.status === "active") ?? null;
  const totalPlannedExercises = days.reduce(
    (count, day) => count + day.exercises.length,
    0,
  );

  function resetBuilder() {
    setTitle("Моя новая неделя");
    setWeekStartDate(getCurrentWeekStartDate());
    setDays([createDayEntry("1")]);
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
        repRangeKey: RepRangePresetKey;
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

        if (!exercise.exerciseLibraryId) {
          setError("Выбери упражнение для каждого слота внутри дня.");
          return;
        }

        if (!Number.isInteger(setsCount) || setsCount < 1) {
          setError("Количество подходов должно быть положительным целым числом.");
          return;
        }

        normalizedExercises.push({
          exerciseLibraryId: exercise.exerciseLibraryId,
          setsCount,
          repRangeKey: exercise.repRangeKey,
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

  function cloneProgram(program: WeeklyProgramOverviewSummary) {
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

  function saveTemplate(program: WeeklyProgramOverviewSummary) {
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
      localId: createLocalId("day"),
      dayOfWeek: day.dayOfWeek.toString(),
      exercises: day.exercises.map((exercise) => ({
        localId: createLocalId("exercise"),
        exerciseLibraryId: exercise.exerciseLibraryId ?? "",
        setsCount: exercise.setsCount.toString(),
        repRangeKey: resolveRepRangePreset(exercise).key,
      })),
    }));

    setDays(nextDays.length ? nextDays : [createDayEntry()]);
    setTitle(template.title);
    setError(null);
    setNotice("Шаблон загружен в конструктор. Проверь неделю и сохрани черновик.");
  }

  const builderPanels: Array<{
    description: string;
    key: BuilderPanelKey;
    label: string;
  }> = [
    {
      key: "builder",
      label: "Конструктор",
      description: "Неделя, дни и упражнения",
    },
    {
      key: "active",
      label: "Активная неделя",
      description: "Текущий план и запуск тренировки",
    },
    {
      key: "templates",
      label: "Шаблоны",
      description: "Готовые схемы для быстрого старта",
    },
    {
      key: "history",
      label: "История",
      description: "Прошлые программы и черновики",
    },
  ];
  const activePanel =
    builderPanels.find((panel) => panel.key === activePanelKey) ?? null;

  function selectPanel(panelKey: BuilderPanelKey) {
    setActivePanelKey(panelKey);
    setIsMobilePanelMenuOpen(false);
  }

  return (
    <div className="grid gap-6">
      <section className="card card--hero p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="workspace-kicker">
              Меню тренировок
            </p>
            <h2 className="app-display mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
              Управляй неделей как тренировочным циклом
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              Здесь мы держим весь цикл рядом: собираем черновик, фиксируем активную неделю,
              сохраняем шаблоны и поднимаем прошлые схемы без длинной ленты из равных блоков.
            </p>
          </div>
          <span className="pill">
            {activePanel?.label ?? "Тренировки"}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <article className="surface-panel surface-panel--soft p-4">
            <p className="workspace-kicker">Черновик</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{days.length}</p>
            <p className="mt-1 text-sm text-muted">тренировочных дней в сборке</p>
          </article>
          <article className="surface-panel surface-panel--soft p-4">
            <p className="workspace-kicker">Упражнения</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {totalPlannedExercises}
            </p>
            <p className="mt-1 text-sm text-muted">слотов уже разложено по неделе</p>
          </article>
          <article className="surface-panel surface-panel--accent p-4">
            <p className="workspace-kicker">Активная неделя</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {activeProgram ? "В работе" : "Пусто"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {activeProgram ? activeProgram.title : "Зафиксируй черновик, чтобы начать выполнение"}
            </p>
          </article>
        </div>

        <div className="mt-4 md:hidden">
          <button
            aria-expanded={isMobilePanelMenuOpen}
            className="section-chip flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            onClick={() => setIsMobilePanelMenuOpen((current) => !current)}
            type="button"
          >
            <span className="min-w-0 flex-1">
              <span className="workspace-kicker block">
                Текущий раздел
              </span>
              <span className="mt-1 block truncate text-sm font-semibold text-foreground">
                {activePanel?.label ?? "Выбери раздел"}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {activePanel?.description ?? "Выбери нужный блок"}
              </span>
            </span>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white/82 text-foreground">
              {isMobilePanelMenuOpen ? (
                <ChevronUp size={18} strokeWidth={2.2} />
              ) : (
                <ChevronDown size={18} strokeWidth={2.2} />
              )}
            </span>
          </button>

          {isMobilePanelMenuOpen ? (
            <div className="mt-3 grid gap-2 rounded-[1.75rem] border border-border bg-[color-mix(in_srgb,var(--surface)_94%,white)] p-3">
              {builderPanels.map((panel) => {
                const isActive = panel.key === activePanelKey;

                return (
                  <button
                    aria-pressed={isActive}
                    className={`section-chip flex items-start justify-between gap-3 px-3 py-3 text-left ${
                      isActive ? "section-chip--active" : ""
                    }`}
                    key={panel.key}
                    onClick={() => selectPanel(panel.key)}
                    type="button"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {panel.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted">
                        {panel.description}
                      </span>
                    </span>
                    {isActive ? (
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
                        <Check size={16} strokeWidth={2.3} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mt-4 hidden gap-3 md:flex md:flex-wrap">
          {builderPanels.map((panel) => {
            const isActive = panel.key === activePanelKey;

            return (
              <button
                aria-pressed={isActive}
                className={`section-chip min-w-[12rem] px-4 py-3 text-left ${
                  isActive ? "section-chip--active" : ""
                }`}
                key={panel.key}
                onClick={() => selectPanel(panel.key)}
                type="button"
              >
                <span className="block text-sm font-semibold">{panel.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">
                  {panel.description}
                </span>
              </button>
            );
          })}
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
      </section>

      {activePanelKey === "builder" ? (
        <section className="card card--hero p-6">
          <div className="mb-5">
            <p className="workspace-kicker">
              Конструктор недели
            </p>
            <h2 className="app-display mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
              Собрать черновик недели
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              Здесь собирается структура недели: дни, упражнения и плановые повторы. Фиксация недели и экран выполнения идут следующим отдельным шагом.
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
              <section className="surface-panel surface-panel--soft p-4" key={day.localId}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="workspace-kicker">
                      Тренировочный день {index + 1}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Выбери день недели и наполни его упражнениями.
                    </p>
                  </div>
                  {days.length > 1 ? (
                    <button
                      className="action-button action-button--secondary"
                      onClick={() => removeDay(day.localId)}
                      type="button"
                    >
                      Удалить день
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-start">
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

                  <div className="grid gap-4">
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <div className="surface-panel p-4" key={exercise.localId}>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">
                            Упражнение {exerciseIndex + 1}
                          </p>
                          {day.exercises.length > 1 ? (
                            <button
                              className="action-button action-button--secondary px-4 py-2 text-sm"
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
                                  {option.title}
                                  {option.muscle_group ? ` · ${option.muscle_group}` : ""}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="grid gap-2 text-sm text-muted">
                            Подходы
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

                          <label className="grid gap-2 text-sm text-muted md:col-span-2">
                            Диапазон повторов
                            <select
                              className={inputClassName}
                              onChange={(event) =>
                                updateExerciseField(
                                  day.localId,
                                  exercise.localId,
                                  "repRangeKey",
                                  event.target.value,
                                )
                              }
                              value={exercise.repRangeKey}
                            >
                              {repRangePresets.map((preset) => (
                                <option key={preset.key} value={preset.key}>
                                  {preset.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>
                    ))}

                    <button
                      className="action-button action-button--soft"
                      onClick={() => addExercise(day.localId)}
                      type="button"
                    >
                      Добавить упражнение в день
                    </button>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="action-button action-button--primary"
              disabled={isPending || !title.trim() || !weekStartDate}
              onClick={submit}
              type="button"
            >
              {isPending ? "Сохраняю черновик..." : "Сохранить черновик недели"}
            </button>
            <button
              className="action-button action-button--secondary"
              onClick={addDay}
              type="button"
            >
              Добавить тренировочный день
            </button>
          </div>
        </section>
      ) : null}

      {activePanelKey === "active" ? (
        <section className="card card--hero p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="workspace-kicker">
                Моя неделя
              </p>
              <h2 className="app-display mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                Текущая активная неделя
              </h2>
            </div>
            <div className="pill">{activeProgram ? "Активна" : "Пусто"}</div>
          </div>

          {activeProgram ? (
            <div className="grid gap-3">
              <div>
                <p className="text-lg font-semibold text-foreground">{activeProgram.title}</p>
                <p className="mt-1 text-sm text-muted">{renderProgramRange(activeProgram)}</p>
              </div>

              {activeProgram.days.map((day) => (
                <article
                  className="surface-panel p-4"
                  key={day.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {dayLabels[day.day_of_week] ?? `День ${day.day_of_week}`}
                    </p>
                    <span className="pill">{dayStatusLabels[day.status] ?? day.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">Упражнений: {day.exercises.length}</p>
                  <Link
                    className="action-button action-button--secondary mt-3"
                    href={`/workouts/day/${day.id}` as Route}
                  >
                    Открыть день тренировки
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-7 text-muted">
              Пока нет активной недели. Сохрани черновик программы и нажми `Зафиксировать неделю`, чтобы перевести её в активную.
            </p>
          )}
        </section>
      ) : null}

      {activePanelKey === "templates" ? (
        <section className="card card--hero p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="workspace-kicker">
                Шаблоны
              </p>
              <h2 className="app-display mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                Шаблоны тренировок
              </h2>
            </div>
            <div className="pill">{initialTemplates.length}</div>
          </div>

          <div className="grid gap-3">
            {initialTemplates.length ? (
              initialTemplates.map((template) => (
                <article
                  className="surface-panel p-4"
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
                      className="action-button action-button--soft"
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
                Пока нет сохранённых шаблонов. Сохрани любую недельную программу как шаблон и используй её повторно в конструкторе.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {activePanelKey === "history" ? (
        <section className="card card--hero p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="workspace-kicker">
                Программы
              </p>
              <h2 className="app-display mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                История программ недели
              </h2>
            </div>
            <div className="pill">{initialPrograms.length}</div>
          </div>

          <div className="grid gap-4">
            {initialPrograms.length ? (
              initialPrograms.map((program) => (
                <article
                  className="surface-panel surface-panel--soft p-4"
                  key={program.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{program.title}</p>
                      <p className="mt-1 text-sm text-muted">{renderProgramRange(program)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="action-button action-button--secondary px-4 py-2 text-sm"
                        disabled={isPending}
                        onClick={() => cloneProgram(program)}
                        type="button"
                      >
                        Клонировать +7 дней
                      </button>
                      <button
                        className="action-button action-button--soft px-4 py-2 text-sm"
                        disabled={isPending}
                        onClick={() => saveTemplate(program)}
                        type="button"
                      >
                        Сохранить как шаблон
                      </button>
                      <span className="pill">{statusLabels[program.status] ?? program.status}</span>
                      <span className="pill">
                        {program.is_locked ? "Зафиксирована" : "Можно редактировать"}
                      </span>
                      {!program.is_locked && program.status === "draft" ? (
                        <button
                          className="action-button action-button--primary px-4 py-2 text-sm"
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
                          className="surface-panel p-4"
                          key={day.id}
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {dayLabels[day.day_of_week] ?? `День ${day.day_of_week}`}
                          </p>
                          <div className="mt-2 grid gap-2 text-sm text-muted">
                            {day.exercises.map((exercise) => (
                              <p key={exercise.id}>
                                {exercise.exercise_title_snapshot} · {exercise.sets_count} подход.
                              </p>
                            ))}
                          </div>
                          {program.is_locked ? (
                            <Link
                              className="action-button action-button--secondary mt-3"
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
                Пока нет сохранённых недельных программ. Сначала собери первый черновик, затем появятся фиксация недели, экран выполнения и история.
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
