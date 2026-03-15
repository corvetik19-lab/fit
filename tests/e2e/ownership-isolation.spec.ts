import { expect, test } from "@playwright/test";

import {
  ADMIN_STORAGE_STATE_PATH,
  USER_STORAGE_STATE_PATH,
} from "./helpers/auth-state";
import {
  hasAdminE2ECredentials,
  hasAuthE2ECredentials,
} from "./helpers/auth";
import {
  ensureAiChatSession,
  ensureAiPlanProposal,
  readAiPlanProposal,
} from "./helpers/ai";
import { createExerciseAsset } from "./helpers/exercises";
import { fetchJson } from "./helpers/http";
import { navigateStable } from "./helpers/navigation";
import { createNutritionAssets } from "./helpers/nutrition";
import {
  ensureSettingsBillingReviewRequest,
  ensureSettingsDeletionRequest,
  ensureSettingsExportJob,
} from "./helpers/settings-data";
import { createLockedWorkoutDay } from "./helpers/workouts";

function buildFutureCloneDate() {
  return new Date(Date.now() + 900 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

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

test.describe("user-owned isolation", () => {
  test.describe.configure({ timeout: 60_000 });

  test.skip(
    !hasAuthE2ECredentials() || !hasAdminE2ECredentials(),
    "requires regular and admin Playwright credentials",
  );

  test("root admin cannot read or mutate another user's workout day", async ({
    browser,
  }) => {
    const userContext = await browser.newContext({
      storageState: USER_STORAGE_STATE_PATH,
    });
    const userPage = await userContext.newPage();
    await navigateStable(userPage, "/dashboard", /\/dashboard$/);
    await userPage.waitForLoadState("networkidle");

    const seededDay = await createLockedWorkoutDay(userPage, "isolation");

    const adminContext = await browser.newContext({
      storageState: ADMIN_STORAGE_STATE_PATH,
    });
    const adminPage = await adminContext.newPage();
    await navigateStable(adminPage, "/admin", /\/admin$/);
    await adminPage.waitForLoadState("networkidle");

    const [
      pullResult,
      patchDayResult,
      resetDayResult,
      patchSetResult,
      weeklyProgramsResult,
      weeklyProgramLockResult,
      weeklyProgramCloneResult,
    ] =
      await Promise.all([
        fetchJson<{ code?: string }>(adminPage, {
          method: "GET",
          url: `/api/sync/pull?scope=workout_day&dayId=${seededDay.dayId}`,
        }),
        fetchJson<{ code?: string }>(adminPage, {
          method: "PATCH",
          url: `/api/workout-days/${seededDay.dayId}`,
          body: {
            status: "planned",
          },
        }),
        fetchJson<{ code?: string }>(adminPage, {
          method: "POST",
          url: `/api/workout-days/${seededDay.dayId}/reset`,
        }),
        fetchJson<{ code?: string }>(adminPage, {
          method: "PATCH",
          url: `/api/workout-sets/${seededDay.setId}`,
          body: {
            actualReps: 8,
            actualWeightKg: 60,
            actualRpe: 8,
          },
        }),
        fetchJson<{ data?: Array<{ id: string }> }>(adminPage, {
          method: "GET",
          url: "/api/weekly-programs",
        }),
        fetchJson<{ code?: string }>(adminPage, {
          method: "POST",
          url: `/api/weekly-programs/${seededDay.programId}/lock`,
        }),
        fetchJson<{ code?: string }>(adminPage, {
          method: "POST",
          url: `/api/weekly-programs/${seededDay.programId}/clone`,
          body: {
            weekStartDate: buildFutureCloneDate(),
          },
        }),
      ]);

    expect(pullResult.status).toBe(404);
    expect(pullResult.body?.code).toBe("WORKOUT_DAY_NOT_FOUND");

    expect(patchDayResult.status).toBe(404);
    expect(patchDayResult.body?.code).toBe("WORKOUT_DAY_NOT_FOUND");

    expect(resetDayResult.status).toBe(404);
    expect(resetDayResult.body?.code).toBe("WORKOUT_DAY_NOT_FOUND");

    expect(patchSetResult.status).toBe(404);
    expect(patchSetResult.body?.code).toBe("WORKOUT_SET_NOT_FOUND");

    expect(weeklyProgramsResult.status).toBe(200);
    expect(
      (weeklyProgramsResult.body?.data ?? []).some(
        (program) => program.id === seededDay.programId,
      ),
    ).toBe(false);

    expect(weeklyProgramLockResult.status).toBe(404);
    expect(weeklyProgramLockResult.body?.code).toBe("WEEKLY_PROGRAM_NOT_FOUND");

    expect(weeklyProgramCloneResult.status).toBe(404);
    expect(weeklyProgramCloneResult.body?.code).toBe("WEEKLY_PROGRAM_NOT_FOUND");

    await adminContext.close();
    await userContext.close();
  });

  test("root admin cannot read or mutate another user's nutrition assets", async ({
    browser,
  }) => {
    const userContext = await browser.newContext({
      storageState: USER_STORAGE_STATE_PATH,
    });
    const userPage = await userContext.newPage();
    await navigateStable(userPage, "/dashboard", /\/dashboard$/);
    await userPage.waitForLoadState("networkidle");

    const seededNutrition = await createNutritionAssets(userPage, "nutrition-isolation");

    const adminContext = await browser.newContext({
      storageState: ADMIN_STORAGE_STATE_PATH,
    });
    const adminPage = await adminContext.newPage();
    await navigateStable(adminPage, "/admin", /\/admin$/);
    await adminPage.waitForLoadState("networkidle");

    const [
      foodsResult,
      patchFoodResult,
      deleteFoodResult,
      deleteRecipeResult,
      deleteMealTemplateResult,
      deleteMealResult,
    ] = await Promise.all([
      fetchJson<{ data?: Array<{ id: string }> }>(adminPage, {
        method: "GET",
        url: "/api/foods",
      }),
      fetchJson<{ code?: string }>(adminPage, {
        method: "PATCH",
        url: `/api/foods/${seededNutrition.foodId}`,
        body: {
          name: "Hacked food title",
        },
      }),
      fetchJson<{ code?: string }>(adminPage, {
        method: "DELETE",
        url: `/api/foods/${seededNutrition.foodId}`,
      }),
      fetchJson<{ code?: string }>(adminPage, {
        method: "DELETE",
        url: `/api/recipes/${seededNutrition.recipeId}`,
      }),
      fetchJson<{ code?: string }>(adminPage, {
        method: "DELETE",
        url: `/api/meal-templates/${seededNutrition.mealTemplateId}`,
      }),
      fetchJson<{ code?: string }>(adminPage, {
        method: "DELETE",
        url: `/api/meals/${seededNutrition.mealId}`,
        body: {
          summaryDate: seededNutrition.summaryDate,
        },
      }),
    ]);

    expect(foodsResult.status).toBe(200);
    expect(
      (foodsResult.body?.data ?? []).some(
        (food) => food.id === seededNutrition.foodId,
      ),
    ).toBe(false);

    expect(patchFoodResult.status).toBe(404);
    expect(patchFoodResult.body?.code).toBe("FOOD_NOT_FOUND");

    expect(deleteFoodResult.status).toBe(404);
    expect(deleteFoodResult.body?.code).toBe("FOOD_NOT_FOUND");

    expect(deleteRecipeResult.status).toBe(404);
    expect(deleteRecipeResult.body?.code).toBe("RECIPE_NOT_FOUND");

    expect(deleteMealTemplateResult.status).toBe(404);
    expect(deleteMealTemplateResult.body?.code).toBe("MEAL_TEMPLATE_NOT_FOUND");

    expect(deleteMealResult.status).toBe(404);
    expect(deleteMealResult.body?.code).toBe("MEAL_NOT_FOUND");

    await adminContext.close();
    await userContext.close();
  });

  test("root admin cannot read or mutate another user's custom exercises", async ({
    browser,
  }) => {
    const userContext = await browser.newContext({
      storageState: USER_STORAGE_STATE_PATH,
    });
    const userPage = await userContext.newPage();
    await navigateStable(userPage, "/dashboard", /\/dashboard$/);
    await userPage.waitForLoadState("networkidle");

    const seededExercise = await createExerciseAsset(userPage, "exercise-isolation");

    const adminContext = await browser.newContext({
      storageState: ADMIN_STORAGE_STATE_PATH,
    });
    const adminPage = await adminContext.newPage();
    await navigateStable(adminPage, "/admin", /\/admin$/);
    await adminPage.waitForLoadState("networkidle");

    const [exerciseListResult, patchExerciseResult] = await Promise.all([
      fetchJson<{ data?: Array<{ id: string }> }>(adminPage, {
        method: "GET",
        url: "/api/exercises",
      }),
      fetchJson<{ code?: string }>(adminPage, {
        method: "PATCH",
        url: `/api/exercises/${seededExercise.exerciseId}`,
        body: {
          title: "Hacked exercise title",
        },
      }),
    ]);

    expect(exerciseListResult.status).toBe(200);
    expect(
      (exerciseListResult.body?.data ?? []).some(
        (exercise) => exercise.id === seededExercise.exerciseId,
      ),
    ).toBe(false);

    expect(patchExerciseResult.status).toBe(404);
    expect(patchExerciseResult.body?.code).toBe("EXERCISE_NOT_FOUND");

    await adminContext.close();
    await userContext.close();
  });

  test("root admin cannot access another user's self-service export jobs", async ({
    browser,
  }) => {
    const userContext = await browser.newContext({
      storageState: USER_STORAGE_STATE_PATH,
    });
    const userPage = await userContext.newPage();
    await navigateStable(userPage, "/settings", /\/settings$/);
    await userPage.waitForLoadState("networkidle");

    const seededExport = await ensureSettingsExportJob(userPage);

    const adminContext = await browser.newContext({
      storageState: ADMIN_STORAGE_STATE_PATH,
    });
    const adminPage = await adminContext.newPage();
    await navigateStable(adminPage, "/admin", /\/admin$/);
    await adminPage.waitForLoadState("networkidle");

    const [settingsDataResult, exportDownloadResult] = await Promise.all([
      fetchJson<{ data?: { exportJobs?: Array<{ id: string }> } }>(adminPage, {
        method: "GET",
        url: "/api/settings/data",
      }),
      fetchJson<{ code?: string }>(adminPage, {
        method: "GET",
        url: `/api/settings/data/export/${seededExport.exportJobId}/download`,
      }),
    ]);

    expect(settingsDataResult.status).toBe(200);
    expect(
      (settingsDataResult.body?.data?.exportJobs ?? []).some(
        (job) => job.id === seededExport.exportJobId,
      ),
    ).toBe(false);

    expect(exportDownloadResult.status).toBe(404);
    expect(exportDownloadResult.body?.code).toBe("SETTINGS_EXPORT_NOT_FOUND");

    await adminContext.close();
    await userContext.close();
  });

  test("root admin cannot read or create another user's workout templates", async ({
    browser,
  }) => {
    const userContext = await browser.newContext({
      storageState: USER_STORAGE_STATE_PATH,
    });
    const userPage = await userContext.newPage();
    await navigateStable(userPage, "/dashboard", /\/dashboard$/);
    await userPage.waitForLoadState("networkidle");

    const seededDay = await createLockedWorkoutDay(userPage, "template-isolation");
    const templateTitle = `Isolation Template ${crypto.randomUUID().slice(0, 8)}`;

    const createTemplateResult = await fetchJson<{ data?: { id: string } }>(userPage, {
      method: "POST",
      url: "/api/workout-templates",
      body: {
        programId: seededDay.programId,
        title: templateTitle,
      },
    });

    expect(createTemplateResult.status).toBe(200);
    const templateId = createTemplateResult.body?.data?.id;
    expect(templateId).toBeTruthy();

    const adminContext = await browser.newContext({
      storageState: ADMIN_STORAGE_STATE_PATH,
    });
    const adminPage = await adminContext.newPage();
    await navigateStable(adminPage, "/admin", /\/admin$/);
    await adminPage.waitForLoadState("networkidle");

    const [templateListResult, createForeignTemplateResult] = await Promise.all([
      fetchJson<{ data?: Array<{ id: string }> }>(adminPage, {
        method: "GET",
        url: "/api/workout-templates",
      }),
      fetchJson<{ code?: string }>(adminPage, {
        method: "POST",
        url: "/api/workout-templates",
        body: {
          programId: seededDay.programId,
          title: `Foreign Template ${crypto.randomUUID().slice(0, 8)}`,
        },
      }),
    ]);

    expect(templateListResult.status).toBe(200);
    expect(
      (templateListResult.body?.data ?? []).some(
        (template) => template.id === templateId,
      ),
    ).toBe(false);

    expect(createForeignTemplateResult.status).toBe(404);
    expect(createForeignTemplateResult.body?.code).toBe(
      "WORKOUT_TEMPLATE_SOURCE_NOT_FOUND",
    );

    await adminContext.close();
    await userContext.close();
  });

  test("root admin cannot cancel another user's deletion request", async ({
    browser,
  }) => {
    const userContext = await browser.newContext({
      storageState: USER_STORAGE_STATE_PATH,
    });
    const userPage = await userContext.newPage();
    await navigateStable(userPage, "/settings", /\/settings$/);
    await userPage.waitForLoadState("networkidle");

    const seededDeletion = await ensureSettingsDeletionRequest(userPage);

    const adminContext = await browser.newContext({
      storageState: ADMIN_STORAGE_STATE_PATH,
    });
    const adminPage = await adminContext.newPage();
    await navigateStable(adminPage, "/admin", /\/admin$/);
    await adminPage.waitForLoadState("networkidle");

    const [settingsDataResult, cancelDeletionResult] = await Promise.all([
      fetchJson<{ data?: { deletionRequest?: { id: string } | null } }>(adminPage, {
        method: "GET",
        url: "/api/settings/data",
      }),
      fetchJson<{ code?: string }>(adminPage, {
        method: "DELETE",
        url: "/api/settings/data",
      }),
    ]);

    expect(settingsDataResult.status).toBe(200);
    expect(settingsDataResult.body?.data?.deletionRequest?.id).not.toBe(
      seededDeletion.deletionRequestId,
    );

    expect(cancelDeletionResult.status).toBe(404);
    expect(cancelDeletionResult.body?.code).toBe("SETTINGS_DELETION_NOT_FOUND");

    const userSnapshotResult = await fetchJson<{
      data?: { deletionRequest?: { id: string } | null };
    }>(userPage, {
      method: "GET",
      url: "/api/settings/data",
    });

    expect(userSnapshotResult.status).toBe(200);
    expect(userSnapshotResult.body?.data?.deletionRequest?.id).toBe(
      seededDeletion.deletionRequestId,
    );

    await adminContext.close();
    await userContext.close();
  });

  test("root admin cannot see another user's billing review request", async ({
    browser,
  }) => {
    const userContext = await browser.newContext({
      storageState: USER_STORAGE_STATE_PATH,
    });
    const userPage = await userContext.newPage();
    await navigateStable(userPage, "/settings", /\/settings$/);
    await userPage.waitForLoadState("networkidle");

    const seededReview = await ensureSettingsBillingReviewRequest(userPage);

    const adminContext = await browser.newContext({
      storageState: ADMIN_STORAGE_STATE_PATH,
    });
    const adminPage = await adminContext.newPage();
    await navigateStable(adminPage, "/admin", /\/admin$/);
    await adminPage.waitForLoadState("networkidle");

    const settingsBillingResult = await fetchJson<{
      data?: {
        snapshot?: {
          billingReviewRequest?: { id: string } | null;
        };
      };
    }>(adminPage, {
      method: "GET",
      url: "/api/settings/billing",
    });

    expect(settingsBillingResult.status).toBe(200);
    expect(
      settingsBillingResult.body?.data?.snapshot?.billingReviewRequest?.id,
    ).not.toBe(seededReview.reviewRequestId);

    const userBillingResult = await fetchJson<{
      data?: {
        snapshot?: {
          billingReviewRequest?: { id: string } | null;
        };
      };
    }>(userPage, {
      method: "GET",
      url: "/api/settings/billing",
    });

    expect(userBillingResult.status).toBe(200);
    expect(userBillingResult.body?.data?.snapshot?.billingReviewRequest?.id).toBe(
      seededReview.reviewRequestId,
    );

    await adminContext.close();
    await userContext.close();
  });

  test("root admin cannot delete another user's AI chat history", async ({
    browser,
  }) => {
    const userContext = await browser.newContext({
      storageState: USER_STORAGE_STATE_PATH,
    });
    const userPage = await userContext.newPage();
    await navigateStable(userPage, "/ai", /\/ai$/);
    await userPage.waitForLoadState("networkidle");

    const seededSession = await ensureAiChatSession(userPage);

    const adminContext = await browser.newContext({
      storageState: ADMIN_STORAGE_STATE_PATH,
    });
    const adminPage = await adminContext.newPage();
    await navigateStable(adminPage, "/admin", /\/admin$/);
    await adminPage.waitForLoadState("networkidle");

    const [
      deleteForeignSessionResult,
      chatForeignSessionResult,
      assistantForeignSessionResult,
      clearAdminHistoryResult,
    ] =
      await Promise.all([
        fetchJson<{ code?: string }>(adminPage, {
          method: "DELETE",
          url: `/api/ai/sessions/${seededSession.sessionId}`,
        }),
        fetchJson<{ code?: string }>(adminPage, {
          method: "POST",
          url: "/api/ai/chat",
          body: {
            sessionId: seededSession.sessionId,
            message:
              "I want an extreme calorie deficit and I am ready to starve to lose weight fast.",
          },
        }),
        fetchJson<{ code?: string }>(adminPage, {
          method: "POST",
          url: "/api/ai/assistant",
          body: {
            allowWebSearch: false,
            messages: buildAssistantMessages(),
            sessionId: seededSession.sessionId,
          },
        }),
        fetchJson<{ data?: { cleared?: boolean } }>(adminPage, {
          method: "DELETE",
          url: "/api/ai/sessions",
        }),
      ]);

    expect(deleteForeignSessionResult.status).toBe(404);
    expect(deleteForeignSessionResult.body?.code).toBe("AI_CHAT_SESSION_NOT_FOUND");

    expect(chatForeignSessionResult.status).toBe(404);
    expect(chatForeignSessionResult.body?.code).toBe("AI_CHAT_SESSION_NOT_FOUND");

    expect(assistantForeignSessionResult.status).toBe(404);
    expect(assistantForeignSessionResult.body?.code).toBe(
      "AI_CHAT_SESSION_NOT_FOUND",
    );

    expect(clearAdminHistoryResult.status).toBe(200);
    expect(clearAdminHistoryResult.body?.data?.cleared).toBe(true);

    const deleteUserSessionResult = await fetchJson<{
      data?: { deleted?: boolean; sessionId?: string };
    }>(userPage, {
      method: "DELETE",
      url: `/api/ai/sessions/${seededSession.sessionId}`,
    });

    expect(deleteUserSessionResult.status).toBe(200);
    expect(deleteUserSessionResult.body?.data?.deleted).toBe(true);
    expect(deleteUserSessionResult.body?.data?.sessionId).toBe(
      seededSession.sessionId,
    );

    await adminContext.close();
    await userContext.close();
  });

  test("root admin cannot approve or apply another user's AI plan proposal", async ({
    browser,
  }) => {
    const userContext = await browser.newContext({
      storageState: USER_STORAGE_STATE_PATH,
    });
    const userPage = await userContext.newPage();
    await navigateStable(userPage, "/ai", /\/ai$/);
    await userPage.waitForLoadState("networkidle");

    const seededProposal = await ensureAiPlanProposal(userPage, {
      proposalType: "meal_plan",
    });

    const adminContext = await browser.newContext({
      storageState: ADMIN_STORAGE_STATE_PATH,
    });
    const adminPage = await adminContext.newPage();
    await navigateStable(adminPage, "/admin", /\/admin$/);
    await adminPage.waitForLoadState("networkidle");

    const [approveForeignProposalResult, applyForeignProposalResult] =
      await Promise.all([
        fetchJson<{ code?: string }>(adminPage, {
          method: "POST",
          url: `/api/ai/proposals/${seededProposal.proposalId}/approve`,
        }),
        fetchJson<{ code?: string }>(adminPage, {
          method: "POST",
          url: `/api/ai/proposals/${seededProposal.proposalId}/apply`,
        }),
      ]);

    expect(approveForeignProposalResult.status).toBe(404);
    expect(approveForeignProposalResult.body?.code).toBe("AI_PROPOSAL_NOT_FOUND");

    expect(applyForeignProposalResult.status).toBe(404);
    expect(applyForeignProposalResult.body?.code).toBe("AI_PROPOSAL_NOT_FOUND");

    const proposalAfterAdminAttempts = await readAiPlanProposal(
      seededProposal.proposalId,
    );

    expect(proposalAfterAdminAttempts?.id).toBe(seededProposal.proposalId);
    expect(proposalAfterAdminAttempts?.user_id).toBe(seededProposal.userId);
    expect(proposalAfterAdminAttempts?.status).toBe("draft");

    await adminContext.close();
    await userContext.close();
  });
});
