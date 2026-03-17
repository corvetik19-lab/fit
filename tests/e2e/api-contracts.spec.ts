import { expect, test } from "@playwright/test";

import { hasAuthE2ECredentials } from "./helpers/auth";
import { USER_STORAGE_STATE_PATH } from "./helpers/auth-state";
import { fetchJson } from "./helpers/http";

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

test.use({
  storageState: USER_STORAGE_STATE_PATH,
});

test.describe("api contracts", () => {
  test.describe.configure({ timeout: 60_000 });

  test.skip(
    !hasAuthE2ECredentials(),
    "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
  );

  test("authenticated invalid route params return explicit 400s", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
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
