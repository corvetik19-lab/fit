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
          ["/dashboard", /\/dashboard$/, "main"],
          ["/workouts", /\/workouts$/, "main"],
          ["/nutrition", /\/nutrition$/, "main"],
          ["/ai", /\/ai$/, '[data-testid="ai-chat-panel"][data-hydrated="true"]'],
          ["/settings", /\/settings$/, "main"],
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

    test("desktop shell keeps full top navigation readable", async ({ page }) => {
      const regressionCapture = startClientRegressionCapture(page);

      try {
        await navigateStable(page, "/dashboard", /\/dashboard$/);

        await page.evaluate(() => {
          window.localStorage.removeItem("fit-app-shell-collapsed");
          window.dispatchEvent(
            new StorageEvent("storage", { key: "fit-app-shell-collapsed" }),
          );
        });
        await page.reload();
        await page.waitForLoadState("networkidle");

        await expect(
          page.getByRole("link", { name: "Тренировки" }),
        ).toBeVisible();
        await expect(
          page.getByRole("link", { name: "Питание" }),
        ).toBeVisible();
        await expect(
          page.getByRole("link", { name: "Настройки" }),
        ).toBeVisible();

        const collapseButton = page.getByRole("button", { name: "Свернуть" });
        await expect(collapseButton).toBeVisible();
        await collapseButton.click();
        await expect(
          page.getByRole("button", { name: "Развернуть верхнюю панель" }),
        ).toBeVisible();

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
        await expect(
          page.getByRole("button", { name: "Обычный вид" }),
        ).toBeVisible();

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

        await expect(page.getByRole("link", { name: "Админ" })).toBeVisible();
        await expect(
          page.getByRole("link", { name: "Пользователи" }),
        ).toBeVisible();

        await navigateStable(page, "/admin/users", /\/admin\/users$/);
        const userCardLink = page.locator('a[href^="/admin/users/"]').first();
        await expect(userCardLink).toBeVisible();
        await page.waitForTimeout(1000);

        const detailHref = await userCardLink.getAttribute("href");
        expect(detailHref).toBeTruthy();

        await navigateStable(page, detailHref!, /\/admin\/users\/.+$/);
        await expect
          .poll(
            async () => {
              const detailHeadingVisible = await page
                .locator('[data-testid="admin-user-detail-section-heading"]')
                .isVisible()
                .catch(() => false);
              if (detailHeadingVisible) {
                return "detail";
              }

              const degradedBannerVisible = await page
                .locator('[data-testid="admin-user-detail-degraded-banner"]')
                .isVisible()
                .catch(() => false);

              return degradedBannerVisible ? "degraded" : "pending";
            },
            { timeout: 15_000 },
          )
          .not.toBe("pending");
        await page.waitForTimeout(1000);

        regressionCapture.assertNone();
      } finally {
        regressionCapture.stop();
      }
    });
  });
});
