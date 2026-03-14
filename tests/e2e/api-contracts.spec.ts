import { expect, test } from "@playwright/test";

import { hasAuthE2ECredentials, signInAndFinishOnboarding } from "./helpers/auth";
import { fetchJson } from "./helpers/http";

test.describe("api contracts", () => {
  test.skip(
    !hasAuthE2ECredentials(),
    "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
  );

  test("authenticated invalid route params return explicit 400s", async ({ page }) => {
    await signInAndFinishOnboarding(page);

    const [dayUpdate, dayReset, setUpdate, invalidAiSession] = await Promise.all([
      fetchJson(page, {
        method: "PATCH",
        url: "/api/workout-days/not-a-uuid",
        body: { status: "planned" },
      }),
      fetchJson(page, {
        method: "POST",
        url: "/api/workout-days/not-a-uuid/reset",
      }),
      fetchJson(page, {
        method: "PATCH",
        url: "/api/workout-sets/not-a-uuid",
        body: { actualReps: 10, actualWeightKg: 50, actualRpe: 8 },
      }),
      fetchJson(page, {
        method: "DELETE",
        url: "/api/ai/sessions/not-a-uuid",
      }),
    ]);

    expect(dayUpdate.status).toBe(400);
    expect((dayUpdate.body as { code?: string } | null)?.code).toBe(
      "WORKOUT_DAY_UPDATE_INVALID",
    );

    expect(dayReset.status).toBe(400);
    expect((dayReset.body as { code?: string } | null)?.code).toBe(
      "WORKOUT_DAY_RESET_INVALID",
    );

    expect(setUpdate.status).toBe(400);
    expect((setUpdate.body as { code?: string } | null)?.code).toBe(
      "WORKOUT_SET_UPDATE_INVALID",
    );

    expect(invalidAiSession.status).toBe(400);
    expect((invalidAiSession.body as { code?: string } | null)?.code).toBe(
      "AI_CHAT_SESSION_INVALID",
    );
  });

  test("owner-scoped AI session delete returns 404 for unknown valid session id", async ({
    page,
  }) => {
    await signInAndFinishOnboarding(page);

    const unknownSessionResult = await page.evaluate(async () => {
      const randomId = crypto.randomUUID();
      const response = await fetch(`/api/ai/sessions/${randomId}`, {
        method: "DELETE",
      });

      return {
        sessionId: randomId,
        status: response.status,
        body: await response.json().catch(() => null),
      };
    });

    expect(unknownSessionResult.status).toBe(404);
    expect(
      (unknownSessionResult.body as { code?: string } | null)?.code,
    ).toBe("AI_CHAT_SESSION_NOT_FOUND");
    expect(unknownSessionResult.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
