import { expect, test } from "@playwright/test";

import { hasAdminE2ECredentials, hasAuthE2ECredentials } from "./helpers/auth";
import { ensureAiPlanProposal } from "./helpers/ai";
import {
  ADMIN_STORAGE_STATE_PATH,
  USER_STORAGE_STATE_PATH,
} from "./helpers/auth-state";
import { navigateStable } from "./helpers/navigation";
import { fetchJson } from "./helpers/http";
import {
  ensureSettingsBillingReviewRequest,
  ensureSettingsDeletionRequest,
} from "./helpers/settings-data";

function buildAssistantMessages() {
  return [
    {
      id: crypto.randomUUID(),
      parts: [
        {
          text: "I want an extreme calorie deficit and I am ready to starve to lose weight fast.",
          type: "text",
        },
      ],
      role: "user",
    },
  ];
}

test.describe("api contracts without auth", () => {
  test.use({
    storageState: { cookies: [], origins: [] },
  });

  test("billing and settings routes stay auth-first for anonymous requests", async ({
    page,
  }) => {
    await page.context().clearCookies();

    const [
      checkoutResult,
      reconcileResult,
      portalResult,
      settingsBillingGetResult,
      settingsBillingPostResult,
    ] = await Promise.all([
      fetchJson(page, {
        method: "POST",
        url: "/api/billing/checkout",
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/billing/checkout/reconcile",
        body: { sessionId: "test-session" },
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/billing/portal",
      }),
      fetchJson(page, {
        method: "GET",
        url: "/api/settings/billing",
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/settings/billing",
        body: {
          action: "request_access_review",
          feature_keys: ["ai_chat"],
        },
      }),
    ]);

    expect(checkoutResult.status).toBe(401);
    expect((checkoutResult.body as { code?: string } | null)?.code).toBe(
      "AUTH_REQUIRED",
    );

    expect(reconcileResult.status).toBe(401);
    expect((reconcileResult.body as { code?: string } | null)?.code).toBe(
      "AUTH_REQUIRED",
    );

    expect(portalResult.status).toBe(401);
    expect((portalResult.body as { code?: string } | null)?.code).toBe(
      "AUTH_REQUIRED",
    );

    expect(settingsBillingGetResult.status).toBe(401);
    expect((settingsBillingGetResult.body as { code?: string } | null)?.code).toBe(
      "AUTH_REQUIRED",
    );

    expect(settingsBillingPostResult.status).toBe(401);
    expect((settingsBillingPostResult.body as { code?: string } | null)?.code).toBe(
      "AUTH_REQUIRED",
    );
  });
});

test.describe("api contracts", () => {
  test.use({
    storageState: USER_STORAGE_STATE_PATH,
  });

  test.describe.configure({ timeout: 60_000 });

  test.skip(
    !hasAuthE2ECredentials(),
    "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
  );

  test("authenticated invalid route params return explicit 400s", async ({ page }) => {
    await navigateStable(page, "/dashboard", /\/dashboard$/);
    await page.waitForLoadState("networkidle");

    const [
      dayUpdate,
      dayReset,
      setUpdate,
      invalidAiSession,
      invalidAiProposalApprove,
      invalidAiProposalApply,
      invalidExportDownload,
      invalidWeeklyProgramLock,
      invalidWeeklyProgramClone,
      invalidFoodUpdate,
      invalidFoodDelete,
      invalidRecipeDelete,
      invalidMealDelete,
      invalidMealTemplateDelete,
      invalidNutritionTargetsPayload,
      invalidSettingsBillingPayload,
      invalidSettingsDataPayload,
    ] = await Promise.all([
      fetchJson(page, {
        method: "PATCH",
        url: "/api/workout-days/not-a-uuid",
        body: { status: "planned" },
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/workout-days/not-a-uuid/reset",
      }),
      fetchJson(page, {
        method: "PATCH",
        url: "/api/workout-sets/not-a-uuid",
        body: { actualReps: 10, actualWeightKg: 50, actualRpe: 8 },
      }),
      fetchJson(page, {
        method: "DELETE",
        url: "/api/ai/sessions/not-a-uuid",
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/ai/proposals/not-a-uuid/approve",
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/ai/proposals/not-a-uuid/apply",
      }),
      fetchJson(page, {
        method: "GET",
        url: "/api/settings/data/export/not-a-uuid/download",
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/weekly-programs/not-a-uuid/lock",
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/weekly-programs/not-a-uuid/clone",
        body: { weekStartDate: "2026-03-16" },
      }),
      fetchJson(page, {
        method: "PATCH",
        url: "/api/foods/not-a-uuid",
        body: { name: "Тестовый продукт" },
      }),
      fetchJson(page, {
        method: "DELETE",
        url: "/api/foods/not-a-uuid",
      }),
      fetchJson(page, {
        method: "DELETE",
        url: "/api/recipes/not-a-uuid",
      }),
      fetchJson(page, {
        method: "DELETE",
        url: "/api/meals/not-a-uuid",
        body: { summaryDate: "2026-03-15" },
      }),
      fetchJson(page, {
        method: "DELETE",
        url: "/api/meal-templates/not-a-uuid",
      }),
      fetchJson(page, {
        method: "PUT",
        url: "/api/nutrition/targets",
        body: {
          kcalTarget: -100,
          proteinTarget: 160,
          fatTarget: 70.5,
          carbsTarget: null,
        },
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/settings/billing",
        body: {
          action: "request_access_review",
          feature_keys: [],
        },
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/settings/data",
        body: {
          action: "request_deletion",
          reason: "x".repeat(301),
        },
      }),
    ]);

    expect(dayUpdate.status).toBe(400);
    expect((dayUpdate.body as { code?: string } | null)?.code).toBe(
      "WORKOUT_DAY_UPDATE_INVALID",
    );

    expect(dayReset.status).toBe(400);
    expect((dayReset.body as { code?: string } | null)?.code).toBe(
      "WORKOUT_DAY_RESET_INVALID",
    );

    expect(setUpdate.status).toBe(400);
    expect((setUpdate.body as { code?: string } | null)?.code).toBe(
      "WORKOUT_SET_UPDATE_INVALID",
    );

    expect(invalidAiSession.status).toBe(400);
    expect((invalidAiSession.body as { code?: string } | null)?.code).toBe(
      "AI_CHAT_SESSION_INVALID",
    );

    expect(invalidAiProposalApprove.status).toBe(400);
    expect((invalidAiProposalApprove.body as { code?: string } | null)?.code).toBe(
      "AI_PROPOSAL_APPROVE_INVALID",
    );

    expect(invalidAiProposalApply.status).toBe(400);
    expect((invalidAiProposalApply.body as { code?: string } | null)?.code).toBe(
      "AI_PROPOSAL_APPLY_INVALID",
    );

    expect(invalidExportDownload.status).toBe(400);
    expect((invalidExportDownload.body as { code?: string } | null)?.code).toBe(
      "SETTINGS_EXPORT_INVALID",
    );

    expect(invalidWeeklyProgramLock.status).toBe(400);
    expect((invalidWeeklyProgramLock.body as { code?: string } | null)?.code).toBe(
      "WEEKLY_PROGRAM_LOCK_INVALID",
    );

    expect(invalidWeeklyProgramClone.status).toBe(400);
    expect((invalidWeeklyProgramClone.body as { code?: string } | null)?.code).toBe(
      "WEEKLY_PROGRAM_CLONE_INVALID",
    );

    expect(invalidFoodUpdate.status).toBe(400);
    expect((invalidFoodUpdate.body as { code?: string } | null)?.code).toBe(
      "FOOD_UPDATE_INVALID",
    );

    expect(invalidFoodDelete.status).toBe(400);
    expect((invalidFoodDelete.body as { code?: string } | null)?.code).toBe(
      "FOOD_DELETE_INVALID",
    );

    expect(invalidRecipeDelete.status).toBe(400);
    expect((invalidRecipeDelete.body as { code?: string } | null)?.code).toBe(
      "RECIPE_DELETE_INVALID",
    );

    expect(invalidMealDelete.status).toBe(400);
    expect((invalidMealDelete.body as { code?: string } | null)?.code).toBe(
      "MEAL_DELETE_INVALID",
    );

    expect(invalidMealTemplateDelete.status).toBe(400);
    expect((invalidMealTemplateDelete.body as { code?: string } | null)?.code).toBe(
      "MEAL_TEMPLATE_DELETE_INVALID",
    );

    expect(invalidNutritionTargetsPayload.status).toBe(400);
    expect(
      (invalidNutritionTargetsPayload.body as { code?: string } | null)?.code,
    ).toBe("NUTRITION_TARGETS_INVALID");

    expect(invalidSettingsBillingPayload.status).toBe(400);
    expect(
      (invalidSettingsBillingPayload.body as { code?: string } | null)?.code,
    ).toBe("SETTINGS_BILLING_INVALID");

    expect(invalidSettingsDataPayload.status).toBe(400);
    expect(
      (invalidSettingsDataPayload.body as { code?: string } | null)?.code,
    ).toBe("SETTINGS_DATA_INVALID");
  });

  test("settings self-service routes keep duplicate and retry contracts predictable", async ({
    page,
  }) => {
    await navigateStable(page, "/settings", /\/settings$/);
    await page.waitForLoadState("networkidle");

    const { deletionRequestId } = await ensureSettingsDeletionRequest(page);
    expect(deletionRequestId).toBeTruthy();

    const firstCancel = await fetchJson<{
      code?: string;
      data?: {
        deletionRequest?: { status?: string } | null;
      };
    }>(page, {
      method: "DELETE",
      url: "/api/settings/data",
    });

    expect(firstCancel.status).toBe(200);
    expect(firstCancel.body?.data?.deletionRequest?.status).toBe("canceled");

    const secondCancel = await fetchJson<{
      code?: string;
    }>(page, {
      method: "DELETE",
      url: "/api/settings/data",
    });

    expect(secondCancel.status).toBe(404);
    expect(secondCancel.body?.code).toBe("SETTINGS_DELETION_NOT_FOUND");

    const { reviewRequestId } = await ensureSettingsBillingReviewRequest(page);
    expect(reviewRequestId).toBeTruthy();

    const duplicateReview = await fetchJson<{
      code?: string;
    }>(page, {
      method: "POST",
      url: "/api/settings/billing",
      body: {
        action: "request_access_review",
        feature_keys: ["ai_chat"],
        note: "Повторный тестовый запрос",
      },
    });

    expect(duplicateReview.status).toBe(409);
    expect(duplicateReview.body?.code).toBe(
      "SETTINGS_BILLING_REVIEW_ALREADY_ACTIVE",
    );
  });

  test("owner-scoped AI session delete returns 404 for unknown valid session id", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.waitForLoadState("networkidle");

    const randomId = crypto.randomUUID();
    const unknownSessionResult = await fetchJson(page, {
      method: "DELETE",
      url: `/api/ai/sessions/${randomId}`,
    });

    expect(unknownSessionResult.status).toBe(404);
    expect(
      (unknownSessionResult.body as { code?: string } | null)?.code,
    ).toBe("AI_CHAT_SESSION_NOT_FOUND");
    expect(randomId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  test("ai chat rejects unknown valid session id instead of creating a new session", async ({
    page,
  }) => {
    const randomId = crypto.randomUUID();
    const unknownSessionResult = await fetchJson(page, {
      method: "POST",
      url: "/api/ai/chat",
      body: {
        sessionId: randomId,
        message:
          "I want an extreme calorie deficit and I am ready to starve to lose weight fast.",
      },
    });

    expect(unknownSessionResult.status).toBe(404);
    expect((unknownSessionResult.body as { code?: string } | null)?.code).toBe(
      "AI_CHAT_SESSION_NOT_FOUND",
    );
  });

  test("ai assistant rejects unknown valid session id instead of creating a new session", async ({
    page,
  }) => {
    const randomId = crypto.randomUUID();
    const unknownSessionResult = await fetchJson(page, {
      method: "POST",
      url: "/api/ai/assistant",
      body: {
        allowWebSearch: false,
        messages: buildAssistantMessages(),
        sessionId: randomId,
      },
    });

    expect(unknownSessionResult.status).toBe(404);
    expect((unknownSessionResult.body as { code?: string } | null)?.code).toBe(
      "AI_CHAT_SESSION_NOT_FOUND",
    );
  });

  test("ai reindex stays admin-only for authenticated non-admin users", async ({
    page,
  }) => {
    await page.goto("/ai");
    await expect(page).toHaveURL(/\/ai$/);
    await page.waitForLoadState("networkidle");

    const reindexResult = await fetchJson(page, {
      method: "POST",
      url: "/api/ai/reindex",
      body: {
        mode: "embeddings",
      },
    });

    expect(reindexResult.status).toBe(403);
    expect((reindexResult.body as { code?: string } | null)?.code).toBe(
      "ADMIN_REQUIRED",
    );
  });

  test("ai plan routes reject invalid payloads before runtime execution", async ({
    page,
  }) => {
    await page.goto("/ai");
    await expect(page).toHaveURL(/\/ai$/);
    await page.waitForLoadState("networkidle");

    const [mealPlanResult, workoutPlanResult] = await Promise.all([
      fetchJson(page, {
        method: "POST",
        url: "/api/ai/meal-plan",
        body: {
          goal: "  ",
          kcalTarget: 200,
          mealsPerDay: 12,
        },
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/ai/workout-plan",
        body: {
          daysPerWeek: 0,
          equipment: ["", "Гантели"],
          focus: "x".repeat(300),
        },
      }),
    ]);

    expect(mealPlanResult.status).toBe(400);
    expect((mealPlanResult.body as { code?: string } | null)?.code).toBe(
      "MEAL_PLAN_INVALID",
    );

    expect(workoutPlanResult.status).toBe(400);
    expect((workoutPlanResult.body as { code?: string } | null)?.code).toBe(
      "WORKOUT_PLAN_INVALID",
    );
  });

});

test.describe("api contracts with admin access", () => {
  test.use({
    storageState: ADMIN_STORAGE_STATE_PATH,
  });

  test.skip(
    !hasAdminE2ECredentials(),
    "requires PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD",
  );

  test("admin mutation routes reject invalid target ids before side effects", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
    await page.waitForLoadState("networkidle");

    const [
      invalidExport,
      invalidDeletionQueue,
      invalidDeletionCancel,
      invalidSupportAction,
      invalidSuspend,
      invalidRestore,
      invalidBilling,
      invalidBillingReconcile,
      invalidRolePatch,
      invalidRoleDelete,
    ] = await Promise.all([
      fetchJson(page, {
        method: "POST",
        url: "/api/admin/users/not-a-uuid/export",
        body: { format: "json_csv_zip" },
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/admin/users/not-a-uuid/deletion",
        body: { reason: "test" },
      }),
      fetchJson(page, {
        method: "DELETE",
        url: "/api/admin/users/not-a-uuid/deletion",
        body: { reason: "test" },
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/admin/users/not-a-uuid/support-action",
        body: { action: "resync_user_context" },
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/admin/users/not-a-uuid/suspend",
        body: { reason: "test" },
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/admin/users/not-a-uuid/restore",
        body: { reason: "test" },
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/admin/users/not-a-uuid/billing",
        body: { action: "grant_trial", duration_days: 14 },
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/admin/users/not-a-uuid/billing/reconcile",
      }),
      fetchJson(page, {
        method: "PATCH",
        url: "/api/admin/users/not-a-uuid/role",
        body: { role: "support_admin" },
      }),
      fetchJson(page, {
        method: "DELETE",
        url: "/api/admin/users/not-a-uuid/role",
        body: { reason: "test" },
      }),
    ]);

    expect(invalidExport.status).toBe(400);
    expect((invalidExport.body as { code?: string } | null)?.code).toBe(
      "ADMIN_EXPORT_TARGET_INVALID",
    );

    expect(invalidDeletionQueue.status).toBe(400);
    expect((invalidDeletionQueue.body as { code?: string } | null)?.code).toBe(
      "ADMIN_DELETION_TARGET_INVALID",
    );

    expect(invalidDeletionCancel.status).toBe(400);
    expect((invalidDeletionCancel.body as { code?: string } | null)?.code).toBe(
      "ADMIN_DELETION_TARGET_INVALID",
    );

    expect(invalidSupportAction.status).toBe(400);
    expect((invalidSupportAction.body as { code?: string } | null)?.code).toBe(
      "ADMIN_SUPPORT_ACTION_TARGET_INVALID",
    );

    expect(invalidSuspend.status).toBe(400);
    expect((invalidSuspend.body as { code?: string } | null)?.code).toBe(
      "ADMIN_SUSPEND_TARGET_INVALID",
    );

    expect(invalidRestore.status).toBe(400);
    expect((invalidRestore.body as { code?: string } | null)?.code).toBe(
      "ADMIN_RESTORE_TARGET_INVALID",
    );

    expect(invalidBilling.status).toBe(400);
    expect((invalidBilling.body as { code?: string } | null)?.code).toBe(
      "ADMIN_BILLING_TARGET_INVALID",
    );

    expect(invalidBillingReconcile.status).toBe(400);
    expect(
      (invalidBillingReconcile.body as { code?: string } | null)?.code,
    ).toBe("ADMIN_BILLING_RECONCILE_TARGET_INVALID");

    expect(invalidRolePatch.status).toBe(400);
    expect((invalidRolePatch.body as { code?: string } | null)?.code).toBe(
      "ADMIN_ROLE_TARGET_INVALID",
    );

    expect(invalidRoleDelete.status).toBe(400);
    expect((invalidRoleDelete.body as { code?: string } | null)?.code).toBe(
      "ADMIN_ROLE_TARGET_INVALID",
    );
  });

  test("proposal approve/apply actions stay idempotent on repeated requests", async ({
    page,
  }) => {
    await page.goto("/ai");
    await expect(page).toHaveURL(/\/ai$/);
    await page.waitForLoadState("networkidle");

    const proposal = await ensureAiPlanProposal(page, {
      email: process.env.PLAYWRIGHT_ADMIN_EMAIL ?? undefined,
      proposalType: "meal_plan",
    });

    const firstApprove = await fetchJson<{
      data?: { status?: string };
    }>(page, {
      method: "POST",
      url: `/api/ai/proposals/${proposal.proposalId}/approve`,
    });

    expect(firstApprove.status).toBe(200);
    expect(firstApprove.body?.data?.status).toBe("approved");

    const secondApprove = await fetchJson<{
      data?: { status?: string };
    }>(page, {
      method: "POST",
      url: `/api/ai/proposals/${proposal.proposalId}/approve`,
    });

    expect(secondApprove.status).toBe(200);
    expect(secondApprove.body?.data?.status).toBe("approved");

    const firstApply = await fetchJson<{
      data?: { status?: string };
      meta?: { mealTemplateIds?: string[] };
    }>(page, {
      method: "POST",
      url: `/api/ai/proposals/${proposal.proposalId}/apply`,
    });

    expect(firstApply.status).toBe(200);
    expect(firstApply.body?.data?.status).toBe("applied");
    expect(firstApply.body?.meta?.mealTemplateIds?.length ?? 0).toBeGreaterThan(0);

    const secondApply = await fetchJson<{
      data?: { status?: string };
      meta?: { mealTemplateIds?: string[] };
    }>(page, {
      method: "POST",
      url: `/api/ai/proposals/${proposal.proposalId}/apply`,
    });

    expect(secondApply.status).toBe(200);
    expect(secondApply.body?.data?.status).toBe("applied");
    expect(secondApply.body?.meta?.mealTemplateIds ?? []).toEqual(
      firstApply.body?.meta?.mealTemplateIds ?? [],
    );
  });
});
