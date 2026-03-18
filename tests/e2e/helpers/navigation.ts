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
        timeout: 45_000,
      });
      await page.waitForURL(targetUrl, { timeout: 45_000 });
      return;
    } catch (error) {
      lastError = error;

      if (
        attempt === 2 ||
        (!String(error).includes("ERR_ABORTED") &&
          !String(error).includes("Timeout"))
      ) {
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
