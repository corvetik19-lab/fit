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
    method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
    url: string;
  },
) {
  const requestUrl = resolveRequestUrl(page, input.url);
  const isAiRoute = new URL(requestUrl).pathname.startsWith("/api/ai/");
  const maxAttempts = isAiRoute ? 2 : 3;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await page.context().request.fetch(requestUrl, {
        method: input.method,
        headers: input.body ? { "Content-Type": "application/json" } : undefined,
        data: input.body ? JSON.stringify(input.body) : undefined,
        failOnStatusCode: false,
        timeout: isAiRoute ? 45_000 : 30_000,
      });

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
        (response.status() === 401 ||
          (isAiRoute && (response.status() === 500 || response.status() === 502)))
      ) {
        await page.waitForTimeout(250 * (attempt + 1));
        continue;
      }

      return {
        status: response.status(),
        body: parsedBody as T,
      } satisfies FetchResult<T>;
    } catch (error) {
      if (attempt < maxAttempts - 1 && error instanceof Error) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Request did not complete.");
}
