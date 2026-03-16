import { expect, test } from "@playwright/test";

import { hasAdminE2ECredentials } from "./helpers/auth";
import { ADMIN_STORAGE_STATE_PATH } from "./helpers/auth-state";
import { fetchJson } from "./helpers/http";
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
    test.setTimeout(60_000);

    await navigateStable(page, "/admin", /\/admin$/);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();

    await navigateStable(page, "/admin/users", /\/admin\/users$/);
    await page.waitForLoadState("networkidle");
    const myCardLink = page.locator('a[href^="/admin/users/"]').first();
    await expect(myCardLink).toBeVisible();
    const myCardHref = await myCardLink.getAttribute("href");
    expect(myCardHref).toBeTruthy();

    await navigateStable(page, myCardHref!, /\/admin\/users\/.+$/);
    await expect(page).toHaveURL(/\/admin\/users\/.+$/);
    await expect(
      page.getByRole("heading", { name: "Открывайте только нужный раздел" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('button[aria-pressed]').first()).toBeVisible();
    await expect(page.locator('a[href="/admin/users"]').first()).toBeVisible();
  });

  test("root admin gets degraded fallback for admin user detail snapshot", async ({
    page,
  }) => {
    const usersResult = await fetchJson<{
      data?: Array<{
        user_id?: string;
      }>;
    }>(page, {
      method: "GET",
      url: "/api/admin/users",
    });

    expect(usersResult.status).toBe(200);
    const targetUserId = usersResult.body?.data?.[0]?.user_id;
    expect(targetUserId).toBeTruthy();

    const detailResult = await fetchJson<{
      data?: {
        authUser?: {
          email?: string | null;
        } | null;
      };
      meta?: {
        degraded?: boolean;
      };
    }>(page, {
      method: "GET",
      url: `/api/admin/users/${targetUserId}?__test_admin_detail_fallback=1`,
    });

    expect(detailResult.status).toBe(200);
    expect(detailResult.body?.meta?.degraded).toBe(true);
    expect(detailResult.body?.data?.authUser?.email).toBeTruthy();
  });

  test("root admin gets explicit validation error for invalid reindex payload", async ({
    page,
  }) => {
    await navigateStable(page, "/admin", /\/admin$/);
    await page.waitForLoadState("networkidle");

    const reindexResult = await fetchJson(page, {
      method: "POST",
      url: "/api/ai/reindex",
      body: {
        mode: "full",
        targetUserId: "not-a-uuid",
      },
    });

    expect(reindexResult.status).toBe(400);
    expect((reindexResult.body as { code?: string } | null)?.code).toBe(
      "REINDEX_INVALID",
    );
  });
});
