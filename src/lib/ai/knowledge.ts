import { cosineSimilarity, embed, embedMany } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";

import { models } from "@/lib/ai/gateway";
import { logger } from "@/lib/logger";

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
};

type WorkoutExerciseRow = {
  id: string;
  workout_day_id: string;
  exercise_title_snapshot: string;
  sets_count: number;
  sort_order: number;
};

type WorkoutSetRow = {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  planned_reps: number;
  actual_reps: number | null;
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

export type RetrievedKnowledgeItem = {
  id: string;
  sourceType: string;
  sourceId: string | null;
  content: string;
  metadata: JsonRecord;
  similarity: number;
};

function formatGoal(goalType: string | null) {
  switch (goalType) {
    case "fat_loss":
      return "снижение веса";
    case "muscle_gain":
      return "набор мышц";
    case "performance":
      return "улучшение производительности";
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

  return serialized.length > 1200
    ? `${serialized.slice(0, 1200)}...`
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

async function buildKnowledgeDocuments(
  supabase: SupabaseClient,
  userId: string,
): Promise<KnowledgeDocument[]> {
  const [
    onboardingResult,
    goalResult,
    nutritionProfileResult,
    bodyMetricsResult,
    nutritionSummariesResult,
    memoryFactsResult,
    contextSnapshotsResult,
    programsResult,
  ] = await Promise.all([
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
    supabase
      .from("body_metrics")
      .select("id, weight_kg, body_fat_pct, measured_at")
      .eq("user_id", userId)
      .order("measured_at", { ascending: false })
      .limit(5),
    supabase
      .from("daily_nutrition_summaries")
      .select("id, summary_date, kcal, protein, fat, carbs")
      .eq("user_id", userId)
      .order("summary_date", { ascending: false })
      .limit(7),
    supabase
      .from("user_memory_facts")
      .select("id, fact_type, content, confidence, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("user_context_snapshots")
      .select("id, snapshot_reason, payload, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("weekly_programs")
      .select("id, title, status, week_start_date, week_end_date, is_locked")
      .eq("user_id", userId)
      .order("week_start_date", { ascending: false })
      .limit(3),
  ]);

  const onboarding = (onboardingResult.data as OnboardingRow | null) ?? null;
  const goal = (goalResult.data as GoalRow | null) ?? null;
  const nutritionProfile =
    (nutritionProfileResult.data as NutritionProfileRow | null) ?? null;
  const bodyMetrics = (bodyMetricsResult.data as BodyMetricRow[] | null) ?? [];
  const nutritionSummaries =
    (nutritionSummariesResult.data as NutritionSummaryRow[] | null) ?? [];
  const memoryFacts = (memoryFactsResult.data as UserMemoryRow[] | null) ?? [];
  const contextSnapshots =
    (contextSnapshotsResult.data as ContextSnapshotRow[] | null) ?? [];
  const programs = (programsResult.data as WeeklyProgramRow[] | null) ?? [];

  const documents: KnowledgeDocument[] = [];

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
        `Оборудование: ${onboarding?.equipment?.join(", ") || "не указано"}.`,
        `Ограничения и травмы: ${onboarding?.injuries?.join(", ") || "не указаны"}.`,
        `Пищевые предпочтения: ${onboarding?.dietary_preferences?.join(", ") || "не указаны"}.`,
        `Цели по КБЖУ: калории ${nutritionProfile?.kcal_target ?? "не указаны"}, белки ${nutritionProfile?.protein_target ?? "не указаны"}, жиры ${nutritionProfile?.fat_target ?? "не указаны"}, углеводы ${nutritionProfile?.carbs_target ?? "не указаны"}.`,
      ].join("\n"),
      metadata: {
        category: "profile",
      },
    });
  }

  if (bodyMetrics.length) {
    documents.push({
      sourceType: "body_metrics",
      sourceId: bodyMetrics[0]?.id ?? null,
      content: [
        "Последние замеры тела пользователя.",
        ...bodyMetrics.map(
          (metric) =>
            `${metric.measured_at}: вес ${metric.weight_kg ?? "не указан"} кг, процент жира ${metric.body_fat_pct ?? "не указан"}.`,
        ),
      ].join("\n"),
      metadata: {
        category: "progress",
      },
    });
  }

  if (nutritionSummaries.length) {
    documents.push({
      sourceType: "nutrition_history",
      sourceId: nutritionSummaries[0]?.id ?? null,
      content: [
        "Сводки по питанию за последние дни.",
        ...nutritionSummaries.map(
          (summary) =>
            `${summary.summary_date}: ${summary.kcal} ккал, белки ${summary.protein}, жиры ${summary.fat}, углеводы ${summary.carbs}.`,
        ),
      ].join("\n"),
      metadata: {
        category: "nutrition",
      },
    });
  }

  if (memoryFacts.length) {
    documents.push({
      sourceType: "user_memory",
      sourceId: memoryFacts[0]?.id ?? null,
      content: [
        "Краткая память о пользователе и его предпочтениях.",
        ...memoryFacts.map(
          (fact) =>
            `${fact.fact_type}: ${fact.content} (confidence ${fact.confidence}).`,
        ),
      ].join("\n"),
      metadata: {
        category: "memory",
      },
    });
  }

  if (contextSnapshots.length) {
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
  }

  if (programs.length) {
    const programIds = programs.map((program) => program.id);
    const { data: workoutDaysData } = await supabase
      .from("workout_days")
      .select("id, weekly_program_id, day_of_week, status")
      .eq("user_id", userId)
      .in("weekly_program_id", programIds)
      .order("day_of_week", { ascending: true });

    const workoutDays = (workoutDaysData as WorkoutDayRow[] | null) ?? [];
    const dayIds = workoutDays.map((day) => day.id);

    const { data: workoutExercisesData } = dayIds.length
      ? await supabase
          .from("workout_exercises")
          .select(
            "id, workout_day_id, exercise_title_snapshot, sets_count, sort_order",
          )
          .eq("user_id", userId)
          .in("workout_day_id", dayIds)
          .order("sort_order", { ascending: true })
      : { data: [] };

    const workoutExercises =
      (workoutExercisesData as WorkoutExerciseRow[] | null) ?? [];
    const exerciseIds = workoutExercises.map((exercise) => exercise.id);

    const { data: workoutSetsData } = exerciseIds.length
      ? await supabase
          .from("workout_sets")
          .select("id, workout_exercise_id, set_number, planned_reps, actual_reps")
          .eq("user_id", userId)
          .in("workout_exercise_id", exerciseIds)
          .order("set_number", { ascending: true })
      : { data: [] };

    const workoutSets = (workoutSetsData as WorkoutSetRow[] | null) ?? [];

    const daysByProgram = new Map<string, WorkoutDayRow[]>();
    for (const day of workoutDays) {
      const bucket = daysByProgram.get(day.weekly_program_id) ?? [];
      bucket.push(day);
      daysByProgram.set(day.weekly_program_id, bucket);
    }

    const exercisesByDay = new Map<string, WorkoutExerciseRow[]>();
    for (const exercise of workoutExercises) {
      const bucket = exercisesByDay.get(exercise.workout_day_id) ?? [];
      bucket.push(exercise);
      exercisesByDay.set(exercise.workout_day_id, bucket);
    }

    const setsByExercise = new Map<string, WorkoutSetRow[]>();
    for (const set of workoutSets) {
      const bucket = setsByExercise.get(set.workout_exercise_id) ?? [];
      bucket.push(set);
      setsByExercise.set(set.workout_exercise_id, bucket);
    }

    for (const program of programs) {
      const days = daysByProgram.get(program.id) ?? [];
      const lines = days.map((day) => {
        const exercises = exercisesByDay.get(day.id) ?? [];
        const exerciseSummary = exercises
          .map((exercise) => {
            const sets = setsByExercise.get(exercise.id) ?? [];
            const repsSummary = sets
              .map((set) =>
                set.actual_reps != null
                  ? `${set.actual_reps}/${set.planned_reps}`
                  : `${set.planned_reps}`,
              )
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
          ...lines,
        ].join("\n"),
        metadata: {
          category: "workout",
          status: program.status,
          weekStartDate: program.week_start_date,
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

export async function reindexUserKnowledgeBase(
  supabase: SupabaseClient,
  userId: string,
) {
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
    };
  }

  const embeddingResult = await embedMany({
    model: models.embeddings,
    values: chunks.map((chunk) => chunk.content),
  });

  const { error: embeddingInsertError } = await supabase
    .from("knowledge_embeddings")
    .insert(
      embeddingResult.embeddings.map((embedding, index) => ({
        user_id: userId,
        chunk_id: chunks[index]?.id,
        embedding: toVectorLiteral(embedding),
        model: "voyage/voyage-4-large",
      })),
    );

  if (embeddingInsertError) {
    logger.error("knowledge embeddings insert failed", {
      error: embeddingInsertError,
      userId,
    });
    throw embeddingInsertError;
  }

  return {
    indexedChunks: chunks.length,
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
  }
}

export async function retrieveKnowledgeMatches(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  limit = 6,
): Promise<RetrievedKnowledgeItem[]> {
  await ensureKnowledgeIndex(supabase, userId);

  const { embedding: queryEmbedding } = await embed({
    model: models.embeddings,
    value: query,
  });

  const { data: embeddingData, error: embeddingError } = await supabase
    .from("knowledge_embeddings")
    .select("chunk_id, embedding")
    .or(`user_id.eq.${userId},user_id.is.null`)
    .limit(200);

  if (embeddingError) {
    throw embeddingError;
  }

  const embeddingRows =
    (embeddingData as KnowledgeEmbeddingRow[] | null) ?? [];

  if (!embeddingRows.length) {
    return [];
  }

  const chunkIds = [...new Set(embeddingRows.map((row) => row.chunk_id))];

  const { data: chunkData, error: chunkError } = await supabase
    .from("knowledge_chunks")
    .select("id, source_type, source_id, content, metadata")
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
