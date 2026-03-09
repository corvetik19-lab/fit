import { mealPlanSchema, workoutPlanSchema } from "@/lib/ai/schemas";
import {
  getAiPlanProposal,
  updateAiPlanProposal,
} from "@/lib/ai/proposals";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveRepRangePresetFromText } from "@/lib/workout/rep-ranges";
import { insertWorkoutSetsWithRepRangeFallback } from "@/lib/workout/workout-sets";

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

async function createWorkoutDraftFromProposal(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
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

        const { data: workoutExerciseRow, error: workoutExerciseError } =
          await supabase
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
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
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

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Нужно войти в аккаунт, чтобы применять AI-предложения.",
      });
    }

    const { id } = await context.params;
    const proposal = await getAiPlanProposal(supabase, user.id, id);

    if (!proposal) {
      return createApiErrorResponse({
        status: 404,
        code: "AI_PROPOSAL_NOT_FOUND",
        message: "AI-предложение не найдено.",
      });
    }

    if (proposal.status === "applied") {
      return createApiErrorResponse({
        status: 409,
        code: "AI_PROPOSAL_ALREADY_APPLIED",
        message: "AI-предложение уже применено.",
      });
    }

    if (proposal.proposal_type === "workout_plan") {
      const workoutPayload = proposal.payload as { proposal?: unknown };
      const parsedProposal = workoutPlanSchema.parse(workoutPayload.proposal);
      const applied = await createWorkoutDraftFromProposal(
        supabase,
        user.id,
        proposal.id,
        parsedProposal,
      );

      const updated = await updateAiPlanProposal(supabase, {
        userId: user.id,
        proposalId: proposal.id,
        status: "applied",
        payload: {
          ...proposal.payload,
          appliedAt: new Date().toISOString(),
          appliedWeekStartDate: applied.weekStartDate,
          appliedWeeklyProgramId: applied.weeklyProgramId,
        },
      });

      return Response.json({
        data: updated,
        meta: {
          appliedEntity: "weekly_program",
          weeklyProgramId: applied.weeklyProgramId,
          weekStartDate: applied.weekStartDate,
        },
      });
    }

    if (proposal.proposal_type === "meal_plan") {
      const mealPayload = proposal.payload as { proposal?: unknown };
      const parsedProposal = mealPlanSchema.parse(mealPayload.proposal);
      const createdTemplateIds = await createMealTemplatesFromProposal(
        supabase,
        user.id,
        proposal.id,
        parsedProposal,
      );

      const updated = await updateAiPlanProposal(supabase, {
        userId: user.id,
        proposalId: proposal.id,
        status: "applied",
        payload: {
          ...proposal.payload,
          appliedAt: new Date().toISOString(),
          appliedMealTemplateIds: createdTemplateIds,
        },
      });

      return Response.json({
        data: updated,
        meta: {
          appliedEntity: "meal_templates",
          mealTemplateIds: createdTemplateIds,
        },
      });
    }

    return createApiErrorResponse({
      status: 400,
      code: "AI_PROPOSAL_TYPE_UNSUPPORTED",
      message: "Тип AI-предложения пока не поддерживается для применения.",
    });
  } catch (error) {
    logger.error("ai proposal apply route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "AI_PROPOSAL_APPLY_FAILED",
      message: "Не удалось применить AI-предложение.",
    });
  }
}
