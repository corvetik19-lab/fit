import { Buffer } from "node:buffer";

import { expect, test, type Locator } from "@playwright/test";

import { finishOnboardingIfVisible, hasAuthE2ECredentials } from "./helpers/auth";
import { USER_STORAGE_STATE_PATH } from "./helpers/auth-state";
import { replaceAiChatHistory } from "./helpers/ai";
import { navigateStable } from "./helpers/navigation";

const PNG_1X1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnR9f8AAAAASUVORK5CYII=";
const usesLocalPlaywrightAuth = process.env.PLAYWRIGHT_SKIP_AUTH_SETUP === "1";

test.use({
  storageState: USER_STORAGE_STATE_PATH,
});

async function ensureWebSearchEnabled(webSearchToggle: Locator) {
  await expect(webSearchToggle).toHaveAttribute("aria-pressed", "false");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await webSearchToggle.click();

    const isEnabled = await webSearchToggle
      .getAttribute("aria-pressed")
      .then((value) => value === "true")
      .catch(() => false);

    if (isEnabled) {
      return;
    }

    await webSearchToggle.page().waitForTimeout(300);
  }

  await expect
    .poll(async () => webSearchToggle.getAttribute("aria-pressed"))
    .toBe("true");
}

async function openPromptLibrary(
  promptLibrary: Locator,
  promptLibraryOpenButton: Locator,
) {
  const createToggle = promptLibrary.locator(
    '[data-testid="ai-prompt-library-toggle-create"]',
  );

  await expect
    .poll(async () => {
      const isVisible = await createToggle.isVisible().catch(() => false);

      if (isVisible) {
        return "ready";
      }

      await promptLibraryOpenButton.click({ force: true });
      await promptLibraryOpenButton.page().waitForTimeout(250);
      return createToggle.isVisible().then((value) => (value ? "ready" : "pending"));
    })
    .toBe("ready");

  return createToggle;
}

async function openPromptCreateForm(promptLibrary: Locator, createToggle: Locator) {
  const newTitleInput = promptLibrary.locator(
    '[data-testid="ai-prompt-library-new-title"]',
  );

  await expect
    .poll(async () => {
      const isVisible = await newTitleInput.isVisible().catch(() => false);

      if (isVisible) {
        return "ready";
      }

      await createToggle.click({ force: true });
      await createToggle.page().waitForTimeout(250);
      return newTitleInput.isVisible().then((value) => (value ? "ready" : "pending"));
    })
    .toBe("ready");

  return newTitleInput;
}

test.describe("ai workspace", () => {
  test.skip(
    !hasAuthE2ECredentials(),
    "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
  );

  test("prompt library, web search toggle and image upload stay usable", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const customPromptTitle = `E2E шаблон ${crypto.randomUUID().slice(0, 6)}`;
    const customPromptText =
      "Собери короткий разбор восстановления после последних тренировок.";

    await navigateStable(page, "/dashboard", /\/(dashboard|onboarding)$/);
    await finishOnboardingIfVisible(page);
    await navigateStable(page, "/ai", /\/ai$/);
    const chatPanel = page.locator('[data-testid="ai-chat-panel"]').first();
    await expect(page.getByTestId("ai-chat-composer")).toBeVisible({
      timeout: 15_000,
    });
    await expect(chatPanel.locator('[data-testid="ai-chat-toolbar"]')).toBeVisible();

    const webSearchToggle = chatPanel
      .locator('[data-testid="ai-chat-toolbar"]')
      .locator('[data-testid="ai-web-search-toggle"]');

    await ensureWebSearchEnabled(webSearchToggle);

    const promptLibrary = page.locator('[data-testid="ai-prompt-library"]');
    const promptLibraryOpenButton = chatPanel.locator(
      '[data-testid="ai-prompt-library-open"]',
    );

    const createToggle = await openPromptLibrary(
      promptLibrary,
      promptLibraryOpenButton,
    );
    await expect(promptLibrary).toBeVisible({ timeout: 10_000 });
    await expect(createToggle).toBeVisible();
    await expect(createToggle).toBeEnabled();
    const newTitleInput = await openPromptCreateForm(promptLibrary, createToggle);
    await newTitleInput.fill(customPromptTitle);
    await page
      .locator('[data-testid="ai-prompt-library-new-prompt"]')
      .fill(customPromptText);
    await page.locator('[data-testid="ai-prompt-library-save"]').click();

    const customCard = page.locator('[data-testid="ai-custom-prompt-card"]').filter({
      has: page.getByText(customPromptTitle, { exact: true }),
    });
    await expect(customCard).toBeVisible();
    await customCard.locator('[data-testid="ai-custom-prompt-insert"]').click();

    await expect(chatPanel.locator('[data-testid="ai-chat-composer"]')).toHaveValue(
      customPromptText,
    );
    await expect(promptLibrary).toHaveCount(0);

    await chatPanel.locator('[data-testid="ai-image-input"]').setInputFiles({
      name: "meal-photo.png",
      mimeType: "image/png",
      buffer: Buffer.from(PNG_1X1_BASE64, "base64"),
    });

    await expect(page.getByText("meal-photo.png", { exact: true })).toBeVisible();
  });

  test("floating AI launcher opens full agent with intent prefill", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    await navigateStable(page, "/dashboard", /\/(dashboard|onboarding)$/);
    await finishOnboardingIfVisible(page);
    await page.getByTestId("ai-assistant-widget-trigger").click();
    await expect(page.getByTestId("ai-launcher-sheet")).toBeVisible();
    await page.getByTestId("ai-launcher-action-meal-plan").click();
    await expect(page).toHaveURL(/\/ai\?intent=meal_plan&from=dashboard/);
    await expect(page.getByTestId("ai-launch-context")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("ai-chat-composer")).toHaveValue(
      /Составь черновик плана питания/,
      { timeout: 15_000 },
    );
  });

  test("chat history supports single delete and bulk clear", async ({ page }) => {
    test.setTimeout(90_000);

    if (!usesLocalPlaywrightAuth) {
      await navigateStable(page, "/dashboard", /\/(dashboard|onboarding)$/);
      await finishOnboardingIfVisible(page);
    }

    if (!usesLocalPlaywrightAuth) {
      await replaceAiChatHistory({ sessionCount: 2 });
    }

    await navigateStable(
      page,
      usesLocalPlaywrightAuth ? "/ai?e2eHistory=1" : "/ai",
      usesLocalPlaywrightAuth ? /\/ai\?e2eHistory=1$/ : /\/ai$/,
    );

    const sessionItems = page.locator('[data-testid="ai-session-item"]');
    await expect(sessionItems).toHaveCount(2, { timeout: 15_000 });

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.locator('[data-testid="ai-session-delete"]').first().click();
    await expect(sessionItems).toHaveCount(1, { timeout: 15_000 });

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.locator('[data-testid="ai-session-clear-all"]').click();
    await expect(page.locator('[data-testid="ai-session-empty-state"]')).toBeVisible();
  });
});
