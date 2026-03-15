import { expect, type Page } from "@playwright/test";

export async function navigateStable(
  page: Page,
  targetPath: string,
  targetUrl: RegExp,
) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(targetPath, {
        waitUntil: "domcontentloaded",
        timeout: 20_000,
      });
      await page.waitForURL(targetUrl, { timeout: 20_000 });
      return;
    } catch (error) {
      lastError = error;

      if (!String(error).includes("ERR_ABORTED")) {
        throw error;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  await expect(page).toHaveURL(targetUrl);
}
