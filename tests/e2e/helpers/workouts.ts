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

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildFutureWeekStartDate(seed: string) {
  const hash = seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  const offsetDays = 30 + (hash % 720);
  const nextDate = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);

  return toDateOnly(nextDate);
}

export async function createLockedWorkoutDay(page: Page, titleSeed: string) {
  const suffix = crypto.randomUUID().slice(0, 8);
  const exerciseTitle = `E2E ${titleSeed} ${suffix}`;
  const weekStartDate = buildFutureWeekStartDate(suffix);

  const exerciseResult = await fetchJson<{ data: ExerciseRow }>(page, {
    method: "POST",
    url: "/api/exercises",
    body: {
      title: exerciseTitle,
      muscleGroup: "Legs",
      description: "Playwright seeded exercise",
      note: "",
    },
  });

  expect(exerciseResult.status).toBe(200);

  const exerciseId = exerciseResult.body?.data?.id;
  expect(exerciseId).toBeTruthy();

  const programResult = await fetchJson<{ data: { id: string } }>(page, {
    method: "POST",
    url: "/api/weekly-programs",
    body: {
      title: `E2E Program ${titleSeed} ${suffix}`,
      weekStartDate,
      days: [
        {
          dayOfWeek: 1,
          exercises: [
            {
              exerciseLibraryId: exerciseId,
              setsCount: 1,
              repRangeKey: "6-10",
            },
          ],
        },
      ],
    },
  });

  expect(programResult.status).toBe(200);

  const programId = programResult.body?.data?.id;
  expect(programId).toBeTruthy();

  const lockResult = await fetchJson(page, {
    method: "POST",
    url: `/api/weekly-programs/${programId}/lock`,
  });

  expect(lockResult.status).toBe(200);

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
    exerciseId,
    programId,
    dayId: createdProgram!.days[0]!.id,
    workoutExerciseId: createdProgram!.days[0]!.exercises[0]!.id,
    setId: createdProgram!.days[0]!.exercises[0]!.sets[0]!.id,
  };
}
