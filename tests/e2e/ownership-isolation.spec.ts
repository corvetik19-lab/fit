import { expect, test } from "@playwright/test";

import {
  hasAdminE2ECredentials,
  hasAuthE2ECredentials,
  signInAndFinishOnboarding,
  signInAsAdmin,
} from "./helpers/auth";
import { fetchJson } from "./helpers/http";
import { createLockedWorkoutDay } from "./helpers/workouts";

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

    const [pullResult, patchDayResult, resetDayResult, patchSetResult] =
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
      ]);

    expect(pullResult.status).toBe(404);
    expect(pullResult.body?.code).toBe("WORKOUT_DAY_NOT_FOUND");

    expect(patchDayResult.status).toBe(404);
    expect(patchDayResult.body?.code).toBe("WORKOUT_DAY_NOT_FOUND");

    expect(resetDayResult.status).toBe(404);
    expect(resetDayResult.body?.code).toBe("WORKOUT_DAY_NOT_FOUND");

    expect(patchSetResult.status).toBe(404);
    expect(patchSetResult.body?.code).toBe("WORKOUT_SET_NOT_FOUND");

    await adminContext.close();
    await userContext.close();
  });
});
