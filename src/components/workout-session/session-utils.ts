import type { OfflineMutation } from "@/lib/offline/db";
import type {
  WeeklyProgramExerciseSummary,
  WeeklyProgramSetSummary,
  WorkoutDayDetail,
} from "@/lib/workout/weekly-programs";

export const dayLabels: Record<number, string> = {
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
  7: "Воскресенье",
};

export const dayStatusLabels: Record<string, string> = {
  planned: "Запланирована",
  in_progress: "В процессе",
  done: "Завершена",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
});

const snapshotTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export const WORKOUT_TIMER_MAX_SECONDS = 2 * 60 * 60;
const WORKOUT_TIMER_STORAGE_KEY_PREFIX = "fit-workout-timer:";

export type PersistedWorkoutTimer = {
  baseSeconds: number;
  startedAt: number;
};

export type ExerciseDraft = {
  setId: string;
  actualReps: number;
  actualWeightKg: number | null;
  actualRpe: number | null;
};

function getWorkoutTimerStorageKey(dayId: string) {
  return `${WORKOUT_TIMER_STORAGE_KEY_PREFIX}${dayId}`;
}

export function loadPersistedWorkoutTimer(
  dayId: string,
): PersistedWorkoutTimer | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getWorkoutTimerStorageKey(dayId));

    if (!rawValue) {
      return null;
    }

    const value = JSON.parse(rawValue) as Partial<PersistedWorkoutTimer>;

    if (
      typeof value.baseSeconds !== "number" ||
      !Number.isFinite(value.baseSeconds) ||
      typeof value.startedAt !== "number" ||
      !Number.isFinite(value.startedAt)
    ) {
      window.localStorage.removeItem(getWorkoutTimerStorageKey(dayId));
      return null;
    }

    return {
      baseSeconds: Math.max(0, Math.floor(value.baseSeconds)),
      startedAt: value.startedAt,
    };
  } catch {
    window.localStorage.removeItem(getWorkoutTimerStorageKey(dayId));
    return null;
  }
}

export function persistWorkoutTimer(dayId: string, timer: PersistedWorkoutTimer) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getWorkoutTimerStorageKey(dayId),
    JSON.stringify(timer),
  );
}

export function clearPersistedWorkoutTimer(dayId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getWorkoutTimerStorageKey(dayId));
}

export function getRunningTimerSeconds(baseSeconds: number, startedAt: number) {
  return baseSeconds + Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
}

export function hasRunningTimerExpired(baseSeconds: number, startedAt: number) {
  return (
    getRunningTimerSeconds(baseSeconds, startedAt) >= WORKOUT_TIMER_MAX_SECONDS
  );
}

export function formatWeekRange(day: WorkoutDayDetail) {
  const startDate = dateFormatter.format(
    new Date(`${day.week_start_date}T00:00:00`),
  );
  const endDate = dateFormatter.format(new Date(`${day.week_end_date}T00:00:00`));
  return `${startDate} - ${endDate}`;
}

export function formatSnapshotTime(value: string | null) {
  if (!value) {
    return "локальная копия ещё не сохранена";
  }

  return snapshotTimeFormatter.format(new Date(value));
}

export function formatOptionalWeight(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return `${value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })} кг`;
}

export function formatOptionalRpe(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

export function formatDurationSeconds(value: number) {
  const safeValue = Math.max(0, value);
  const hours = Math.floor(safeValue / 3600);
  const minutes = Math.floor((safeValue % 3600) / 60);
  const seconds = safeValue % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((part) => part.toString().padStart(2, "0"))
      .join(":");
  }

  return [minutes, seconds]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}

export function isCompletedWorkoutSet(set: WeeklyProgramSetSummary) {
  return (
    typeof set.actual_reps === "number" &&
    typeof set.actual_weight_kg === "number" &&
    typeof set.actual_rpe === "number"
  );
}

export function isCompletedWorkoutExercise(
  exercise: WeeklyProgramExerciseSummary,
) {
  return exercise.sets.length > 0 && exercise.sets.every(isCompletedWorkoutSet);
}

export function getFirstIncompleteExerciseIndex(
  exercises: WeeklyProgramExerciseSummary[],
) {
  return exercises.findIndex((exercise) => !isCompletedWorkoutExercise(exercise));
}

export function getInitialActualRepsMap(day: WorkoutDayDetail) {
  const nextState: Record<string, string> = {};

  for (const exercise of day.exercises) {
    for (const set of exercise.sets) {
      nextState[set.id] = set.actual_reps?.toString() ?? "";
    }
  }

  return nextState;
}

export function getInitialActualWeightMap(day: WorkoutDayDetail) {
  const nextState: Record<string, string> = {};

  for (const exercise of day.exercises) {
    for (const set of exercise.sets) {
      nextState[set.id] =
        typeof set.actual_weight_kg === "number"
          ? set.actual_weight_kg.toString()
          : "";
    }
  }

  return nextState;
}

export function getInitialActualRpeMap(day: WorkoutDayDetail) {
  const nextState: Record<string, string> = {};

  for (const exercise of day.exercises) {
    for (const set of exercise.sets) {
      nextState[set.id] =
        typeof set.actual_rpe === "number" ? set.actual_rpe.toString() : "";
    }
  }

  return nextState;
}

export function getRpeOptions() {
  return Array.from({ length: 11 }, (_, index) => 5 + index * 0.5);
}

export function applyWorkoutDayExecution(
  day: WorkoutDayDetail,
  input: {
    status?: WorkoutDayDetail["status"];
    bodyWeightKg?: number | null;
    sessionNote?: string | null;
    sessionDurationSeconds?: number | null;
  },
) {
  return {
    ...day,
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.bodyWeightKg !== undefined
      ? { body_weight_kg: input.bodyWeightKg }
      : {}),
    ...(input.sessionNote !== undefined ? { session_note: input.sessionNote } : {}),
    ...(input.sessionDurationSeconds !== undefined
      ? { session_duration_seconds: input.sessionDurationSeconds }
      : {}),
  };
}

export function applyWorkoutSetPerformance(
  day: WorkoutDayDetail,
  setId: string,
  actualReps: number | null,
  actualWeightKg: number | null,
  actualRpe: number | null,
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
              actual_weight_kg: actualWeightKg,
              actual_rpe: actualRpe,
            }
          : set,
      ),
    })),
  };
}

export function parseOptionalWeight(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized.length) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function parseOptionalRpe(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized.length) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function areExerciseDraftValuesSaved(
  exercise: WeeklyProgramExerciseSummary,
  actualRepsBySetId: Record<string, string>,
  actualWeightBySetId: Record<string, string>,
  actualRpeBySetId: Record<string, string>,
) {
  return exercise.sets.every((set) => {
    const reps = actualRepsBySetId[set.id]?.trim() ?? "";
    const weight = actualWeightBySetId[set.id]?.trim() ?? "";
    const rpe = actualRpeBySetId[set.id]?.trim() ?? "";

    return (
      reps === (set.actual_reps?.toString() ?? "") &&
      weight ===
        (typeof set.actual_weight_kg === "number"
          ? set.actual_weight_kg.toString()
          : "") &&
      rpe ===
        (typeof set.actual_rpe === "number" ? set.actual_rpe.toString() : "")
    );
  });
}

export function isExerciseDraftReadyToSave(
  exercise: WeeklyProgramExerciseSummary,
  actualRepsBySetId: Record<string, string>,
  actualWeightBySetId: Record<string, string>,
  actualRpeBySetId: Record<string, string>,
) {
  return exercise.sets.every((set) => {
    const repsRaw = actualRepsBySetId[set.id]?.trim() ?? "";
    const weightRaw = actualWeightBySetId[set.id]?.trim() ?? "";
    const rpeRaw = actualRpeBySetId[set.id]?.trim() ?? "";

    if (!repsRaw.length || !weightRaw.length || !rpeRaw.length) {
      return false;
    }

    const reps = Number(repsRaw);
    const weight = parseOptionalWeight(weightRaw);
    const rpe = parseOptionalRpe(rpeRaw);

    return (
      Number.isInteger(reps) &&
      reps >= 0 &&
      typeof weight === "number" &&
      Number.isFinite(weight) &&
      weight >= 0 &&
      weight <= 1000 &&
      typeof rpe === "number" &&
      Number.isFinite(rpe) &&
      rpe >= 1 &&
      rpe <= 10
    );
  });
}

export function applyQueuedMutations(
  day: WorkoutDayDetail,
  mutations: OfflineMutation[],
) {
  return mutations.reduce((currentDay, mutation) => {
    if (mutation.entity === "workout_day_status") {
      return applyWorkoutDayExecution(currentDay, {
        status: mutation.payload.status,
      });
    }

    if (mutation.entity === "workout_day_execution") {
      return applyWorkoutDayExecution(currentDay, {
        status: mutation.payload.status,
        bodyWeightKg: mutation.payload.bodyWeightKg,
        sessionNote: mutation.payload.sessionNote,
        sessionDurationSeconds: mutation.payload.sessionDurationSeconds,
      });
    }

    return applyWorkoutSetPerformance(
      currentDay,
      mutation.payload.setId,
      mutation.payload.actualReps,
      mutation.payload.actualWeightKg,
      mutation.payload.actualRpe,
    );
  }, day);
}
