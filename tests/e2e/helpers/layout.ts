import { expect, type Page } from "@playwright/test";

export async function expectNoHorizontalOverflow(page: Page, label: string) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;

        return {
          clientWidth: doc.clientWidth,
          scrollWidth: Math.max(doc.scrollWidth, body?.scrollWidth ?? 0),
        };
      });

      expect(
        metrics.scrollWidth,
        `${label}: scrollWidth ${metrics.scrollWidth} should fit clientWidth ${metrics.clientWidth}`,
      ).toBeLessThanOrEqual(metrics.clientWidth + 2);
      return;
    } catch (error) {
      lastError = error;

      if (!String(error).includes("Execution context was destroyed")) {
        throw error;
      }

      await page.waitForTimeout(250);
    }
  }

  throw lastError;
}

export async function expectDrawerFillsViewport(page: Page) {
  const drawerSurface = page
    .locator('#app-mobile-drawer[aria-hidden="false"] .app-drawer__surface')
    .first();
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await expect(drawerSurface).toBeVisible();
      const metrics = await drawerSurface.evaluate((element) => {
        const rect = element.getBoundingClientRect();

        return {
          top: rect.top,
          height: rect.height,
          viewportHeight: window.innerHeight,
        };
      });

      expect(metrics.top).toBeLessThanOrEqual(1);
      expect(
        Math.abs(metrics.height - metrics.viewportHeight),
      ).toBeLessThanOrEqual(2);
      return;
    } catch (error) {
      lastError = error;
      const message = String(error);

      if (
        !message.includes("Execution context was destroyed") &&
        !message.includes("element is not attached")
      ) {
        throw error;
      }

      await page.waitForTimeout(250);
    }
  }

  throw lastError;
}
