import { expect, type Page } from "@playwright/test";

async function waitForMainReady(page: Page) {
  await page.locator("main").waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForLoadState("domcontentloaded");
}

function isRecoverableNavigationError(error: unknown) {
  const serializedError = String(error);

  return (
    serializedError.includes("ERR_ABORTED") ||
    serializedError.includes("Timeout") ||
    serializedError.includes("frame was detached") ||
    serializedError.includes("Navigation interrupted") ||
    serializedError.includes("Target page, context or browser has been closed")
  );
}

export async function navigateStable(
  page: Page,
  targetPath: string,
  targetUrl: RegExp,
) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(targetPath, {
        waitUntil: "commit",
        timeout: 30_000,
      });
      await page.waitForURL(targetUrl, { timeout: 30_000 });
      await waitForMainReady(page);
      await page.waitForTimeout(150);
      return;
    } catch (error) {
      lastError = error;

      if (page.isClosed()) {
        throw new Error(
          `Page closed while navigating to ${targetPath}. Last error: ${String(error)}`,
        );
      }

      if (targetUrl.test(page.url())) {
        try {
          await waitForMainReady(page);
          return;
        } catch {
          // fall through to retry handling below
        }
      }

      const isRecoverable = isRecoverableNavigationError(error);

      if (attempt === 2 || !isRecoverable) {
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
