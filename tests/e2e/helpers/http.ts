import type { Page } from "@playwright/test";

export type FetchResult<T = unknown> = {
  body: T;
  status: number;
};

function resolveRequestUrl(page: Page, url: string) {
  if (/^https?:\/\//iu.test(url)) {
    return url;
  }

  const currentUrl = page.url();
  const baseUrl =
    currentUrl && /^https?:\/\//iu.test(currentUrl)
      ? currentUrl
      : process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";

  return new URL(url, baseUrl).toString();
}

export async function fetchJson<T = unknown>(
  page: Page,
  input: {
    body?: unknown;
    maxAttempts?: number;
    method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
    timeoutMs?: number;
    url: string;
  },
) {
  const requestUrl = resolveRequestUrl(page, input.url);
  const requestPath = new URL(requestUrl).pathname;
  const isAiRoute = requestPath.startsWith("/api/ai/");
  const isAdminRoute = requestPath.startsWith("/api/admin/");
  const isWorkoutRoute = requestPath.startsWith("/api/weekly-programs");
  const isExerciseRoute = requestPath.startsWith("/api/exercises");
  const isSeedRoute = isWorkoutRoute || isExerciseRoute;
  const maxAttempts =
    input.maxAttempts ?? (isAiRoute ? 3 : isAdminRoute ? 4 : isSeedRoute ? 5 : 4);
  const timeout =
    input.timeoutMs ??
    (isAiRoute
      ? 90_000
      : isAdminRoute
        ? 20_000
        : isSeedRoute
          ? 15_000
          : 45_000);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const cookies = await page.context().cookies(requestUrl);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const cookieHeader = cookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");
      let response: Response;

      try {
        response = await fetch(requestUrl, {
          method: input.method,
          headers: {
            ...(input.body ? { "Content-Type": "application/json" } : {}),
            ...(cookieHeader ? { cookie: cookieHeader } : {}),
          },
          body: input.body ? JSON.stringify(input.body) : undefined,
          redirect: "follow",
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const rawBody = await response.text();
      let parsedBody: unknown = null;

      if (rawBody) {
        try {
          parsedBody = JSON.parse(rawBody);
        } catch {
          parsedBody = null;
        }
      }

      if (
        attempt < maxAttempts - 1 &&
        (response.status === 401 ||
          (isAdminRoute &&
            (response.status === 500 ||
              response.status === 502 ||
              response.status === 503 ||
              response.status === 504)) ||
          (isSeedRoute &&
            (response.status === 500 ||
              response.status === 502 ||
              response.status === 503 ||
              response.status === 504)) ||
          (isAiRoute && (response.status === 500 || response.status === 502)))
      ) {
        await page.waitForTimeout(500 * (attempt + 1));
        continue;
      }

      return {
        status: response.status,
        body: parsedBody as T,
      } satisfies FetchResult<T>;
    } catch (error) {
      if (attempt < maxAttempts - 1 && error instanceof Error) {
        await page.waitForTimeout(500 * (attempt + 1));
        continue;
      }

      throw error;
    }
  }

  throw new Error("Request did not complete.");
}
