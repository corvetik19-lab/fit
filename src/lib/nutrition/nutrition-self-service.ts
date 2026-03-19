import type { SupabaseClient } from "@supabase/supabase-js";

import { recalculateDailyNutritionSummary } from "@/lib/nutrition/meal-logging";

type NutritionDeleteTable = "foods" | "recipes" | "meal_templates" | "meals";

type NutritionFoodUpdateInput = {
  name?: string;
  kcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  barcode?: string | null;
};

type NutritionFoodCreateInput = {
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  barcode?: string | null;
};

export function buildFoodCreateData(userId: string, payload: NutritionFoodCreateInput) {
  return {
    user_id: userId,
    source: "custom" as const,
    name: payload.name,
    kcal: payload.kcal,
    protein: Number(payload.protein.toFixed(2)),
    fat: Number(payload.fat.toFixed(2)),
    carbs: Number(payload.carbs.toFixed(2)),
    barcode: payload.barcode?.trim() || null,
  };
}

export function buildFoodUpdateData(payload: NutritionFoodUpdateInput) {
  const updateData: Record<string, unknown> = {};

  if (payload.name !== undefined) {
    updateData.name = payload.name;
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
