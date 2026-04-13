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

test("pwa surface exposes install metadata", async ({ page, request }) => {
  await page.goto("/smoke");

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/apple-touch-icon.png",
  );
  await expect(page.locator('meta[name="application-name"]')).toHaveAttribute(
    "content",
    "fit",
  );

  const [manifestResponse, serviceWorkerResponse] = await Promise.all([
    request.get("/manifest.webmanifest"),
    request.get("/sw.js"),
  ]);

  expect(manifestResponse.ok()).toBeTruthy();
  expect(serviceWorkerResponse.ok()).toBeTruthy();

  const manifest = await manifestResponse.json();
  const serviceWorker = await serviceWorkerResponse.text();

  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/dashboard");
  expect(manifest.lang).toBe("ru");
  expect(manifest.theme_color).toBe("#0040e0");
  expect(manifest.background_color).toBe("#fcf9f8");
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        purpose: "maskable",
        sizes: "512x512",
      }),
    ]),
  );
  expect(serviceWorker).toContain("skipWaiting");
  expect(serviceWorker).toContain("clients.claim");
});

test("android twa asset links endpoint is reachable", async ({ request }) => {
  const response = await request.get("/.well-known/assetlinks.json");

  expect(response.ok()).toBeTruthy();

  const statements = await response.json();

  expect(Array.isArray(statements)).toBeTruthy();

  if (statements.length > 0) {
    expect(statements[0]).toEqual(
      expect.objectContaining({
        relation: expect.arrayContaining(["delegate_permission/common.handle_all_urls"]),
        target: expect.objectContaining({
          namespace: "android_app",
        }),
      }),
    );
  }
});
