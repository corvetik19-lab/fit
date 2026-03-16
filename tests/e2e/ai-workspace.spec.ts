import { Buffer } from "node:buffer";

import { expect, test, type Locator } from "@playwright/test";

import { hasAuthE2ECredentials } from "./helpers/auth";
import { USER_STORAGE_STATE_PATH } from "./helpers/auth-state";
import { ensureAiChatSession } from "./helpers/ai";
import { navigateStable } from "./helpers/navigation";

const PNG_1X1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnR9f8AAAAASUVORK5CYII=";

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

test.describe("ai workspace", () => {
  test.skip(
    !hasAuthE2ECredentials(),
    "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
  );

  test("prompt library, web search toggle and image upload stay usable", async ({
    page,
  }) => {
    const customPromptTitle = `E2E шаблон ${crypto.randomUUID().slice(0, 6)}`;
    const customPromptText =
      "Собери короткий разбор восстановления после последних тренировок.";

    await navigateStable(page, "/ai", /\/ai$/);
    const chatPanel = page.locator('[data-testid="ai-chat-panel"]').first();
    await expect(chatPanel).toHaveAttribute("data-hydrated", "true");
    await expect(
      chatPanel.locator('[data-testid="ai-chat-composer"]'),
    ).toBeVisible();

    const webSearchToggle = chatPanel
      .locator('[data-testid="ai-chat-toolbar"]')
      .locator('[data-testid="ai-web-search-toggle"]');

    await ensureWebSearchEnabled(webSearchToggle);

    const promptLibrary = page.locator('[data-testid="ai-prompt-library"]');
    const promptLibraryOpenButton = chatPanel.locator(
      '[data-testid="ai-prompt-library-open"]',
    );

    await promptLibraryOpenButton.click();
    if (!(await promptLibrary.isVisible().catch(() => false))) {
      await page.waitForTimeout(200);
      await promptLibraryOpenButton.click();
    }
    await expect(promptLibrary).toBeVisible({ timeout: 10_000 });

    await page.locator('[data-testid="ai-prompt-library-toggle-create"]').click();
    await page
      .locator('[data-testid="ai-prompt-library-new-title"]')
      .fill(customPromptTitle);
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

  test("chat history supports single delete and bulk clear", async ({ page }) => {
    await navigateStable(page, "/dashboard", /\/dashboard$/);
    await page.waitForLoadState("networkidle");

    await ensureAiChatSession(page);
    await ensureAiChatSession(page);

    await navigateStable(page, "/ai", /\/ai$/);

    const sessionItems = page.locator('[data-testid="ai-session-item"]');
    const initialCount = await sessionItems.count();
    expect(initialCount).toBeGreaterThanOrEqual(2);

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.locator('[data-testid="ai-session-delete"]').first().click();
    await expect(sessionItems).toHaveCount(initialCount - 1);

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.locator('[data-testid="ai-session-clear-all"]').click();
    await expect(page.locator('[data-testid="ai-session-empty-state"]')).toBeVisible();
  });
});
