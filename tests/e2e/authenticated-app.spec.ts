import { expect, test } from "@playwright/test";

import {
  hasAuthE2ECredentials,
  signInAndFinishOnboarding,
} from "./helpers/auth";

test.describe("authenticated app", () => {
  test.skip(
    !hasAuthE2ECredentials(),
    "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
  );

  test("user can open main product sections after sign-in", async ({ page }) => {
    await signInAndFinishOnboarding(page);

    await expect(
      page.getByRole("heading", {
        name: "Открывай только тот слой аналитики, который нужен сейчас",
      }),
    ).toBeVisible();

    await page.goto("/workouts");
    await expect(
      page.getByRole("button", { name: /План недели/ }),
    ).toBeVisible();

    await page.goto("/nutrition");
    await expect(
      page.getByRole("button", { name: /Баланс дня/ }),
    ).toBeVisible();

    await page.goto("/ai");
    await expect(
      page.getByRole("button", { name: /История/ }).first(),
    ).toBeVisible();

    await page.goto("/settings");
    await expect(
      page.getByRole("button", { name: /Профиль/ }),
    ).toBeVisible();
  });

  test("session is restored inside the same browser context", async ({ page }) => {
    await signInAndFinishOnboarding(page);

    await page.goto("/");
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 });

    if (page.url().includes("/onboarding")) {
      await page.waitForURL(/\/dashboard$/, { timeout: 20_000 });
    }

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "Открывай только тот слой аналитики, который нужен сейчас" }),
    ).toBeVisible();
  });
});
