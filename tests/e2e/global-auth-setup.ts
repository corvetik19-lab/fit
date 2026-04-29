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
  type SupabaseAuthResponse,
} from "./helpers/supabase-password-auth";
import { ensureOnboardingTestData } from "./helpers/supabase-admin";

type AuthCredentials = NonNullable<ReturnType<typeof getAuthE2ECredentials>>;

function writeSyntheticStorageState(
  baseURL: string,
  filePath: string,
  credentials: AuthCredentials | null,
) {
  if (!credentials) {
    writeEmptyStorageState(filePath);
    return;
  }

  const expiresAt = Math.floor(Date.now() / 1_000) + 24 * 60 * 60;
  const payload = {
    access_token: `playwright-access-${credentials.email}`,
    expires_at: expiresAt,
    expires_in: 24 * 60 * 60,
    refresh_token: `playwright-refresh-${credentials.email}`,
    token_type: "bearer",
    user: {
      id:
        credentials.email === getAdminE2ECredentials()?.email
          ? "00000000-0000-4000-8000-000000000002"
          : "00000000-0000-4000-8000-000000000001",
      aud: "authenticated",
      role: "authenticated",
      email: credentials.email,
      user_metadata: {
        full_name: credentials.fullName,
      },
      app_metadata: {
        provider: "email",
        providers: ["email"],
      },
    },
  } satisfies SupabaseAuthResponse;

  ensureAuthStateDir();
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        cookies: [buildSupabaseAuthCookie(baseURL, payload)],
        origins: [],
      },
      null,
      2,
    ),
  );
}

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

async function saveStorageStateOrReuseExisting(
  baseURL: string,
  filePath: string,
  credentials: AuthCredentials | null,
) {
  if (!credentials) {
    writeEmptyStorageState(filePath);
    return;
  }

  try {
    await saveSupabaseStorageState(baseURL, filePath, credentials);
  } catch (error) {
    const canReuseExistingState =
      fs.existsSync(filePath) && fs.statSync(filePath).size > 0;

    if (!canReuseExistingState) {
      throw error;
    }

    console.warn(
      `Playwright auth bootstrap reused existing storage state after transient auth failure for ${credentials.email}: ${String(error)}`,
    );
  }
}

export default async function globalAuthSetup(config: FullConfig) {
  ensureAuthStateDir();

  const baseURL =
    config.projects.find((project) => typeof project.use.baseURL === "string")?.use
      .baseURL ?? "http://127.0.0.1:3000";

  if (process.env.PLAYWRIGHT_SKIP_AUTH_SETUP === "1") {
    writeSyntheticStorageState(baseURL, USER_STORAGE_STATE_PATH, getAuthE2ECredentials());
    writeSyntheticStorageState(
      baseURL,
      ADMIN_STORAGE_STATE_PATH,
      getAdminE2ECredentials(),
    );
    return;
  }

  if (hasAuthE2ECredentials()) {
    await saveStorageStateOrReuseExisting(
      baseURL,
      USER_STORAGE_STATE_PATH,
      getAuthE2ECredentials(),
    );
  } else {
    writeEmptyStorageState(USER_STORAGE_STATE_PATH);
  }

  if (hasAdminE2ECredentials()) {
    await saveStorageStateOrReuseExisting(
      baseURL,
      ADMIN_STORAGE_STATE_PATH,
      getAdminE2ECredentials(),
    );
  } else {
    writeEmptyStorageState(ADMIN_STORAGE_STATE_PATH);
  }
}
