import { expect, type Page } from "@playwright/test";

export async function navigateStable(
  page: Page,
  targetPath: string,
  targetUrl: RegExp,
) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await page.goto(targetPath, {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });
      await page.waitForURL(targetUrl, { timeout: 45_000 });
      await page.locator("main").waitFor({ state: "visible", timeout: 15_000 });
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(150);
      return;
    } catch (error) {
      lastError = error;

      const serializedError = String(error);
      const isRecoverable =
        serializedError.includes("ERR_ABORTED") ||
        serializedError.includes("Timeout") ||
        serializedError.includes("frame was detached");

      if (attempt === 4 || !isRecoverable) {
        throw error;
      }

      await page.waitForTimeout(500);
    }
  }

  if (lastError) {
    throw lastError;
  }

  await expect(page).toHaveURL(targetUrl);
}
