import fs from "node:fs";
import { chromium, type FullConfig } from "@playwright/test";

import {
  finishOnboardingIfVisible,
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

type AuthCredentials = NonNullable<ReturnType<typeof getAuthE2ECredentials>>;

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
    const page = await context.newPage();
    const payload = await requestSupabasePasswordAuth(credentials);

    await context.addCookies([buildSupabaseAuthCookie(baseURL, payload)]);

    await page.goto("/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    await finishOnboardingIfVisible(page, credentials.fullName);

    if (!page.url().includes("/dashboard")) {
      throw new Error("Supabase auth bootstrap did not establish a dashboard session.");
    }

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
