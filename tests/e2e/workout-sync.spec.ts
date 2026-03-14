import { expect, test } from "@playwright/test";

import { hasAuthE2ECredentials } from "./helpers/auth";
import { USER_STORAGE_STATE_PATH } from "./helpers/auth-state";
import { fetchJson } from "./helpers/http";
import { createLockedWorkoutDay } from "./helpers/workouts";

test.use({
  storageState: USER_STORAGE_STATE_PATH,
});

function createMutationId() {
  return crypto.randomUUID();
}

function createCreatedAt() {
  return new Date().toISOString();
}

test.describe("workout sync contracts", () => {
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
          {
            id: createMutationId(),
            entity: "workout_set_actual_reps",
            op: "update",
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
            entity: "workout_day_execution",
            op: "update",
            payload: {
              dayId: seededDay.dayId,
              status: "done",
              bodyWeightKg: 80,
              sessionNote: null,
              sessionDurationSeconds: 1800,
            },
            createdAt: createCreatedAt(),
          },
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

    const pullResult = await fetchJson<{
      data?: {
        snapshot?: {
          body_weight_kg: number | null;
          session_duration_seconds: number | null;
          status: string;
          exercises: Array<{
            sets: Array<{
              actual_reps: number | null;
              actual_weight_kg: number | null;
              actual_rpe: number | null;
            }>;
          }>;
        };
      };
    }>(page, {
      method: "GET",
      url: `/api/sync/pull?scope=workout_day&dayId=${seededDay.dayId}`,
    });

    expect(pullResult.status).toBe(200);
    expect(pullResult.body?.data?.snapshot?.status).toBe("done");
    expect(pullResult.body?.data?.snapshot?.body_weight_kg).toBe(80);
    expect(pullResult.body?.data?.snapshot?.session_duration_seconds).toBe(1800);
    expect(
      pullResult.body?.data?.snapshot?.exercises[0]?.sets[0]?.actual_reps,
    ).toBe(8);
    expect(
      pullResult.body?.data?.snapshot?.exercises[0]?.sets[0]?.actual_weight_kg,
    ).toBe(60);
    expect(
      pullResult.body?.data?.snapshot?.exercises[0]?.sets[0]?.actual_rpe,
    ).toBe(8);
  });
});
