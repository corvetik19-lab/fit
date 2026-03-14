import { expect, test } from "@playwright/test";

import { hasAdminE2ECredentials, signInAsAdmin } from "./helpers/auth";

test.describe("admin app", () => {
  test.skip(
    !hasAdminE2ECredentials(),
    "requires PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD",
  );

  test("root admin can open core operator surfaces", async ({ page }) => {
    await signInAsAdmin(page);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('a[href="/admin/users"]').first()).toBeVisible();

    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users$/);

    const userCardLink = page.locator('a[href^="/admin/users/"]').first();
    await expect(userCardLink).toBeVisible();
    await userCardLink.click();

    await expect(page).toHaveURL(/\/admin\/users\/.+$/);
    await expect(page.locator('button[aria-pressed]').first()).toBeVisible();
    await expect(page.locator('a[href="/admin/users"]').first()).toBeVisible();
  });
});
