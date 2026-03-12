import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getAiPlanProposal,
  listAiPlanProposals,
  type AiPlanProposalRow,
  type AiPlanProposalType,
  updateAiPlanProposal,
} from "@/lib/ai/proposals";
import { mealPlanSchema, workoutPlanSchema } from "@/lib/ai/schemas";
import { resolveRepRangePresetFromText } from "@/lib/workout/rep-ranges";
import { insertWorkoutSetsWithRepRangeFallback } from "@/lib/workout/workout-sets";

export type AiPlanProposalPreview = {
  proposalId: string;
  proposalType: AiPlanProposalType;
  status: string;
  title: string;
  requestSummary: string;
  timeline: string;
  createdAt: string;
  updatedAt: string;
};

function getUtcMonday(date: Date) {
  const nextDate = new Date(date);
  const offset = (nextDate.getUTCDay() + 6) % 7;
  nextDate.setUTCHours(0, 0, 0, 0);
  nextDate.setUTCDate(nextDate.getUTCDate() - offset);
  return nextDate;
}

function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatGoal(goal: string | null | undefined) {
  switch (goal) {
    case "fat_loss":
      return "снижение веса";
    case "muscle_gain":
      return "набор мышц";
    case "performance":
      return "рост формы";
    case "maintenance":
      return "поддержание формы";
    default:
      return "цель не указана";
  }
}

function extractProposalTitle(proposal: AiPlanProposalRow) {
  const payload = proposal.payload as { proposal?: unknown };
  const schema =
    proposal.proposal_type === "meal_plan" ? mealPlanSchema : workoutPlanSchema;
  const parsed = schema.safeParse(payload.proposal);

  if (!parsed.success) {
    return proposal.proposal_type === "meal_plan" ? "План питания" : "План тренировок";
  }

  return parsed.data.title;
}

function extractRequestSummary(proposal: AiPlanProposalRow) {
  const payload = proposal.payload as {
    request?: {
      goal?: string | null;
      kcalTarget?: number | null;
      mealsPerDay?: number | null;
      daysPerWeek?: number | null;
      equipment?: string[];
      focus?: string | null;
    };
  };
  const request = payload.request;

  if (!request) {
    return "запрос сохранен без подробностей";
  }

  if (proposal.proposal_type === "meal_plan") {
    return [
      `цель ${formatGoal(request.goal).toLowerCase()}`,
      request.kcalTarget ? `${request.kcalTarget} ккал` : null,
      request.mealsPerDay ? `${request.mealsPerDay} приемов пищи` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  return [
    `цель ${formatGoal(request.goal).toLowerCase()}`,
    request.daysPerWeek ? `${request.daysPerWeek} дня в неделю` : null,
    request.focus?.trim() || null,
    request.equipment?.length ? request.equipment.join(", ") : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function extractTimeline(proposal: AiPlanProposalRow) {
  const payload = proposal.payload as {
    approvedAt?: string;
    appliedAt?: string;
    appliedWeekStartDate?: string;
    appliedMealTemplateIds?: string[];
  };

  if (payload.appliedAt) {
    if (proposal.proposal_type === "meal_plan") {
      const templateCount = payload.appliedMealTemplateIds?.length ?? 0;
      return `уже применен; создано шаблонов питания: ${templateCount}`;
    }

    return `уже применен; неделя стартует ${payload.appliedWeekStartDate ?? "в ближайшее окно"}`;
  }

  if (payload.approvedAt || proposal.status === "approved") {
    return "подтвержден и готов к применению";
  }

  return "черновик, ждет подтверждения или применения";
}

export function buildAiPlanProposalPreview(
  proposal: AiPlanProposalRow,
): AiPlanProposalPreview {
  return {
    proposalId: proposal.id,
    proposalType: proposal.proposal_type,
    status: proposal.status,
    title: extractProposalTitle(proposal),
    requestSummary: extractRequestSummary(proposal),
    timeline: extractTimeline(proposal),
    createdAt: proposal.created_at,
    updatedAt: proposal.updated_at,
  };
}

export async function listAiPlanProposalPreviews(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    limit?: number;
    proposalType?: AiPlanProposalType;
    status?: string;
  },
) {
  const proposals = await listAiPlanProposals(supabase, userId, options?.limit ?? 8);

  return proposals
    .filter((proposal) =>
      options?.proposalType ? proposal.proposal_type === options.proposalType : true,
    )
    .filter((proposal) => (options?.status ? proposal.status === options.status : true))
    .map(buildAiPlanProposalPreview);
}

export async function resolveAiPlanProposalTarget(
  supabase: SupabaseClient,
  input: {
    userId: string;
    proposalId?: string | null;
    proposalType?: AiPlanProposalType | null;
    includeApplied?: boolean;
  },
) {
  if (input.proposalId) {
    const proposal = await getAiPlanProposal(supabase, input.userId, input.proposalId);

    if (!proposal) {
      throw new Error("Нужное AI-предложение не найдено.");
    }

    if (input.proposalType && proposal.proposal_type !== input.proposalType) {
      throw new Error("Тип AI-предложения не совпадает с запросом.");
    }

    if (!input.includeApplied && proposal.status === "applied") {
      throw new Error("Это AI-предложение уже применено.");
    }

    return proposal;
  }

  const proposals = await listAiPlanProposals(supabase, input.userId, 12);
  const target =
    proposals
      .filter((proposal) =>
        input.proposalType ? proposal.proposal_type === input.proposalType : true,
      )
      .find((proposal) => (input.includeApplied ? true : proposal.status !== "applied")) ??
    null;

  if (!target) {
    throw new Error("Подходящий черновик AI-предложения не найден.");
  }

  return target;
}

async function createWorkoutDraftFromProposal(
  supabase: SupabaseClient,
  userId: string,
  proposalId: string,
  proposal: ReturnType<typeof workoutPlanSchema.parse>,
) {
  const { data: latestProgram, error: latestProgramError } = await supabase
    .from("weekly_programs")
    .select("week_start_date")
    .eq("user_id", userId)
    .order("week_start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestProgramError) {
    throw latestProgramError;
  }

  const currentWeekStart = getUtcMonday(new Date());
  let nextWeekStart = addUtcDays(currentWeekStart, 7);

  if (latestProgram?.week_start_date) {
    const latestDate = new Date(`${latestProgram.week_start_date}T00:00:00.000Z`);
    if (latestDate >= nextWeekStart) {
      nextWeekStart = addUtcDays(latestDate, 7);
    }
  }

  const weekStartDate = toDateString(nextWeekStart);
  const weekEndDate = toDateString(addUtcDays(nextWeekStart, 6));
  const exerciseTitles = Array.from(
    new Set(
      proposal.days.flatMap((day) => day.exercises.map((exercise) => exercise.name.trim())),
    ),
  ).filter(Boolean);

  const { data: existingExercises, error: existingExercisesError } = await supabase
    .from("exercise_library")
    .select("id, title")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .in("title", exerciseTitles);

  if (existingExercisesError) {
    throw existingExercisesError;
  }

  const exerciseIdByTitle = new Map(
    (existingExercises ?? []).map((row) => [row.title, row.id]),
  );

  for (const exerciseTitle of exerciseTitles) {
    if (exerciseIdByTitle.has(exerciseTitle)) {
      continue;
    }

    const { data: createdExercise, error: createdExerciseError } = await supabase
      .from("exercise_library")
      .insert({
        user_id: userId,
        title: exerciseTitle,
        muscle_group: "AI recommendation",
        description: `Создано из AI-предложения ${proposalId}`,
        note: "Создано автоматически при применении AI workout proposal.",
        is_archived: false,
      })
      .select("id, title")
      .single();

    if (createdExerciseError) {
      throw createdExerciseError;
    }

    exerciseIdByTitle.set(createdExercise.title, createdExercise.id);
  }

  let createdProgramId: string | null = null;

  try {
    const { data: programRow, error: programError } = await supabase
      .from("weekly_programs")
      .insert({
        user_id: userId,
        title: proposal.title,
        status: "draft",
        week_start_date: weekStartDate,
        week_end_date: weekEndDate,
        is_locked: false,
      })
      .select("id, week_start_date")
      .single();

    if (programError) {
      throw programError;
    }

    createdProgramId = programRow.id;

    for (const [dayIndex, day] of proposal.days.entries()) {
      const { data: dayRow, error: dayError } = await supabase
        .from("workout_days")
        .insert({
          user_id: userId,
          weekly_program_id: programRow.id,
          day_of_week: dayIndex + 1,
          status: "planned",
        })
        .select("id")
        .single();

      if (dayError) {
        throw dayError;
      }

      for (const [exerciseIndex, exercise] of day.exercises.entries()) {
        const exerciseLibraryId = exerciseIdByTitle.get(exercise.name.trim()) ?? null;

        const { data: workoutExerciseRow, error: workoutExerciseError } = await supabase
          .from("workout_exercises")
          .insert({
            user_id: userId,
            workout_day_id: dayRow.id,
            exercise_library_id: exerciseLibraryId,
            exercise_title_snapshot: exercise.name.trim(),
            sets_count: exercise.sets,
            sort_order: exerciseIndex,
          })
          .select("id")
          .single();

        if (workoutExerciseError) {
          throw workoutExerciseError;
        }

        const repRangePreset = resolveRepRangePresetFromText(exercise.reps);
        const setsPayload = Array.from({ length: exercise.sets }, (_, setIndex) => ({
          user_id: userId,
          workout_exercise_id: workoutExerciseRow.id,
          set_number: setIndex + 1,
          planned_reps: repRangePreset.max,
          planned_reps_min: repRangePreset.min,
          planned_reps_max: repRangePreset.max,
          actual_reps: null,
          actual_weight_kg: null,
          actual_rpe: null,
        }));

        await insertWorkoutSetsWithRepRangeFallback(supabase, setsPayload);
      }
    }

    return {
      weeklyProgramId: programRow.id,
      weekStartDate: programRow.week_start_date,
    };
  } catch (error) {
    if (createdProgramId) {
      await supabase.from("weekly_programs").delete().eq("id", createdProgramId);
    }

    throw error;
  }
}

async function createMealTemplatesFromProposal(
  supabase: SupabaseClient,
  userId: string,
  proposalId: string,
  proposal: ReturnType<typeof mealPlanSchema.parse>,
) {
  const mealCount = proposal.meals.length || 1;
  const totalMealCalories = proposal.meals.reduce((sum, meal) => sum + meal.kcal, 0);
  const createdTemplateIds: string[] = [];

  for (const meal of proposal.meals) {
    const itemCount = meal.items.length || 1;
    const calorieRatio = totalMealCalories > 0 ? meal.kcal / totalMealCalories : 1 / mealCount;
    const mealProtein = Number((proposal.macros.protein * calorieRatio).toFixed(2));
    const mealFat = Number((proposal.macros.fat * calorieRatio).toFixed(2));
    const mealCarbs = Number((proposal.macros.carbs * calorieRatio).toFixed(2));

    const templateItems = meal.items.map((item) => ({
      foodId: null,
      foodNameSnapshot: item,
      servings: 1,
      kcal: Math.max(1, Math.round(meal.kcal / itemCount)),
      protein: Number((mealProtein / itemCount).toFixed(2)),
      fat: Number((mealFat / itemCount).toFixed(2)),
      carbs: Number((mealCarbs / itemCount).toFixed(2)),
    }));

    const { data: templateRow, error: templateError } = await supabase
      .from("meal_templates")
      .insert({
        user_id: userId,
        title: `${proposal.title} · ${meal.name}`,
        payload: {
          source: "ai_plan_proposal",
          aiProposalId: proposalId,
          isReferenceOnly: true,
          items: templateItems,
        },
      })
      .select("id")
      .single();

    if (templateError) {
      throw templateError;
    }

    createdTemplateIds.push(templateRow.id);
  }

  return createdTemplateIds;
}

export async function approveAiPlanProposal(
  supabase: SupabaseClient,
  input: {
    userId: string;
    proposalId: string;
  },
) {
  const proposal = await getAiPlanProposal(supabase, input.userId, input.proposalId);

  if (!proposal) {
    throw new Error("AI-предложение не найдено.");
  }

  if (proposal.status === "applied") {
    throw new Error("AI-предложение уже применено и не требует подтверждения.");
  }

  const updated = await updateAiPlanProposal(supabase, {
    userId: input.userId,
    proposalId: proposal.id,
    status: "approved",
    payload: {
      ...proposal.payload,
      approvedAt: new Date().toISOString(),
    },
  });

  return {
    proposal: updated,
    preview: buildAiPlanProposalPreview(updated),
  };
}

export async function applyAiPlanProposal(
  supabase: SupabaseClient,
  input: {
    userId: string;
    proposalId: string;
  },
) {
  const proposal = await getAiPlanProposal(supabase, input.userId, input.proposalId);

  if (!proposal) {
    throw new Error("AI-предложение не найдено.");
  }

  if (proposal.status === "applied") {
    throw new Error("AI-предложение уже применено.");
  }

  if (proposal.proposal_type === "workout_plan") {
    const workoutPayload = proposal.payload as { proposal?: unknown };
    const parsedProposal = workoutPlanSchema.parse(workoutPayload.proposal);
    const applied = await createWorkoutDraftFromProposal(
      supabase,
      input.userId,
      proposal.id,
      parsedProposal,
    );

    const updated = await updateAiPlanProposal(supabase, {
      userId: input.userId,
      proposalId: proposal.id,
      status: "applied",
      payload: {
        ...proposal.payload,
        appliedAt: new Date().toISOString(),
        appliedWeekStartDate: applied.weekStartDate,
        appliedWeeklyProgramId: applied.weeklyProgramId,
      },
    });

    return {
      proposal: updated,
      preview: buildAiPlanProposalPreview(updated),
      meta: {
        appliedEntity: "weekly_program" as const,
        weeklyProgramId: applied.weeklyProgramId,
        weekStartDate: applied.weekStartDate,
      },
    };
  }

  const mealPayload = proposal.payload as { proposal?: unknown };
  const parsedProposal = mealPlanSchema.parse(mealPayload.proposal);
  const createdTemplateIds = await createMealTemplatesFromProposal(
    supabase,
    input.userId,
    proposal.id,
    parsedProposal,
  );

  const updated = await updateAiPlanProposal(supabase, {
    userId: input.userId,
    proposalId: proposal.id,
    status: "applied",
    payload: {
      ...proposal.payload,
      appliedAt: new Date().toISOString(),
      appliedMealTemplateIds: createdTemplateIds,
    },
  });

  return {
    proposal: updated,
    preview: buildAiPlanProposalPreview(updated),
    meta: {
      appliedEntity: "meal_templates" as const,
      mealTemplateIds: createdTemplateIds,
    },
  };
}
