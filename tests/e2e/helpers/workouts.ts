import { expect, type Page } from "@playwright/test";

import { getAuthE2ECredentials } from "./auth";
import {
  createSupabaseAdminTestClient,
  findAuthUserIdByEmail,
} from "./supabase-admin";

type ExerciseRow = {
  id: string;
};

type CreateWorkoutDayOptions = {
  exerciseCount?: number;
  locked?: boolean;
};

const ADMIN_RETRY_DELAYS_MS = [350, 900, 1_800, 3_000, 5_000] as const;
const WORKOUT_HELPER_RETRY_DELAYS_MS = [1_000, 3_000, 6_000] as const;

function isTransientAdminError(error: unknown) {
  const normalizedError = String(error).toLowerCase();

  return (
    normalizedError.includes("econnreset") ||
    normalizedError.includes("fetch failed") ||
    normalizedError.includes("terminated") ||
    normalizedError.includes("timeout") ||
    normalizedError.includes("und_err")
  );
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildFutureWeekStartDate(seed: string) {
  const hash = seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  const randomOffset = Math.floor(Math.random() * 36500);
  const offsetDays = 365 + (hash % 36500) + randomOffset;
  const nextDate = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);

  return toDateOnly(nextDate);
}

function computeWeekEndDate(weekStartDate: string) {
  const [year, month, day] = weekStartDate.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day));
  nextDate.setUTCDate(nextDate.getUTCDate() + 6);
  return nextDate.toISOString().slice(0, 10);
}

async function withAdminRetry<T>(factory: () => Promise<T>) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < ADMIN_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const result = await factory();

      if (
        result &&
        typeof result === "object" &&
        "error" in result &&
        result.error &&
        typeof result.error === "object"
      ) {
        const errorRecord = result.error as {
          details?: string;
          message?: string;
        };
        const serializedError = [
          errorRecord.message ?? "",
          errorRecord.details ?? "",
          JSON.stringify(result.error),
        ]
          .filter(Boolean)
          .join(" ");

        if (isTransientAdminError(serializedError)) {
          throw new Error(serializedError);
        }
      }

      return result;
    } catch (error) {
      lastError = error;

      if (attempt === ADMIN_RETRY_DELAYS_MS.length - 1) {
        break;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, ADMIN_RETRY_DELAYS_MS[attempt]),
      );
    }
  }

  throw lastError;
}

async function resolveAuthUserId() {
  const credentials = getAuthE2ECredentials();

  if (!credentials) {
    throw new Error(
      "PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD are required for workout helpers.",
    );
  }

  return findAuthUserIdByEmail(credentials.email);
}

async function createExercise(userId: string, title: string) {
  const supabase = createSupabaseAdminTestClient();
  const result = await withAdminRetry(async () =>
    await supabase
      .from("exercise_library")
      .insert({
        user_id: userId,
        title,
        muscle_group: "Legs",
        description: "Playwright seeded exercise",
        note: "",
        is_archived: false,
      })
      .select("id")
      .single(),
  );

  if (result.error) {
    throw result.error;
  }

  const exerciseId = (result.data as ExerciseRow | null)?.id;
  expect(exerciseId).toBeTruthy();

  return exerciseId!;
}

async function findUnusedFutureWeekStartDate(
  userId: string,
  seed: string,
  supabase: ReturnType<typeof createSupabaseAdminTestClient>,
) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidateDate = buildFutureWeekStartDate(`${seed}-${attempt}`);
    const candidateLookup = await withAdminRetry(async () =>
      await supabase
        .from("weekly_programs")
        .select("id")
        .eq("user_id", userId)
        .eq("week_start_date", candidateDate)
        .limit(1),
    );

    if (candidateLookup.error) {
      throw candidateLookup.error;
    }

    if (!candidateLookup.data?.length) {
      return candidateDate;
    }
  }

  throw new Error("Could not find a free weekly program slot for the workout test seed.");
}

export async function createLockedWorkoutDay(page: Page, titleSeed: string) {
  return createWorkoutDay(page, titleSeed, {
    exerciseCount: 1,
    locked: true,
  });
}

export async function createUnlockedWorkoutDay(page: Page, titleSeed: string) {
  return createWorkoutDay(page, titleSeed, {
    exerciseCount: 1,
    locked: false,
  });
}

export async function createLockedWorkoutDayWithExercises(
  page: Page,
  titleSeed: string,
  exerciseCount: number,
) {
  return createWorkoutDay(page, titleSeed, {
    exerciseCount,
    locked: true,
  });
}

async function createWorkoutDay(
  _page: Page,
  titleSeed: string,
  options?: CreateWorkoutDayOptions,
) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= WORKOUT_HELPER_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await createWorkoutDayOnce(titleSeed, options);
    } catch (error) {
      lastError = error;

      if (
        attempt === WORKOUT_HELPER_RETRY_DELAYS_MS.length ||
        !isTransientAdminError(error)
      ) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, WORKOUT_HELPER_RETRY_DELAYS_MS[attempt]),
      );
    }
  }

  throw lastError;
}

async function createWorkoutDayOnce(
  titleSeed: string,
  options?: CreateWorkoutDayOptions,
) {
  const userId = await resolveAuthUserId();
  const supabase = createSupabaseAdminTestClient();
  const suffix = crypto.randomUUID().slice(0, 8);
  const exerciseCount = Math.max(1, options?.exerciseCount ?? 1);
  const exerciseIds: string[] = [];

  for (let index = 0; index < exerciseCount; index += 1) {
    exerciseIds.push(
      await createExercise(userId, `E2E ${titleSeed} ${suffix} ${index + 1}`),
    );
  }

  let programId: string | null = null;
  let weekStartDate = "";

  for (let attempt = 0; attempt < 12; attempt += 1) {
    weekStartDate = await findUnusedFutureWeekStartDate(
      userId,
      `${suffix}-${attempt}${options?.locked === false ? "-draft" : ""}`,
      supabase,
    );
    const weekEndDate = computeWeekEndDate(weekStartDate);
    const programInsert = await withAdminRetry(async () =>
      await supabase
        .from("weekly_programs")
        .insert({
          user_id: userId,
          title: `E2E ${options?.locked === false ? "Draft" : "Program"} ${titleSeed} ${suffix}-${attempt}`,
          status: "draft",
          week_start_date: weekStartDate,
          week_end_date: weekEndDate,
          is_locked: false,
        })
        .select("id")
        .single(),
    );

    if (!programInsert.error) {
      programId = (programInsert.data as { id: string } | null)?.id ?? null;
      break;
    }

    if (programInsert.error.code !== "23505") {
      throw programInsert.error;
    }
  }

  expect(programId).toBeTruthy();

  const dayInsert = await withAdminRetry(async () =>
    await supabase
      .from("workout_days")
      .insert({
        user_id: userId,
        weekly_program_id: programId,
        day_of_week: 1,
        status: "planned",
        body_weight_kg: null,
        session_note: null,
        session_duration_seconds: 0,
      })
      .select("id")
      .single(),
  );

  if (dayInsert.error) {
    throw dayInsert.error;
  }

  const dayId = (dayInsert.data as { id: string } | null)?.id;
  expect(dayId).toBeTruthy();

  const workoutExerciseIds: string[] = [];
  const setIds: string[] = [];

  for (const [index, exerciseId] of exerciseIds.entries()) {
    const workoutExerciseInsert = await withAdminRetry(async () =>
      await supabase
        .from("workout_exercises")
        .insert({
          user_id: userId,
          workout_day_id: dayId,
          exercise_library_id: exerciseId,
          exercise_title_snapshot: `E2E ${titleSeed} ${suffix} ${index + 1}`,
          sets_count: 1,
          sort_order: index,
        })
        .select("id")
        .single(),
    );

    if (workoutExerciseInsert.error) {
      throw workoutExerciseInsert.error;
    }

    const workoutExerciseId = (
      workoutExerciseInsert.data as { id: string } | null
    )?.id;
    expect(workoutExerciseId).toBeTruthy();
    workoutExerciseIds.push(workoutExerciseId!);

    const workoutSetInsert = await withAdminRetry(async () =>
      await supabase
        .from("workout_sets")
        .insert({
          user_id: userId,
          workout_exercise_id: workoutExerciseId,
          set_number: 1,
          planned_reps: 10,
          planned_reps_min: 6,
          planned_reps_max: 10,
          actual_reps: null,
          actual_weight_kg: null,
          actual_rpe: null,
        })
        .select("id")
        .single(),
    );

    if (workoutSetInsert.error) {
      throw workoutSetInsert.error;
    }

    const setId = (workoutSetInsert.data as { id: string } | null)?.id;
    expect(setId).toBeTruthy();
    setIds.push(setId!);
  }

  if (options?.locked !== false) {
    const lockMutation = await withAdminRetry(async () =>
      await supabase
        .from("weekly_programs")
        .update({
          is_locked: true,
          status: "active",
        })
        .eq("id", programId)
        .eq("user_id", userId),
    );

    if (lockMutation.error) {
      throw lockMutation.error;
    }
  }

  expect(dayId).toBeTruthy();
  expect(workoutExerciseIds.length).toBeGreaterThan(0);
  expect(setIds.length).toBeGreaterThan(0);

  return {
    exerciseId: exerciseIds[0]!,
    exerciseIds,
    programId: programId!,
    dayId: dayId!,
    workoutExerciseId: workoutExerciseIds[0]!,
    workoutExerciseIds,
    setId: setIds[0]!,
    setIds,
  };
}
