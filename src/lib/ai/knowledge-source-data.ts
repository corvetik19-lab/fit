import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createEmptyAiUserContext,
  type AiUserContext,
  getAiRuntimeContext,
} from "@/lib/ai/user-context";
import { logger } from "@/lib/logger";
import { withTimeout } from "@/lib/runtime-retry";
import {
  type BodyMetricRow,
  type ContextSnapshotRow,
  type GoalRow,
  type KnowledgeChunkEmbeddingInput,
  type MealItemRow,
  type MealRow,
  type NutritionProfileRow,
  type NutritionSummaryRow,
  type OnboardingRow,
  type UserMemoryRow,
  type WeeklyProgramRow,
  type WorkoutDayRow,
  type WorkoutExerciseRow,
  type WorkoutSetRow,
} from "@/lib/ai/knowledge-model";
import { listAllWorkoutSetsWithRepRangeFallback } from "@/lib/workout/workout-sets";

const FETCH_PAGE_SIZE = 500;
const KNOWLEDGE_SOURCE_TIMEOUT_MS = 12_000;

export type KnowledgeSourceData = {
  aiContext: AiUserContext;
  bestSetWeightKg: number | null;
  bodyMetrics: BodyMetricRow[];
  contextSnapshots: ContextSnapshotRow[];
  goal: GoalRow | null;
  mealItems: MealItemRow[];
  meals: MealRow[];
  memoryFacts: UserMemoryRow[];
  nutritionProfile: NutritionProfileRow | null;
  nutritionSummaries: NutritionSummaryRow[];
  onboarding: OnboardingRow | null;
  programs: WeeklyProgramRow[];
  totalTonnageKg: number;
  workoutDays: WorkoutDayRow[];
  workoutExercises: WorkoutExerciseRow[];
  workoutSets: WorkoutSetRow[];
};

export async function fetchAllRows<T>(
  loader: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>,
  pageSize = FETCH_PAGE_SIZE,
) {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const result = await loader(from, to);

    if (result.error) {
      throw result.error;
    }

    const page = result.data ?? [];
    rows.push(...page);

    if (page.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

export async function listKnowledgeChunkInputs(
  supabase: SupabaseClient,
  userId: string,
) {
  return fetchAllRows<KnowledgeChunkEmbeddingInput>(async (from, to) =>
    await supabase
      .from("knowledge_chunks")
      .select("id, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to),
  );
}

export async function loadKnowledgeSourceData(
  supabase: SupabaseClient,
  userId: string,
): Promise<KnowledgeSourceData> {
  async function readOptionalValue<T>(
    label: string,
    factory: () => Promise<{ data: T | null; error: unknown }>,
  ) {
    try {
      const result = await withTimeout(
        factory(),
        KNOWLEDGE_SOURCE_TIMEOUT_MS,
        label,
      );

      if (result.error) {
        throw result.error;
      }

      return (result.data as T | null) ?? null;
    } catch (error) {
      logger.warn("knowledge source optional loader is using fallback", {
        error,
        label,
        userId,
      });
      return null;
    }
  }

  async function readCollection<T>(label: string, factory: () => Promise<T[]>) {
    try {
      return await withTimeout(factory(), KNOWLEDGE_SOURCE_TIMEOUT_MS, label);
    } catch (error) {
      logger.warn("knowledge source collection loader is using fallback", {
        error,
        label,
        userId,
      });
      return [] as T[];
    }
  }

  async function readRuntimeContext() {
    try {
      const result = await withTimeout(
        getAiRuntimeContext(supabase, userId, {
          forceRefresh: true,
        }).then((value) => value.context),
        KNOWLEDGE_SOURCE_TIMEOUT_MS,
        "knowledge runtime context",
      );

      return result;
    } catch (error) {
      logger.warn("knowledge source runtime context is using fallback", {
        error,
        userId,
      });
      return createEmptyAiUserContext();
    }
  }

  const [
    aiContext,
    onboarding,
    goal,
    nutritionProfile,
    bodyMetrics,
    nutritionSummaries,
    memoryFacts,
    contextSnapshots,
    programs,
    workoutDays,
    workoutExercises,
    meals,
    mealItems,
  ] = await Promise.all([
    readRuntimeContext(),
    readOptionalValue<OnboardingRow>("knowledge onboarding profile", async () =>
      await supabase
        .from("onboarding_profiles")
        .select(
          "id, age, sex, height_cm, weight_kg, fitness_level, equipment, injuries, dietary_preferences",
        )
        .eq("user_id", userId)
        .maybeSingle(),
    ),
    readOptionalValue<GoalRow>("knowledge goal", async () =>
      await supabase
        .from("goals")
        .select("id, goal_type, target_weight_kg, weekly_training_days, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ),
    readOptionalValue<NutritionProfileRow>("knowledge nutrition profile", async () =>
      await supabase
        .from("nutrition_profiles")
        .select("id, kcal_target, protein_target, fat_target, carbs_target")
        .eq("user_id", userId)
        .maybeSingle(),
    ),
    readCollection<BodyMetricRow>("knowledge body metrics", async () =>
      fetchAllRows<BodyMetricRow>(async (from, to) =>
      await supabase
        .from("body_metrics")
        .select("id, weight_kg, body_fat_pct, measured_at")
        .eq("user_id", userId)
        .order("measured_at", { ascending: false })
        .range(from, to),
      ),
    ),
    readCollection<NutritionSummaryRow>("knowledge nutrition summaries", async () =>
      fetchAllRows<NutritionSummaryRow>(async (from, to) =>
      await supabase
        .from("daily_nutrition_summaries")
        .select("id, summary_date, kcal, protein, fat, carbs")
        .eq("user_id", userId)
        .order("summary_date", { ascending: false })
        .range(from, to),
      ),
    ),
    readCollection<UserMemoryRow>("knowledge memory facts", async () =>
      fetchAllRows<UserMemoryRow>(async (from, to) =>
      await supabase
        .from("user_memory_facts")
        .select("id, fact_type, content, confidence, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to),
      ),
    ),
    readCollection<ContextSnapshotRow>("knowledge context snapshots", async () =>
      fetchAllRows<ContextSnapshotRow>(async (from, to) =>
      await supabase
        .from("user_context_snapshots")
        .select("id, snapshot_reason, payload, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to),
      ),
    ),
    readCollection<WeeklyProgramRow>("knowledge weekly programs", async () =>
      fetchAllRows<WeeklyProgramRow>(async (from, to) =>
      await supabase
        .from("weekly_programs")
        .select("id, title, status, week_start_date, week_end_date, is_locked")
        .eq("user_id", userId)
        .order("week_start_date", { ascending: false })
        .range(from, to),
      ),
    ),
    readCollection<WorkoutDayRow>("knowledge workout days", async () =>
      fetchAllRows<WorkoutDayRow>(async (from, to) =>
      await supabase
        .from("workout_days")
        .select(
          "id, weekly_program_id, day_of_week, status, body_weight_kg, session_note, updated_at",
        )
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .range(from, to),
      ),
    ),
    readCollection<WorkoutExerciseRow>("knowledge workout exercises", async () =>
      fetchAllRows<WorkoutExerciseRow>(async (from, to) =>
      await supabase
        .from("workout_exercises")
        .select(
          "id, workout_day_id, exercise_title_snapshot, sets_count, sort_order, updated_at",
        )
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .range(from, to),
      ),
    ),
    readCollection<MealRow>("knowledge meals", async () =>
      fetchAllRows<MealRow>(async (from, to) =>
      await supabase
        .from("meals")
        .select("id, eaten_at, source")
        .eq("user_id", userId)
        .order("eaten_at", { ascending: false })
        .range(from, to),
      ),
    ),
    readCollection<MealItemRow>("knowledge meal items", async () =>
      fetchAllRows<MealItemRow>(async (from, to) =>
      await supabase
        .from("meal_items")
        .select(
          "id, meal_id, food_name_snapshot, servings, kcal, protein, fat, carbs",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to),
      ),
    ),
  ]);

  const workoutSets = await readCollection<WorkoutSetRow>("knowledge workout sets", async () =>
    await listAllWorkoutSetsWithRepRangeFallback(supabase, userId),
  );
  const totalTonnageKg = workoutSets.reduce((sum, set) => {
    if (set.actual_reps === null || set.actual_weight_kg === null) {
      return sum;
    }

    return sum + set.actual_reps * set.actual_weight_kg;
  }, 0);
  const bestSetWeightKg = workoutSets.reduce<number | null>((best, set) => {
    if (set.actual_weight_kg === null) {
      return best;
    }

    return best === null ? set.actual_weight_kg : Math.max(best, set.actual_weight_kg);
  }, null);

  return {
    aiContext,
    bestSetWeightKg,
    bodyMetrics,
    contextSnapshots,
    goal,
    mealItems,
    meals,
    memoryFacts,
    nutritionProfile,
    nutritionSummaries,
    onboarding,
    programs,
    totalTonnageKg,
    workoutDays,
    workoutExercises,
    workoutSets,
  };
}
