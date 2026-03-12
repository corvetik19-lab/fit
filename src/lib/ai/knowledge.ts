import { cosineSimilarity } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";

import { embedDocumentTexts, embedQueryText } from "@/lib/ai/embeddings";
import { aiProviders, defaultModels } from "@/lib/ai/gateway";
import {
  buildStructuredKnowledgeSignature,
  formatStructuredKnowledgeForDocument,
} from "@/lib/ai/structured-knowledge";
import { getAiRuntimeContext } from "@/lib/ai/user-context";
import { logger } from "@/lib/logger";
import { buildNutritionMealPatternStats } from "@/lib/nutrition/meal-patterns";
import { buildNutritionStrategyRecommendations } from "@/lib/nutrition/strategy-recommendations";
import { formatPlannedRepTarget } from "@/lib/workout/rep-ranges";
import { listAllWorkoutSetsWithRepRangeFallback } from "@/lib/workout/workout-sets";

type JsonRecord = Record<string, unknown>;

type OnboardingRow = {
  id: string;
  age: number | null;
  sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_level: string | null;
  equipment: string[];
  injuries: string[];
  dietary_preferences: string[];
};

type GoalRow = {
  id: string;
  goal_type: string | null;
  target_weight_kg: number | null;
  weekly_training_days: number | null;
  updated_at: string;
};

type NutritionProfileRow = {
  id: string;
  kcal_target: number | null;
  protein_target: number | null;
  fat_target: number | null;
  carbs_target: number | null;
};

type BodyMetricRow = {
  id: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  measured_at: string;
};

type NutritionSummaryRow = {
  id: string;
  summary_date: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
};

type UserMemoryRow = {
  id: string;
  fact_type: string;
  content: string;
  confidence: number;
  created_at: string;
};

type ContextSnapshotRow = {
  id: string;
  snapshot_reason: string;
  payload: JsonRecord;
  created_at: string;
};

type WeeklyProgramRow = {
  id: string;
  title: string;
  status: string;
  week_start_date: string;
  week_end_date: string;
  is_locked: boolean;
};

type WorkoutDayRow = {
  id: string;
  weekly_program_id: string;
  day_of_week: number;
  status: string;
  body_weight_kg: number | null;
  session_note: string | null;
  updated_at: string;
};

type WorkoutExerciseRow = {
  id: string;
  workout_day_id: string;
  exercise_title_snapshot: string;
  sets_count: number;
  sort_order: number;
  updated_at: string;
};

type WorkoutSetRow = {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  planned_reps: number;
  planned_reps_min: number | null;
  planned_reps_max: number | null;
  actual_reps: number | null;
  actual_weight_kg: number | null;
  actual_rpe: number | null;
};

type MealRow = {
  id: string;
  eaten_at: string;
  source: string;
};

type MealItemRow = {
  id: string;
  meal_id: string;
  food_name_snapshot: string;
  servings: number | null;
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

type KnowledgeChunkRow = {
  id: string;
  source_type: string;
  source_id: string | null;
  content: string;
  metadata: JsonRecord;
};

type KnowledgeEmbeddingRow = {
  chunk_id: string;
  embedding: string | number[] | null;
};

type KnowledgeDocument = {
  sourceType: string;
  sourceId: string | null;
  content: string;
  metadata: JsonRecord;
};

type KnowledgeChunkEmbeddingInput = {
  content: string;
  id: string;
};

export type RetrievedKnowledgeItem = {
  id: string;
  sourceType: string;
  sourceId: string | null;
  content: string;
  metadata: JsonRecord;
  similarity: number;
};

export type KnowledgeReindexResult = {
  indexedChunks: number;
  embeddingsIndexed: number;
  mode: "embeddings" | "full";
  searchMode: "text" | "vector";
};

const FETCH_PAGE_SIZE = 500;
const KNOWLEDGE_EMBEDDING_MODEL =
  aiProviders.embeddings === "voyage"
    ? defaultModels.voyageEmbeddings
    : defaultModels.gatewayEmbeddings;

function formatGoal(goalType: string | null) {
  switch (goalType) {
    case "fat_loss":
      return "снижение веса";
    case "muscle_gain":
      return "набор мышц";
    case "performance":
      return "рост спортивной формы";
    case "maintenance":
      return "поддержание формы";
    default:
      return "цель не указана";
  }
}

function formatDayOfWeek(dayOfWeek: number) {
  return (
    {
      1: "Понедельник",
      2: "Вторник",
      3: "Среда",
      4: "Четверг",
      5: "Пятница",
      6: "Суббота",
      7: "Воскресенье",
    }[dayOfWeek] ?? `День ${dayOfWeek}`
  );
}

function compactJson(value: unknown) {
  const serialized = JSON.stringify(value);
  if (!serialized) {
    return "пустой JSON";
  }

  return serialized.length > 1600
    ? `${serialized.slice(0, 1600)}...`
    : serialized;
}

function toVectorLiteral(embedding: number[]) {
  return `[${embedding.map((value) => Number(value).toFixed(8)).join(",")}]`;
}

function parseVector(value: string | number[] | null) {
  if (Array.isArray(value)) {
    return value.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry));
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .trim()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry));
}

function normalizeTextForSearch(value: string) {
  return value.toLowerCase();
}

function tokenizeSearchQuery(query: string) {
  return normalizeTextForSearch(query)
    .split(/[^0-9A-Za-zА-Яа-яЁё]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, 24);
}

function rankChunkByTokens(chunk: KnowledgeChunkRow, query: string) {
  const normalizedQuery = normalizeTextForSearch(query).trim();
  const tokens = tokenizeSearchQuery(query);

  if (!normalizedQuery && !tokens.length) {
    return 0;
  }

  const haystack = normalizeTextForSearch(
    `${chunk.source_type} ${chunk.source_id ?? ""} ${chunk.content}`,
  );

  let score = 0;

  if (normalizedQuery && haystack.includes(normalizedQuery)) {
    score += 8;
  }

  for (const token of tokens) {
    if (!haystack.includes(token)) {
      continue;
    }

    score += 2;

    if (chunk.source_type.toLowerCase().includes(token)) {
      score += 1;
    }
  }

  return score;
}

function normalizeJsonArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.flatMap((item) => (typeof item === "string" ? [item] : []));
}

function toSafeNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function average(values: Array<number | null>) {
  const filtered = values.filter((value): value is number => typeof value === "number");
  if (!filtered.length) {
    return null;
  }

  return Number(
    (filtered.reduce((sum, value) => sum + value, 0) / filtered.length).toFixed(1),
  );
}

async function fetchAllRows<T>(
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

function buildMealSummary(items: MealItemRow[]) {
  const totals = items.reduce(
    (accumulator, item) => ({
      kcal: accumulator.kcal + (item.kcal ?? 0),
      protein: accumulator.protein + Number(item.protein ?? 0),
      fat: accumulator.fat + Number(item.fat ?? 0),
      carbs: accumulator.carbs + Number(item.carbs ?? 0),
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );

  return {
    description: items
      .map((item) => {
        const servings = toSafeNumber(item.servings);
        const servingText =
          typeof servings === "number" ? `${servings} порц.` : "без порции";

        return `${item.food_name_snapshot} (${servingText}; ${item.kcal ?? 0} ккал, Б ${item.protein ?? 0}, Ж ${item.fat ?? 0}, У ${item.carbs ?? 0})`;
      })
      .join("; "),
    totals,
  };
}

async function buildKnowledgeDocuments(
  supabase: SupabaseClient,
  userId: string,
): Promise<KnowledgeDocument[]> {
  const [
    aiContext,
    onboardingResult,
    goalResult,
    nutritionProfileResult,
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
    getAiRuntimeContext(supabase, userId, {
      forceRefresh: true,
    }).then((result) => result.context),
    supabase
      .from("onboarding_profiles")
      .select(
        "id, age, sex, height_cm, weight_kg, fitness_level, equipment, injuries, dietary_preferences",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("goals")
      .select("id, goal_type, target_weight_kg, weekly_training_days, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("nutrition_profiles")
      .select("id, kcal_target, protein_target, fat_target, carbs_target")
      .eq("user_id", userId)
      .maybeSingle(),
    fetchAllRows<BodyMetricRow>(async (from, to) =>
      await supabase
        .from("body_metrics")
        .select("id, weight_kg, body_fat_pct, measured_at")
        .eq("user_id", userId)
        .order("measured_at", { ascending: false })
        .range(from, to),
    ),
    fetchAllRows<NutritionSummaryRow>(async (from, to) =>
      await supabase
        .from("daily_nutrition_summaries")
        .select("id, summary_date, kcal, protein, fat, carbs")
        .eq("user_id", userId)
        .order("summary_date", { ascending: false })
        .range(from, to),
    ),
    fetchAllRows<UserMemoryRow>(async (from, to) =>
      await supabase
        .from("user_memory_facts")
        .select("id, fact_type, content, confidence, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
    fetchAllRows<ContextSnapshotRow>(async (from, to) =>
      await supabase
        .from("user_context_snapshots")
        .select("id, snapshot_reason, payload, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
    fetchAllRows<WeeklyProgramRow>(async (from, to) =>
      await supabase
        .from("weekly_programs")
        .select("id, title, status, week_start_date, week_end_date, is_locked")
        .eq("user_id", userId)
        .order("week_start_date", { ascending: false })
        .range(from, to),
    ),
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
    fetchAllRows<MealRow>(async (from, to) =>
      await supabase
        .from("meals")
        .select("id, eaten_at, source")
        .eq("user_id", userId)
        .order("eaten_at", { ascending: false })
        .range(from, to),
    ),
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
  ]);

  if (onboardingResult.error) {
    throw onboardingResult.error;
  }

  if (goalResult.error) {
    throw goalResult.error;
  }

  if (nutritionProfileResult.error) {
    throw nutritionProfileResult.error;
  }

  const workoutSets = await listAllWorkoutSetsWithRepRangeFallback(supabase, userId);
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

  const onboarding = (onboardingResult.data as OnboardingRow | null) ?? null;
  const goal = (goalResult.data as GoalRow | null) ?? null;
  const nutritionProfile =
    (nutritionProfileResult.data as NutritionProfileRow | null) ?? null;

  const documents: KnowledgeDocument[] = [];
  const structuredKnowledge = aiContext.structuredKnowledge;

  if (onboarding || goal || nutritionProfile) {
    documents.push({
      sourceType: "user_profile",
      sourceId: onboarding?.id ?? goal?.id ?? nutritionProfile?.id ?? userId,
      content: [
        "Профиль пользователя fit.",
        `Цель: ${formatGoal(goal?.goal_type ?? null)}.`,
        `Целевой вес: ${goal?.target_weight_kg ?? "не указан"} кг.`,
        `Тренировок в неделю: ${goal?.weekly_training_days ?? "не указано"}.`,
        `Возраст: ${onboarding?.age ?? "не указан"}.`,
        `Пол: ${onboarding?.sex ?? "не указан"}.`,
        `Рост: ${onboarding?.height_cm ?? "не указан"} см.`,
        `Вес: ${onboarding?.weight_kg ?? "не указан"} кг.`,
        `Уровень подготовки: ${onboarding?.fitness_level ?? "не указан"}.`,
        `Оборудование: ${normalizeJsonArray(onboarding?.equipment).join(", ") || "не указано"}.`,
        `Ограничения и травмы: ${normalizeJsonArray(onboarding?.injuries).join(", ") || "не указаны"}.`,
        `Пищевые предпочтения: ${normalizeJsonArray(onboarding?.dietary_preferences).join(", ") || "не указаны"}.`,
        `Цели по КБЖУ: калории ${nutritionProfile?.kcal_target ?? "не указаны"}, белки ${nutritionProfile?.protein_target ?? "не указаны"}, жиры ${nutritionProfile?.fat_target ?? "не указаны"}, углеводы ${nutritionProfile?.carbs_target ?? "не указаны"}.`,
        `Суммарный тоннаж: ${totalTonnageKg > 0 ? `${totalTonnageKg.toFixed(1)} кг` : "нет данных"}.`,
        `Лучший зафиксированный вес: ${bestSetWeightKg !== null ? `${bestSetWeightKg.toFixed(1)} кг` : "нет данных"}.`,
      ].join("\n"),
      metadata: {
        category: "profile",
      },
    });
  }

  if (bodyMetrics.length) {
    const latestMetric = bodyMetrics[0];
    const oldestMetric = bodyMetrics[bodyMetrics.length - 1];
    const weightDelta =
      latestMetric && oldestMetric
        ? (toSafeNumber(latestMetric.weight_kg) ?? 0) -
          (toSafeNumber(oldestMetric.weight_kg) ?? 0)
        : null;

    documents.push({
      sourceType: "body_metrics_overview",
      sourceId: latestMetric?.id ?? null,
      content: [
        "Сводка по динамике состава тела.",
        `Замеров в истории: ${bodyMetrics.length}.`,
        `Последний замер: ${latestMetric?.measured_at ?? "нет"}.`,
        `Текущий вес: ${latestMetric?.weight_kg ?? "не указан"} кг.`,
        `Текущий процент жира: ${latestMetric?.body_fat_pct ?? "не указан"}.`,
        `Изменение веса от самого раннего к последнему: ${
          typeof weightDelta === "number" ? `${weightDelta.toFixed(1)} кг` : "недостаточно данных"
        }.`,
      ].join("\n"),
      metadata: {
        category: "body_progress",
      },
    });

    for (const metric of bodyMetrics) {
      documents.push({
        sourceType: "body_metric_entry",
        sourceId: metric.id,
        content: `Замер тела от ${metric.measured_at}: вес ${metric.weight_kg ?? "не указан"} кг, процент жира ${metric.body_fat_pct ?? "не указан"}.`,
        metadata: {
          category: "body_progress",
          measuredAt: metric.measured_at,
        },
      });
    }
  }

  if (nutritionSummaries.length) {
    const avgKcal = average(nutritionSummaries.map((summary) => summary.kcal));
    const avgProtein = average(
      nutritionSummaries.map((summary) => toSafeNumber(summary.protein)),
    );

    documents.push({
      sourceType: "nutrition_overview",
      sourceId: nutritionSummaries[0]?.id ?? null,
      content: [
        "Сводка по истории питания.",
        `Дней с итогами питания: ${nutritionSummaries.length}.`,
        `Средняя калорийность по истории: ${avgKcal ?? "нет данных"} ккал.`,
        `Средний белок по истории: ${avgProtein ?? "нет данных"} г.`,
        `Последний день питания: ${nutritionSummaries[0]?.summary_date ?? "нет"}.`,
      ].join("\n"),
      metadata: {
        category: "nutrition",
      },
    });

    for (const summary of nutritionSummaries) {
      documents.push({
        sourceType: "nutrition_day",
        sourceId: summary.id,
        content: `Питание за ${summary.summary_date}: ${summary.kcal} ккал, белки ${summary.protein}, жиры ${summary.fat}, углеводы ${summary.carbs}.`,
        metadata: {
          category: "nutrition",
          summaryDate: summary.summary_date,
        },
      });
    }
  }

  if (meals.length) {
    const mealItemsByMealId = new Map<string, MealItemRow[]>();
    for (const item of mealItems) {
      const bucket = mealItemsByMealId.get(item.meal_id) ?? [];
      bucket.push(item);
      mealItemsByMealId.set(item.meal_id, bucket);
    }

    const mealPatternStats = buildNutritionMealPatternStats(
      meals.map((meal) => {
        const items = mealItemsByMealId.get(meal.id) ?? [];
        const summary = buildMealSummary(items);

        return {
          id: meal.id,
          eatenAt: meal.eaten_at,
          totals: summary.totals,
          items: items.map((item) => ({
            foodNameSnapshot: item.food_name_snapshot,
            servings: toSafeNumber(item.servings) ?? 0,
            kcal: item.kcal ?? 0,
            protein: Number(item.protein ?? 0),
            fat: Number(item.fat ?? 0),
            carbs: Number(item.carbs ?? 0),
          })),
        };
      }),
    );
    const nutritionStrategy = buildNutritionStrategyRecommendations({
      coachingSignals: [],
      mealPatterns: mealPatternStats.patterns,
      topFoods: mealPatternStats.topFoods,
      trackedDays: mealPatternStats.trackedMealDays,
    });

    if (mealPatternStats.patterns.length) {
      documents.push({
        sourceType: "nutrition_meal_patterns",
        sourceId: userId,
        content: [
          "Сводка по паттернам питания на уровне приёмов пищи.",
          ...mealPatternStats.patterns.map(
            (pattern, index) =>
              `${index + 1}. ${pattern.title} [${pattern.metric}] ${pattern.summary} Следующий шаг: ${pattern.action}`,
          ),
          mealPatternStats.topFoods.length
            ? `Частые продукты: ${mealPatternStats.topFoods
                .map((food) => `${food.foodName} (${food.appearances})`)
                .join(", ")}.`
            : "Частые продукты пока не выделены.",
        ].join("\n"),
        metadata: {
          category: "nutrition_patterns",
          mealCount: mealPatternStats.mealCount,
          trackedMealDays: mealPatternStats.trackedMealDays,
        },
      });
    }

    if (nutritionStrategy.length) {
      documents.push({
        sourceType: "nutrition_strategy",
        sourceId: userId,
        content: [
          "Приоритетные рекомендации по рациону на основе истории питания.",
          ...nutritionStrategy.map(
            (recommendation, index) =>
              `${index + 1}. ${recommendation.title} [${recommendation.priority}] ${recommendation.summary} Следующий шаг: ${recommendation.action}`,
          ),
        ].join("\n"),
        metadata: {
          category: "nutrition_strategy",
          trackedMealDays: mealPatternStats.trackedMealDays,
          recommendationCount: nutritionStrategy.length,
        },
      });
    }

    for (const meal of meals) {
      const items = mealItemsByMealId.get(meal.id) ?? [];
      const summary = buildMealSummary(items);

      documents.push({
        sourceType: "meal_log",
        sourceId: meal.id,
        content: [
          `Приём пищи от ${meal.eaten_at}.`,
          `Источник: ${meal.source}.`,
          `Итог: ${summary.totals.kcal} ккал, белки ${summary.totals.protein.toFixed(1)}, жиры ${summary.totals.fat.toFixed(1)}, углеводы ${summary.totals.carbs.toFixed(1)}.`,
          `Состав: ${summary.description || "позиции не записаны"}.`,
        ].join("\n"),
        metadata: {
          category: "meal_log",
          eatenAt: meal.eaten_at,
          source: meal.source,
        },
      });
    }
  }

  for (const fact of memoryFacts) {
    documents.push({
      sourceType: "user_memory",
      sourceId: fact.id,
      content: `Факт о пользователе (${fact.fact_type}) от ${fact.created_at}: ${fact.content}. Уверенность ${fact.confidence}.`,
      metadata: {
        category: "memory",
        factType: fact.fact_type,
      },
    });
  }

  for (const snapshot of contextSnapshots) {
    documents.push({
      sourceType: "context_snapshot",
      sourceId: snapshot.id,
      content: `Снимок пользовательского контекста (${snapshot.snapshot_reason}) от ${snapshot.created_at}: ${compactJson(snapshot.payload)}.`,
      metadata: {
        category: "snapshot",
        snapshotReason: snapshot.snapshot_reason,
      },
    });
  }

  if (programs.length || workoutDays.length || workoutExercises.length || workoutSets.length) {
    const programsById = new Map(programs.map((program) => [program.id, program]));
    const daysByProgramId = new Map<string, WorkoutDayRow[]>();
    const exercisesByDayId = new Map<string, WorkoutExerciseRow[]>();
    const setsByExerciseId = new Map<string, WorkoutSetRow[]>();

    for (const day of workoutDays) {
      const bucket = daysByProgramId.get(day.weekly_program_id) ?? [];
      bucket.push(day);
      daysByProgramId.set(day.weekly_program_id, bucket);
    }

    for (const exercise of workoutExercises) {
      const bucket = exercisesByDayId.get(exercise.workout_day_id) ?? [];
      bucket.push(exercise);
      exercisesByDayId.set(exercise.workout_day_id, bucket);
    }

    for (const set of workoutSets) {
      const bucket = setsByExerciseId.get(set.workout_exercise_id) ?? [];
      bucket.push(set);
      setsByExerciseId.set(set.workout_exercise_id, bucket);
    }

    const completedDays = workoutDays.filter((day) => day.status === "done").length;
    const loggedSets = workoutSets.filter((set) => set.actual_reps != null).length;
    const exerciseHistory = new Map<
      string,
      {
        appearances: number;
        lastUpdatedAt: string | null;
        repNotes: string[];
        weightNotes: string[];
        rpeNotes: string[];
        totalTonnageKg: number;
        bestSetWeightKg: number | null;
      }
    >();

    documents.push({
      sourceType: "workout_overview",
      sourceId: programs[0]?.id ?? workoutDays[0]?.id ?? null,
      content: [
        "Сводка по тренировочной истории.",
        `Программ в истории: ${programs.length}.`,
        `Тренировочных дней в истории: ${workoutDays.length}.`,
        `Завершённых дней: ${completedDays}.`,
        `Сетов с фактическими повторениями: ${loggedSets}.`,
      ].join("\n"),
      metadata: {
        category: "workout",
      },
    });

    for (const program of programs) {
      const days = (daysByProgramId.get(program.id) ?? []).sort(
        (left, right) => left.day_of_week - right.day_of_week,
      );
      const dayLines = days.map((day) => {
        const exercises = (exercisesByDayId.get(day.id) ?? []).sort(
          (left, right) => left.sort_order - right.sort_order,
        );
        const exerciseSummary = exercises
          .map((exercise) => {
            const sets = (setsByExerciseId.get(exercise.id) ?? []).sort(
              (left, right) => left.set_number - right.set_number,
            );
            const repsSummary = sets
              .map((set) => {
                const actualWeight =
                  set.actual_weight_kg !== null ? ` @ ${set.actual_weight_kg} кг` : "";
                const actualRpe =
                  set.actual_rpe !== null ? `, RPE ${set.actual_rpe}` : "";
                return set.actual_reps != null
                  ? `${set.actual_reps}/${formatPlannedRepTarget(set)}${actualWeight}${actualRpe}`
                  : `${formatPlannedRepTarget(set)}${actualWeight}${actualRpe}`;
              })
              .join(", ");

            return `${exercise.exercise_title_snapshot} (${exercise.sets_count} подходов${repsSummary ? `; повторения: ${repsSummary}` : ""})`;
          })
          .join("; ");

        return `${formatDayOfWeek(day.day_of_week)} [${day.status}]: ${exerciseSummary || "без упражнений"}.`;
      });

      documents.push({
        sourceType: "weekly_program",
        sourceId: program.id,
        content: [
          `Тренировочная неделя "${program.title}".`,
          `Статус: ${program.status}.`,
          `Период: ${program.week_start_date} — ${program.week_end_date}.`,
          `Заблокирована: ${program.is_locked ? "да" : "нет"}.`,
          ...dayLines,
        ].join("\n"),
        metadata: {
          category: "workout",
          status: program.status,
          weekStartDate: program.week_start_date,
          weekEndDate: program.week_end_date,
        },
      });
    }

    for (const day of workoutDays) {
      const program = programsById.get(day.weekly_program_id);
      const exercises = (exercisesByDayId.get(day.id) ?? []).sort(
        (left, right) => left.sort_order - right.sort_order,
      );
      const exerciseLines = exercises.map((exercise) => {
        const sets = (setsByExerciseId.get(exercise.id) ?? []).sort(
          (left, right) => left.set_number - right.set_number,
        );
        const setLine = sets
          .map((set) => {
            const planned = formatPlannedRepTarget(set);
            const weightText =
              set.actual_weight_kg !== null ? `, вес ${set.actual_weight_kg} кг` : "";
            const rpeText =
              set.actual_rpe !== null ? `, RPE ${set.actual_rpe}` : "";
            return set.actual_reps != null
              ? `сет ${set.set_number}: факт ${set.actual_reps}, план ${planned}${weightText}${rpeText}`
              : `сет ${set.set_number}: план ${planned}${weightText}${rpeText}`;
          })
          .join("; ");
        const title = exercise.exercise_title_snapshot.trim() || "Без названия";
        const repValues = sets
          .map((set) => set.actual_reps)
          .filter((value): value is number => typeof value === "number");
        const weightValues = sets
          .map((set) => set.actual_weight_kg)
          .filter((value): value is number => typeof value === "number");
        const rpeValues = sets
          .map((set) => set.actual_rpe)
          .filter((value): value is number => typeof value === "number");
        const exerciseTonnageKg = sets.reduce((sum, set) => {
          if (set.actual_reps === null || set.actual_weight_kg === null) {
            return sum;
          }

          return sum + set.actual_reps * set.actual_weight_kg;
        }, 0);
        const current = exerciseHistory.get(title) ?? {
          appearances: 0,
          lastUpdatedAt: null,
          repNotes: [],
          weightNotes: [],
          rpeNotes: [],
          totalTonnageKg: 0,
          bestSetWeightKg: null,
        };

        current.appearances += 1;
        current.lastUpdatedAt = current.lastUpdatedAt
          ? current.lastUpdatedAt > exercise.updated_at
            ? current.lastUpdatedAt
            : exercise.updated_at
          : exercise.updated_at;
        current.totalTonnageKg += exerciseTonnageKg;
        current.bestSetWeightKg =
          current.bestSetWeightKg === null
            ? weightValues[0] ?? null
            : weightValues.length
              ? Math.max(current.bestSetWeightKg, ...weightValues)
              : current.bestSetWeightKg;
        if (repValues.length) {
          current.repNotes.push(
            `${day.updated_at}: ${repValues.map((value) => `${value} повт.`).join(", ")}`,
          );
        }
        if (weightValues.length || exerciseTonnageKg > 0) {
          current.weightNotes.push(
            `${day.updated_at}: тоннаж ${exerciseTonnageKg.toFixed(1)} кг, лучший вес ${weightValues.length ? `${Math.max(...weightValues).toFixed(1)} кг` : "не записан"}`,
          );
        }
        if (rpeValues.length) {
          const avgRpe =
            rpeValues.reduce((sum, value) => sum + value, 0) / rpeValues.length;
          current.rpeNotes.push(
            `${day.updated_at}: средний RPE ${avgRpe.toFixed(1)}, пик ${Math.max(...rpeValues).toFixed(1)}`,
          );
        }
        exerciseHistory.set(title, current);

        return `${title}. ${setLine || "подходы ещё не записаны"}.`;
      });

      documents.push({
        sourceType: "workout_day",
        sourceId: day.id,
        content: [
          `Тренировочный день ${formatDayOfWeek(day.day_of_week)}.`,
          `Статус: ${day.status}.`,
          `Вес тела в день тренировки: ${day.body_weight_kg ?? "не указан"} кг.`,
          `Обновлён: ${day.updated_at}.`,
          `Программа: ${program?.title ?? "без названия"}.`,
          `Заметка: ${day.session_note?.trim() || "нет заметки"}.`,
          ...exerciseLines,
        ].join("\n"),
        metadata: {
          category: "workout",
          status: day.status,
          weeklyProgramId: day.weekly_program_id,
        },
      });
    }

    for (const [exerciseTitle, summary] of exerciseHistory.entries()) {
      documents.push({
        sourceType: "exercise_history",
        sourceId: exerciseTitle,
        content: [
          `История упражнения "${exerciseTitle}".`,
          `Встречалось в истории: ${summary.appearances} раз.`,
          `Последнее обновление: ${summary.lastUpdatedAt ?? "нет данных"}.`,
          `Последние фактические записи: ${summary.repNotes.slice(0, 6).join(" | ") || "нет фактических повторений"}.`,
          `Последние записи по нагрузке: ${summary.weightNotes.slice(0, 6).join(" | ") || "нет данных по весу и тоннажу"}.`,
          `Последние записи по усилию: ${summary.rpeNotes.slice(0, 6).join(" | ") || "нет данных по RPE"}.`,
        ].join("\n"),
        metadata: {
          category: "workout_exercise_history",
          exerciseTitle,
        },
      });
    }
  }

  if (structuredKnowledge.facts.length) {
    documents.push({
      sourceType: "structured_fact_sheet",
      sourceId: userId,
      content: [
        "Нормализованная сводка фактов, приоритетов и coaching-сигналов по пользователю.",
        formatStructuredKnowledgeForDocument(structuredKnowledge),
      ].join("\n"),
      metadata: {
        category: "structured_knowledge",
        factCount: structuredKnowledge.facts.length,
        generatedAt: structuredKnowledge.generatedAt,
        signature: buildStructuredKnowledgeSignature(structuredKnowledge),
      },
    });

    for (const fact of structuredKnowledge.facts) {
      documents.push({
        sourceType: "structured_fact",
        sourceId: `${userId}:${fact.id}`,
        content: [
          `${fact.title}.`,
          fact.summary,
          fact.evidence.length ? `Основания: ${fact.evidence.join("; ")}.` : null,
          fact.action ? `Следующий шаг: ${fact.action}` : null,
        ]
          .filter((value): value is string => typeof value === "string" && value.length > 0)
          .join("\n"),
        metadata: {
          category: "structured_knowledge",
          topic: fact.topic,
          priority: fact.priority,
        },
      });
    }
  }

  if (!documents.length) {
    documents.push({
      sourceType: "fallback_context",
      sourceId: userId,
      content:
        "По пользователю пока мало данных. Давай короткие, безопасные и практичные рекомендации, явно отмечая недостаток истории.",
      metadata: {
        category: "fallback",
      },
    });
  }

  return documents;
}

async function listKnowledgeChunkInputs(
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

async function refreshKnowledgeEmbeddings(
  supabase: SupabaseClient,
  userId: string,
): Promise<KnowledgeReindexResult> {
  const chunks = await listKnowledgeChunkInputs(supabase, userId);

  if (!chunks.length) {
    return {
      indexedChunks: 0,
      embeddingsIndexed: 0,
      mode: "embeddings",
      searchMode: "text",
    };
  }

  const { error: deleteError } = await supabase
    .from("knowledge_embeddings")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    throw deleteError;
  }

  try {
    const embeddings = await embedDocumentTexts(chunks.map((chunk) => chunk.content));

    const { error: embeddingInsertError } = await supabase
      .from("knowledge_embeddings")
      .insert(
        embeddings.map((embedding, index) => ({
          user_id: userId,
          chunk_id: chunks[index]?.id,
          embedding: toVectorLiteral(embedding),
          model: KNOWLEDGE_EMBEDDING_MODEL,
        })),
      );

    if (embeddingInsertError) {
      throw embeddingInsertError;
    }
  } catch (error) {
    logger.warn("knowledge embeddings unavailable; text retrieval only", {
      error,
      userId,
    });

    return {
      indexedChunks: chunks.length,
      embeddingsIndexed: 0,
      mode: "embeddings",
      searchMode: "text",
    };
  }

  return {
    indexedChunks: chunks.length,
    embeddingsIndexed: chunks.length,
    mode: "embeddings",
    searchMode: "vector",
  };
}

export async function reindexUserKnowledgeBase(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    mode?: "embeddings" | "full";
  },
): Promise<KnowledgeReindexResult> {
  const mode = options?.mode ?? "full";

  if (mode === "embeddings") {
    const chunks = await listKnowledgeChunkInputs(supabase, userId);

    if (!chunks.length) {
      return reindexUserKnowledgeBase(supabase, userId, {
        mode: "full",
      });
    }

    return refreshKnowledgeEmbeddings(supabase, userId);
  }

  const documents = await buildKnowledgeDocuments(supabase, userId);

  const { error: deleteError } = await supabase
    .from("knowledge_chunks")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    throw deleteError;
  }

  const { data: insertedChunks, error: chunkInsertError } = await supabase
    .from("knowledge_chunks")
    .insert(
      documents.map((document) => ({
        user_id: userId,
        source_type: document.sourceType,
        source_id: document.sourceId,
        content: document.content,
        metadata: document.metadata,
      })),
    )
    .select("id, source_type, source_id, content, metadata");

  if (chunkInsertError) {
    throw chunkInsertError;
  }

  const chunks = (insertedChunks as KnowledgeChunkRow[] | null) ?? [];

  if (!chunks.length) {
    return {
      indexedChunks: 0,
      embeddingsIndexed: 0,
      mode: "full",
      searchMode: "text",
    };
  }

  const embeddingsResult = await refreshKnowledgeEmbeddings(supabase, userId);

  return {
    embeddingsIndexed: embeddingsResult.embeddingsIndexed,
    indexedChunks: chunks.length,
    mode: "full",
    searchMode: embeddingsResult.searchMode,
  };
}

async function ensureKnowledgeIndex(
  supabase: SupabaseClient,
  userId: string,
) {
  const { count, error } = await supabase
    .from("knowledge_chunks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  if (!count) {
    await reindexUserKnowledgeBase(supabase, userId);
    return;
  }

  const { count: embeddingCount, error: embeddingCountError } = await supabase
    .from("knowledge_embeddings")
    .select("chunk_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("model", KNOWLEDGE_EMBEDDING_MODEL);

  if (embeddingCountError) {
    throw embeddingCountError;
  }

  if (!embeddingCount) {
    try {
      await refreshKnowledgeEmbeddings(supabase, userId);
    } catch (error) {
      logger.warn("knowledge embeddings refresh failed during ensure", {
        error,
        userId,
      });
    }
  }
}

async function retrieveKnowledgeMatchesViaRpc(
  supabase: SupabaseClient,
  queryEmbedding: number[],
  limit: number,
) {
  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: toVectorLiteral(queryEmbedding),
    match_count: limit,
    match_threshold: 0.45,
  });

  if (error) {
    throw error;
  }

  return ((data as
    | Array<{
        id: string;
        source_type: string;
        source_id: string | null;
        content: string;
        metadata: JsonRecord;
        similarity: number;
      }>
    | null) ?? [])
    .map((item) => ({
      id: item.id,
      sourceType: item.source_type,
      sourceId: item.source_id,
      content: item.content,
      metadata: item.metadata ?? {},
      similarity: Number(item.similarity),
    }))
    .filter((item) => Number.isFinite(item.similarity));
}

async function retrieveKnowledgeMatchesViaTextRpc(
  supabase: SupabaseClient,
  query: string,
  limit: number,
) {
  const { data, error } = await supabase.rpc("search_knowledge_chunks_text", {
    query_text: query,
    match_count: limit,
  });

  if (error) {
    throw error;
  }

  return ((data as
    | Array<{
        id: string;
        source_type: string;
        source_id: string | null;
        content: string;
        metadata: JsonRecord;
        similarity: number;
      }>
    | null) ?? [])
    .map((item) => ({
      id: item.id,
      sourceType: item.source_type,
      sourceId: item.source_id,
      content: item.content,
      metadata: item.metadata ?? {},
      similarity: Number(item.similarity),
    }))
    .filter((item) => Number.isFinite(item.similarity));
}

async function retrieveKnowledgeMatchesWithFallback(
  supabase: SupabaseClient,
  userId: string,
  queryEmbedding: number[],
  limit: number,
) {
  const { data: embeddingData, error: embeddingError } = await supabase
    .from("knowledge_embeddings")
    .select("chunk_id, embedding")
    .eq("user_id", userId)
    .limit(400);

  if (embeddingError) {
    throw embeddingError;
  }

  const embeddingRows =
    (embeddingData as KnowledgeEmbeddingRow[] | null) ?? [];

  if (!embeddingRows.length) {
    return [] as RetrievedKnowledgeItem[];
  }

  const chunkIds = [...new Set(embeddingRows.map((row) => row.chunk_id))];

  const { data: chunkData, error: chunkError } = await supabase
    .from("knowledge_chunks")
    .select("id, source_type, source_id, content, metadata")
    .eq("user_id", userId)
    .in("id", chunkIds);

  if (chunkError) {
    throw chunkError;
  }

  const chunks = (chunkData as KnowledgeChunkRow[] | null) ?? [];
  const chunksById = new Map(chunks.map((chunk) => [chunk.id, chunk]));

  return embeddingRows
    .map((row) => {
      const chunk = chunksById.get(row.chunk_id);

      if (!chunk) {
        return null;
      }

      const candidateEmbedding = parseVector(row.embedding);

      if (!candidateEmbedding.length || candidateEmbedding.length !== queryEmbedding.length) {
        return null;
      }

      return {
        id: chunk.id,
        sourceType: chunk.source_type,
        sourceId: chunk.source_id,
        content: chunk.content,
        metadata: chunk.metadata,
        similarity: cosineSimilarity(queryEmbedding, candidateEmbedding),
      } satisfies RetrievedKnowledgeItem;
    })
    .filter((item): item is RetrievedKnowledgeItem => Boolean(item))
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, limit);
}

async function retrieveKnowledgeMatchesViaTextFallback(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  limit: number,
) {
  const { data, error } = await supabase
    .from("knowledge_chunks")
    .select("id, source_type, source_id, content, metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(600);

  if (error) {
    throw error;
  }

  const chunks = (data as KnowledgeChunkRow[] | null) ?? [];

  return chunks
    .map((chunk) => ({
      id: chunk.id,
      sourceType: chunk.source_type,
      sourceId: chunk.source_id,
      content: chunk.content,
      metadata: chunk.metadata,
      similarity: rankChunkByTokens(chunk, query),
    }))
    .filter((item) => item.similarity > 0)
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, limit);
}

export async function retrieveKnowledgeMatches(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  limit = 6,
): Promise<RetrievedKnowledgeItem[]> {
  try {
    await ensureKnowledgeIndex(supabase, userId);
  } catch (error) {
    logger.warn("knowledge index refresh failed; using existing chunks only", {
      error,
      userId,
    });
  }

  let queryEmbedding: number[] | null = null;

  try {
    queryEmbedding = await embedQueryText(query);
  } catch (error) {
    logger.warn("knowledge query embedding unavailable; falling back to text retrieval", {
      error,
      userId,
    });
  }

  if (queryEmbedding) {
    try {
      const rpcMatches = await retrieveKnowledgeMatchesViaRpc(
        supabase,
        queryEmbedding,
        limit,
      );

      if (rpcMatches.length) {
        return rpcMatches;
      }
    } catch (error) {
      logger.warn("knowledge RPC retrieval fell back to app-side vector ranking", {
        error,
        userId,
      });
    }

    try {
      const vectorFallbackMatches = await retrieveKnowledgeMatchesWithFallback(
        supabase,
        userId,
        queryEmbedding,
        limit,
      );

      if (vectorFallbackMatches.length) {
        return vectorFallbackMatches;
      }
    } catch (error) {
      logger.warn("knowledge vector fallback failed; trying text retrieval", {
        error,
        userId,
      });
    }
  }

  try {
    const textRpcMatches = await retrieveKnowledgeMatchesViaTextRpc(
      supabase,
      query,
      limit,
    );

    if (textRpcMatches.length) {
      return textRpcMatches;
    }
  } catch (error) {
    logger.warn("knowledge text RPC retrieval fell back to app-side text ranking", {
      error,
      userId,
    });
  }

  try {
    return await retrieveKnowledgeMatchesViaTextFallback(
      supabase,
      userId,
      query,
      limit,
    );
  } catch (error) {
    logger.warn("knowledge text fallback failed", {
      error,
      userId,
    });
    return [];
  }
}
