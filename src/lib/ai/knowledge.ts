import type { SupabaseClient } from "@supabase/supabase-js";

import { aiProviders, defaultModels } from "@/lib/ai/gateway";
import {
  average,
  buildMealSummary,
  compactJson,
  formatDayOfWeek,
  formatGoal,
  normalizeJsonArray,
  toSafeNumber,
  type KnowledgeChunkRow,
  type KnowledgeDocument,
  type KnowledgeReindexResult,
  type MealItemRow,
  type RetrievedKnowledgeItem,
  type WorkoutDayRow,
  type WorkoutExerciseRow,
  type WorkoutSetRow,
} from "@/lib/ai/knowledge-model";
import {
  ensureKnowledgeIndexState,
  refreshKnowledgeEmbeddings as refreshKnowledgeEmbeddingsWithIndexing,
} from "@/lib/ai/knowledge-indexing";
import {
  listKnowledgeChunkInputs,
  loadKnowledgeSourceData,
} from "@/lib/ai/knowledge-source-data";
import { retrieveKnowledgeMatchesWithPipeline } from "@/lib/ai/knowledge-retrieval";
import {
  buildStructuredKnowledgeSignature,
  formatStructuredKnowledgeForDocument,
} from "@/lib/ai/structured-knowledge";
import { buildNutritionMealPatternStats } from "@/lib/nutrition/meal-patterns";
import { buildNutritionStrategyRecommendations } from "@/lib/nutrition/strategy-recommendations";
import { formatPlannedRepTarget } from "@/lib/workout/rep-ranges";

export type {
  KnowledgeReindexResult,
  RetrievedKnowledgeItem,
} from "@/lib/ai/knowledge-model";

const KNOWLEDGE_EMBEDDING_MODEL =
  aiProviders.embeddings === "voyage"
    ? defaultModels.voyageEmbeddings
    : defaultModels.gatewayEmbeddings;

async function buildKnowledgeDocuments(
  supabase: SupabaseClient,
  userId: string,
): Promise<KnowledgeDocument[]> {
  const {
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
  } = await loadKnowledgeSourceData(supabase, userId);

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

    return refreshKnowledgeEmbeddingsWithIndexing({
      embeddingModel: KNOWLEDGE_EMBEDDING_MODEL,
      listKnowledgeChunkInputs,
      supabase,
      userId,
    });
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

  const embeddingsResult = await refreshKnowledgeEmbeddingsWithIndexing({
    embeddingModel: KNOWLEDGE_EMBEDDING_MODEL,
    listKnowledgeChunkInputs,
    supabase,
    userId,
  });

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
  await ensureKnowledgeIndexState({
    embeddingModel: KNOWLEDGE_EMBEDDING_MODEL,
    reindexKnowledgeBase: async (innerSupabase, innerUserId) => {
      await reindexUserKnowledgeBase(innerSupabase, innerUserId);
    },
    refreshKnowledgeEmbeddings: async (innerSupabase, innerUserId) =>
      await refreshKnowledgeEmbeddingsWithIndexing({
        embeddingModel: KNOWLEDGE_EMBEDDING_MODEL,
        listKnowledgeChunkInputs,
        supabase: innerSupabase,
        userId: innerUserId,
      }),
    supabase,
    userId,
  });
}

export async function retrieveKnowledgeMatches(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  limit = 6,
): Promise<RetrievedKnowledgeItem[]> {
  return retrieveKnowledgeMatchesWithPipeline({
    ensureKnowledgeIndex,
    limit,
    query,
    supabase,
    userId,
  });
}
