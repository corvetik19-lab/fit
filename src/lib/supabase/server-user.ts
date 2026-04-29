import { Buffer } from "node:buffer";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

import { publicEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { withTimeout, withTransientRetry } from "@/lib/runtime-retry";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const isPlaywrightRuntime = process.env.PLAYWRIGHT_TEST_HOOKS === "1";
const SERVER_USER_TIMEOUT_MS = isPlaywrightRuntime ? 2_500 : 12_000;
const SERVER_USER_RETRY_DELAYS_MS = isPlaywrightRuntime
  ? ([150, 300] as const)
  : ([500, 1_500, 3_000, 5_000] as const);
const SERVER_SESSION_TIMEOUT_MS = isPlaywrightRuntime ? 1_500 : 8_000;
const SERVER_SESSION_RETRY_DELAYS_MS = isPlaywrightRuntime
  ? ([150, 300] as const)
  : ([300, 900, 1_800] as const);

type ServerAuthClient = Pick<SupabaseClient, "auth">;

function getSupabaseProjectRef() {
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  try {
    return new URL(publicEnv.NEXT_PUBLIC_SUPABASE_URL).host.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

function decodeSupabaseCookieUser(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const normalizedCookieValue = decodeURIComponent(value)
      .trim()
      .replace(/^"|"$/g, "")
      .replace(/ /g, "+");
    const normalizedValue = normalizedCookieValue.startsWith("base64-")
      ? normalizedCookieValue.slice("base64-".length)
      : normalizedCookieValue;
    const payload = JSON.parse(
      Buffer.from(normalizedValue, "base64").toString("utf8"),
    ) as { user?: User | null };

    return (payload.user as User | null | undefined) ?? null;
  } catch {
    return null;
  }
}

function parseCookieHeader(rawCookieHeader: string | null | undefined) {
  const cookieMap = new Map<string, string>();

  if (!rawCookieHeader) {
    return cookieMap;
  }

  for (const entry of rawCookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = entry.split("=");
    const name = rawName?.trim();

    if (!name) {
      continue;
    }

    cookieMap.set(name, rawValueParts.join("=").trim());
  }

  return cookieMap;
}

function extractBearerToken(
  rawAuthorizationHeader: string | null | undefined,
) {
  if (!rawAuthorizationHeader) {
    return null;
  }

  const [scheme, ...tokenParts] = rawAuthorizationHeader.trim().split(" ");

  if (scheme?.toLowerCase() !== "bearer" || tokenParts.length === 0) {
    return null;
  }

  const token = tokenParts.join(" ").trim();
  return token.length ? token : null;
}

function readSupabaseCookieUserFromMap(input: {
  cookieMap: Map<string, string>;
  projectRef: string;
}) {
  const baseCookieName = `sb-${input.projectRef}-auth-token`;
  const directHeaderCookie = input.cookieMap.get(baseCookieName);

  if (directHeaderCookie) {
    return decodeSupabaseCookieUser(directHeaderCookie);
  }

  const chunkedHeaderCookie = [...input.cookieMap.entries()]
    .filter(([name]) => name === baseCookieName || name.startsWith(`${baseCookieName}.`))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value)
    .join("");

  return decodeSupabaseCookieUser(chunkedHeaderCookie || undefined);
}

function readRequestCookieUserOrNull(request: Request) {
  const projectRef = getSupabaseProjectRef();

  if (!projectRef) {
    return null;
  }

  return readSupabaseCookieUserFromMap({
    cookieMap: parseCookieHeader(request.headers.get("cookie")),
    projectRef,
  });
}

async function readServerCookieUserOrNull() {
  const projectRef = getSupabaseProjectRef();

  if (!projectRef) {
    return null;
  }

  const cookieStore = await cookies();
  const baseCookieName = `sb-${projectRef}-auth-token`;
  const directCookie = cookieStore.get(baseCookieName)?.value;

  if (directCookie) {
    return decodeSupabaseCookieUser(directCookie);
  }

  const chunkedCookie = cookieStore
    .getAll()
    .filter((item) => item.name === baseCookieName || item.name.startsWith(`${baseCookieName}.`))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((item) => item.value)
    .join("");

  const parsedChunkedCookieUser = decodeSupabaseCookieUser(chunkedCookie || undefined);

  if (parsedChunkedCookieUser) {
    return parsedChunkedCookieUser;
  }

  const headerStore = await headers();
  return readSupabaseCookieUserFromMap({
    cookieMap: parseCookieHeader(headerStore.get("cookie")),
    projectRef,
  });
}

async function readServerSessionUserOrNull(supabase: ServerAuthClient) {
  const {
    data: { session },
  } = await withTimeout(
    withTransientRetry(async () => await supabase.auth.getSession(), {
      attempts: 4,
      delaysMs: SERVER_SESSION_RETRY_DELAYS_MS,
    }),
    SERVER_SESSION_TIMEOUT_MS,
    "server auth session",
  );

  return (session?.user as User | null | undefined) ?? null;
}

async function safeReadServerSessionUserOrNull(supabase: ServerAuthClient) {
  try {
    return await readServerSessionUserOrNull(supabase);
  } catch (error) {
    logger.warn("server auth session fallback failed", {
      error,
    });
    return null;
  }
}

async function readBearerUserOrNull(
  supabase: ServerAuthClient,
  accessToken: string | null,
) {
  if (!accessToken) {
    return null;
  }

  try {
    const {
      data: { user },
    } = await withTimeout(
      withTransientRetry(async () => await supabase.auth.getUser(accessToken), {
        attempts: 4,
        delaysMs: SERVER_SESSION_RETRY_DELAYS_MS,
      }),
      SERVER_SESSION_TIMEOUT_MS,
      "server auth bearer user",
    );

    if (user) {
      return user as User;
    }
  } catch (error) {
    logger.warn("server auth bearer lookup is retrying via admin client", {
      error,
    });
  }

  const adminSupabase = createAdminSupabaseClient();
  const {
    data: { user },
  } = await withTimeout(
    withTransientRetry(async () => await adminSupabase.auth.getUser(accessToken), {
      attempts: 4,
      delaysMs: SERVER_SESSION_RETRY_DELAYS_MS,
    }),
    SERVER_SESSION_TIMEOUT_MS,
    "admin auth bearer user",
  );

  return (user as User | null | undefined) ?? null;
}

async function safeReadBearerUserOrNull(
  supabase: ServerAuthClient,
  accessToken: string | null,
) {
  try {
    return await readBearerUserOrNull(supabase, accessToken);
  } catch (error) {
    logger.warn("server auth bearer fallback failed", {
      error,
    });
    return null;
  }
}

type FallbackMode = "playwright" | "verified";

export async function readServerUserOrNull(
  supabase: ServerAuthClient,
  request?: Request,
) {
  const runFallbacks = async (error: unknown, mode: FallbackMode) => {
    const allowUnverifiedCookieFallbacks = mode === "playwright";

    if (request) {
      const requestBearerUser = await safeReadBearerUserOrNull(
        supabase,
        extractBearerToken(request.headers.get("authorization")),
      );

      if (requestBearerUser) {
        logger.warn("server auth user fallback activated", {
          error,
          source: "request-bearer",
          userId: requestBearerUser.id,
        });

        return requestBearerUser;
      }

      if (allowUnverifiedCookieFallbacks) {
        const requestCookieUser = readRequestCookieUserOrNull(request);

        if (requestCookieUser) {
          logger.warn("server auth user fallback activated", {
            error,
            source: "request-cookie",
            userId: requestCookieUser.id,
          });

          return requestCookieUser;
        }
      }
    }

    const headerStore = await headers();
    const headerBearerUser = await safeReadBearerUserOrNull(
      supabase,
      extractBearerToken(headerStore.get("authorization")),
    );

    if (headerBearerUser) {
      logger.warn("server auth user fallback activated", {
        error,
        source: "header-bearer",
        userId: headerBearerUser.id,
      });

      return headerBearerUser;
    }

    if (!allowUnverifiedCookieFallbacks) {
      return null;
    }

    const cookieUser = await readServerCookieUserOrNull();

    if (cookieUser) {
      logger.warn("server auth user fallback activated", {
        error,
        source: "cookie",
        userId: cookieUser.id,
      });

      return cookieUser;
    }

    const sessionUser = await safeReadServerSessionUserOrNull(supabase);

    if (sessionUser) {
      logger.warn("server auth user fallback activated", {
        error,
        source: "session",
        userId: sessionUser.id,
      });

      return sessionUser;
    }

    return null;
  };

  if (isPlaywrightRuntime) {
    const fallbackUser = await runFallbacks(
      "playwright auth fast path",
      "playwright",
    );

    if (fallbackUser) {
      return fallbackUser;
    }
  }

  try {
    const {
      data: { user },
    } = await withTimeout(
      withTransientRetry(async () => await supabase.auth.getUser(), {
        attempts: 5,
        delaysMs: SERVER_USER_RETRY_DELAYS_MS,
      }),
      SERVER_USER_TIMEOUT_MS,
      "server auth user",
    );

    if (user) {
      return user as User;
    }
  } catch (error) {
    try {
      const fallbackUser = await runFallbacks(error, "verified");

      if (fallbackUser) {
        return fallbackUser;
      }
    } catch {
      throw error;
    }
  }

  return await runFallbacks("empty-server-user", "verified");
}
