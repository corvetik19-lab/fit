import type { Page } from "@playwright/test";

export type FetchResult<T = unknown> = {
  body: T;
  status: number;
};

export async function fetchJson<T = unknown>(
  page: Page,
  input: {
    body?: unknown;
    method: "DELETE" | "GET" | "PATCH" | "POST";
    url: string;
  },
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.waitForLoadState("networkidle").catch(() => undefined);

    try {
      return (await page.evaluate(
        async ({ body, method, url }) => {
          const response = await fetch(url, {
            method,
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined,
          });

          return {
            status: response.status,
            body: await response.json().catch(() => null),
          } satisfies FetchResult;
        },
        input,
      )) as FetchResult<T>;
    } catch (error) {
      if (
        attempt < 2 &&
        error instanceof Error &&
        error.message.includes("Execution context was destroyed")
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Request did not complete.");
}
