import { Buffer } from "node:buffer";

import { expect, test } from "@playwright/test";

import {
  finishOnboardingIfVisible,
  hasAuthE2ECredentials,
} from "./helpers/auth";
import { USER_STORAGE_STATE_PATH } from "./helpers/auth-state";
import { navigateStable } from "./helpers/navigation";

async function setLookupValue(
  locator: ReturnType<import("@playwright/test").Page["locator"]>,
  value: string,
) {
  await locator.click();
  await locator.evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    const prototype = Object.getPrototypeOf(input) as HTMLInputElement;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

    descriptor?.set?.call(input, nextValue);
    input.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        data: nextValue,
        inputType: "insertText",
      }),
    );
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new Event("blur", { bubbles: true }));
  }, value);
  await expect(locator).toHaveValue(value);
}

const previewPayload = {
  data: {
    existingFood: null,
    product: {
      barcode: "3017624010701",
      brand: "Ferrero",
      carbs: 57.5,
      fat: 30.9,
      imageUrl:
        "https://images.openfoodfacts.org/images/products/301/762/401/0701/front_en.3.400.jpg",
      ingredientsText: "Сахар, пальмовое масло, фундук, какао, сухое молоко.",
      kcal: 539,
      name: "Nutella",
      productUrl: "https://world.openfoodfacts.org/product/3017624010701",
      protein: 6.3,
      quantity: "350 g",
      servingSize: "15 g",
    },
  },
};

const importedFood = {
  data: {
    id: "5a7fd8fd-e7d3-4efc-8ab1-b08f6572a001",
    name: "Nutella",
    brand: "Ferrero",
    source: "open_food_facts",
    kcal: 539,
    protein: 6.3,
    fat: 30.9,
    carbs: 57.5,
    barcode: "3017624010701",
    image_url:
      "https://images.openfoodfacts.org/images/products/301/762/401/0701/front_en.3.400.jpg",
    ingredients_text: "Сахар, пальмовое масло, фундук, какао, сухое молоко.",
    quantity: "350 g",
    serving_size: "15 g",
    created_at: "2026-03-31T10:30:00.000Z",
    updated_at: "2026-03-31T10:30:00.000Z",
  },
  meta: {
    existed: false,
    imported: true,
    source: "open_food_facts",
  },
};

const existingFoodLookupPayload = {
  data: {
    existingFood: {
      id: "79c29240-e473-4db2-a31c-88b502af14f2",
      name: "Протеиновый батончик",
      brand: "fit",
      source: "custom",
      kcal: 210,
      protein: 20,
      fat: 7,
      carbs: 18,
      barcode: "4601234567890",
      image_url: null,
      ingredients_text: null,
      quantity: "60 g",
      serving_size: "1 шт",
      created_at: "2026-03-31T10:30:00.000Z",
      updated_at: "2026-03-31T10:30:00.000Z",
    },
    product: {
      barcode: "4601234567890",
      brand: "fit",
      carbs: 18,
      fat: 7,
      imageUrl: null,
      ingredientsText: null,
      kcal: 210,
      name: "Протеиновый батончик",
      productUrl: "https://world.openfoodfacts.org/product/4601234567890",
      protein: 20,
      quantity: "60 g",
      servingSize: "1 шт",
    },
  },
};

const mealPhotoAnalysisPayload = {
  data: {
    confidence: "high" as const,
    estimatedKcal: 620,
    items: [
      {
        confidence: "high" as const,
        name: "Курица",
        portion: "180 г",
      },
      {
        confidence: "medium" as const,
        name: "Рис",
        portion: "160 г",
      },
    ],
    macros: {
      carbs: 58,
      fat: 17,
      protein: 42,
    },
    suggestions: [
      "Сохрани блюдо как продукт, если будешь есть его регулярно.",
      "Добавь запись в дневник, чтобы обновить дневной баланс.",
    ],
    summary:
      "На фото похоже на порцию курицы с рисом и овощами. По калорийности это полноценный приём пищи.",
    title: "Курица с рисом",
  },
};

const mealPhotoImportPayload = {
  data: {
    food: {
      id: "4fa64572-5f6f-4ec2-8b12-c0d5d16f9d61",
      name: "Курица с рисом",
    },
    meal: {
      eaten_at: "2026-04-14T12:30:00.000Z",
      id: "3d4cedf2-88d2-49f8-a9e5-0cdf0f8fd992",
    },
    summary: {
      carbs: 58,
      fat: 17,
      id: "d2f41b18-d2ba-4eeb-b66f-50cb9a5cf7b1",
      kcal: 620,
      protein: 42,
      summary_date: "2026-04-14",
    },
  },
  meta: {
    addedToMeal: true,
    imageStored: true,
  },
};

test.describe("nutrition capture flow", () => {
  test.describe.configure({
    timeout: 60_000,
  });

  test.use({
    storageState: USER_STORAGE_STATE_PATH,
  });

  test.skip(
    !hasAuthE2ECredentials(),
    "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
  );

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("fit:nutrition-page:workspace-visibility");
    });

    await navigateStable(page, "/dashboard", /\/(dashboard|onboarding)$/);
    await finishOnboardingIfVisible(page);
  });

  test("foods section previews and imports product from Open Food Facts", async ({
    page,
  }) => {
    let importRequestCount = 0;

    await page.route(
      "**/api/foods/open-food-facts/3017624010701",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(previewPayload),
        });
      },
    );

    await page.route("**/api/foods/open-food-facts/import", async (route) => {
      importRequestCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(importedFood),
      });
    });

    await navigateStable(
      page,
      "/nutrition?section=log&panel=foods",
      /\/nutrition(?:\?section=log&panel=foods)?$/,
    );
    const lookupSection = page.getByTestId(
      "nutrition-open-food-facts-card-foods",
    );
    await lookupSection.waitFor({ state: "visible", timeout: 15_000 });

    const foodLookupInput = lookupSection.getByPlaceholder(
      "Например, 4601234567890",
    );
    await setLookupValue(foodLookupInput, "3017624010701");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/foods/open-food-facts/3017624010701") &&
          response.request().method() === "GET",
      ),
      lookupSection.getByRole("button", { name: "Найти" }).click(),
    ]);

    const previewCard = page.getByTestId(
      "nutrition-open-food-facts-preview-foods",
    );
    await expect(previewCard).toBeVisible({ timeout: 10_000 });
    await expect(previewCard.getByText("Nutella", { exact: true })).toBeVisible();
    await expect(previewCard.getByText(/Ferrero/)).toBeVisible();
    await expect(previewCard.getByText(/350 g/)).toBeVisible();
    await expect(previewCard.getByText(/порция 15 g/)).toBeVisible();
    await expect(previewCard.getByText(/Сахар/)).toBeVisible();

    await page.getByTestId("nutrition-open-food-facts-import-foods").click();
    await expect.poll(() => importRequestCount).toBe(1);
    await expect(
      page.getByRole("button", { name: "Открыть в базе" }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Название", exact: true }),
    ).toHaveValue("Nutella");
  });

  test("log section adds existing barcode product into current meal", async ({
    page,
  }) => {
    await page.route(
      "**/api/foods/open-food-facts/4601234567890",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(existingFoodLookupPayload),
        });
      },
    );

    await navigateStable(
      page,
      "/nutrition?section=log&panel=log",
      /\/nutrition(?:\?section=log&panel=log)?$/,
    );
    const lookupSection = page.getByTestId(
      "nutrition-open-food-facts-card-meal",
    );
    await lookupSection.waitFor({ state: "visible", timeout: 15_000 });

    const mealLookupInput = lookupSection.getByPlaceholder(
      "Например, 4601234567890",
    );
    await setLookupValue(mealLookupInput, "4601234567890");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/foods/open-food-facts/4601234567890") &&
          response.request().method() === "GET",
      ),
      lookupSection.getByRole("button", { name: "Найти" }).click(),
    ]);

    await expect(
      page.getByTestId("nutrition-open-food-facts-preview-meal"),
    ).toBeVisible({ timeout: 10_000 });
    await page
      .getByTestId("nutrition-open-food-facts-use-existing-meal")
      .click({ noWaitAfter: true });

    await expect(
      page.getByText(
        "Продукт «Протеиновый батончик» добавлен в текущий приём пищи.",
      ),
    ).toBeVisible();
    await expect(page.locator("select").last()).toHaveValue(
      "79c29240-e473-4db2-a31c-88b502af14f2",
    );
  });

  test("photo analysis can save a captured dish into nutrition and diary", async ({
    page,
  }) => {
    let importRequestCount = 0;

    await page.route("**/api/ai/meal-photo", async (route) => {
      await route.fulfill({
        body: JSON.stringify(mealPhotoAnalysisPayload),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.route("**/api/nutrition/photo-import", async (route) => {
      importRequestCount += 1;
      await route.fulfill({
        body: JSON.stringify(mealPhotoImportPayload),
        contentType: "application/json",
        status: 200,
      });
    });

    await navigateStable(
      page,
      "/nutrition?section=photo",
      /\/nutrition(?:\?section=photo)?$/,
    );
    await page
      .getByRole("heading", {
        name: "Сними еду и сразу загрузи её в приложение",
      })
      .waitFor({ state: "visible", timeout: 15_000 });

    const photoChooser = page.waitForEvent("filechooser");
    await page.getByTestId("nutrition-photo-open-gallery").click();
    await (await photoChooser).setFiles({
      buffer: Buffer.from("fake-image-payload"),
      mimeType: "image/jpeg",
      name: "lunch.jpg",
    });

    await expect(page.getByTestId("nutrition-photo-analyze")).toBeEnabled({
      timeout: 15_000,
    });
    await page.getByTestId("nutrition-photo-analyze").click();

    await expect(page.getByText("Курица с рисом", { exact: true })).toBeVisible();
    await expect(page.getByText(/620 ккал/)).toBeVisible();

    await page.getByTestId("nutrition-photo-save-meal").click();
    await expect.poll(() => importRequestCount).toBe(1);
    await expect(
      page.getByText(
        "Продукт «Курица с рисом» сохранён и сразу добавлен в дневник питания.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Открыть продукты" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Открыть дневник" }),
    ).toBeVisible();
  });
});
