import { expect, test } from "@playwright/test";

import {
  hasAuthE2ECredentials,
} from "./helpers/auth";
import { USER_STORAGE_STATE_PATH } from "./helpers/auth-state";

test.use({
  storageState: USER_STORAGE_STATE_PATH,
});

test.describe("authenticated app", () => {
  test.skip(
    !hasAuthE2ECredentials(),
    "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
  );

  test("user can open main product sections after sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('a[href="/ai"]').first()).toBeVisible();

    await page.goto("/workouts");
    await expect(page).toHaveURL(/\/workouts$/);
    await expect(page.locator('button[aria-pressed]').first()).toBeVisible();

    await page.goto("/nutrition");
    await expect(page).toHaveURL(/\/nutrition$/);
    await expect(page.locator('button[aria-pressed]').first()).toBeVisible();

    await page.goto("/ai");
    await expect(page).toHaveURL(/\/ai$/);
    await expect(page.locator("textarea").first()).toBeVisible();

    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.locator('button[aria-pressed]').first()).toBeVisible();
  });

  test("session is restored inside the same browser context", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 });

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('a[href="/ai"]').first()).toBeVisible();
  });
});
