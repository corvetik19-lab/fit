import { expect, test } from "@playwright/test";

import {
  hasAdminE2ECredentials,
  hasAuthE2ECredentials,
} from "./helpers/auth";
import {
  ADMIN_STORAGE_STATE_PATH,
  USER_STORAGE_STATE_PATH,
} from "./helpers/auth-state";
import { startClientRegressionCapture } from "./helpers/client-regressions";
import { navigateStable } from "./helpers/navigation";
import { createLockedWorkoutDay } from "./helpers/workouts";

test.describe("ui regressions", () => {
  test.describe.configure({ timeout: 60_000 });

  test.describe("user surfaces", () => {
    test.use({
      storageState: USER_STORAGE_STATE_PATH,
    });

    test.skip(
      !hasAuthE2ECredentials(),
      "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
    );

    test("main user surfaces avoid hydration and render-loop regressions", async ({
      page,
    }) => {
      const regressionCapture = startClientRegressionCapture(page);

      try {
        const routes: Array<[string, RegExp, string]> = [
          ["/dashboard", /\/dashboard$/, 'a[href="/ai"]'],
          ["/workouts", /\/workouts$/, 'button[aria-pressed]'],
          ["/nutrition", /\/nutrition$/, 'button[aria-pressed]'],
          ["/ai", /\/ai$/, "textarea"],
          ["/settings", /\/settings$/, 'button[aria-pressed]'],
        ];

        for (const [targetPath, targetUrl, stableSelector] of routes) {
          await navigateStable(page, targetPath, targetUrl);
          await expect(page.locator(stableSelector).first()).toBeVisible();
          await page.waitForTimeout(1000);
        }

        regressionCapture.assertNone();
      } finally {
        regressionCapture.stop();
      }
    });

    test("workout focus mode does not fall into excessive sync polling", async ({
      page,
    }) => {
      const seededDay = await createLockedWorkoutDay(page, "ui-regression");
      const regressionCapture = startClientRegressionCapture(page);
      let syncPullCount = 0;

      const handleRequestFinished = (request: { url: () => string }) => {
        const url = request.url();

        if (
          url.includes("/api/sync/pull?scope=workout_day") &&
          url.includes(`dayId=${seededDay.dayId}`)
        ) {
          syncPullCount += 1;
        }
      };

      page.on("requestfinished", handleRequestFinished);

      try {
        await navigateStable(
          page,
          `/workouts/day/${seededDay.dayId}?focus=1`,
          new RegExp(`/workouts/day/${seededDay.dayId}\\?focus=1$`),
        );
        await expect(page.getByRole("button", { name: "Обычный вид" })).toBeVisible();

        await page.waitForTimeout(8000);

        regressionCapture.assertNone();
        expect(syncPullCount).toBeLessThanOrEqual(2);
      } finally {
        page.off("requestfinished", handleRequestFinished);
        regressionCapture.stop();
      }
    });
  });

  test.describe("admin surfaces", () => {
    test.use({
      storageState: ADMIN_STORAGE_STATE_PATH,
    });

    test.skip(
      !hasAdminE2ECredentials(),
      "requires PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD",
    );

    test("admin pages avoid hydration and render-loop regressions", async ({
      page,
    }) => {
      const regressionCapture = startClientRegressionCapture(page);

      try {
        await navigateStable(page, "/admin", /\/admin$/);
        await expect(page.locator("main")).toBeVisible();
        await page.waitForTimeout(1000);

        await navigateStable(page, "/admin/users", /\/admin\/users$/);
        const userCardLink = page.locator('a[href^="/admin/users/"]').first();
        await expect(userCardLink).toBeVisible();
        await page.waitForTimeout(1000);

        const detailHref = await userCardLink.getAttribute("href");
        expect(detailHref).toBeTruthy();

        await navigateStable(page, detailHref!, /\/admin\/users\/.+$/);
        await expect(page.locator('button[aria-pressed]').first()).toBeVisible();
        await page.waitForTimeout(1000);

        regressionCapture.assertNone();
      } finally {
        regressionCapture.stop();
      }
    });
  });
});
