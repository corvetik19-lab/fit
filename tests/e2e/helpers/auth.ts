import { expect, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const authEmail = process.env.PLAYWRIGHT_TEST_EMAIL ?? null;
const authPassword = process.env.PLAYWRIGHT_TEST_PASSWORD ?? null;
const onboardingName = process.env.PLAYWRIGHT_TEST_FULL_NAME ?? "Leva Demo";
const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL ?? null;
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? null;
const adminFullName = process.env.PLAYWRIGHT_ADMIN_FULL_NAME ?? "Root Admin";

type AuthCredentials = {
  email: string;
  fullName: string;
  password: string;
};

export function hasAuthE2ECredentials() {
  return Boolean(authEmail && authPassword);
}

export function hasAdminE2ECredentials() {
  return Boolean(adminEmail && adminPassword);
}

export async function signInAndFinishOnboarding(page: Page) {
  if (!authEmail || !authPassword) {
    throw new Error(
      "PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD are required for authenticated e2e.",
    );
  }

  return signInWithCredentials(page, {
    email: authEmail,
    password: authPassword,
    fullName: onboardingName,
  });
}

export async function signInAsAdmin(page: Page) {
  if (!adminEmail || !adminPassword) {
    throw new Error(
      "PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD are required for admin e2e.",
    );
  }

  return signInWithCredentials(page, {
    email: adminEmail,
    password: adminPassword,
    fullName: adminFullName,
  });
}

async function setFieldValue(locator: ReturnType<Page["locator"]>, value: string) {
  await locator.fill("");
  await locator.fill(value);

  const currentValue = await locator.inputValue().catch(() => "");

  if (currentValue !== value) {
    await locator.evaluate((element, nextValue) => {
      const input = element as HTMLInputElement;
      const prototype = Object.getPrototypeOf(input) as HTMLInputElement;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

      descriptor?.set?.call(input, nextValue);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  }

  await locator.blur().catch(() => undefined);
}

async function waitForPostAuthRoute(page: Page) {
  try {
    await page.waitForURL(/\/(dashboard|onboarding)/, {
      timeout: 30_000,
      waitUntil: "domcontentloaded",
    });
    return;
  } catch (error) {
    const authError = page.locator("text=/invalid login credentials/i").first();
    const visibleError = await authError.isVisible().catch(() => false);

    if (visibleError) {
      throw error;
    }
  }

  await page.goto("/dashboard", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });

  if (page.url().includes("/auth")) {
    throw new Error("Auth session was not established after sign-in.");
  }
}

async function signInWithCredentials(page: Page, credentials: AuthCredentials) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  if (page.url().includes("/dashboard")) {
    await expect(page).toHaveURL(/\/dashboard$/);
    return;
  }

  const emailField = page.locator('input[type="email"]').first();
  const passwordField = page.locator('input[type="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();

  await expect(emailField).toBeVisible();
  await expect(passwordField).toBeVisible();

  await setFieldValue(emailField, credentials.email);
  await setFieldValue(passwordField, credentials.password);
  await expect(submitButton).toBeEnabled({ timeout: 10_000 });

  await submitButton.click();
  await waitForPostAuthRoute(page);

  if (page.url().includes("/onboarding")) {
    await completeOnboarding(page, credentials.fullName);
  }

  await expect(page).toHaveURL(/\/dashboard$/);
}

async function completeOnboarding(page: Page, fullName: string) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(250);

  const textInputs = page.locator('input[type="text"]');
  const numberInputs = page.locator('input[type="number"]');
  const selects = page.locator("select");
  const submitButton = page.locator('button[type="button"]').first();

  await expect(textInputs.first()).toBeVisible();
  await expect(numberInputs).toHaveCount(5);
  await expect(selects).toHaveCount(3);

  await setFieldValue(textInputs.first(), fullName);
  await setFieldValue(numberInputs.nth(0), "30");
  await selects.nth(0).selectOption("male");
  await selects.nth(1).selectOption("intermediate");
  await setFieldValue(numberInputs.nth(1), "180");
  await setFieldValue(numberInputs.nth(2), "80");
  await setFieldValue(numberInputs.nth(3), "3");

  await expect(submitButton).toBeEnabled();
  await submitButton.click();
  await page.waitForURL(/\/dashboard$/, { timeout: 20_000 });
}
