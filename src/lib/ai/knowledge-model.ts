export type JsonRecord = Record<string, unknown>;

export type OnboardingRow = {
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

export type GoalRow = {
  id: string;
  goal_type: string | null;
  target_weight_kg: number | null;
  weekly_training_days: number | null;
  updated_at: string;
};

export type NutritionProfileRow = {
  id: string;
  kcal_target: number | null;
  protein_target: number | null;
  fat_target: number | null;
  carbs_target: number | null;
};

export type BodyMetricRow = {
  id: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  measured_at: string;
};

export type NutritionSummaryRow = {
  id: string;
  summary_date: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type UserMemoryRow = {
  id: string;
  fact_type: string;
  content: string;
  confidence: number;
  created_at: string;
};

export type ContextSnapshotRow = {
  id: string;
  snapshot_reason: string;
  payload: JsonRecord;
  created_at: string;
};

export type WeeklyProgramRow = {
  id: string;
  title: string;
  status: string;
  week_start_date: string;
  week_end_date: string;
  is_locked: boolean;
};

export type WorkoutDayRow = {
  id: string;
  weekly_program_id: string;
  day_of_week: number;
  status: string;
  body_weight_kg: number | null;
  session_note: string | null;
  updated_at: string;
};

export type WorkoutExerciseRow = {
  id: string;
  workout_day_id: string;
  exercise_title_snapshot: string;
  sets_count: number;
  sort_order: number;
  updated_at: string;
};

export type WorkoutSetRow = {
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

export type MealRow = {
  id: string;
  eaten_at: string;
  source: string;
};

export type MealItemRow = {
  id: string;
  meal_id: string;
  food_name_snapshot: string;
  servings: number | null;
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

export type KnowledgeChunkRow = {
  id: string;
  source_type: string;
  source_id: string | null;
  content: string;
  metadata: JsonRecord;
};

export type KnowledgeEmbeddingRow = {
  chunk_id: string;
  embedding: string | number[] | null;
};

export type KnowledgeDocument = {
  sourceType: string;
  sourceId: string | null;
  content: string;
  metadata: JsonRecord;
};

export type KnowledgeChunkEmbeddingInput = {
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

export function formatGoal(goalType: string | null) {
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

export function formatDayOfWeek(dayOfWeek: number) {
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

export function compactJson(value: unknown) {
  const serialized = JSON.stringify(value);
  if (!serialized) {
    return "пустой JSON";
  }

  return serialized.length > 1600
    ? `${serialized.slice(0, 1600)}...`
    : serialized;
}

export function toVectorLiteral(embedding: number[]) {
  return `[${embedding.map((value) => Number(value).toFixed(8)).join(",")}]`;
}

export function parseVector(value: string | number[] | null) {
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

export function normalizeTextForSearch(value: string) {
  return value.toLowerCase();
}

export function tokenizeSearchQuery(query: string) {
  return normalizeTextForSearch(query)
    .split(/[^0-9A-Za-zА-Яа-яЁё]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, 24);
}

export function rankChunkByTokens(chunk: KnowledgeChunkRow, query: string) {
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

export function normalizeJsonArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.flatMap((item) => (typeof item === "string" ? [item] : []));
}

export function toSafeNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function average(values: Array<number | null>) {
  const filtered = values.filter((value): value is number => typeof value === "number");
  if (!filtered.length) {
    return null;
  }

  return Number(
    (filtered.reduce((sum, value) => sum + value, 0) / filtered.length).toFixed(1),
  );
}

export function buildMealSummary(items: MealItemRow[]) {
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
