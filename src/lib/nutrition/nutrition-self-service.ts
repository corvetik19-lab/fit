import type { SupabaseClient } from "@supabase/supabase-js";

import { recalculateDailyNutritionSummary } from "@/lib/nutrition/meal-logging";

type NutritionDeleteTable = "foods" | "recipes" | "meal_templates" | "meals";

type NutritionFoodUpdateInput = {
  brand?: string | null;
  name?: string;
  kcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  barcode?: string | null;
  image_url?: string | null;
  ingredients_text?: string | null;
  quantity?: string | null;
  serving_size?: string | null;
  source?: string;
};

type NutritionFoodCreateInput = {
  brand?: string | null;
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  barcode?: string | null;
  image_url?: string | null;
  ingredients_text?: string | null;
  quantity?: string | null;
  serving_size?: string | null;
  source?: string;
};

export function buildFoodCreateData(userId: string, payload: NutritionFoodCreateInput) {
  return {
    user_id: userId,
    source: payload.source?.trim() || ("custom" as const),
    name: payload.name,
    brand: payload.brand?.trim() || null,
    kcal: payload.kcal,
    protein: Number(payload.protein.toFixed(2)),
    fat: Number(payload.fat.toFixed(2)),
    carbs: Number(payload.carbs.toFixed(2)),
    barcode: payload.barcode?.trim() || null,
    image_url: payload.image_url?.trim() || null,
    ingredients_text: payload.ingredients_text?.trim() || null,
    quantity: payload.quantity?.trim() || null,
    serving_size: payload.serving_size?.trim() || null,
  };
}

export function buildFoodUpdateData(payload: NutritionFoodUpdateInput) {
  const updateData: Record<string, unknown> = {};

  if (payload.name !== undefined) {
    updateData.name = payload.name;
  }

  if (payload.brand !== undefined) {
    updateData.brand = payload.brand?.trim() || null;
  }

  if (payload.kcal !== undefined) {
    updateData.kcal = payload.kcal;
  }

  if (payload.protein !== undefined) {
    updateData.protein = Number(payload.protein.toFixed(2));
  }

  if (payload.fat !== undefined) {
    updateData.fat = Number(payload.fat.toFixed(2));
  }

  if (payload.carbs !== undefined) {
    updateData.carbs = Number(payload.carbs.toFixed(2));
  }

  if (payload.barcode !== undefined) {
    updateData.barcode = payload.barcode?.trim() || null;
  }

  if (payload.image_url !== undefined) {
    updateData.image_url = payload.image_url?.trim() || null;
  }

  if (payload.ingredients_text !== undefined) {
    updateData.ingredients_text = payload.ingredients_text?.trim() || null;
  }

  if (payload.quantity !== undefined) {
    updateData.quantity = payload.quantity?.trim() || null;
  }

  if (payload.serving_size !== undefined) {
    updateData.serving_size = payload.serving_size?.trim() || null;
  }

  if (payload.source !== undefined) {
    updateData.source = payload.source?.trim() || "custom";
  }

  return updateData;
}

export async function deleteOwnedNutritionEntity(
  supabase: SupabaseClient,
  table: NutritionDeleteTable,
  userId: string,
  id: string,
) {
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteOwnedMealAndRecalculateSummary(
  supabase: SupabaseClient,
  userId: string,
  mealId: string,
  summaryDate: string,
) {
  const meal = await deleteOwnedNutritionEntity(supabase, "meals", userId, mealId);

  if (!meal) {
    return null;
  }

  const summary = await recalculateDailyNutritionSummary(supabase, userId, summaryDate);

  return {
    meal,
    summary,
  };
}
