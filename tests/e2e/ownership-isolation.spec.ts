import { expect, test } from "@playwright/test";

import {
  hasAdminE2ECredentials,
  hasAuthE2ECredentials,
  signInAndFinishOnboarding,
  signInAsAdmin,
} from "./helpers/auth";
import { fetchJson } from "./helpers/http";
import { createLockedWorkoutDay } from "./helpers/workouts";

function buildFutureCloneDate() {
  return new Date(Date.now() + 900 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

test.describe("user-owned isolation", () => {
  test.skip(
    !hasAuthE2ECredentials() || !hasAdminE2ECredentials(),
    "requires regular and admin Playwright credentials",
  );

  test("root admin cannot read or mutate another user's workout day", async ({
    browser,
  }) => {
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    await signInAndFinishOnboarding(userPage);

    const seededDay = await createLockedWorkoutDay(userPage, "isolation");

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await signInAsAdmin(adminPage);

    const [
      pullResult,
      patchDayResult,
      resetDayResult,
      patchSetResult,
      weeklyProgramsResult,
      weeklyProgramLockResult,
      weeklyProgramCloneResult,
    ] =
      await Promise.all([
        fetchJson<{ code?: string }>(adminPage, {
          method: "GET",
          url: `/api/sync/pull?scope=workout_day&dayId=${seededDay.dayId}`,
        }),
        fetchJson<{ code?: string }>(adminPage, {
          method: "PATCH",
          url: `/api/workout-days/${seededDay.dayId}`,
          body: {
            status: "planned",
          },
        }),
        fetchJson<{ code?: string }>(adminPage, {
          method: "POST",
          url: `/api/workout-days/${seededDay.dayId}/reset`,
        }),
        fetchJson<{ code?: string }>(adminPage, {
          method: "PATCH",
          url: `/api/workout-sets/${seededDay.setId}`,
          body: {
            actualReps: 8,
            actualWeightKg: 60,
            actualRpe: 8,
          },
        }),
        fetchJson<{ data?: Array<{ id: string }> }>(adminPage, {
          method: "GET",
          url: "/api/weekly-programs",
        }),
        fetchJson<{ code?: string }>(adminPage, {
          method: "POST",
          url: `/api/weekly-programs/${seededDay.programId}/lock`,
        }),
        fetchJson<{ code?: string }>(adminPage, {
          method: "POST",
          url: `/api/weekly-programs/${seededDay.programId}/clone`,
          body: {
            weekStartDate: buildFutureCloneDate(),
          },
        }),
      ]);

    expect(pullResult.status).toBe(404);
    expect(pullResult.body?.code).toBe("WORKOUT_DAY_NOT_FOUND");

    expect(patchDayResult.status).toBe(404);
    expect(patchDayResult.body?.code).toBe("WORKOUT_DAY_NOT_FOUND");

    expect(resetDayResult.status).toBe(404);
    expect(resetDayResult.body?.code).toBe("WORKOUT_DAY_NOT_FOUND");

    expect(patchSetResult.status).toBe(404);
    expect(patchSetResult.body?.code).toBe("WORKOUT_SET_NOT_FOUND");

    expect(weeklyProgramsResult.status).toBe(200);
    expect(
      (weeklyProgramsResult.body?.data ?? []).some(
        (program) => program.id === seededDay.programId,
      ),
    ).toBe(false);

    expect(weeklyProgramLockResult.status).toBe(404);
    expect(weeklyProgramLockResult.body?.code).toBe("WEEKLY_PROGRAM_NOT_FOUND");

    expect(weeklyProgramCloneResult.status).toBe(404);
    expect(weeklyProgramCloneResult.body?.code).toBe("WEEKLY_PROGRAM_NOT_FOUND");

    await adminContext.close();
    await userContext.close();
  });
});
