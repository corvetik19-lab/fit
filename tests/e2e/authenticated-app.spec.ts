import { test } from "@playwright/test";

import {
  finishOnboardingIfVisible,
  hasAuthE2ECredentials,
} from "./helpers/auth";
import { USER_STORAGE_STATE_PATH } from "./helpers/auth-state";
import { navigateStable } from "./helpers/navigation";

test.use({
  storageState: USER_STORAGE_STATE_PATH,
});

test.describe("authenticated app", () => {
  test.describe.configure({ timeout: 120_000 });

  test.skip(
    !hasAuthE2ECredentials(),
    "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
  );

  test("user can open main product sections after sign-in", async ({ page }) => {
    await navigateStable(page, "/dashboard", /\/(dashboard|onboarding)$/);
    await finishOnboardingIfVisible(page);
    await page
      .getByText("Статус дня", { exact: true })
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });

    await navigateStable(page, "/workouts", /\/workouts$/);
    await page
      .getByText("Программы, недели и библиотека упражнений", {
        exact: true,
      })
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });

    await navigateStable(page, "/nutrition", /\/nutrition$/);
    await page
      .getByText("Дневник питания и ежедневный баланс", { exact: true })
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });

    await navigateStable(page, "/ai", /\/ai$/);
    await page.locator("textarea").first().waitFor({ state: "visible", timeout: 15_000 });

    await navigateStable(page, "/settings", /\/settings$/);
    await page
      .locator("#billing-center")
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
  });

  test("session is restored inside the same browser context", async ({ page }) => {
    await navigateStable(page, "/dashboard", /\/(dashboard|onboarding)$/);
    await finishOnboardingIfVisible(page);
    await page
      .getByText("Статус дня", { exact: true })
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
    await page
      .getByRole("link", { name: /^AI$/ })
      .waitFor({ state: "visible", timeout: 15_000 });
  });
});
