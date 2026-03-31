import type { SupabaseClient } from "@supabase/supabase-js";

export type NutritionFood = {
  id: string;
  name: string;
  brand: string | null;
  source: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  barcode: string | null;
  image_url: string | null;
  ingredients_text: string | null;
  quantity: string | null;
  serving_size: string | null;
  created_at: string;
  updated_at: string;
};

export type NutritionMealItem = {
  id: string;
  meal_id: string;
  food_id: string | null;
  food_name_snapshot: string;
  servings: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  created_at: string;
};

export type NutritionMeal = {
  id: string;
  eaten_at: string;
  source: string;
  created_at: string;
  items: NutritionMealItem[];
  totals: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  };
};

export type NutritionSummary = {
  id: string;
  summary_date: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  created_at: string;
  updated_at: string;
};

export type NutritionSummaryTrendPoint = {
  summary_date: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type NutritionTargets = {
  kcal_target: number | null;
  protein_target: number | null;
  fat_target: number | null;
  carbs_target: number | null;
};

export type NutritionRecipeItem = {
  id: string;
  recipe_id: string;
  food_id: string | null;
  food_name_snapshot: string;
  servings: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  created_at: string;
};

export type NutritionRecipe = {
  id: string;
  title: string;
  instructions: string | null;
  servings: number;
  created_at: string;
  updated_at: string;
  items: NutritionRecipeItem[];
  totals: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  };
};

export type NutritionTemplateItem = {
  foodId: string | null;
  foodNameSnapshot: string;
  servings: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type NutritionMealTemplate = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  isReferenceOnly: boolean;
  payload: {
    items: NutritionTemplateItem[];
    source: string;
  };
  totals: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  };
};

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateDaysAgo(daysAgo: number) {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() - daysAgo);
  return nextDate;
}

function getTomorrowDateString() {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  return formatLocalDate(nextDate);
}

function getDateRangeForSummaryDate(summaryDate: string) {
  const start = new Date(`${summaryDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function sumMealItems(items: NutritionMealItem[]) {
  return items.reduce(
    (totals, item) => ({
      kcal: totals.kcal + toNumber(item.kcal),
      protein: totals.protein + toNumber(item.protein),
      fat: totals.fat + toNumber(item.fat),
      carbs: totals.carbs + toNumber(item.carbs),
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

function sumNutritionRows<
  T extends {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  },
>(items: T[]) {
  return items.reduce(
    (totals, item) => ({
      kcal: totals.kcal + toNumber(item.kcal),
      protein: totals.protein + toNumber(item.protein),
      fat: totals.fat + toNumber(item.fat),
      carbs: totals.carbs + toNumber(item.carbs),
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

export function getTodaySummaryDate() {
  return formatLocalDate(new Date());
}

export async function listNutritionFoods(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("foods")
    .select(
      "id, name, brand, source, kcal, protein, fat, carbs, barcode, image_url, ingredients_text, quantity, serving_size, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as NutritionFood[];
}

export async function getNutritionTargets(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("nutrition_profiles")
    .select("kcal_target, protein_target, fat_target, carbs_target")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as NutritionTargets | null) ?? null;
}

export async function getNutritionSummary(
  supabase: SupabaseClient,
  userId: string,
  summaryDate: string,
) {
  const { data, error } = await supabase
    .from("daily_nutrition_summaries")
    .select("id, summary_date, kcal, protein, fat, carbs, created_at, updated_at")
    .eq("user_id", userId)
    .eq("summary_date", summaryDate)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as NutritionSummary | null) ?? null;
}

export async function listNutritionSummaryTrend(
  supabase: SupabaseClient,
  userId: string,
  days: number,
) {
  const startDate = formatLocalDate(getDateDaysAgo(days - 1));
  const endDate = getTomorrowDateString();

  const { data, error } = await supabase
    .from("daily_nutrition_summaries")
    .select("summary_date, kcal, protein, fat, carbs")
    .eq("user_id", userId)
    .gte("summary_date", startDate)
    .lt("summary_date", endDate)
    .order("summary_date", { ascending: true });

  if (error) {
    throw error;
  }

  const rowsByDate = new Map<string, NutritionSummaryTrendPoint>();

  for (const row of (data ?? []) as NutritionSummaryTrendPoint[]) {
    rowsByDate.set(row.summary_date, {
      summary_date: row.summary_date,
      kcal: toNumber(row.kcal),
      protein: toNumber(row.protein),
      fat: toNumber(row.fat),
      carbs: toNumber(row.carbs),
    });
  }

  return Array.from({ length: days }, (_, index) => {
    const date = formatLocalDate(getDateDaysAgo(days - index - 1));

    return (
      rowsByDate.get(date) ?? {
        summary_date: date,
        kcal: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
      }
    );
  });
}

export async function listRecentMeals(
  supabase: SupabaseClient,
  userId: string,
  limit = 8,
) {
  const { data: meals, error: mealsError } = await supabase
    .from("meals")
    .select("id, eaten_at, source, created_at")
    .eq("user_id", userId)
    .order("eaten_at", { ascending: false })
    .limit(limit);

  if (mealsError) {
    throw mealsError;
  }

  const mealRows = meals ?? [];

  if (!mealRows.length) {
    return [] as NutritionMeal[];
  }

  const mealIds = mealRows.map((meal) => meal.id);
  const { data: mealItems, error: mealItemsError } = await supabase
    .from("meal_items")
    .select(
      "id, meal_id, food_id, food_name_snapshot, servings, kcal, protein, fat, carbs, created_at",
    )
    .eq("user_id", userId)
    .in("meal_id", mealIds)
    .order("created_at", { ascending: true });

  if (mealItemsError) {
    throw mealItemsError;
  }

  const itemsByMealId = new Map<string, NutritionMealItem[]>();

  for (const item of (mealItems ?? []) as NutritionMealItem[]) {
    const nextItems = itemsByMealId.get(item.meal_id) ?? [];
    nextItems.push(item);
    itemsByMealId.set(item.meal_id, nextItems);
  }

  return mealRows.map((meal) => {
    const items = itemsByMealId.get(meal.id) ?? [];

    return {
      ...meal,
      items,
      totals: sumMealItems(items),
    };
  }) as NutritionMeal[];
}

export async function listNutritionRecipes(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data: recipes, error: recipesError } = await supabase
    .from("recipes")
    .select("id, title, instructions, servings, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (recipesError) {
    throw recipesError;
  }

  const recipeRows = recipes ?? [];

  if (!recipeRows.length) {
    return [] as NutritionRecipe[];
  }

  const recipeIds = recipeRows.map((recipe) => recipe.id);
  const { data: recipeItems, error: recipeItemsError } = await supabase
    .from("recipe_items")
    .select(
      "id, recipe_id, food_id, food_name_snapshot, servings, kcal, protein, fat, carbs, created_at",
    )
    .eq("user_id", userId)
    .in("recipe_id", recipeIds)
    .order("created_at", { ascending: true });

  if (recipeItemsError) {
    throw recipeItemsError;
  }

  const itemsByRecipeId = new Map<string, NutritionRecipeItem[]>();

  for (const item of (recipeItems ?? []) as NutritionRecipeItem[]) {
    const nextItems = itemsByRecipeId.get(item.recipe_id) ?? [];
    nextItems.push(item);
    itemsByRecipeId.set(item.recipe_id, nextItems);
  }

  return recipeRows.map((recipe) => {
    const items = itemsByRecipeId.get(recipe.id) ?? [];

    return {
      ...recipe,
      items,
      totals: sumNutritionRows(items),
    };
  }) as NutritionRecipe[];
}

export async function listMealTemplates(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("meal_templates")
    .select("id, title, payload, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((template) => {
    const payload = (template.payload ?? {}) as {
      items?: NutritionTemplateItem[];
      source?: string;
    };
    const items = Array.isArray(payload.items) ? payload.items : [];

    return {
      ...template,
      isReferenceOnly:
        (payload.source ?? "manual") === "ai_plan_proposal" ||
        items.some((item) => !item.foodId),
      payload: {
        items,
        source: payload.source ?? "manual",
      },
      totals: sumNutritionRows(items),
    };
  }) as NutritionMealTemplate[];
}

export async function recalculateDailyNutritionSummary(
  supabase: SupabaseClient,
  userId: string,
  summaryDate: string,
) {
  const { startIso, endIso } = getDateRangeForSummaryDate(summaryDate);
  const { data: meals, error: mealsError } = await supabase
    .from("meals")
    .select("id")
    .eq("user_id", userId)
    .gte("eaten_at", startIso)
    .lt("eaten_at", endIso);

  if (mealsError) {
    throw mealsError;
  }

  const mealIds = (meals ?? []).map((meal) => meal.id);
  let totals = { kcal: 0, protein: 0, fat: 0, carbs: 0 };

  if (mealIds.length) {
    const { data: mealItems, error: itemsError } = await supabase
      .from("meal_items")
      .select("kcal, protein, fat, carbs")
      .eq("user_id", userId)
      .in("meal_id", mealIds);

    if (itemsError) {
      throw itemsError;
    }

    totals = (mealItems ?? []).reduce(
      (accumulator, item) => ({
        kcal: accumulator.kcal + toNumber(item.kcal),
        protein: accumulator.protein + toNumber(item.protein),
        fat: accumulator.fat + toNumber(item.fat),
        carbs: accumulator.carbs + toNumber(item.carbs),
      }),
      totals,
    );
  }

  const payload = {
    user_id: userId,
    summary_date: summaryDate,
    kcal: Math.round(totals.kcal),
    protein: Number(totals.protein.toFixed(2)),
    fat: Number(totals.fat.toFixed(2)),
    carbs: Number(totals.carbs.toFixed(2)),
  };

  const { data, error } = await supabase
    .from("daily_nutrition_summaries")
    .upsert(payload, { onConflict: "user_id,summary_date" })
    .select("id, summary_date, kcal, protein, fat, carbs, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data as NutritionSummary;
}
