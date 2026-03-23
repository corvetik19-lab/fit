import { expect, test } from "@playwright/test";

import { hasAdminE2ECredentials } from "../e2e/helpers/auth";
import { ADMIN_STORAGE_STATE_PATH } from "../e2e/helpers/auth-state";
import { fetchJson } from "../e2e/helpers/http";

function hasSentryRuntimeEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim());
}

test.use({
  storageState: ADMIN_STORAGE_STATE_PATH,
});

test.describe("sentry runtime gate", () => {
  test.skip(
    !hasAdminE2ECredentials(),
    "requires PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD",
  );

  test.skip(
    !hasSentryRuntimeEnv(),
    "requires NEXT_PUBLIC_SENTRY_DSN",
  );

  test("root admin can send a Sentry smoke event", async ({ page }) => {
    const result = await fetchJson<{
      data?: {
        createdAt?: string | null;
        eventId?: string | null;
      };
    }>(page, {
      method: "POST",
      url: "/api/admin/observability/sentry-test",
    });

    expect(result.status).toBe(200);
    expect(result.body?.data?.eventId).toBeTruthy();
    expect(result.body?.data?.createdAt).toBeTruthy();
  });
});
