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
  return page.evaluate(
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
  ) as Promise<FetchResult<T>>;
}
