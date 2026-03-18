import { expect, type Page } from "@playwright/test";

import { fetchJson } from "./http";

type ExerciseRow = {
  id: string;
};

type WeeklyProgramSummary = {
  id: string;
  days: Array<{
    id: string;
    exercises: Array<{
      id: string;
      sets: Array<{
        id: string;
      }>;
    }>;
  }>;
};

type CreateWorkoutDayOptions = {
  exerciseCount?: number;
  locked?: boolean;
};

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildFutureWeekStartDate(seed: string) {
  const hash = seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  const randomOffset = Math.floor(Math.random() * 3650);
  const offsetDays = 30 + (hash % 3650) + randomOffset;
  const nextDate = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);

  return toDateOnly(nextDate);
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

async function createExercise(page: Page, title: string) {
  const exerciseResult = await fetchJson<{ data: ExerciseRow }>(page, {
    method: "POST",
    url: "/api/exercises",
    body: {
      title,
      muscleGroup: "Legs",
      description: "Playwright seeded exercise",
      note: "",
    },
  });

  expect(exerciseResult.status).toBe(200);
  const exerciseId = exerciseResult.body?.data?.id;
  expect(exerciseId).toBeTruthy();

  return exerciseId!;
}

async function createWorkoutDay(
  page: Page,
  titleSeed: string,
  options?: CreateWorkoutDayOptions,
) {
  const suffix = crypto.randomUUID().slice(0, 8);
  const exerciseCount = Math.max(1, options?.exerciseCount ?? 1);
  const exerciseIds = await Promise.all(
    Array.from({ length: exerciseCount }, (_, index) =>
      createExercise(page, `E2E ${titleSeed} ${suffix} ${index + 1}`),
    ),
  );

  let programId: string | null = null;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const attemptSeed = `${suffix}-${attempt}`;
    const weekStartDate = buildFutureWeekStartDate(
      `${attemptSeed}${options?.locked === false ? "-draft" : ""}`,
    );
    const programResult = await fetchJson<{ data: { id: string } }>(page, {
      method: "POST",
      url: "/api/weekly-programs",
      body: {
        title: `E2E ${options?.locked === false ? "Draft" : "Program"} ${titleSeed} ${attemptSeed}`,
        weekStartDate,
        days: [
          {
            dayOfWeek: 1,
            exercises: exerciseIds.map((exerciseId) => ({
              exerciseLibraryId: exerciseId,
              setsCount: 1,
              repRangeKey: "6-10",
            })),
          },
        ],
      },
    });

    expect(programResult.status).toBe(200);

    programId = programResult.body?.data?.id ?? null;
    expect(programId).toBeTruthy();

    if (!options?.locked) {
      break;
    }

    const lockResult = await fetchJson<{ code?: string }>(page, {
      method: "POST",
      url: `/api/weekly-programs/${programId}/lock`,
    });

    if (lockResult.status === 200) {
      break;
    }

    expect(lockResult.status).toBe(409);
    expect(lockResult.body?.code).toBe("WEEKLY_PROGRAM_ACTIVE_WEEK_CONFLICT");
    programId = null;
  }

  expect(programId).toBeTruthy();

  const listResult = await fetchJson<{ data: WeeklyProgramSummary[] }>(page, {
    method: "GET",
    url: "/api/weekly-programs",
  });

  expect(listResult.status).toBe(200);

  const createdProgram = (listResult.body?.data ?? []).find(
    (program) => program.id === programId,
  );

  expect(createdProgram).toBeTruthy();
  expect(createdProgram?.days.length).toBeGreaterThan(0);
  expect(createdProgram?.days[0]?.exercises.length).toBeGreaterThan(0);
  expect(createdProgram?.days[0]?.exercises[0]?.sets.length).toBeGreaterThan(0);

  return {
    exerciseId: exerciseIds[0]!,
    exerciseIds,
    programId,
    dayId: createdProgram!.days[0]!.id,
    workoutExerciseId: createdProgram!.days[0]!.exercises[0]!.id,
    workoutExerciseIds: createdProgram!.days[0]!.exercises.map((exercise) => exercise.id),
    setId: createdProgram!.days[0]!.exercises[0]!.sets[0]!.id,
    setIds: createdProgram!.days[0]!.exercises.flatMap((exercise) =>
      exercise.sets.map((set) => set.id),
    ),
  };
}
