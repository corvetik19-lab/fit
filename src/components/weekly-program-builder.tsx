"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import type { WeeklyProgramSummary } from "@/lib/workout/weekly-programs";
import {
  defaultRepRangePresetKey,
  formatPlannedRepTarget,
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
  1: "РџРѕРЅРµРґРµР»СЊРЅРёРє",
  2: "Р’С‚РѕСЂРЅРёРє",
  3: "РЎСЂРµРґР°",
  4: "Р§РµС‚РІРµСЂРі",
  5: "РџСЏС‚РЅРёС†Р°",
  6: "РЎСѓР±Р±РѕС‚Р°",
  7: "Р’РѕСЃРєСЂРµСЃРµРЅСЊРµ",
};

const statusLabels: Record<string, string> = {
  draft: "Р§РµСЂРЅРѕРІРёРє",
  active: "РђРєС‚РёРІРЅР°",
  completed: "Р—Р°РІРµСЂС€РµРЅР°",
  archived: "РђСЂС…РёРІ",
};

const dayStatusLabels: Record<string, string> = {
  planned: "Р—Р°РїР»Р°РЅРёСЂРѕРІР°РЅ",
  in_progress: "Р’ РїСЂРѕС†РµСЃСЃРµ",
  done: "Р—Р°РІРµСЂС€С‘РЅ",
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
    repRangeKey: defaultRepRangePresetKey,
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
  const [title, setTitle] = useState("РњРѕСЏ РЅРѕРІР°СЏ РЅРµРґРµР»СЏ");
  const [weekStartDate, setWeekStartDate] = useState(getCurrentWeekStartDate());
  const [days, setDays] = useState<BuilderDay[]>([createDayEntry()]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [activePanelKey, setActivePanelKey] =
    useState<BuilderPanelKey>("builder");
  const activeProgram =
    initialPrograms.find((program) => program.status === "active") ?? null;

  function resetBuilder() {
    setTitle("РњРѕСЏ РЅРѕРІР°СЏ РЅРµРґРµР»СЏ");
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
      setError("РЎРЅР°С‡Р°Р»Р° РґРѕР±Р°РІСЊ С…РѕС‚СЏ Р±С‹ РѕРґРЅРѕ Р°РєС‚РёРІРЅРѕРµ СѓРїСЂР°Р¶РЅРµРЅРёРµ РІ Р±РёР±Р»РёРѕС‚РµРєСѓ.");
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
        setError("Р”Р»СЏ РєР°Р¶РґРѕРіРѕ РґРЅСЏ РЅСѓР¶РЅРѕ РІС‹Р±СЂР°С‚СЊ РґРµРЅСЊ РЅРµРґРµР»Рё.");
        return;
      }

      if (usedDays.has(nextDayOfWeek)) {
        setError("РћРґРёРЅ Рё С‚РѕС‚ Р¶Рµ РґРµРЅСЊ РЅРµРґРµР»Рё РЅРµР»СЊР·СЏ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґРІР°Р¶РґС‹.");
        return;
      }

      usedDays.add(nextDayOfWeek);

      if (!day.exercises.length) {
        setError("Р’ РєР°Р¶РґРѕРј С‚СЂРµРЅРёСЂРѕРІРѕС‡РЅРѕРј РґРЅРµ РґРѕР»Р¶РЅРѕ Р±С‹С‚СЊ С…РѕС‚СЏ Р±С‹ РѕРґРЅРѕ СѓРїСЂР°Р¶РЅРµРЅРёРµ.");
        return;
      }

      const normalizedExercises = [];

      for (const exercise of day.exercises) {
        const setsCount = Number(exercise.setsCount);

        if (!exercise.exerciseLibraryId) {
          setError("Р’С‹Р±РµСЂРё СѓРїСЂР°Р¶РЅРµРЅРёРµ РґР»СЏ РєР°Р¶РґРѕРіРѕ СЃР»РѕС‚Р° РІРЅСѓС‚СЂРё РґРЅСЏ.");
          return;
        }

        if (!Number.isInteger(setsCount) || setsCount < 1) {
          setError("РљРѕР»РёС‡РµСЃС‚РІРѕ РїРѕРґС…РѕРґРѕРІ РґРѕР»Р¶РЅРѕ Р±С‹С‚СЊ РїРѕР»РѕР¶РёС‚РµР»СЊРЅС‹Рј С†РµР»С‹Рј С‡РёСЃР»РѕРј.");
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
          setError(payload?.message ?? "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РЅРµРґРµР»СЊРЅСѓСЋ РїСЂРѕРіСЂР°РјРјСѓ.");
          return;
        }

        setNotice("Р§РµСЂРЅРѕРІРёРє РїСЂРѕРіСЂР°РјРјС‹ СЃРѕС…СЂР°РЅС‘РЅ.");
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
          setError(payload?.message ?? "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°С„РёРєСЃРёСЂРѕРІР°С‚СЊ РЅРµРґРµР»СЊРЅСѓСЋ РїСЂРѕРіСЂР°РјРјСѓ.");
          return;
        }

        setNotice("РџСЂРѕРіСЂР°РјРјР° Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅР° Рё РїРµСЂРµРІРµРґРµРЅР° РІ Р°РєС‚РёРІРЅСѓСЋ.");
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
          setError(payload?.message ?? "РќРµ СѓРґР°Р»РѕСЃСЊ РєР»РѕРЅРёСЂРѕРІР°С‚СЊ РЅРµРґРµР»СЊРЅСѓСЋ РїСЂРѕРіСЂР°РјРјСѓ.");
          return;
        }

        setNotice("РџСЂРѕРіСЂР°РјРјР° РєР»РѕРЅРёСЂРѕРІР°РЅР° РєР°Рє РЅРѕРІС‹Р№ С‡РµСЂРЅРѕРІРёРє РЅР° СЃР»РµРґСѓСЋС‰СѓСЋ РЅРµРґРµР»СЋ.");
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
          setError(payload?.message ?? "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ С€Р°Р±Р»РѕРЅ С‚СЂРµРЅРёСЂРѕРІРєРё.");
          return;
        }

        setNotice("РЁР°Р±Р»РѕРЅ С‚СЂРµРЅРёСЂРѕРІРєРё СЃРѕС…СЂР°РЅС‘РЅ.");
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
        repRangeKey: resolveRepRangePreset(exercise).key,
      })),
    }));

    setDays(nextDays.length ? nextDays : [createDayEntry()]);
    setTitle(template.title);
    setError(null);
    setNotice("РЁР°Р±Р»РѕРЅ Р·Р°РіСЂСѓР¶РµРЅ РІ РєРѕРЅСЃС‚СЂСѓРєС‚РѕСЂ. РџСЂРѕРІРµСЂСЊ РЅРµРґРµР»СЋ Рё СЃРѕС…СЂР°РЅРё С‡РµСЂРЅРѕРІРёРє.");
  }

  const builderPanels: Array<{
    description: string;
    key: BuilderPanelKey;
    label: string;
  }> = [
    {
      key: "builder",
      label: "РљРѕРЅСЃС‚СЂСѓРєС‚РѕСЂ",
      description: "РќРµРґРµР»СЏ, РґРЅРё Рё СѓРїСЂР°Р¶РЅРµРЅРёСЏ",
    },
    {
      key: "active",
      label: "РђРєС‚РёРІРЅР°СЏ РЅРµРґРµР»СЏ",
      description: "РўРµРєСѓС‰РёР№ РїР»Р°РЅ Рё Р·Р°РїСѓСЃРє С‚СЂРµРЅРёСЂРѕРІРєРё",
    },
    {
      key: "templates",
      label: "РЁР°Р±Р»РѕРЅС‹",
      description: "Р“РѕС‚РѕРІС‹Рµ СЃС…РµРјС‹ РґР»СЏ Р±С‹СЃС‚СЂРѕРіРѕ СЃС‚Р°СЂС‚Р°",
    },
    {
      key: "history",
      label: "РСЃС‚РѕСЂРёСЏ",
      description: "РџСЂРѕС€Р»С‹Рµ РїСЂРѕРіСЂР°РјРјС‹ Рё С‡РµСЂРЅРѕРІРёРєРё",
    },
  ];

  return (
    <div className="grid gap-6">
      <section className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Меню тренировок
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Открывай только нужный блок
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Переключайся между конструктором, текущей неделей, шаблонами и историей программ, чтобы экран не превращался в длинную ленту.
            </p>
          </div>
          <span className="pill">
            {builderPanels.find((panel) => panel.key === activePanelKey)?.label ?? "Тренировки"}
          </span>
        </div>

        <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {builderPanels.map((panel) => {
            const isActive = panel.key === activePanelKey;

            return (
              <button
                aria-pressed={isActive}
                className={`min-w-[13.5rem] shrink-0 rounded-3xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-accent/30 bg-accent-soft text-foreground shadow-[0_18px_45px_-35px_rgba(20,97,75,0.35)]"
                    : "border-border bg-white/80 text-foreground hover:bg-white"
                }`}
                key={panel.key}
                onClick={() => setActivePanelKey(panel.key)}
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
        <section className="card p-6">
          <div className="mb-5">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Конструктор недели
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Собрать черновик недели
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">
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
                      className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/70"
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
                      <div
                        className="rounded-2xl border border-border bg-white/85 p-4"
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
                      className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white/70"
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
      ) : null}

      {activePanelKey === "active" ? (
        <section className="card p-6">
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
                <p className="text-lg font-semibold text-foreground">{activeProgram.title}</p>
                <p className="mt-1 text-sm text-muted">{renderProgramRange(activeProgram)}</p>
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
                    <span className="pill">{dayStatusLabels[day.status] ?? day.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">Упражнений: {day.exercises.length}</p>
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
              Пока нет активной недели. Сохрани черновик программы и нажми `Зафиксировать неделю`, чтобы перевести её в активную.
            </p>
          )}
        </section>
      ) : null}

      {activePanelKey === "templates" ? (
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                Шаблоны
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
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
                Пока нет сохранённых шаблонов. Сохрани любую недельную программу как шаблон и используй её повторно в конструкторе.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {activePanelKey === "history" ? (
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                Программы
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                История программ недели
              </h2>
            </div>
            <div className="pill">{initialPrograms.length}</div>
          </div>

          <div className="grid gap-4">
            {initialPrograms.length ? (
              initialPrograms.map((program) => (
                <article
                  className="rounded-2xl border border-border bg-white/60 p-4"
                  key={program.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{program.title}</p>
                      <p className="mt-1 text-sm text-muted">{renderProgramRange(program)}</p>
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
                      <span className="pill">{statusLabels[program.status] ?? program.status}</span>
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
                                {exercise.sets[0]
                                  ? formatPlannedRepTarget(exercise.sets[0])
                                  : "?"}
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
                Пока нет сохранённых недельных программ. Сначала собери первый черновик, затем появятся фиксация недели, экран выполнения и история.
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
