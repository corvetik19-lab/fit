import { expect, test } from "@playwright/test";

import { hasAdminE2ECredentials } from "./helpers/auth";
import { ADMIN_STORAGE_STATE_PATH } from "./helpers/auth-state";
import { fetchJson } from "./helpers/http";
import { navigateStable } from "./helpers/navigation";
import { findAuthUserIdByEmail } from "./helpers/supabase-admin";

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
      page.locator('[data-testid="admin-user-detail-section-heading"]'),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('button[aria-pressed]').first()).toBeVisible();
    await expect(page.locator('a[href="/admin/users"]').first()).toBeVisible();
  });

  test("root admin gets degraded fallback for admin dashboard page", async ({
    page,
  }) => {
    await navigateStable(
      page,
      "/admin?__test_admin_dashboard_fallback=1",
      /\/admin\?__test_admin_dashboard_fallback=1$/,
    );
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="admin-page-degraded-banner"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="admin-page-open-users-link"]'),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.locator('[data-testid="admin-page-back-to-dashboard-link"]'),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("root admin gets degraded fallback for admin user detail snapshot", async ({
    page,
  }) => {
    const targetUserEmail = process.env.PLAYWRIGHT_TEST_EMAIL;
    expect(targetUserEmail).toBeTruthy();
    const targetUserId = await findAuthUserIdByEmail(targetUserEmail!);

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

  test("root admin sees billing health and user billing controls", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    await navigateStable(page, "/admin", /\/admin$/);
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByTestId("admin-health-billing-overview-card"),
    ).toBeVisible();
    await expect(
      page.getByTestId("admin-health-billing-review-card"),
    ).toBeVisible();
    await expect(
      page.getByTestId("admin-health-billing-subscriptions-card"),
    ).toBeVisible();
    await expect(
      page.getByTestId("admin-health-billing-reconcile-button"),
    ).toBeVisible();

    await navigateStable(page, "/admin/users", /\/admin\/users$/);
    await page.waitForLoadState("networkidle");
    const firstUserLink = page.locator('a[href^="/admin/users/"]').first();
    await expect(firstUserLink).toBeVisible();
    const userHref = await firstUserLink.getAttribute("href");
    expect(userHref).toBeTruthy();

    await navigateStable(page, userHref!, /\/admin\/users\/.+$/);
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByTestId("admin-user-actions-billing-panel"),
    ).toBeVisible();
    await expect(
      page.getByTestId("admin-user-actions-billing-reconcile"),
    ).toBeVisible();
    await page.getByTestId("admin-user-detail-section-billing").click();
    await expect(
      page.getByTestId("admin-user-detail-billing-section"),
    ).toBeVisible();
    await expect(page.getByText("Текущая подписка").first()).toBeVisible();
    await expect(page.getByText("Платёжный профиль").first()).toBeVisible();
    await expect(page.getByText("История подписки").first()).toBeVisible();
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

  test("root admin gets explicit validation errors for invalid admin user ids", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
    await page.waitForLoadState("networkidle");

    const [
      detailResult,
      billingResult,
      deletionQueueResult,
      deletionCancelResult,
      exportResult,
      restoreResult,
      roleResult,
      supportActionResult,
      suspendResult,
      billingReconcileResult,
      bulkResult,
    ] = await Promise.all([
      fetchJson(page, {
        method: "GET",
        url: "/api/admin/users/not-a-uuid",
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/admin/users/not-a-uuid/billing",
        body: {
          action: "grant_trial",
        },
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/admin/users/not-a-uuid/deletion",
      }),
      fetchJson(page, {
        method: "DELETE",
        url: "/api/admin/users/not-a-uuid/deletion",
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/admin/users/not-a-uuid/export",
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/admin/users/not-a-uuid/restore",
      }),
      fetchJson(page, {
        method: "PATCH",
        url: "/api/admin/users/not-a-uuid/role",
        body: {
          role: "analyst",
        },
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/admin/users/not-a-uuid/support-action",
        body: {
          action: "resync_user_context",
        },
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/admin/users/not-a-uuid/suspend",
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/admin/users/not-a-uuid/billing/reconcile",
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/admin/users/bulk",
        body: {
          action: "queue_resync",
          user_ids: ["not-a-uuid"],
        },
      }),
    ]);

    expect(detailResult.status).toBe(400);
    expect((detailResult.body as { code?: string } | null)?.code).toBe(
      "ADMIN_USER_DETAIL_INVALID",
    );

    expect(billingResult.status).toBe(400);
    expect((billingResult.body as { code?: string } | null)?.code).toBe(
      "ADMIN_BILLING_TARGET_INVALID",
    );

    expect(deletionQueueResult.status).toBe(400);
    expect((deletionQueueResult.body as { code?: string } | null)?.code).toBe(
      "ADMIN_DELETION_TARGET_INVALID",
    );

    expect(deletionCancelResult.status).toBe(400);
    expect((deletionCancelResult.body as { code?: string } | null)?.code).toBe(
      "ADMIN_DELETION_TARGET_INVALID",
    );

    expect(exportResult.status).toBe(400);
    expect((exportResult.body as { code?: string } | null)?.code).toBe(
      "ADMIN_EXPORT_TARGET_INVALID",
    );

    expect(restoreResult.status).toBe(400);
    expect((restoreResult.body as { code?: string } | null)?.code).toBe(
      "ADMIN_RESTORE_TARGET_INVALID",
    );

    expect(roleResult.status).toBe(400);
    expect((roleResult.body as { code?: string } | null)?.code).toBe(
      "ADMIN_ROLE_TARGET_INVALID",
    );

    expect(supportActionResult.status).toBe(400);
    expect((supportActionResult.body as { code?: string } | null)?.code).toBe(
      "ADMIN_SUPPORT_ACTION_TARGET_INVALID",
    );

    expect(suspendResult.status).toBe(400);
    expect((suspendResult.body as { code?: string } | null)?.code).toBe(
      "ADMIN_SUSPEND_TARGET_INVALID",
    );

    expect(billingReconcileResult.status).toBe(400);
    expect((billingReconcileResult.body as { code?: string } | null)?.code).toBe(
      "ADMIN_BILLING_RECONCILE_TARGET_INVALID",
    );

    expect(bulkResult.status).toBe(400);
    expect((bulkResult.body as { code?: string } | null)?.code).toBe(
      "ADMIN_BULK_INVALID",
    );
  });
});
