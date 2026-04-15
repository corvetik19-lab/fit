import fs from "node:fs";
import {
  chromium,
  type BrowserContext,
  type FullConfig,
} from "@playwright/test";

import {
  getAdminE2ECredentials,
  getAuthE2ECredentials,
  hasAdminE2ECredentials,
  hasAuthE2ECredentials,
} from "./helpers/auth";
import {
  ADMIN_STORAGE_STATE_PATH,
  USER_STORAGE_STATE_PATH,
  ensureAuthStateDir,
  writeEmptyStorageState,
} from "./helpers/auth-state";
import {
  buildSupabaseAuthCookie,
  requestSupabasePasswordAuth,
} from "./helpers/supabase-password-auth";
import { ensureOnboardingTestData } from "./helpers/supabase-admin";

type AuthCredentials = NonNullable<ReturnType<typeof getAuthE2ECredentials>>;

async function probeSessionOnHome(baseURL: string, context: BrowserContext) {
  const page = await context.newPage();

  try {
    await page.goto(new URL("/", baseURL).toString(), {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
  } catch (error) {
    console.warn(
      `Playwright auth bootstrap skipped home probe after request failure: ${String(error)}`,
    );
  } finally {
    await page.close().catch(() => undefined);
  }
}

async function seedAuthStorageState(
  baseURL: string,
  context: BrowserContext,
  credentials: AuthCredentials,
) {
  try {
    await ensureOnboardingTestData(credentials.email, credentials.fullName);
  } catch (error) {
    console.warn(
      `Playwright onboarding bootstrap will fall back to runtime flow after admin seed failure: ${String(error)}`,
    );
    await probeSessionOnHome(baseURL, context);
  }
}

async function saveSupabaseStorageState(
  baseURL: string,
  filePath: string,
  credentials: AuthCredentials,
) {
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      baseURL,
    });
    const payload = await requestSupabasePasswordAuth({
      email: credentials.email,
      password: credentials.password,
    });

    await context.addCookies([buildSupabaseAuthCookie(baseURL, payload)]);
    await seedAuthStorageState(baseURL, context, credentials);

    ensureAuthStateDir();
    await context.storageState({
      path: filePath,
    });
    await context.close();
  } finally {
    await browser.close();
  }
}

export default async function globalAuthSetup(config: FullConfig) {
  ensureAuthStateDir();

  if (process.env.PLAYWRIGHT_SKIP_AUTH_SETUP === "1") {
    if (!fs.existsSync(USER_STORAGE_STATE_PATH)) {
      writeEmptyStorageState(USER_STORAGE_STATE_PATH);
    }

    if (!fs.existsSync(ADMIN_STORAGE_STATE_PATH)) {
      writeEmptyStorageState(ADMIN_STORAGE_STATE_PATH);
    }

    return;
  }

  const baseURL =
    config.projects.find((project) => typeof project.use.baseURL === "string")?.use
      .baseURL ?? "http://127.0.0.1:3000";

  if (hasAuthE2ECredentials()) {
    const credentials = getAuthE2ECredentials();

    if (!credentials) {
      writeEmptyStorageState(USER_STORAGE_STATE_PATH);
    } else {
      await saveSupabaseStorageState(baseURL, USER_STORAGE_STATE_PATH, credentials);
    }
  } else {
    writeEmptyStorageState(USER_STORAGE_STATE_PATH);
  }

  if (hasAdminE2ECredentials()) {
    const credentials = getAdminE2ECredentials();

    if (!credentials) {
      writeEmptyStorageState(ADMIN_STORAGE_STATE_PATH);
    } else {
      await saveSupabaseStorageState(baseURL, ADMIN_STORAGE_STATE_PATH, credentials);
    }
  } else {
    writeEmptyStorageState(ADMIN_STORAGE_STATE_PATH);
  }
}
