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

type SeededWorkoutDay = Awaited<
  ReturnType<typeof createLockedWorkoutDayWithExercises>
>;

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
  const saveButton = page.getByTestId(`workout-exercise-save-${stepNumber}`);
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
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
    const seededDay = await createLockedWorkoutDayWithExercises(
      page,
      "focus-flow",
      2,
    );

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
    await page.getByTestId(`workout-set-${seededDay.setIds[0]}-weight`).fill("62");
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
    await expect(page.getByTestId("workout-finish-button")).toBeEnabled();

    const finishDialog = handleNextDialog(
      page,
      "Сохранить время тренировки перед завершением?",
    );
    await page.getByTestId("workout-finish-button").click();
    await finishDialog;

    await expect(
      page.getByRole("button", { name: "Снова в работу" }),
    ).toBeVisible();
    await expect(page.getByText("Тренировка завершена, время сохранено.")).toBeVisible();
  });

  test("reset returns focus flow to the first locked sequence", async ({
    page,
  }) => {
    const seededDay = await createLockedWorkoutDayWithExercises(
      page,
      "focus-reset",
      2,
    );

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
    await expect(page.getByText("Тренировка обнулена. Можно начать заново.")).toBeVisible();
  });
});
