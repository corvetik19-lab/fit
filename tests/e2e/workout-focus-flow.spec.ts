import { expect, test, type Page } from "@playwright/test";

import { hasAuthE2ECredentials } from "./helpers/auth";
import { USER_STORAGE_STATE_PATH } from "./helpers/auth-state";
import { navigateStable } from "./helpers/navigation";
import { createLockedWorkoutDayWithExercises } from "./helpers/workouts";

const mobileUse = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
} as const;
const usesLocalPlaywrightAuth = process.env.PLAYWRIGHT_SKIP_AUTH_SETUP === "1";

type SeededWorkoutDay = Awaited<
  ReturnType<typeof createLockedWorkoutDayWithExercises>
>;

function createPlaywrightWorkoutDay(dayId: string): SeededWorkoutDay {
  return {
    exerciseId: `${dayId}-library-exercise-1`,
    exerciseIds: [
      `${dayId}-library-exercise-1`,
      `${dayId}-library-exercise-2`,
    ],
    programId: `${dayId}-program`,
    dayId,
    workoutExerciseId: `${dayId}-exercise-1`,
    workoutExerciseIds: [`${dayId}-exercise-1`, `${dayId}-exercise-2`],
    setId: `${dayId}-set-1`,
    setIds: [`${dayId}-set-1`, `${dayId}-set-2`],
  };
}

async function prepareWorkoutDay(page: Page, seed: string) {
  if (!usesLocalPlaywrightAuth) {
    return createLockedWorkoutDayWithExercises(page, seed, 2);
  }

  const seededDay = createPlaywrightWorkoutDay(`e2e-${seed}`);

  await page.route("**/api/workout-sets/**", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ data: { saved: true } }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route("**/api/workout-days/**", async (route) => {
    if (route.request().url().endsWith("/reset")) {
      await route.fulfill({
        body: JSON.stringify({
          data: {
            id: seededDay.dayId,
            weekly_program_id: seededDay.programId,
            day_of_week: 1,
            status: "planned",
            body_weight_kg: null,
            session_note: null,
            session_duration_seconds: 0,
            program_title: "E2E focus program",
            week_start_date: "2026-04-28",
            week_end_date: "2026-05-04",
            program_status: "active",
            is_locked: true,
            exercises: [
              {
                id: seededDay.workoutExerciseIds[0],
                exercise_title_snapshot: "Жим гантелей",
                sets_count: 1,
                sort_order: 0,
                sets: [
                  {
                    id: seededDay.setIds[0],
                    set_number: 1,
                    planned_reps: 10,
                    planned_reps_min: 6,
                    planned_reps_max: 10,
                    actual_reps: null,
                    actual_weight_kg: null,
                    actual_rpe: null,
                  },
                ],
              },
              {
                id: seededDay.workoutExerciseIds[1],
                exercise_title_snapshot: "Тяга блока",
                sets_count: 1,
                sort_order: 1,
                sets: [
                  {
                    id: seededDay.setIds[1],
                    set_number: 1,
                    planned_reps: 10,
                    planned_reps_min: 8,
                    planned_reps_max: 12,
                    actual_reps: null,
                    actual_weight_kg: null,
                    actual_rpe: null,
                  },
                ],
              },
            ],
          },
        }),
        contentType: "application/json",
        status: 200,
      });
      return;
    }

    await route.fulfill({
      body: JSON.stringify({ data: { saved: true } }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route("**/api/sync/pull?**", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ data: { nextCursor: null, snapshot: null } }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route("**/api/sync/push", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ data: { applied: 0, discardedStale: 0, processed: [] } }),
      contentType: "application/json",
      status: 200,
    });
  });

  return seededDay;
}

async function openWorkoutStep(page: Page, stepNumber: number) {
  const step = page.getByTestId(`workout-step-${stepNumber}`);
  await expect(step).toBeVisible();
  await step.click();
  return step;
}

async function fillExerciseSet(
  page: Page,
  setId: string,
  values: {
    reps: string;
    rpe: string;
    weight: string;
  },
) {
  await page.getByTestId(`workout-set-${setId}-reps`).selectOption(values.reps);
  await page.getByTestId(`workout-set-${setId}-weight`).fill(values.weight);
  await page.getByTestId(`workout-set-${setId}-rpe`).selectOption(values.rpe);
}

async function saveExercise(page: Page, stepNumber: number) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const saveButton = page.getByTestId(`workout-exercise-save-${stepNumber}`);
    await expect(saveButton).toBeEnabled();

    try {
      await saveButton.click({ timeout: 10_000 });
      return;
    } catch (error) {
      lastError = error;

      if (attempt === 2) {
        break;
      }

      await page.waitForTimeout(400 * (attempt + 1));
    }
  }

  throw lastError;
}

async function expectExerciseCard(page: Page, stepNumber: number) {
  const card = page.getByTestId(`workout-exercise-card-${stepNumber}`);
  await expect(card).toBeVisible();
  return card;
}

function handleNextDialog(
  page: Page,
  expectedFragment: string,
  accept = true,
) {
  return page.waitForEvent("dialog").then(async (dialog) => {
    expect(dialog.message()).toContain(expectedFragment);
    if (accept) {
      await dialog.accept();
      return;
    }

    await dialog.dismiss();
  });
}

async function startWorkoutTimer(page: Page) {
  const timerToggle = page.getByTestId("workout-timer-toggle");
  await expect(timerToggle).toBeVisible();
  await timerToggle.click();
  await page.waitForTimeout(1_100);
  await timerToggle.click();
}

test.describe("workout focus flow", () => {
  test.use({
    ...mobileUse,
    storageState: USER_STORAGE_STATE_PATH,
  });

  test.describe.configure({ timeout: 90_000 });

  test.skip(
    !hasAuthE2ECredentials(),
    "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
  );

  test("focus mode enforces ordered save, edit and finish flow", async ({
    page,
  }) => {
    const seededDay = await prepareWorkoutDay(page, "focus-flow");

    await navigateStable(
      page,
      `/workouts/day/${seededDay.dayId}?focus=1`,
      new RegExp(`/workouts/day/${seededDay.dayId}\\?focus=1$`),
    );
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("workout-step-1")).toHaveAttribute(
      "data-locked",
      "false",
    );
    await expect(page.getByTestId("workout-step-2")).toHaveAttribute(
      "data-locked",
      "true",
    );

    await page.getByTestId("workout-start-button").click();
    await expect(page.getByTestId("workout-finish-button")).toBeDisabled();

    await startWorkoutTimer(page);

    await expectExerciseCard(page, 1);
    await expect(page.getByTestId("workout-exercise-save-1")).toBeDisabled();
    await fillExerciseSet(page, seededDay.setIds[0]!, {
      reps: "8",
      rpe: "8",
      weight: "60",
    });
    await saveExercise(page, 1);

    await expect(page.getByTestId("workout-step-1")).toHaveAttribute(
      "data-complete",
      "true",
    );
    await expect(page.getByTestId("workout-step-2")).toHaveAttribute(
      "data-locked",
      "false",
    );
    await expectExerciseCard(page, 2);
    await expect(page.getByTestId("workout-finish-button")).toBeDisabled();

    await openWorkoutStep(page, 1);
    await expectExerciseCard(page, 1);
    const editFirstExerciseButton = page.getByTestId("workout-exercise-edit-1");
    await expect(editFirstExerciseButton).toBeVisible();
    await expect(editFirstExerciseButton).toBeEnabled({ timeout: 15_000 });
    await editFirstExerciseButton.click();
    await page
      .getByTestId(`workout-set-${seededDay.setIds[0]}-weight`)
      .fill("62");
    await saveExercise(page, 1);
    await expect(page.getByTestId("workout-step-1")).toHaveAttribute(
      "data-complete",
      "true",
    );
    await expectExerciseCard(page, 2);

    await openWorkoutStep(page, 2);
    const secondCard = await expectExerciseCard(page, 2);
    await fillExerciseSet(page, seededDay.setIds[1]!, {
      reps: "10",
      rpe: "7.5",
      weight: "50",
    });
    await saveExercise(page, 2);

    await expect(secondCard).toHaveAttribute("data-complete", "true");
    await expect(page.getByTestId("workout-step-2")).toHaveAttribute(
      "data-complete",
      "true",
    );
    await expect(page.getByTestId("workout-finish-button")).toBeEnabled({
      timeout: 15_000,
    });

    const finishDialog = handleNextDialog(
      page,
      "Сохранить время тренировки перед завершением?",
    );
    await page.getByTestId("workout-finish-button").click();
    await finishDialog;

    await expect(
      page.getByRole("button", { name: /Вернуть в работу|Снова в работу/ }),
    ).toBeVisible();
    await expect(
      page.getByText("Тренировка завершена, время сохранено.").first(),
    ).toBeVisible();
  });

  test("reset returns focus flow to the first locked sequence", async ({
    page,
  }) => {
    const seededDay = await prepareWorkoutDay(page, "focus-reset");

    await navigateStable(
      page,
      `/workouts/day/${seededDay.dayId}?focus=1`,
      new RegExp(`/workouts/day/${seededDay.dayId}\\?focus=1$`),
    );
    await page.waitForLoadState("networkidle");

    await page.getByTestId("workout-start-button").click();
    await fillExerciseSet(page, seededDay.setIds[0]!, {
      reps: "8",
      rpe: "8",
      weight: "60",
    });
    await saveExercise(page, 1);
    await expect(page.getByTestId("workout-step-2")).toHaveAttribute(
      "data-locked",
      "false",
    );

    const resetDialog = handleNextDialog(
      page,
      "Все сохраненные повторы, вес, RPE и время",
    );
    await page.getByTestId("workout-reset-button").click();
    await resetDialog;

    await expect(page.getByTestId("workout-step-1")).toHaveAttribute(
      "data-complete",
      "false",
    );
    await expect(page.getByTestId("workout-step-2")).toHaveAttribute(
      "data-locked",
      "true",
    );
    await expect(page.getByTestId("workout-start-button")).toBeVisible();
    await expect(
      page.getByText("Тренировка обнулена. Можно начать заново."),
    ).toBeVisible();
  });
});
