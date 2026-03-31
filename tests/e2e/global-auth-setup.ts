import fs from "node:fs";
import { chromium, type FullConfig } from "@playwright/test";

import {
  getAdminE2ECredentials,
  getAuthE2ECredentials,
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

type SupabaseAuthResponse = {
  access_token: string;
  expires_at?: number;
  expires_in?: number;
  refresh_token: string;
  token_type: string;
  user: Record<string, unknown>;
};

type PlaywrightCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Lax";
};

function getSupabaseProjectRef() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  return new URL(supabaseUrl).host.split(".")[0] ?? null;
}

function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    null
  );
}

async function createSupabaseStorageState(
  baseURL: string,
  filePath: string,
  credentials: NonNullable<ReturnType<typeof getAuthE2ECredentials>>,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublicKey = getSupabasePublicKey();
  const projectRef = getSupabaseProjectRef();

  if (!supabaseUrl || !supabasePublicKey || !projectRef) {
    throw new Error("Supabase public env is not configured for Playwright auth bootstrap.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: supabasePublicKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | SupabaseAuthResponse
    | { error_description?: string; msg?: string }
    | null;

  if (!response.ok || !payload || !("access_token" in payload)) {
    throw new Error(
      payload && "error_description" in payload && payload.error_description
        ? payload.error_description
        : payload && "msg" in payload && payload.msg
          ? payload.msg
          : "Supabase password auth failed during Playwright bootstrap.",
    );
  }

  const origin = new URL(baseURL);
  const expires =
    payload.expires_at ??
    Math.floor(Date.now() / 1_000) + (payload.expires_in ?? 3_600);

  const authCookie: PlaywrightCookie = {
    name: `sb-${projectRef}-auth-token`,
    value: `base64-${Buffer.from(JSON.stringify(payload)).toString("base64")}`,
    domain: origin.hostname,
    path: "/",
    expires,
    httpOnly: false,
    secure: origin.protocol === "https:",
    sameSite: "Lax",
  };

  ensureAuthStateDir();
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        cookies: [authCookie],
        origins: [],
      },
      null,
      2,
    ),
  );
}

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
      try {
        await createSupabaseStorageState(baseURL, USER_STORAGE_STATE_PATH, credentials);
      } catch {
        await saveStorageState(baseURL, USER_STORAGE_STATE_PATH, signInAndFinishOnboarding);
      }
    }
  } else {
    writeEmptyStorageState(USER_STORAGE_STATE_PATH);
  }

  if (hasAdminE2ECredentials()) {
    const credentials = getAdminE2ECredentials();

    if (!credentials) {
      writeEmptyStorageState(ADMIN_STORAGE_STATE_PATH);
    } else {
      try {
        await createSupabaseStorageState(baseURL, ADMIN_STORAGE_STATE_PATH, credentials);
      } catch {
        await saveStorageState(baseURL, ADMIN_STORAGE_STATE_PATH, signInAsAdmin);
      }
    }
  } else {
    writeEmptyStorageState(ADMIN_STORAGE_STATE_PATH);
  }
}
