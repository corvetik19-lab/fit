import type { SupabaseClient } from "@supabase/supabase-js";

export type NutritionWriteItemInput = {
  foodId: string;
  servings: number;
};

type NutritionFoodRow = {
  id: string;
  name: string;
  kcal: number | string | null;
  protein: number | string | null;
  fat: number | string | null;
  carbs: number | string | null;
};

export type NutritionItemSnapshot = {
  foodId: string;
  foodNameSnapshot: string;
  servings: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
};

const NUTRITION_FOOD_SELECT = "id, name, kcal, protein, fat, carbs";

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function toRoundedServings(value: number) {
  return Number(value.toFixed(2));
}

function toRoundedMacro(value: number) {
  return Number(value.toFixed(2));
}

export async function loadOwnedNutritionFoods(
  supabase: SupabaseClient,
  userId: string,
  items: ReadonlyArray<NutritionWriteItemInput>,
) {
  const uniqueFoodIds = [...new Set(items.map((item) => item.foodId))];
  const { data, error } = await supabase
    .from("foods")
    .select(NUTRITION_FOOD_SELECT)
    .eq("user_id", userId)
    .in("id", uniqueFoodIds);

  if (error) {
    throw error;
  }

  return {
    foodsById: new Map((data ?? []).map((food) => [food.id, food as NutritionFoodRow])),
    uniqueFoodIds,
  };
}

export function getMissingNutritionFoodIds(
  uniqueFoodIds: ReadonlyArray<string>,
  foodsById: ReadonlyMap<string, NutritionFoodRow>,
) {
  return uniqueFoodIds.filter((foodId) => !foodsById.has(foodId));
}

export function buildNutritionItemSnapshots(
  items: ReadonlyArray<NutritionWriteItemInput>,
  foodsById: ReadonlyMap<string, NutritionFoodRow>,
) {
  return items.map((item) => {
    const food = foodsById.get(item.foodId);

    if (!food) {
      throw new Error(`Food ${item.foodId} was not found during nutrition write.`);
    }

    return {
      foodId: food.id,
      foodNameSnapshot: food.name,
      servings: toRoundedServings(item.servings),
      kcal: Math.round(toNumber(food.kcal) * item.servings),
      protein: toRoundedMacro(toNumber(food.protein) * item.servings),
      fat: toRoundedMacro(toNumber(food.fat) * item.servings),
      carbs: toRoundedMacro(toNumber(food.carbs) * item.servings),
    } satisfies NutritionItemSnapshot;
  });
}

export function buildRecipeItemInsertPayload(
  userId: string,
  recipeId: string,
  itemSnapshots: ReadonlyArray<NutritionItemSnapshot>,
) {
  return itemSnapshots.map((item) => ({
    user_id: userId,
    recipe_id: recipeId,
    food_id: item.foodId,
    food_name_snapshot: item.foodNameSnapshot,
    servings: item.servings,
    kcal: item.kcal,
    protein: item.protein,
    fat: item.fat,
    carbs: item.carbs,
  }));
}

export function buildMealItemInsertPayload(
  userId: string,
  mealId: string,
  itemSnapshots: ReadonlyArray<NutritionItemSnapshot>,
) {
  return itemSnapshots.map((item) => ({
    user_id: userId,
    meal_id: mealId,
    food_id: item.foodId,
    food_name_snapshot: item.foodNameSnapshot,
    servings: item.servings,
    kcal: item.kcal,
    protein: item.protein,
    fat: item.fat,
    carbs: item.carbs,
  }));
}

export function buildMealTemplatePayloadItems(
  itemSnapshots: ReadonlyArray<NutritionItemSnapshot>,
) {
  return itemSnapshots.map((item) => ({
    foodId: item.foodId,
    foodNameSnapshot: item.foodNameSnapshot,
    servings: item.servings,
    kcal: item.kcal,
    protein: item.protein,
    fat: item.fat,
    carbs: item.carbs,
  }));
}
