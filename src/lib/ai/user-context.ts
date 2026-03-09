import type { SupabaseClient } from "@supabase/supabase-js";

export type AiUserContext = {
  profile: {
    fullName: string | null;
  };
  onboarding: {
    age: number | null;
    sex: string | null;
    heightCm: number | null;
    weightKg: number | null;
    fitnessLevel: string | null;
    equipment: string[];
    injuries: string[];
    dietaryPreferences: string[];
  };
  goal: {
    goalType: string | null;
    targetWeightKg: number | null;
    weeklyTrainingDays: number | null;
  };
  nutritionTargets: {
    kcalTarget: number | null;
    proteinTarget: number | null;
    fatTarget: number | null;
    carbsTarget: number | null;
  };
  latestBodyMetrics: {
    weightKg: number | null;
    bodyFatPct: number | null;
    measuredAt: string | null;
  };
  latestNutritionSummary: {
    summaryDate: string | null;
    kcal: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  };
};

function normalizeJsonArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.flatMap((item) => (typeof item === "string" ? [item] : []));
}

export async function getAiUserContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<AiUserContext> {
  const today = new Date().toISOString().slice(0, 10);

  const [
    profileResult,
    onboardingResult,
    goalResult,
    nutritionProfileResult,
    bodyMetricsResult,
    nutritionSummaryResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("onboarding_profiles")
      .select(
        "age, sex, height_cm, weight_kg, fitness_level, equipment, injuries, dietary_preferences",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("goals")
      .select("goal_type, target_weight_kg, weekly_training_days")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("nutrition_profiles")
      .select("kcal_target, protein_target, fat_target, carbs_target")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("body_metrics")
      .select("weight_kg, body_fat_pct, measured_at")
      .eq("user_id", userId)
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("daily_nutrition_summaries")
      .select("summary_date, kcal, protein, fat, carbs")
      .eq("user_id", userId)
      .eq("summary_date", today)
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (onboardingResult.error) {
    throw onboardingResult.error;
  }

  if (goalResult.error) {
    throw goalResult.error;
  }

  if (nutritionProfileResult.error) {
    throw nutritionProfileResult.error;
  }

  if (bodyMetricsResult.error) {
    throw bodyMetricsResult.error;
  }

  if (nutritionSummaryResult.error) {
    throw nutritionSummaryResult.error;
  }

  return {
    profile: {
      fullName: profileResult.data?.full_name ?? null,
    },
    onboarding: {
      age: onboardingResult.data?.age ?? null,
      sex: onboardingResult.data?.sex ?? null,
      heightCm: onboardingResult.data?.height_cm ?? null,
      weightKg: onboardingResult.data?.weight_kg ?? null,
      fitnessLevel: onboardingResult.data?.fitness_level ?? null,
      equipment: normalizeJsonArray(onboardingResult.data?.equipment),
      injuries: normalizeJsonArray(onboardingResult.data?.injuries),
      dietaryPreferences: normalizeJsonArray(
        onboardingResult.data?.dietary_preferences,
      ),
    },
    goal: {
      goalType: goalResult.data?.goal_type ?? null,
      targetWeightKg: goalResult.data?.target_weight_kg ?? null,
      weeklyTrainingDays: goalResult.data?.weekly_training_days ?? null,
    },
    nutritionTargets: {
      kcalTarget: nutritionProfileResult.data?.kcal_target ?? null,
      proteinTarget: nutritionProfileResult.data?.protein_target ?? null,
      fatTarget: nutritionProfileResult.data?.fat_target ?? null,
      carbsTarget: nutritionProfileResult.data?.carbs_target ?? null,
    },
    latestBodyMetrics: {
      weightKg: bodyMetricsResult.data?.weight_kg ?? null,
      bodyFatPct: bodyMetricsResult.data?.body_fat_pct ?? null,
      measuredAt: bodyMetricsResult.data?.measured_at ?? null,
    },
    latestNutritionSummary: {
      summaryDate: nutritionSummaryResult.data?.summary_date ?? null,
      kcal: nutritionSummaryResult.data?.kcal ?? null,
      protein: nutritionSummaryResult.data?.protein ?? null,
      fat: nutritionSummaryResult.data?.fat ?? null,
      carbs: nutritionSummaryResult.data?.carbs ?? null,
    },
  };
}
