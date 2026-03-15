import { chromium, type FullConfig } from "@playwright/test";

import {
  hasAdminE2ECredentials,
  hasAuthE2ECredentials,
  signInAndFinishOnboarding,
  signInAsAdmin,
} from "./helpers/auth";
import {
  ADMIN_STORAGE_STATE_PATH,
  USER_STORAGE_STATE_PATH,
  ensureAuthStateDir,
  writeEmptyStorageState,
} from "./helpers/auth-state";

async function saveStorageState(
  baseURL: string,
  filePath: string,
  signIn: (page: Parameters<typeof signInAndFinishOnboarding>[0]) => Promise<void>,
) {
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      baseURL,
    });
    const page = await context.newPage();

    await signIn(page);
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
    writeEmptyStorageState(USER_STORAGE_STATE_PATH);
    writeEmptyStorageState(ADMIN_STORAGE_STATE_PATH);
    return;
  }

  const baseURL =
    config.projects.find((project) => typeof project.use.baseURL === "string")?.use
      .baseURL ?? "http://127.0.0.1:3000";

  if (hasAuthE2ECredentials()) {
    await saveStorageState(baseURL, USER_STORAGE_STATE_PATH, signInAndFinishOnboarding);
  } else {
    writeEmptyStorageState(USER_STORAGE_STATE_PATH);
  }

  if (hasAdminE2ECredentials()) {
    await saveStorageState(baseURL, ADMIN_STORAGE_STATE_PATH, signInAsAdmin);
  } else {
    writeEmptyStorageState(ADMIN_STORAGE_STATE_PATH);
  }
}
