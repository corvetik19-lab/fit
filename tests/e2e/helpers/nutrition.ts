import { expect, type Page } from "@playwright/test";

import { fetchJson } from "./http";

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function createNutritionAssets(page: Page, titleSeed: string) {
  const suffix = crypto.randomUUID().slice(0, 8);
  const summaryDate = toDateOnly(new Date());
  const eatenAt = new Date().toISOString();

  const foodResult = await fetchJson<{ data?: { id: string } }>(page, {
    method: "POST",
    url: "/api/foods",
    body: {
      name: `E2E Food ${titleSeed} ${suffix}`,
      kcal: 250,
      protein: 20,
      fat: 8,
      carbs: 18,
      barcode: null,
    },
  });

  expect(foodResult.status).toBe(200);

  const foodId = foodResult.body?.data?.id;
  expect(foodId).toBeTruthy();

  const recipeResult = await fetchJson<{ data?: { id: string } }>(page, {
    method: "POST",
    url: "/api/recipes",
    body: {
      title: `E2E Recipe ${titleSeed} ${suffix}`,
      instructions: "Playwright seeded recipe",
      servings: 1,
      items: [
        {
          foodId,
          servings: 1,
        },
      ],
    },
  });

  expect(recipeResult.status).toBe(200);

  const recipeId = recipeResult.body?.data?.id;
  expect(recipeId).toBeTruthy();

  const templateResult = await fetchJson<{ data?: { id: string } }>(page, {
    method: "POST",
    url: "/api/meal-templates",
    body: {
      title: `E2E Template ${titleSeed} ${suffix}`,
      items: [
        {
          foodId,
          servings: 1,
        },
      ],
    },
  });

  expect(templateResult.status).toBe(200);

  const mealTemplateId = templateResult.body?.data?.id;
  expect(mealTemplateId).toBeTruthy();

  const mealResult = await fetchJson<{ data?: { meal?: { id: string } } }>(page, {
    method: "POST",
    url: "/api/meals",
    body: {
      eatenAt,
      summaryDate,
      items: [
        {
          foodId,
          servings: 1,
        },
      ],
    },
  });

  expect(mealResult.status).toBe(200);

  const mealId = mealResult.body?.data?.meal?.id;
  expect(mealId).toBeTruthy();

  return {
    foodId: foodId!,
    recipeId: recipeId!,
    mealTemplateId: mealTemplateId!,
    mealId: mealId!,
    summaryDate,
  };
}
