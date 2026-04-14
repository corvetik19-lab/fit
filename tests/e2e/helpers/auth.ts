import { expect, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import {
  buildSupabaseAuthCookie,
  requestSupabasePasswordAuth,
} from "./supabase-password-auth";

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

export function getAuthE2ECredentials(): AuthCredentials | null {
  if (!authEmail || !authPassword) {
    return null;
  }

  return {
    email: authEmail,
    password: authPassword,
    fullName: onboardingName,
  };
}

export function getAdminE2ECredentials(): AuthCredentials | null {
  if (!adminEmail || !adminPassword) {
    return null;
  }

  return {
    email: adminEmail,
    password: adminPassword,
    fullName: adminFullName,
  };
}

export function hasAuthE2ECredentials() {
  return Boolean(authEmail && authPassword);
}

export function hasAdminE2ECredentials() {
  return Boolean(adminEmail && adminPassword);
}

export async function signInAndFinishOnboarding(page: Page) {
  const credentials = getAuthE2ECredentials();

  if (!credentials) {
    throw new Error(
      "PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD are required for authenticated e2e.",
    );
  }

  return signInWithCredentials(page, credentials);
}

export async function finishOnboardingIfVisible(
  page: Page,
  fullName = onboardingName,
) {
  if (!page.url().includes("/onboarding")) {
    return;
  }

  await completeOnboarding(page, fullName);
}

export async function signInAsAdmin(page: Page) {
  const credentials = getAdminE2ECredentials();

  if (!credentials) {
    throw new Error(
      "PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD are required for admin e2e.",
    );
  }

  return signInWithCredentials(page, credentials);
}

async function setFieldValue(locator: ReturnType<Page["locator"]>, value: string) {
  await expect(locator).toBeEditable({ timeout: 15_000 });
  await locator.click();
  await locator.press("Control+A").catch(() => undefined);
  await locator.press("Delete").catch(() => undefined);
  await locator.pressSequentially(value, { delay: 12 }).catch(() => undefined);

  const currentValue = await locator.inputValue().catch(() => "");

  if (currentValue !== value) {
    await locator.fill("").catch(() => undefined);
    await locator.fill(value).catch(() => undefined);
  }

  const filledValue = await locator.inputValue().catch(() => "");

  if (filledValue !== value) {
    await locator.evaluate((element, nextValue) => {
      const input = element as HTMLInputElement;
      const prototype = Object.getPrototypeOf(input) as HTMLInputElement;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

      descriptor?.set?.call(input, nextValue);
      input.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          data: nextValue,
          inputType: "insertText",
        }),
      );
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
    }, value);
  }

  await locator.blur().catch(() => undefined);
  await expect(locator).toHaveValue(value, { timeout: 10_000 });
}

async function waitForSubmitButtonReady(page: Page) {
  const submitSelector = 'button[type="submit"]';
  const emailSelector = 'input[type="email"]';
  const passwordSelector = 'input[type="password"]';

  try {
    await page.waitForFunction(
      ({ emailSelector: nextEmailSelector, passwordSelector: nextPasswordSelector, submitSelector: nextSubmitSelector }) => {
        const emailInput = document.querySelector<HTMLInputElement>(nextEmailSelector);
        const passwordInput =
          document.querySelector<HTMLInputElement>(nextPasswordSelector);
        const submitButton =
          document.querySelector<HTMLButtonElement>(nextSubmitSelector);

        return Boolean(
          emailInput?.value.trim() &&
            passwordInput?.value.trim() &&
            submitButton &&
            !submitButton.disabled,
        );
      },
      { emailSelector, passwordSelector, submitSelector },
      { timeout: 10_000 },
    );
    return;
  } catch {
    await page.locator(emailSelector).evaluate((element) => {
      const input = element as HTMLInputElement;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new Event("blur", { bubbles: true }));
    });
    await page.locator(passwordSelector).evaluate((element) => {
      const input = element as HTMLInputElement;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new Event("blur", { bubbles: true }));
    });
  }

  await expect(page.locator(submitSelector).first()).toBeEnabled({
    timeout: 10_000,
  });
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

async function describeAuthFailure(page: Page, phase: string) {
  const candidateSelectors = [
    '[role="alert"]',
    '[data-testid*="error"]',
    'text=/failed to fetch/i',
    'text=/invalid login credentials/i',
    'text=/не удалось/i',
    'text=/ошибка/i',
  ] as const;

  let visibleError = "";

  for (const selector of candidateSelectors) {
    const locator = page.locator(selector).first();
    const isVisible = await locator.isVisible().catch(() => false);

    if (!isVisible) {
      continue;
    }

    visibleError = (await locator.innerText().catch(() => "")).trim();
    if (visibleError) {
      break;
    }
  }

  const bodyExcerpt = (await page.locator("body").innerText().catch(() => ""))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 260);

  const details = [
    `${phase}.`,
    `Current URL: ${page.url()}.`,
    `Visible error: ${visibleError || "none"}.`,
    `Body excerpt: ${bodyExcerpt || "none"}.`,
  ];

  return details.join(" ");
}

async function bootstrapSessionFromSupabase(
  page: Page,
  credentials: AuthCredentials,
) {
  const payload = await requestSupabasePasswordAuth({
    email: credentials.email,
    password: credentials.password,
  });

  await page.context().addCookies([
    buildSupabaseAuthCookie(page.url() || "http://127.0.0.1:3100", payload),
  ]);
}

async function signInWithCredentials(page: Page, credentials: AuthCredentials) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1_000);

  if (page.url().includes("/dashboard")) {
    await expect(page).toHaveURL(/\/dashboard$/);
    return;
  }

  const emailField = page.locator('input[type="email"]').first();
  const passwordField = page.locator('input[type="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();

  await expect(emailField).toBeVisible();
  await expect(passwordField).toBeVisible();
  await expect(submitButton).toBeVisible();
  await page.waitForTimeout(300);

  await setFieldValue(emailField, credentials.email);
  await setFieldValue(passwordField, credentials.password);
  await waitForSubmitButtonReady(page);

  try {
    await submitButton.click();
    await waitForPostAuthRoute(page);

    if (page.url().includes("/onboarding")) {
      await completeOnboarding(page, credentials.fullName);
    }

    await expect(page).toHaveURL(/\/dashboard$/);
    return;
  } catch {
    await bootstrapSessionFromSupabase(page, credentials);
    await page.goto("/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    if (page.url().includes("/onboarding")) {
      await completeOnboarding(page, credentials.fullName);
    }

    try {
      await expect(page).toHaveURL(/\/dashboard$/);
      return;
    } catch {
      throw new Error(
        await describeAuthFailure(page, "Auth redirect did not reach /dashboard"),
      );
    }
  }
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

  try {
    await page.waitForURL(/\/dashboard$/, { timeout: 45_000 });
    return;
  } catch {
    await page.waitForTimeout(500);
    await submitButton.click();
    await page.waitForURL(/\/dashboard$/, { timeout: 45_000 });
  }
}
