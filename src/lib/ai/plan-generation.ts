import { generateObject } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";

import { models } from "@/lib/ai/gateway";
import { retrieveKnowledgeMatches } from "@/lib/ai/knowledge";
import { createAiPlanProposal } from "@/lib/ai/proposals";
import { mealPlanSchema, workoutPlanSchema } from "@/lib/ai/schemas";
import { formatStructuredKnowledgeForPrompt } from "@/lib/ai/structured-knowledge";
import { getAiRuntimeContext } from "@/lib/ai/user-context";
import { formatNutritionCoachingSignalsForPrompt } from "@/lib/nutrition/coaching-signals";
import { formatNutritionMealPatternsForPrompt } from "@/lib/nutrition/meal-patterns";
import { formatNutritionStrategyForPrompt } from "@/lib/nutrition/strategy-recommendations";
import { formatWorkoutCoachingSignalsForPrompt } from "@/lib/workout/coaching-signals";

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

function buildKnowledgeExcerpt(
  knowledge: Awaited<ReturnType<typeof retrieveKnowledgeMatches>>,
) {
  if (!knowledge.length) {
    return "РСЃС‚РѕСЂРёС‡РµСЃРєРёР№ RAG-РєРѕРЅС‚РµРєСЃС‚ РїРѕРєР° РїСѓСЃС‚.";
  }

  return knowledge
    .map((item, index) => `[${index + 1}] ${item.sourceType}: ${item.content}`)
    .join("\n\n");
}

export async function generateMealPlanProposalForUser(
  supabase: SupabaseClient,
  userId: string,
  input: MealPlanGenerationInput,
) {
  const { context } = await getAiRuntimeContext(supabase, userId);
  const goal = input.goal ?? context.goal.goalType ?? "maintenance";
  const kcalTarget = input.kcalTarget ?? context.nutritionTargets.kcalTarget ?? 2200;
  const dietaryNotes =
    input.dietaryNotes ??
    context.onboarding.dietaryPreferences.join(", ") ??
    "Р±РµР· РѕРіСЂР°РЅРёС‡РµРЅРёР№";
  const mealsPerDay = input.mealsPerDay ?? 4;
  const knowledge = await retrieveKnowledgeMatches(
    supabase,
    userId,
    `РџРёС‚Р°РЅРёРµ, СЂР°С†РёРѕРЅ, РєР°Р»РѕСЂРёРё, Р±РµР»РѕРє Рё РёСЃС‚РѕСЂРёСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ. Р¦РµР»СЊ ${goal}. РљР°Р»РѕСЂРёРё ${kcalTarget}. РљРѕРјРјРµРЅС‚Р°СЂРёР№ ${dietaryNotes}.`,
    8,
  );

  const result = await generateObject({
    model: models.chat,
    schema: mealPlanSchema,
    prompt: `РЎРѕР±РµСЂРё proposal РїР»Р°РЅР° РїРёС‚Р°РЅРёСЏ РґР»СЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ С„РёС‚РЅРµСЃ-РїСЂРёР»РѕР¶РµРЅРёСЏ.

РљРѕРЅС‚РµРєСЃС‚ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ:
- С†РµР»СЊ: ${goal}
- С†РµР»РµРІР°СЏ РєР°Р»РѕСЂРёР№РЅРѕСЃС‚СЊ: ${kcalTarget}
- РїСЂРёС‘РјРѕРІ РїРёС‰Рё РІ РґРµРЅСЊ: ${mealsPerDay}
- РїРѕР»: ${context.onboarding.sex ?? "РЅРµ СѓРєР°Р·Р°РЅ"}
- РІРѕР·СЂР°СЃС‚: ${context.onboarding.age ?? "РЅРµ СѓРєР°Р·Р°РЅ"}
- СЂРѕСЃС‚: ${context.onboarding.heightCm ?? "РЅРµ СѓРєР°Р·Р°РЅ"}
- РІРµСЃ: ${context.onboarding.weightKg ?? "РЅРµ СѓРєР°Р·Р°РЅ"}
- СѓСЂРѕРІРµРЅСЊ РїРѕРґРіРѕС‚РѕРІРєРё: ${context.onboarding.fitnessLevel ?? "РЅРµ СѓРєР°Р·Р°РЅ"}
- РїРёС‰РµРІС‹Рµ РїСЂРµРґРїРѕС‡С‚РµРЅРёСЏ: ${context.onboarding.dietaryPreferences.join(", ") || "РЅРµ СѓРєР°Р·Р°РЅС‹"}
- РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Р№ РєРѕРјРјРµРЅС‚Р°СЂРёР№: ${dietaryNotes || "РЅРµС‚"}
- СЃРІРµР¶Р°СЏ СЃРІРѕРґРєР° РїРѕ РїРёС‚Р°РЅРёСЋ: ${JSON.stringify(context.latestNutritionSummary)}
- СЃСЂРµРґРЅСЏСЏ РєР°Р»РѕСЂРёР№РЅРѕСЃС‚СЊ Р·Р° 7 РґРЅРµР№: ${context.nutritionInsights.avgKcalLast7 ?? "РЅРµС‚ РґР°РЅРЅС‹С…"}
- СЃСЂРµРґРЅРёР№ Р±РµР»РѕРє Р·Р° 7 РґРЅРµР№: ${context.nutritionInsights.avgProteinLast7 ?? "РЅРµС‚ РґР°РЅРЅС‹С…"}
- РѕС‚РєР»РѕРЅРµРЅРёРµ РѕС‚ С†РµР»Рё РїРѕ РєР°Р»РѕСЂРёСЏРј: ${context.nutritionInsights.kcalDeltaFromTarget ?? "РЅРµС‚ РґР°РЅРЅС‹С…"}
- РѕС‚РєР»РѕРЅРµРЅРёРµ РѕС‚ С†РµР»Рё РїРѕ Р±РµР»РєСѓ: ${context.nutritionInsights.proteinDeltaFromTarget ?? "РЅРµС‚ РґР°РЅРЅС‹С…"}

РљРѕСѓС‡-СЃРёРіРЅР°Р»С‹ РїРѕ С‚СЂРµРЅРёСЂРѕРІРѕС‡РЅРѕР№ РёСЃС‚РѕСЂРёРё:
${formatWorkoutCoachingSignalsForPrompt(context.workoutInsights.coachingSignals)}

РџРёС‰РµРІС‹Рµ РєРѕСѓС‡-СЃРёРіРЅР°Р»С‹:
${formatNutritionCoachingSignalsForPrompt(context.nutritionInsights.coachingSignals)}

Meal-level РїР°С‚С‚РµСЂРЅС‹ РїРёС‚Р°РЅРёСЏ:
${formatNutritionMealPatternsForPrompt(context.nutritionInsights.mealPatterns)}

РџСЂРёРѕСЂРёС‚РµС‚РЅС‹Рµ СЂРµРєРѕРјРµРЅРґР°С†РёРё РїРѕ СЂР°С†РёРѕРЅСѓ:
${formatNutritionStrategyForPrompt(context.nutritionInsights.strategy)}

РќРѕСЂРјР°Р»РёР·РѕРІР°РЅРЅС‹Рµ С„Р°РєС‚С‹ Рё РїСЂРёРѕСЂРёС‚РµС‚С‹:
${formatStructuredKnowledgeForPrompt(context.structuredKnowledge)}

РСЃС‚РѕСЂРёС‡РµСЃРєРёР№ RAG-РєРѕРЅС‚РµРєСЃС‚:
${buildKnowledgeExcerpt(knowledge)}

РџСЂР°РІРёР»Р°:
- РѕС‚РІРµС‚ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ practical Рё non-medical;
- СѓС‡РёС‚С‹РІР°Р№ С†РµР»СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ, С‚РµРєСѓС‰СѓСЋ РєР°Р»РѕСЂРёР№РЅРѕСЃС‚СЊ Рё РІСЃСЋ РґРѕСЃС‚СѓРїРЅСѓСЋ РёСЃС‚РѕСЂРёСЋ РїРёС‚Р°РЅРёСЏ;
- РЅРµ РїСЂРµРґР»Р°РіР°Р№ СЌРєСЃС‚СЂРµРјР°Р»СЊРЅС‹Рµ РґРµС„РёС†РёС‚С‹ РёР»Рё СЂРёСЃРєРѕРІР°РЅРЅС‹Рµ СЃС…РµРјС‹;
- meals РґРµР»Р°Р№ СЂРµР°Р»РёСЃС‚РёС‡РЅС‹РјРё Рё РїСЂРёРіРѕРґРЅС‹РјРё РґР»СЏ СЂСѓС‡РЅРѕРіРѕ Р»РѕРіРёСЂРѕРІР°РЅРёСЏ.`,
  });

  return createAiPlanProposal(supabase, {
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
      context,
      knowledge,
      proposal: result.object,
    },
  });
}

export async function generateWorkoutPlanProposalForUser(
  supabase: SupabaseClient,
  userId: string,
  input: WorkoutPlanGenerationInput,
) {
  const { context } = await getAiRuntimeContext(supabase, userId);
  const goal = input.goal ?? context.goal.goalType ?? "maintenance";
  const equipment = input.equipment?.length
    ? input.equipment
    : context.onboarding.equipment.length
      ? context.onboarding.equipment
      : ["СЃРѕР±СЃС‚РІРµРЅРЅС‹Р№ РІРµСЃ"];
  const daysPerWeek = input.daysPerWeek ?? context.goal.weeklyTrainingDays ?? 3;
  const focus = input.focus ?? "РѕР±С‰РёР№ РїСЂРѕРіСЂРµСЃСЃ Р±РµР· РїРµСЂРµРіСЂСѓР·Р°";
  const knowledge = await retrieveKnowledgeMatches(
    supabase,
    userId,
    `РўСЂРµРЅРёСЂРѕРІРєРё, СѓРїСЂР°Р¶РЅРµРЅРёСЏ, РїРѕРІС‚РѕСЂРµРЅРёСЏ Рё РїСЂРѕРіСЂРµСЃСЃ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ. Р¦РµР»СЊ ${goal}. Р”РЅРµР№ ${daysPerWeek}. Р¤РѕРєСѓСЃ ${focus}.`,
    8,
  );

  const result = await generateObject({
    model: models.chat,
    schema: workoutPlanSchema,
    prompt: `РЎРѕР±РµСЂРё proposal С‚СЂРµРЅРёСЂРѕРІРѕС‡РЅРѕРіРѕ РїР»Р°РЅР° РґР»СЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ fitness-РїСЂРёР»РѕР¶РµРЅРёСЏ.

РљРѕРЅС‚РµРєСЃС‚ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ:
- С†РµР»СЊ: ${goal}
- С‚СЂРµРЅРёСЂРѕРІРѕС‡РЅС‹С… РґРЅРµР№ РІ РЅРµРґРµР»СЋ: ${daysPerWeek}
- РѕР±РѕСЂСѓРґРѕРІР°РЅРёРµ: ${equipment.join(", ")}
- СѓСЂРѕРІРµРЅСЊ РїРѕРґРіРѕС‚РѕРІРєРё: ${context.onboarding.fitnessLevel ?? "РЅРµ СѓРєР°Р·Р°РЅ"}
- С‚СЂР°РІРјС‹/РѕРіСЂР°РЅРёС‡РµРЅРёСЏ: ${context.onboarding.injuries.join(", ") || "РЅРµ СѓРєР°Р·Р°РЅС‹"}
- РїРѕР»: ${context.onboarding.sex ?? "РЅРµ СѓРєР°Р·Р°РЅ"}
- РІРѕР·СЂР°СЃС‚: ${context.onboarding.age ?? "РЅРµ СѓРєР°Р·Р°РЅ"}
- РІРµСЃ: ${context.onboarding.weightKg ?? "РЅРµ СѓРєР°Р·Р°РЅ"}
- С„РѕРєСѓСЃ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ: ${focus}
- Р·Р°РІРµСЂС€С‘РЅРЅС‹С… С‚СЂРµРЅРёСЂРѕРІРѕС‡РЅС‹С… РґРЅРµР№ Р·Р° 28 РґРЅРµР№: ${context.workoutInsights.completedDaysLast28}
- СЃРѕС…СЂР°РЅС‘РЅРЅС‹С… СЃРµС‚РѕРІ Р·Р° 28 РґРЅРµР№: ${context.workoutInsights.loggedSetsLast28}
- СЃСЂРµРґРЅРёРµ С„Р°РєС‚РёС‡РµСЃРєРёРµ РїРѕРІС‚РѕСЂС‹: ${context.workoutInsights.avgActualReps ?? "РЅРµС‚ РґР°РЅРЅС‹С…"}
- СЃСЂРµРґРЅРёР№ СЂР°Р±РѕС‡РёР№ РІРµСЃ: ${context.workoutInsights.avgActualWeightKg ?? "РЅРµС‚ РґР°РЅРЅС‹С…"}
- СЃСЂРµРґРЅРёР№ RPE: ${context.workoutInsights.avgActualRpe ?? "РЅРµС‚ РґР°РЅРЅС‹С…"}
- РґРѕР»СЏ С‚СЏР¶С‘Р»С‹С… СЃРµС‚РѕРІ (RPE 8.5+): ${context.workoutInsights.hardSetShareLast28 ?? "РЅРµС‚ РґР°РЅРЅС‹С…"}
- С‚РѕРЅРЅР°Р¶ Р·Р° 28 РґРЅРµР№: ${context.workoutInsights.tonnageLast28Kg ?? "РЅРµС‚ РґР°РЅРЅС‹С…"}
- Р»СѓС‡С€РёР№ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅРЅС‹Р№ РІРµСЃ: ${context.workoutInsights.bestSetWeightKg ?? "РЅРµС‚ РґР°РЅРЅС‹С…"}
- Р»СѓС‡С€Р°СЏ РѕС†РµРЅРєР° 1РџРњ: ${context.workoutInsights.bestEstimatedOneRmKg ?? "РЅРµС‚ РґР°РЅРЅС‹С…"}
- РїРѕСЃР»РµРґРЅРёР№ РІРµСЃ С‚РµР»Р° РІ С‚СЂРµРЅРёСЂРѕРІРѕС‡РЅС‹Р№ РґРµРЅСЊ: ${context.workoutInsights.latestSessionBodyWeightKg ?? "РЅРµС‚ РґР°РЅРЅС‹С…"}

РљРѕСѓС‡-СЃРёРіРЅР°Р»С‹ РїРѕ РїСЂРѕРіСЂРµСЃСЃРёРё Рё РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЋ:
${formatWorkoutCoachingSignalsForPrompt(context.workoutInsights.coachingSignals)}

РџРёС‰РµРІС‹Рµ РєРѕСѓС‡-СЃРёРіРЅР°Р»С‹:
${formatNutritionCoachingSignalsForPrompt(context.nutritionInsights.coachingSignals)}

Meal-level РїР°С‚С‚РµСЂРЅС‹ РїРёС‚Р°РЅРёСЏ:
${formatNutritionMealPatternsForPrompt(context.nutritionInsights.mealPatterns)}

РџСЂРёРѕСЂРёС‚РµС‚РЅС‹Рµ СЂРµРєРѕРјРµРЅРґР°С†РёРё РїРѕ СЂР°С†РёРѕРЅСѓ:
${formatNutritionStrategyForPrompt(context.nutritionInsights.strategy)}

РќРѕСЂРјР°Р»РёР·РѕРІР°РЅРЅС‹Рµ С„Р°РєС‚С‹ Рё РїСЂРёРѕСЂРёС‚РµС‚С‹:
${formatStructuredKnowledgeForPrompt(context.structuredKnowledge)}

РСЃС‚РѕСЂРёС‡РµСЃРєРёР№ RAG-РєРѕРЅС‚РµРєСЃС‚:
${buildKnowledgeExcerpt(knowledge)}

РџСЂР°РІРёР»Р°:
- РїР»Р°РЅ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ realistic Рё safe;
- РЅРµ РїСЂРµРґР»Р°РіР°Р№ РјРµРґРёС†РёРЅСЃРєРёРµ СЂРµРєРѕРјРµРЅРґР°С†РёРё;
- СѓС‡РёС‚С‹РІР°Р№ РѕРіСЂР°РЅРёС‡РµРЅРёСЏ, РѕР±РѕСЂСѓРґРѕРІР°РЅРёРµ, СЂР°Р±РѕС‡РёРµ РІРµСЃР°, С‚РѕРЅРЅР°Р¶ Рё РІСЃСЋ РґРѕСЃС‚СѓРїРЅСѓСЋ РёСЃС‚РѕСЂРёСЋ С‚СЂРµРЅРёСЂРѕРІРѕРє;
- summary Рё exercise names РґРµР»Р°Р№ РїСЂРёРіРѕРґРЅС‹РјРё РґР»СЏ СЂСѓСЃСЃРєРѕСЏР·С‹С‡РЅРѕРіРѕ UI.`,
  });

  return createAiPlanProposal(supabase, {
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
      context,
      knowledge,
      proposal: result.object,
    },
  });
}
