import { expect, test } from "@playwright/test";

import { hasAdminE2ECredentials } from "./helpers/auth";
import { ADMIN_STORAGE_STATE_PATH } from "./helpers/auth-state";
import { navigateStable } from "./helpers/navigation";

test.use({
  storageState: ADMIN_STORAGE_STATE_PATH,
});

test.describe("admin app", () => {
  test.skip(
    !hasAdminE2ECredentials(),
    "requires PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD",
  );

  test("root admin can open core operator surfaces", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
    await page.waitForLoadState("networkidle");
    await expect(page.locator('a[href="/admin/users"]').first()).toBeVisible();

    await navigateStable(page, "/admin/users", /\/admin\/users$/);
    await page.waitForLoadState("networkidle");

    const userCardLink = page.locator('a[href^="/admin/users/"]').first();
    await expect(userCardLink).toBeVisible();
    const userCardHref = await userCardLink.getAttribute("href");
    expect(userCardHref).toBeTruthy();
    await navigateStable(page, userCardHref!, /\/admin\/users\/.+$/);

    await expect(page).toHaveURL(/\/admin\/users\/.+$/);
    await expect(page.locator('button[aria-pressed]').first()).toBeVisible();
    await expect(page.locator('a[href="/admin/users"]').first()).toBeVisible();
  });
});
