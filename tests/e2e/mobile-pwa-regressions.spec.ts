import { expect, test } from "@playwright/test";

import {
  hasAdminE2ECredentials,
  hasAuthE2ECredentials,
} from "./helpers/auth";
import {
  ADMIN_STORAGE_STATE_PATH,
  USER_STORAGE_STATE_PATH,
} from "./helpers/auth-state";
import { startClientRegressionCapture } from "./helpers/client-regressions";
import {
  expectDrawerFillsViewport,
  expectNoHorizontalOverflow,
} from "./helpers/layout";
import { navigateStable } from "./helpers/navigation";
import { createLockedWorkoutDay } from "./helpers/workouts";

const mobileUse = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
} as const;

async function toggleFocusHeader(
  page: Parameters<typeof expectNoHorizontalOverflow>[0],
  expectedExpanded: "true" | "false",
) {
  const collapseToggle = page.getByTestId("workout-focus-header-toggle");

  await expect
    .poll(async () => {
      const currentValue = await collapseToggle.getAttribute("aria-expanded");

      if (currentValue === expectedExpanded) {
        return currentValue;
      }

      await collapseToggle.click({ force: true });
      await page.waitForTimeout(250);
      return collapseToggle.getAttribute("aria-expanded");
    })
    .toBe(expectedExpanded);
}

async function openMobileDrawer(
  page: Parameters<typeof expectNoHorizontalOverflow>[0],
) {
  const drawerToggle = page
    .getByTestId("app-mobile-header-drawer-toggle")
    .first();
  const drawer = page.getByTestId("app-mobile-drawer").first();

  await expect(drawerToggle).toBeVisible({ timeout: 15_000 });

  await expect
    .poll(async () => {
      const ariaHidden = await drawer.getAttribute("aria-hidden");

      if (ariaHidden === "false") {
        return ariaHidden;
      }

      await drawerToggle.click({ force: true });
      await page.waitForTimeout(250);
      return drawer.getAttribute("aria-hidden");
    })
    .toBe("false");

  return drawer;
}

test.describe("mobile pwa regressions", () => {
  test.describe.configure({ timeout: 90_000 });

  test.describe("user mobile surfaces", () => {
    test.use({
      ...mobileUse,
      storageState: USER_STORAGE_STATE_PATH,
    });

    test.skip(
      !hasAuthE2ECredentials(),
      "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
    );

    test("mobile shell drawer and workspace sections stay usable without overflow", async ({
      page,
    }) => {
      const regressionCapture = startClientRegressionCapture(page);

      try {
        await navigateStable(page, "/dashboard", /\/dashboard$/);
        await page.waitForTimeout(300);
        await expectNoHorizontalOverflow(page, "/dashboard");

        const drawer = await openMobileDrawer(page);
        await expectDrawerFillsViewport(page);
        await expect(drawer).toContainText("Разделы");
        await expect(drawer).toContainText("Настройки");
        await page.keyboard.press("Escape");
        await expect(drawer).toHaveAttribute("aria-hidden", "true");

        const dashboardSectionTrigger = page.getByTestId(
          "dashboard-workspace-mobile-trigger",
        );
        await expect(dashboardSectionTrigger).toBeVisible();
        await dashboardSectionTrigger.click();
        await page.getByTestId("dashboard-workspace-option-ai").click();
        await expect(dashboardSectionTrigger).toContainText("AI");
        await expectNoHorizontalOverflow(page, "dashboard section switch");

        await navigateStable(page, "/workouts", /\/workouts$/);
        await page.waitForTimeout(300);
        await expectNoHorizontalOverflow(page, "/workouts");
        const workoutsSectionTrigger = page.getByTestId(
          "page-workspace-mobile-trigger",
        );
        await expect(workoutsSectionTrigger).toBeVisible();
        await workoutsSectionTrigger.click();
        await page.getByTestId("page-workspace-mobile-option-library").click();
        await expect(workoutsSectionTrigger).toContainText("Упражнения");
        const menuVisibilityButton = page.getByTestId(
          "page-workspace-visibility-menu",
        );
        await menuVisibilityButton.click();
        await expect(menuVisibilityButton).toHaveAttribute("aria-pressed", "false");
        await menuVisibilityButton.click();
        await expect(menuVisibilityButton).toHaveAttribute("aria-pressed", "true");
        await expectNoHorizontalOverflow(page, "workouts section controls");

        await navigateStable(page, "/nutrition", /\/nutrition$/);
        await page.waitForTimeout(300);
        await expectNoHorizontalOverflow(page, "/nutrition");
        const nutritionSectionTrigger = page.getByTestId(
          "page-workspace-mobile-trigger",
        );
        await expect(nutritionSectionTrigger).toBeVisible();
        await nutritionSectionTrigger.click();
        await page.getByTestId("page-workspace-mobile-option-log").click();
        await expect(nutritionSectionTrigger).toContainText("Журнал и база");
        const sectionVisibilityButton = page.getByTestId(
          "page-workspace-visibility-section",
        );
        await sectionVisibilityButton.click();
        await expect(sectionVisibilityButton).toHaveAttribute(
          "aria-pressed",
          "false",
        );
        await sectionVisibilityButton.click();
        await expect(sectionVisibilityButton).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await expectNoHorizontalOverflow(page, "nutrition section controls");

        regressionCapture.assertNone();
      } finally {
        regressionCapture.stop();
      }
    });

    test("mobile workout focus mode stays compact and stable", async ({
      page,
    }) => {
      const seededDay = await createLockedWorkoutDay(
        page,
        "mobile-pwa-regression",
      );
      const regressionCapture = startClientRegressionCapture(page);

      try {
        await navigateStable(
          page,
          `/workouts/day/${seededDay.dayId}?focus=1`,
          new RegExp(`/workouts/day/${seededDay.dayId}\\?focus=1$`),
        );
        await page.waitForTimeout(300);

        const collapseToggle = page.getByTestId("workout-focus-header-toggle");
        await expect(collapseToggle).toBeVisible();
        await expectNoHorizontalOverflow(page, "workout focus mode");

        const normalViewButton = page.getByTestId(
          "workout-regular-mode-button",
        );
        if (!(await normalViewButton.isVisible().catch(() => false))) {
          await page.waitForTimeout(400);
        }
        await expect(normalViewButton).toBeVisible();

        await toggleFocusHeader(page, "false");
        await expectNoHorizontalOverflow(page, "collapsed workout focus header");
        await toggleFocusHeader(page, "true");

        regressionCapture.assertNone();
      } finally {
        regressionCapture.stop();
      }
    });
  });

  test.describe("admin mobile surfaces", () => {
    test.use({
      ...mobileUse,
      storageState: ADMIN_STORAGE_STATE_PATH,
    });

    test.skip(
      !hasAdminE2ECredentials(),
      "requires PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD",
    );

    test("root admin mobile shell and admin workspace stay usable without layout regressions", async ({
      page,
    }) => {
      const regressionCapture = startClientRegressionCapture(page);

      try {
        await navigateStable(page, "/admin", /\/admin$/);
        await page.waitForTimeout(300);
        await expectNoHorizontalOverflow(page, "/admin");

        const drawer = await openMobileDrawer(page);
        await expectDrawerFillsViewport(page);
        await expect(drawer).toContainText("Разделы");
        await expect(drawer).toContainText("Пользователи");
        await expect(page.getByTestId("ai-assistant-widget-trigger")).toBeHidden();

        await page.keyboard.press("Escape");
        await expect(drawer).toHaveAttribute("aria-hidden", "true");
        await expectNoHorizontalOverflow(page, "admin mobile drawer");
        await expect(page.getByTestId("ai-assistant-widget-trigger")).toBeHidden();
        await expect(page.getByTestId("admin-page-open-users-link")).toBeVisible();
        await expect(page.getByTestId("admin-page-open-self-link")).toBeVisible();
        await expectNoHorizontalOverflow(page, "admin mobile workspace");

        regressionCapture.assertNone();
      } finally {
        regressionCapture.stop();
      }
    });
  });
});
