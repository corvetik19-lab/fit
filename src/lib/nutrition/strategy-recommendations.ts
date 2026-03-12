import type { NutritionCoachingSignal } from "@/lib/nutrition/coaching-signals";
import type {
  NutritionMealPatternInsight,
  NutritionRepeatedFood,
} from "@/lib/nutrition/meal-patterns";

export type NutritionStrategyPriority = "high" | "medium" | "keep";

export type NutritionStrategyRecommendation = {
  key:
    | "logging_foundation"
    | "protein_distribution"
    | "meal_structure"
    | "evening_shift"
    | "food_rotation"
    | "maintain_structure";
  priority: NutritionStrategyPriority;
  title: string;
  summary: string;
  action: string;
};

type BuildNutritionStrategyRecommendationsInput = {
  coachingSignals: NutritionCoachingSignal[];
  mealPatterns: NutritionMealPatternInsight[];
  topFoods: NutritionRepeatedFood[];
  trackedDays: number;
};

function findCoachingSignal(
  signals: NutritionCoachingSignal[],
  key: NutritionCoachingSignal["key"],
) {
  return signals.find((signal) => signal.key === key) ?? null;
}

function findMealPattern(
  patterns: NutritionMealPatternInsight[],
  key: NutritionMealPatternInsight["key"],
) {
  return patterns.find((pattern) => pattern.key === key) ?? null;
}

function pushUnique(
  recommendations: NutritionStrategyRecommendation[],
  recommendation: NutritionStrategyRecommendation,
) {
  if (recommendations.some((item) => item.key === recommendation.key)) {
    return;
  }

  recommendations.push(recommendation);
}

export function buildNutritionStrategyRecommendations(
  input: BuildNutritionStrategyRecommendationsInput,
) {
  const recommendations: NutritionStrategyRecommendation[] = [];
  const loggingSignal = findCoachingSignal(input.coachingSignals, "logging");
  const caloriesSignal = findCoachingSignal(input.coachingSignals, "calories");
  const proteinSignal = findCoachingSignal(input.coachingSignals, "protein");
  const distributionPattern = findMealPattern(input.mealPatterns, "distribution");
  const timingPattern = findMealPattern(input.mealPatterns, "timing");
  const proteinPattern = findMealPattern(input.mealPatterns, "protein");
  const repeatFoodsPattern = findMealPattern(input.mealPatterns, "repeat_foods");
  const leadFood = input.topFoods[0] ?? null;

  if (
    input.trackedDays < 5 ||
    loggingSignal?.status === "attention" ||
    loggingSignal?.status === "watch"
  ) {
    pushUnique(recommendations, {
      key: "logging_foundation",
      priority: input.trackedDays < 4 ? "high" : "medium",
      title: "Сначала стабилизируй лог питания",
      summary:
        "Пока история питания неплотная, любые правки по рациону будут менее точными. Сначала нужно получить устойчивую картину по дням и приёмам пищи.",
      action:
        "Закрой хотя бы 5-6 дней питания из 7 и фиксируй основные приёмы пищи, а не только итоговые калории за день.",
    });
  }

  if (
    proteinSignal?.status === "attention" ||
    proteinSignal?.status === "watch" ||
    proteinPattern?.status === "attention" ||
    proteinPattern?.status === "watch"
  ) {
    pushUnique(recommendations, {
      key: "protein_distribution",
      priority:
        proteinSignal?.status === "attention" || proteinPattern?.status === "attention"
          ? "high"
          : "medium",
      title: "Выровняй белок по приёмам пищи",
      summary:
        "Сейчас белок либо недобирается, либо слишком сильно собирается в одном окне дня. Для восстановления и контроля аппетита лучше распределять его ровнее.",
      action:
        "Усиль самый слабый по белку приём пищи и добавь повторяемый источник белка, который легко держать каждый день.",
    });
  }

  if (timingPattern?.status === "attention") {
    pushUnique(recommendations, {
      key: "evening_shift",
      priority: "high",
      title: "Перенеси часть калорий из вечера",
      summary:
        "Сильный вечерний перекос делает рацион менее управляемым и часто приводит к добору калорий в конце дня, когда контроль уже слабее.",
      action:
        "Перенеси часть калорий и белка в первую половину дня: добавь более плотный завтрак или обед вместо позднего добора вечером.",
    });
  }

  if (
    distributionPattern?.status === "attention" ||
    distributionPattern?.status === "watch" ||
    caloriesSignal?.status === "attention" ||
    caloriesSignal?.status === "watch"
  ) {
    pushUnique(recommendations, {
      key: "meal_structure",
      priority:
        distributionPattern?.status === "attention" ||
        caloriesSignal?.status === "attention"
          ? "high"
          : "medium",
      title: "Сделай структуру дня предсказуемее",
      summary:
        "Рацион сейчас зависит от слишком редких или слишком крупных окон питания. Если стабилизировать ритм, будет проще попадать и в калории, и в белок.",
      action:
        "Выбери один хаотичный кусок дня и преврати его в шаблонный приём пищи или перекус, который легко повторять без лишних решений.",
    });
  }

  if (repeatFoodsPattern?.status === "watch" && leadFood) {
    pushUnique(recommendations, {
      key: "food_rotation",
      priority: "medium",
      title: "Собери 2-3 шаблона вокруг частых продуктов",
      summary:
        "У тебя уже есть продукты-якоря, на которых реально держится рацион. Если дать им 1-2 замены, питание останется удобным, но станет гибче и устойчивее.",
      action: `Оставь ${leadFood.foodName} как базу, но подготовь для него 1-2 равноценных замены по калориям и белку, чтобы не упираться в один сценарий каждый день.`,
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      key: "maintain_structure",
      priority: "keep",
      title: "Текущую структуру питания можно закреплять",
      summary:
        "По логам рацион уже выглядит управляемым: структура дня, белок и повторы продуктов не создают сильного перекоса.",
      action:
        "Сохраняй текущий ритм и меняй рацион точечно: через состав блюд, а не через полную перестройку расписания питания.",
    });
  }

  return recommendations.slice(0, 4);
}

export function formatNutritionStrategyForPrompt(
  recommendations: NutritionStrategyRecommendation[],
) {
  if (!recommendations.length) {
    return "Приоритетные рекомендации по рациону пока не сформированы.";
  }

  return recommendations
    .map(
      (recommendation, index) =>
        `${index + 1}. ${recommendation.title} [${recommendation.priority}] — ${recommendation.summary} Следующий шаг: ${recommendation.action}`,
    )
    .join("\n");
}
