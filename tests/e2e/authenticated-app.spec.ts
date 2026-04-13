import { expect, test } from "@playwright/test";

import {
  hasAuthE2ECredentials,
} from "./helpers/auth";
import { USER_STORAGE_STATE_PATH } from "./helpers/auth-state";
import { navigateStable } from "./helpers/navigation";

test.use({
  storageState: USER_STORAGE_STATE_PATH,
});

test.describe("authenticated app", () => {
  test.skip(
    !hasAuthE2ECredentials(),
    "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
  );

  test("user can open main product sections after sign-in", async ({ page }) => {
    await navigateStable(page, "/dashboard", /\/dashboard$/);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: "AI" }).first()).toBeVisible();

    await navigateStable(page, "/workouts", /\/workouts$/);
    await expect(page.locator('button[aria-pressed]').first()).toBeVisible();

    await navigateStable(page, "/nutrition", /\/nutrition$/);
    await expect(page.locator('button[aria-pressed]').first()).toBeVisible();

    await navigateStable(page, "/ai", /\/ai$/);
    await expect(page.locator("textarea").first()).toBeVisible();

    await navigateStable(page, "/settings", /\/settings$/);
    await expect(page.locator("#billing-center").first()).toBeVisible();
  });

  test("session is restored inside the same browser context", async ({ page }) => {
    await navigateStable(page, "/dashboard", /\/(dashboard|onboarding)$/);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: "AI" }).first()).toBeVisible();
  });
});
