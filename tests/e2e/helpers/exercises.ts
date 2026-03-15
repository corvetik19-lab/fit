import { expect, type Page } from "@playwright/test";

import { fetchJson } from "./http";

export async function createExerciseAsset(page: Page, titleSeed: string) {
  const suffix = crypto.randomUUID().slice(0, 8);

  const exerciseResult = await fetchJson<{ data?: { id: string } }>(page, {
    method: "POST",
    url: "/api/exercises",
    body: {
      title: `E2E Exercise ${titleSeed} ${suffix}`,
      muscleGroup: "Legs",
      description: "Playwright seeded exercise",
      note: "",
    },
  });

  expect(exerciseResult.status).toBe(200);

  const exerciseId = exerciseResult.body?.data?.id;
  expect(exerciseId).toBeTruthy();

  return {
    exerciseId: exerciseId!,
  };
}
