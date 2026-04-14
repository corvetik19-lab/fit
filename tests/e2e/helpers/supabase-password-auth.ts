import { setTimeout as delay } from "node:timers/promises";

const SUPABASE_AUTH_RETRY_DELAYS_MS = [750, 1_500, 3_000] as const;
const SUPABASE_AUTH_TIMEOUT_MS = 20_000;

export type SupabaseAuthResponse = {
  access_token: string;
  expires_at?: number;
  expires_in?: number;
  refresh_token: string;
  token_type: string;
  user: Record<string, unknown>;
};

export type PlaywrightCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Lax";
};

export function getSupabaseProjectRef() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  return new URL(supabaseUrl).host.split(".")[0] ?? null;
}

export function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    null
  );
}

function getSupabaseAuthErrorMessage(
  payload:
    | SupabaseAuthResponse
    | { error_description?: string; msg?: string }
    | null,
) {
  if (payload && "error_description" in payload && payload.error_description) {
    return payload.error_description;
  }

  if (payload && "msg" in payload && payload.msg) {
    return payload.msg;
  }

  return "Supabase password auth failed during Playwright bootstrap.";
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUPABASE_AUTH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function requestSupabasePasswordAuth(credentials: {
  email: string;
  password: string;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublicKey = getSupabasePublicKey();

  if (!supabaseUrl || !supabasePublicKey) {
    throw new Error("Supabase public env is not configured for Playwright auth bootstrap.");
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < SUPABASE_AUTH_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            apikey: supabasePublicKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | SupabaseAuthResponse
        | { error_description?: string; msg?: string }
        | null;

      if (response.ok && payload && "access_token" in payload) {
        return payload;
      }

      throw new Error(getSupabaseAuthErrorMessage(payload));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === SUPABASE_AUTH_RETRY_DELAYS_MS.length - 1) {
        break;
      }

      await delay(SUPABASE_AUTH_RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError ?? new Error("Supabase password auth failed during Playwright bootstrap.");
}

export function buildSupabaseAuthCookie(
  baseURL: string,
  payload: SupabaseAuthResponse,
) {
  const projectRef = getSupabaseProjectRef();

  if (!projectRef) {
    throw new Error("Supabase project ref is not configured for Playwright auth bootstrap.");
  }

  const origin = new URL(baseURL);
  const expires =
    payload.expires_at ??
    Math.floor(Date.now() / 1_000) + (payload.expires_in ?? 3_600);

  return {
    name: `sb-${projectRef}-auth-token`,
    value: `base64-${Buffer.from(JSON.stringify(payload)).toString("base64")}`,
    domain: origin.hostname,
    path: "/",
    expires,
    httpOnly: false,
    secure: origin.protocol === "https:",
    sameSite: "Lax",
  } satisfies PlaywrightCookie;
}
