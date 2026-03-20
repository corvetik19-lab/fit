import { expect, test } from "@playwright/test";

import {
  hasAdminE2ECredentials,
  hasAuthE2ECredentials,
} from "./helpers/auth";
import {
  ADMIN_STORAGE_STATE_PATH,
  USER_STORAGE_STATE_PATH,
} from "./helpers/auth-state";
import { fetchJson } from "./helpers/http";
import { navigateStable } from "./helpers/navigation";

test.describe("internal jobs contracts", () => {
  test.describe("authenticated non-admin access", () => {
    test.use({
      storageState: USER_STORAGE_STATE_PATH,
    });

    test.skip(
      !hasAuthE2ECredentials(),
      "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
    );

    test("internal admin jobs stay admin-only for regular users", async ({
      page,
    }) => {
      await navigateStable(page, "/dashboard", /\/dashboard$/);
      await page.waitForLoadState("networkidle");

      const [
        dashboardWarm,
        nutritionSummaries,
        knowledgeReindex,
        scheduledAiEvals,
        billingReconcile,
      ] = await Promise.all([
        fetchJson(page, {
          method: "POST",
          url: "/api/internal/jobs/dashboard-warm?limit=1",
        }),
        fetchJson(page, {
          method: "POST",
          url: "/api/internal/jobs/nutrition-summaries?limit=1&days=1",
        }),
        fetchJson(page, {
          method: "POST",
          url: "/api/internal/jobs/knowledge-reindex?limit=1&mode=embeddings",
        }),
        fetchJson(page, {
          method: "POST",
          url: "/api/internal/jobs/ai-evals-schedule?suite=tool_calls",
        }),
        fetchJson(page, {
          method: "POST",
          url: "/api/internal/jobs/billing-reconcile?limit=1",
        }),
      ]);

      for (const result of [
        dashboardWarm,
        nutritionSummaries,
        knowledgeReindex,
        scheduledAiEvals,
        billingReconcile,
      ]) {
        expect(result.status).toBe(403);
        expect((result.body as { code?: string } | null)?.code).toBe(
          "ADMIN_REQUIRED",
        );
      }
    });
  });

  test.describe("root admin validation", () => {
    test.use({
      storageState: ADMIN_STORAGE_STATE_PATH,
    });

    test.skip(
      !hasAdminE2ECredentials(),
      "requires PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD",
    );

    test("internal jobs return explicit 400s for invalid admin params", async ({
      page,
    }) => {
      await navigateStable(page, "/admin", /\/admin$/);
      await page.waitForLoadState("networkidle");

      const [
        dashboardWarm,
        nutritionSummaries,
        knowledgeReindex,
        scheduledAiEvals,
        billingReconcile,
      ] = await Promise.all([
        fetchJson(page, {
          method: "POST",
          url: "/api/internal/jobs/dashboard-warm?userId=not-a-uuid",
        }),
        fetchJson(page, {
          method: "POST",
          url: "/api/internal/jobs/nutrition-summaries?userId=not-a-uuid",
        }),
        fetchJson(page, {
          method: "POST",
          url: "/api/internal/jobs/knowledge-reindex?userId=not-a-uuid",
        }),
        fetchJson(page, {
          method: "POST",
          url: "/api/internal/jobs/ai-evals-schedule?suite=not-a-suite",
        }),
        fetchJson(page, {
          method: "POST",
          url: "/api/internal/jobs/billing-reconcile?userId=not-a-uuid",
        }),
      ]);

      expect(dashboardWarm.status).toBe(400);
      expect((dashboardWarm.body as { code?: string } | null)?.code).toBe(
        "DASHBOARD_WARM_JOB_INVALID",
      );

      expect(nutritionSummaries.status).toBe(400);
      expect((nutritionSummaries.body as { code?: string } | null)?.code).toBe(
        "NUTRITION_SUMMARIES_JOB_INVALID",
      );

      expect(knowledgeReindex.status).toBe(400);
      expect((knowledgeReindex.body as { code?: string } | null)?.code).toBe(
        "KNOWLEDGE_REINDEX_JOB_INVALID",
      );

      expect(scheduledAiEvals.status).toBe(400);
      expect((scheduledAiEvals.body as { code?: string } | null)?.code).toBe(
        "SCHEDULED_AI_EVAL_INVALID",
      );

      expect(billingReconcile.status).toBe(400);
      expect((billingReconcile.body as { code?: string } | null)?.code).toBe(
        "BILLING_RECONCILE_JOB_INVALID",
      );
    });
  });
});
