import { generateObject } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { models } from "@/lib/ai/gateway";
import { retrieveKnowledgeMatches } from "@/lib/ai/knowledge";
import { createAiPlanProposal } from "@/lib/ai/proposals";
import { AI_PLAN_MAX_OUTPUT_TOKENS } from "@/lib/ai/runtime-budgets";
import { mealPlanSchema, workoutPlanSchema } from "@/lib/ai/schemas";
import {
  createEmptyAiUserContext,
  getAiRuntimeContext,
  type AiUserContext,
} from "@/lib/ai/user-context";
import { logger } from "@/lib/logger";
import { withTimeout, withTransientRetry } from "@/lib/runtime-retry";

type MealPlanGenerationInput = {
  dietaryNotes?: string;
  goal?: string | null;
  kcalTarget?: number | null;
  mealsPerDay?: number | null;
};

type WorkoutPlanGenerationInput = {
  daysPerWeek?: number | null;
  equipment?: string[];
  focus?: string | null;
  goal?: string | null;
};

type MealPlan = z.infer<typeof mealPlanSchema>;
type WorkoutPlan = z.infer<typeof workoutPlanSchema>;

const PLAN_CONTEXT_TIMEOUT_MS = 8_000;
const PLAN_KNOWLEDGE_TIMEOUT_MS = 6_000;
const PLAN_AI_TIMEOUT_MS = 10_000;
const PLAN_PROPOSAL_PERSIST_TIMEOUT_MS = 8_000;

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function roundPositiveInt(value: number, minimum: number) {
  return Math.max(minimum, Math.round(value));
}

function resolveGoalLabel(goal: string) {
  switch (goal) {
    case "fat_loss":
      return "снижение веса";
    case "muscle_gain":
      return "набор мышц";
    case "performance":
      return "рост спортивной формы";
    case "maintenance":
      return "поддержание формы";
    default:
      return goal.trim() || "поддержание формы";
  }
}

function buildKnowledgeExcerpt(content: string) {
  return truncateText(content.replace(/\s+/g, " ").trim(), 180);
}

function buildCompactKnowledgeSection(knowledge: Awaited<ReturnType<typeof retrieveKnowledgeMatches>>) {
  if (!knowledge.length) {
    return "No personal knowledge snippets are available.";
  }

  return knowledge
    .slice(0, 3)
    .map((item, index) => `- [${index + 1}] ${item.sourceType}: ${buildKnowledgeExcerpt(item.content)}`)
    .join("\n");
}

function buildCompactContextSummary(context: AiUserContext) {
  const profileBits = [
    `goal=${context.goal.goalType ?? "unknown"}`,
    `weekly_training_days=${context.goal.weeklyTrainingDays ?? "unknown"}`,
    `weight_kg=${context.latestBodyMetrics.weightKg ?? context.onboarding.weightKg ?? "unknown"}`,
    `fitness_level=${context.onboarding.fitnessLevel ?? "unknown"}`,
    `kcal_target=${context.nutritionTargets.kcalTarget ?? "unknown"}`,
    `protein_target=${context.nutritionTargets.proteinTarget ?? "unknown"}`,
  ];

  if (context.onboarding.equipment.length) {
    profileBits.push(`equipment=${context.onboarding.equipment.join(", ")}`);
  }

  if (context.onboarding.injuries.length) {
    profileBits.push(`injuries=${context.onboarding.injuries.join(", ")}`);
  }

  if (context.onboarding.dietaryPreferences.length) {
    profileBits.push(`dietary_preferences=${context.onboarding.dietaryPreferences.join(", ")}`);
  }

  return profileBits.join("; ");
}

function buildPersistedContextSnapshot(context: AiUserContext) {
  return {
    goalType: context.goal.goalType ?? null,
    weeklyTrainingDays: context.goal.weeklyTrainingDays ?? null,
    weightKg: context.latestBodyMetrics.weightKg ?? context.onboarding.weightKg ?? null,
    fitnessLevel: context.onboarding.fitnessLevel ?? null,
    kcalTarget: context.nutritionTargets.kcalTarget ?? null,
    proteinTarget: context.nutritionTargets.proteinTarget ?? null,
    equipment: context.onboarding.equipment.slice(0, 8),
    injuries: context.onboarding.injuries.slice(0, 6),
    dietaryPreferences: context.onboarding.dietaryPreferences.slice(0, 6),
  };
}

function buildPersistedKnowledgeSummary(
  knowledge: Awaited<ReturnType<typeof retrieveKnowledgeMatches>>,
) {
  return knowledge.slice(0, 3).map((item) => ({
    contentPreview: buildKnowledgeExcerpt(item.content),
    matchedTerms: item.matchedTerms?.slice(0, 6) ?? [],
    sourceId: item.sourceId,
    sourceKind: item.sourceKind ?? item.sourceType,
    sourceType: item.sourceType,
  }));
}

async function persistPlanProposal(
  supabase: SupabaseClient,
  input: {
    userId: string;
    proposalType: "meal_plan" | "workout_plan";
    payload: Record<string, unknown>;
  },
) {
  return withTransientRetry(
    async () =>
      withTimeout(
        createAiPlanProposal(supabase, input),
        PLAN_PROPOSAL_PERSIST_TIMEOUT_MS,
        `${input.proposalType} proposal persistence`,
      ),
    {
      attempts: 2,
      delaysMs: [500, 1_500],
    },
  );
}

async function loadPlanContext(
  supabase: SupabaseClient,
  userId: string,
  proposalType: "meal_plan" | "workout_plan",
) {
  try {
    const result = await withTimeout(
      withTransientRetry(() => getAiRuntimeContext(supabase, userId)),
      PLAN_CONTEXT_TIMEOUT_MS,
      `${proposalType} runtime context`,
    );

    return result.context;
  } catch (error) {
    logger.warn("plan generation is using fallback runtime context", {
      error,
      proposalType,
      userId,
    });
    return createEmptyAiUserContext();
  }
}

async function loadPlanKnowledge(
  supabase: SupabaseClient,
  userId: string,
  proposalType: "meal_plan" | "workout_plan",
  query: string,
) {
  try {
    return await withTimeout(
      withTransientRetry(() => retrieveKnowledgeMatches(supabase, userId, query, 6)),
      PLAN_KNOWLEDGE_TIMEOUT_MS,
      `${proposalType} knowledge retrieval`,
    );
  } catch (error) {
    logger.warn("plan generation is using fallback knowledge context", {
      error,
      proposalType,
      userId,
    });
    return [];
  }
}

async function tryGenerateStructuredPlan<T>({
  prompt,
  proposalType,
  schema,
  userId,
}: {
  prompt: string;
  proposalType: "meal_plan" | "workout_plan";
  schema: z.ZodType<T>;
  userId: string;
}) {
  try {
    const result = await withTimeout(
      generateObject({
        maxOutputTokens: AI_PLAN_MAX_OUTPUT_TOKENS,
        model: models.chat,
        prompt,
        schema,
      }),
      PLAN_AI_TIMEOUT_MS,
      `${proposalType} ai generation`,
    );

    return result.object;
  } catch (error) {
    logger.warn("plan generation is using deterministic fallback", {
      error,
      proposalType,
      userId,
    });
    return null;
  }
}

function distributeIntegers(total: number, weights: number[]) {
  const rawValues = weights.map((weight) => total * weight);
  const values = rawValues.map((value) => Math.floor(value));
  let remainder = total - values.reduce((sum, value) => sum + value, 0);

  const rankedRemainders = rawValues
    .map((value, index) => ({
      fraction: value - Math.floor(value),
      index,
    }))
    .sort((left, right) => right.fraction - left.fraction);

  for (const entry of rankedRemainders) {
    if (remainder <= 0) {
      break;
    }

    values[entry.index] += 1;
    remainder -= 1;
  }

  return values;
}

function resolveMealWeights(mealsPerDay: number) {
  switch (mealsPerDay) {
    case 3:
      return [0.3, 0.4, 0.3];
    case 5:
      return [0.22, 0.26, 0.14, 0.2, 0.18];
    case 2:
      return [0.45, 0.55];
    default:
      return [0.25, 0.35, 0.15, 0.25];
  }
}

function resolveMealTemplates(options: {
  dairyFree: boolean;
  highProtein: boolean;
  mealsPerDay: number;
}) {
  const breakfastItems = options.dairyFree
    ? ["Овсянка на воде", "Яйца", "Ягоды"]
    : ["Овсянка", "Греческий йогурт", "Ягоды"];
  const snackProtein = options.dairyFree
    ? "Протеиновый напиток без молока"
    : "Творог или йогурт";

  const templates = [
    {
      name: "Завтрак",
      items: options.highProtein
        ? [...breakfastItems, "Фрукты"]
        : breakfastItems,
    },
    {
      name: "Обед",
      items: ["Курица или индейка", "Рис или гречка", "Овощи"],
    },
    {
      name: "Перекус",
      items: [snackProtein, "Фрукты", "Орехи"],
    },
    {
      name: "Ужин",
      items: ["Рыба или постная говядина", "Картофель или киноа", "Салат"],
    },
    {
      name: "Второй перекус",
      items: options.dairyFree
        ? ["Хумус с овощами", "Яблоко"]
        : ["Кефир или йогурт", "Фрукты"],
    },
  ];

  return templates.slice(0, options.mealsPerDay);
}

function buildDeterministicMealPlan(input: {
  context: AiUserContext;
  dietaryNotes: string;
  goal: string;
  kcalTarget: number;
  mealsPerDay: number;
}): MealPlan {
  const weightKg = input.context.latestBodyMetrics.weightKg ?? input.context.onboarding.weightKg ?? 80;
  const proteinTarget = roundPositiveInt(
    input.context.nutritionTargets.proteinTarget ??
      weightKg * (input.goal === "muscle_gain" ? 2 : 1.8),
    120,
  );
  const fatTarget = roundPositiveInt(
    input.context.nutritionTargets.fatTarget ?? input.kcalTarget * 0.28 / 9,
    55,
  );
  const remainingCarbs =
    (input.kcalTarget - proteinTarget * 4 - fatTarget * 9) / 4;
  const carbsTarget = roundPositiveInt(remainingCarbs, 90);
  const dairyFree = /без\s*молок|dairy|lactose|milk/iu.test(input.dietaryNotes);
  const highProtein = /белк|protein/iu.test(input.dietaryNotes);
  const weights = resolveMealWeights(input.mealsPerDay);
  const mealCalories = distributeIntegers(input.kcalTarget, weights);
  const templates = resolveMealTemplates({
    dairyFree,
    highProtein,
    mealsPerDay: input.mealsPerDay,
  });

  return {
    title: `План питания: ${resolveGoalLabel(input.goal)}`,
    caloriesTarget: input.kcalTarget,
    macros: {
      protein: proteinTarget,
      fat: fatTarget,
      carbs: carbsTarget,
    },
    meals: templates.map((template, index) => ({
      name: template.name,
      kcal: mealCalories[index] ?? Math.floor(input.kcalTarget / input.mealsPerDay),
      items: template.items,
    })),
  };
}

function hasEquipment(equipment: string[], patterns: RegExp[]) {
  return patterns.some((pattern) => equipment.some((item) => pattern.test(item)));
}

function resolveWorkoutLibrary(equipment: string[]) {
  const hasDumbbells = hasEquipment(equipment, [/гантел/iu, /dumbbell/iu]);
  const hasPullUpBar = hasEquipment(equipment, [/турник/iu, /pull/iu, /bar/iu]);

  return {
    lowerBody: hasDumbbells
      ? [
          { name: "Гоблет-присед", sets: 4, reps: "6-8" },
          { name: "Румынская тяга с гантелями", sets: 3, reps: "8-10" },
          { name: "Болгарские выпады", sets: 3, reps: "8-10" },
        ]
      : [
          { name: "Приседания с паузой", sets: 4, reps: "10-15" },
          { name: "Выпады назад", sets: 3, reps: "10-12" },
          { name: "Ягодичный мост", sets: 3, reps: "12-15" },
        ],
    pull: hasPullUpBar
      ? [
          { name: "Подтягивания", sets: 4, reps: "5-8" },
          { name: "Негативные подтягивания или вис", sets: 2, reps: "20-30 сек" },
        ]
      : [{ name: "Тяга в наклоне с полотенцем или лентой", sets: 4, reps: "10-12" }],
    row: hasDumbbells
      ? [{ name: "Тяга гантели в наклоне", sets: 4, reps: "8-10" }]
      : [{ name: "Тяга корпуса к столу или опоре", sets: 3, reps: "8-12" }],
    push: hasDumbbells
      ? [
          { name: "Жим гантелей лёжа или на полу", sets: 4, reps: "6-10" },
          { name: "Жим гантелей стоя", sets: 3, reps: "8-10" },
        ]
      : [
          { name: "Отжимания", sets: 4, reps: "8-15" },
          { name: "Пайк-отжимания", sets: 3, reps: "6-10" },
        ],
    accessory: hasDumbbells
      ? [
          { name: "Разведение гантелей в стороны", sets: 3, reps: "12-15" },
          { name: "Сгибание рук с гантелями", sets: 3, reps: "10-12" },
        ]
      : [
          { name: "Планка с касанием плеч", sets: 3, reps: "20-30 сек" },
          { name: "Супермен", sets: 3, reps: "12-15" },
        ],
    core: [
      { name: "Планка", sets: 3, reps: "30-45 сек" },
      { name: "Dead bug", sets: 3, reps: "8-10 на сторону" },
    ],
  };
}

function buildWorkoutDayTemplates(input: {
  context: AiUserContext;
  daysPerWeek: number;
  equipment: string[];
  focus: string;
  goal: string;
}) {
  const library = resolveWorkoutLibrary(input.equipment);
  const focusLabel = input.focus.trim() || "базовые движения и контроль техники";

  const templates: WorkoutPlan["days"] = [
    {
      day: "День 1",
      focus: `Спина и тяговые движения (${focusLabel})`,
      exercises: [
        ...library.pull,
        ...library.row,
        library.accessory[0]!,
        library.core[0]!,
      ],
    },
    {
      day: "День 2",
      focus: "Ноги, жим и устойчивость корпуса",
      exercises: [
        ...library.lowerBody.slice(0, 2),
        library.push[0]!,
        library.core[1]!,
        library.lowerBody[2]!,
      ],
    },
    {
      day: "День 3",
      focus: "Полное тело и безопасный прогресс",
      exercises: [
        library.pull[0]!,
        library.push[0]!,
        library.lowerBody[0]!,
        library.push[1]!,
        library.core[0]!,
      ],
    },
    {
      day: "День 4",
      focus: "Объём без отказа и контроль восстановления",
      exercises: [
        library.row[0]!,
        library.push[1]!,
        library.lowerBody[1]!,
        library.accessory[0]!,
        library.core[1]!,
      ],
    },
    {
      day: "День 5",
      focus: "Лёгкий full-body и техника",
      exercises: [
        library.lowerBody[0]!,
        library.pull[0]!,
        library.push[0]!,
        library.accessory.at(-1) ?? library.core[0]!,
      ],
    },
  ];

  return templates.slice(0, Math.max(1, Math.min(input.daysPerWeek, templates.length)));
}

function buildDeterministicWorkoutPlan(input: {
  context: AiUserContext;
  daysPerWeek: number;
  equipment: string[];
  focus: string;
  goal: string;
}): WorkoutPlan {
  const injuries = input.context.onboarding.injuries.length
    ? `Учтены ограничения: ${input.context.onboarding.injuries.join(", ")}.`
    : "Без отказных подходов и с запасом 1-2 повтора.";

  return {
    title: `План тренировок: ${resolveGoalLabel(input.goal)}`,
    summary: `Программа на ${input.daysPerWeek} тренировки в неделю с упором на ${input.focus || "базовые движения"}. ${injuries}`,
    days: buildWorkoutDayTemplates(input),
  };
}

function buildMealPlanPrompt(input: {
  context: AiUserContext;
  dietaryNotes: string;
  goal: string;
  kcalTarget: number;
  knowledge: Awaited<ReturnType<typeof retrieveKnowledgeMatches>>;
  mealsPerDay: number;
}) {
  return `Create a compact meal plan draft for the fit app.
Return only a JSON object that matches the schema.
All visible strings must be in Russian.
Keep the output compact: exactly ${input.mealsPerDay} meals, 2-4 food items per meal, no markdown.

User goal: ${input.goal}
Calories target: ${input.kcalTarget}
Meals per day: ${input.mealsPerDay}
Dietary notes: ${input.dietaryNotes || "none"}
Context: ${buildCompactContextSummary(input.context)}
Knowledge:
${buildCompactKnowledgeSection(input.knowledge)}`;
}

function buildWorkoutPlanPrompt(input: {
  context: AiUserContext;
  daysPerWeek: number;
  equipment: string[];
  focus: string;
  goal: string;
  knowledge: Awaited<ReturnType<typeof retrieveKnowledgeMatches>>;
}) {
  return `Create a compact workout plan draft for the fit app.
Return only a JSON object that matches the schema.
All visible strings must be in Russian.
Keep the output compact: exactly ${input.daysPerWeek} training days, 4-5 exercises per day, safe volume, no markdown.

User goal: ${input.goal}
Days per week: ${input.daysPerWeek}
Equipment: ${input.equipment.join(", ")}
Focus: ${input.focus}
Context: ${buildCompactContextSummary(input.context)}
Knowledge:
${buildCompactKnowledgeSection(input.knowledge)}`;
}

export async function generateMealPlanProposalForUser(
  supabase: SupabaseClient,
  userId: string,
  input: MealPlanGenerationInput,
) {
  const context = await loadPlanContext(supabase, userId, "meal_plan");
  const goal = input.goal ?? context.goal.goalType ?? "maintenance";
  const kcalTarget = input.kcalTarget ?? context.nutritionTargets.kcalTarget ?? 2200;
  const dietaryNotes =
    input.dietaryNotes ??
    context.onboarding.dietaryPreferences.join(", ") ??
    "без дополнительных ограничений";
  const mealsPerDay = Math.max(2, Math.min(input.mealsPerDay ?? 4, 5));
  const knowledge = await loadPlanKnowledge(
    supabase,
    userId,
    "meal_plan",
    `Meal plan for ${goal}; kcal ${kcalTarget}; meals ${mealsPerDay}; notes ${dietaryNotes}`,
  );

  const prompt = buildMealPlanPrompt({
    context,
    dietaryNotes,
    goal,
    kcalTarget,
    knowledge,
    mealsPerDay,
  });
  const aiProposal = await tryGenerateStructuredPlan({
    prompt,
    proposalType: "meal_plan",
    schema: mealPlanSchema,
    userId,
  });
  const proposal =
    aiProposal ??
    buildDeterministicMealPlan({
      context,
      dietaryNotes,
      goal,
      kcalTarget,
      mealsPerDay,
    });

  return persistPlanProposal(supabase, {
    userId,
    proposalType: "meal_plan",
    payload: {
      kind: "meal_plan",
      request: {
        goal,
        kcalTarget,
        dietaryNotes,
        mealsPerDay,
      },
      contextSnapshot: buildPersistedContextSnapshot(context),
      generationMode: aiProposal ? "model" : "deterministic_fallback",
      knowledge: buildPersistedKnowledgeSummary(knowledge),
      proposal,
    },
  });
}

export async function generateWorkoutPlanProposalForUser(
  supabase: SupabaseClient,
  userId: string,
  input: WorkoutPlanGenerationInput,
) {
  const context = await loadPlanContext(supabase, userId, "workout_plan");
  const goal = input.goal ?? context.goal.goalType ?? "maintenance";
  const equipment = input.equipment?.length
    ? input.equipment
    : context.onboarding.equipment.length
      ? context.onboarding.equipment
      : ["собственный вес"];
  const daysPerWeek = Math.max(2, Math.min(input.daysPerWeek ?? context.goal.weeklyTrainingDays ?? 3, 5));
  const focus = input.focus ?? "спина и базовые движения";
  const knowledge = await loadPlanKnowledge(
    supabase,
    userId,
    "workout_plan",
    `Workout plan for ${goal}; days ${daysPerWeek}; focus ${focus}; equipment ${equipment.join(", ")}`,
  );

  const prompt = buildWorkoutPlanPrompt({
    context,
    daysPerWeek,
    equipment,
    focus,
    goal,
    knowledge,
  });
  const aiProposal = await tryGenerateStructuredPlan({
    prompt,
    proposalType: "workout_plan",
    schema: workoutPlanSchema,
    userId,
  });
  const proposal =
    aiProposal ??
    buildDeterministicWorkoutPlan({
      context,
      daysPerWeek,
      equipment,
      focus,
      goal,
    });

  return persistPlanProposal(supabase, {
    userId,
    proposalType: "workout_plan",
    payload: {
      kind: "workout_plan",
      request: {
        goal,
        equipment,
        daysPerWeek,
        focus,
      },
      contextSnapshot: buildPersistedContextSnapshot(context),
      generationMode: aiProposal ? "model" : "deterministic_fallback",
      knowledge: buildPersistedKnowledgeSummary(knowledge),
      proposal,
    },
  });
}
