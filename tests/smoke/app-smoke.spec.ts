import { expect, test } from "@playwright/test";

test("smoke page is reachable", async ({ page }) => {
  await page.goto("/smoke");

  await expect(page).toHaveTitle(/fit smoke/i);
  await expect(page.getByTestId("smoke-status")).toHaveText("ok");
  await expect(page.getByRole("heading", { name: "fit smoke" })).toBeVisible();
});

test("health api returns ok", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toEqual({
    app: "fit",
    status: "ok",
  });
});

test("pwa assets are reachable", async ({ request }) => {
  const [manifestResponse, offlineResponse] = await Promise.all([
    request.get("/manifest.webmanifest"),
    request.get("/offline.html"),
  ]);

  expect(manifestResponse.ok()).toBeTruthy();
  expect(offlineResponse.ok()).toBeTruthy();

  const manifest = await manifestResponse.json();
  const offlineHtml = await offlineResponse.text();

  expect(manifest.name).toContain("fit");
  expect(Array.isArray(manifest.icons)).toBeTruthy();
  expect(offlineHtml).toContain("fit offline");
});
