import { expect, type Page } from "@playwright/test";

const authEmail = process.env.PLAYWRIGHT_TEST_EMAIL ?? null;
const authPassword = process.env.PLAYWRIGHT_TEST_PASSWORD ?? null;
const onboardingName = process.env.PLAYWRIGHT_TEST_FULL_NAME ?? "Leva Demo";

export function hasAuthE2ECredentials() {
  return Boolean(authEmail && authPassword);
}

export async function signInAndFinishOnboarding(page: Page) {
  if (!authEmail || !authPassword) {
    throw new Error(
      "PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD are required for authenticated e2e.",
    );
  }

  await page.goto("/");

  if (page.url().includes("/dashboard")) {
    await expect(page).toHaveURL(/\/dashboard$/);
    return;
  }

  await expect(
    page.getByRole("heading", { name: "Войдите в приложение" }),
  ).toBeVisible();

  const emailField = page.getByRole("textbox", { name: "Email" });
  const passwordField = page.locator('input[type="password"]');
  const submitButton = page.getByRole("button", { name: "Войти" });

  await emailField.click();
  await emailField.pressSequentially(authEmail, { delay: 20 });
  await expect(emailField).toHaveValue(authEmail);

  await passwordField.click();
  await passwordField.pressSequentially(authPassword, { delay: 20 });
  await expect(passwordField).toHaveValue(authPassword);

  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 });

  if (page.url().includes("/onboarding")) {
    await completeOnboarding(page);
  }

  await expect(page).toHaveURL(/\/dashboard$/);
}

async function completeOnboarding(page: Page) {
  await page.getByLabel("Имя").fill(onboardingName);
  await page.getByLabel("Возраст").fill("30");
  await page.getByLabel("Пол").selectOption("male");
  await page.getByLabel("Уровень подготовки").selectOption("intermediate");
  await page.getByLabel("Рост, см").fill("180");
  await page.getByLabel("Вес, кг").fill("80");
  await page.getByLabel("Тренировок в неделю").fill("3");
  await page.getByRole("button", { name: "Сохранить и продолжить" }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 20_000 });
}
