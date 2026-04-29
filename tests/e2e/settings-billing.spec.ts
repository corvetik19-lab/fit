import { expect, test } from "@playwright/test";

import { hasAuthE2ECredentials } from "./helpers/auth";
import { USER_STORAGE_STATE_PATH } from "./helpers/auth-state";
import { navigateStable } from "./helpers/navigation";

test.use({
  storageState: USER_STORAGE_STATE_PATH,
});

test.describe("settings billing center", () => {
  test.skip(
    !hasAuthE2ECredentials(),
    "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
  );

  test("user sees billing center sections without raw transport copy", async ({
    page,
  }) => {
    await navigateStable(
      page,
      "/settings?section=billing",
      /\/settings\?section=billing$/,
    );

    await expect(
      page.getByRole("heading", {
        name: "Подписка, AI-функции и история доступа",
      }),
    ).toBeVisible();
    await expect(page.getByText("Текущий план").first()).toBeVisible();
    await expect(page.getByText("Запросить доступ").first()).toBeVisible();
    await expect(page.getByText("История доступа").first()).toBeVisible();
    await expect(page.getByText("Доступ и оплата").first()).toBeVisible();
  });

  test("queued billing review is shown with russian status copy", async ({
    page,
  }) => {
    await navigateStable(
      page,
      "/settings?section=billing&e2eBillingReview=1",
      /\/settings\?section=billing&e2eBillingReview=1$/,
    );

    await expect(page.getByText("в очереди").first()).toBeVisible();
    await expect(page.getByText("Последний запрос:").first()).toBeVisible();
    await expect(page.getByText("AI-план питания").first()).toBeVisible();
  });
});
