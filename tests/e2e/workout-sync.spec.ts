import { expect, test } from "@playwright/test";

import { hasAuthE2ECredentials } from "./helpers/auth";
import { USER_STORAGE_STATE_PATH } from "./helpers/auth-state";
import { fetchJson } from "./helpers/http";
import { createLockedWorkoutDay } from "./helpers/workouts";

type SeededWorkoutDay = Awaited<ReturnType<typeof createLockedWorkoutDay>>;

type WorkoutDaySyncSnapshot = {
  body_weight_kg: number | null;
  exercises: Array<{
    sets: Array<{
      actual_reps: number | null;
      actual_rpe: number | null;
      actual_weight_kg: number | null;
    }>;
  }>;
  session_duration_seconds: number | null;
  status: string;
};

test.use({
  storageState: USER_STORAGE_STATE_PATH,
});

function createMutationId() {
  return crypto.randomUUID();
}

function createCreatedAt() {
  return new Date().toISOString();
}

function buildValidWorkoutExecutionMutations(seededDay: SeededWorkoutDay) {
  return [
    {
      id: createMutationId(),
      entity: "workout_day_execution" as const,
      op: "update" as const,
      payload: {
        dayId: seededDay.dayId,
        status: "in_progress" as const,
        bodyWeightKg: null,
        sessionNote: null,
        sessionDurationSeconds: null,
      },
      createdAt: createCreatedAt(),
    },
    {
      id: createMutationId(),
      entity: "workout_set_actual_reps" as const,
      op: "update" as const,
      payload: {
        dayId: seededDay.dayId,
        setId: seededDay.setId,
        actualReps: 8,
        actualWeightKg: 60,
        actualRpe: 8,
      },
      createdAt: createCreatedAt(),
    },
    {
      id: createMutationId(),
      entity: "workout_day_execution" as const,
      op: "update" as const,
      payload: {
        dayId: seededDay.dayId,
        status: "done" as const,
        bodyWeightKg: 80,
        sessionNote: null,
        sessionDurationSeconds: 1800,
      },
      createdAt: createCreatedAt(),
    },
  ];
}

async function pullWorkoutDaySnapshot(
  page: Parameters<typeof fetchJson>[0],
  dayId: string,
  cursor?: string | null,
) {
  const searchParams = new URLSearchParams({
    scope: "workout_day",
    dayId,
  });

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  return fetchJson<{
    data?: {
      cursor?: string | null;
      nextCursor?: string | null;
      snapshot?: WorkoutDaySyncSnapshot;
    };
  }>(page, {
    method: "GET",
    url: `/api/sync/pull?${searchParams.toString()}`,
  });
}

function expectCompletedSnapshot(snapshot: WorkoutDaySyncSnapshot | undefined) {
  expect(snapshot?.status).toBe("done");
  expect(snapshot?.body_weight_kg).toBe(80);
  expect(snapshot?.session_duration_seconds).toBe(1800);
  expect(snapshot?.exercises[0]?.sets[0]?.actual_reps).toBe(8);
  expect(snapshot?.exercises[0]?.sets[0]?.actual_weight_kg).toBe(60);
  expect(snapshot?.exercises[0]?.sets[0]?.actual_rpe).toBe(8);
}

function expectResetSnapshot(snapshot: WorkoutDaySyncSnapshot | undefined) {
  expect(snapshot?.status).toBe("planned");
  expect(snapshot?.body_weight_kg).toBeNull();
  expect(snapshot?.session_duration_seconds).toBe(0);
  expect(snapshot?.exercises[0]?.sets[0]?.actual_reps).toBeNull();
  expect(snapshot?.exercises[0]?.sets[0]?.actual_weight_kg).toBeNull();
  expect(snapshot?.exercises[0]?.sets[0]?.actual_rpe).toBeNull();
}

test.describe("workout sync contracts", () => {
  test.describe.configure({ timeout: 60_000 });

  test.skip(
    !hasAuthE2ECredentials(),
    "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
  );

  test("sync push rejects invalid workout mutations and applies the valid sequence", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.waitForLoadState("networkidle");

    const seededDay = await createLockedWorkoutDay(page, "sync");
    const duplicateMutationId = createMutationId();

    const pushResult = await fetchJson<{
      data?: {
        accepted: number;
        applied: number;
        rejected: number;
        processed: Array<{
          code?: string;
          id: string;
          status: "applied" | "rejected";
        }>;
      };
    }>(page, {
      method: "POST",
      url: "/api/sync/push",
      body: {
        mutations: [
          {
            id: duplicateMutationId,
            entity: "workout_day_execution",
            op: "update",
            payload: {
              dayId: seededDay.dayId,
              status: "in_progress",
              bodyWeightKg: null,
              sessionNote: null,
              sessionDurationSeconds: null,
            },
            createdAt: createCreatedAt(),
          },
          {
            id: duplicateMutationId,
            entity: "workout_day_execution",
            op: "update",
            payload: {
              dayId: seededDay.dayId,
              status: "planned",
              bodyWeightKg: null,
              sessionNote: null,
              sessionDurationSeconds: null,
            },
            createdAt: createCreatedAt(),
          },
          {
            id: createMutationId(),
            entity: "workout_day_execution",
            op: "update",
            payload: {
              dayId: seededDay.dayId,
              status: "done",
              bodyWeightKg: null,
              sessionNote: null,
              sessionDurationSeconds: null,
            },
            createdAt: createCreatedAt(),
          },
          {
            id: createMutationId(),
            entity: "workout_set_actual_reps",
            op: "update",
            payload: {
              dayId: seededDay.dayId,
              setId: seededDay.setId,
              actualReps: 8,
              actualWeightKg: null,
              actualRpe: null,
            },
            createdAt: createCreatedAt(),
          },
          ...buildValidWorkoutExecutionMutations(seededDay).slice(1),
        ],
      },
    });

    expect(pushResult.status).toBe(200);
    expect(pushResult.body?.data?.accepted).toBe(6);
    expect(pushResult.body?.data?.applied).toBe(3);
    expect(pushResult.body?.data?.rejected).toBe(3);

    const processedEntries = pushResult.body?.data?.processed ?? [];
    const rejectedCodes = processedEntries
      .filter((entry) => entry.status === "rejected")
      .map((entry) => entry.code);

    expect(rejectedCodes).toEqual(
      expect.arrayContaining([
        "SYNC_MUTATION_DUPLICATE",
        "WORKOUT_DAY_INCOMPLETE",
        "WORKOUT_SET_INCOMPLETE",
      ]),
    );

    const pullResult = await pullWorkoutDaySnapshot(page, seededDay.dayId);

    expect(pullResult.status).toBe(200);
    expectCompletedSnapshot(pullResult.body?.data?.snapshot);
  });

  test("reset clears synced execution and pull stays clean afterwards", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.waitForLoadState("networkidle");

    const seededDay = await createLockedWorkoutDay(page, "sync-reset");

    const pushResult = await fetchJson<{
      data?: {
        accepted: number;
        applied: number;
        rejected: number;
      };
    }>(page, {
      method: "POST",
      url: "/api/sync/push",
      body: {
        mutations: buildValidWorkoutExecutionMutations(seededDay),
      },
    });

    expect(pushResult.status).toBe(200);
    expect(pushResult.body?.data?.accepted).toBe(3);
    expect(pushResult.body?.data?.applied).toBe(3);
    expect(pushResult.body?.data?.rejected).toBe(0);

    const completedPull = await pullWorkoutDaySnapshot(page, seededDay.dayId);

    expect(completedPull.status).toBe(200);
    expectCompletedSnapshot(completedPull.body?.data?.snapshot);

    const completedCursor = completedPull.body?.data?.nextCursor ?? null;
    expect(completedCursor).toBeTruthy();

    const resetResult = await fetchJson<{
      data?: WorkoutDaySyncSnapshot;
    }>(page, {
      method: "POST",
      url: `/api/workout-days/${seededDay.dayId}/reset`,
    });

    expect(resetResult.status).toBe(200);
    expectResetSnapshot(resetResult.body?.data);

    const resetPull = await pullWorkoutDaySnapshot(
      page,
      seededDay.dayId,
      completedCursor,
    );

    expect(resetPull.status).toBe(200);
    expectResetSnapshot(resetPull.body?.data?.snapshot);

    const secondResetPull = await pullWorkoutDaySnapshot(
      page,
      seededDay.dayId,
      resetPull.body?.data?.nextCursor ?? null,
    );

    expect(secondResetPull.status).toBe(200);
    expectResetSnapshot(secondResetPull.body?.data?.snapshot);
  });
});
