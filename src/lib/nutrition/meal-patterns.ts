export type NutritionMealPatternStatus = "positive" | "watch" | "attention";

export type NutritionMealPatternInsight = {
  key: "distribution" | "timing" | "protein" | "repeat_foods";
  status: NutritionMealPatternStatus;
  title: string;
  metric: string;
  summary: string;
  action: string;
};

export type NutritionRepeatedFood = {
  foodName: string;
  appearances: number;
  totalKcal: number;
  totalProtein: number;
};

export type NutritionMealPatternMealItem = {
  foodNameSnapshot: string;
  servings: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type NutritionMealPatternMeal = {
  id: string;
  eatenAt: string;
  totals: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  items: NutritionMealPatternMealItem[];
};

export type NutritionMealPatternStats = {
  trackedMealDays: number;
  mealCount: number;
  avgMealsPerTrackedDay: number | null;
  avgMealKcal: number | null;
  avgProteinPerMeal: number | null;
  proteinDenseMealShare: number | null;
  eveningCaloriesShare: number | null;
  dominantWindow: "morning" | "midday" | "evening" | null;
  topFoods: NutritionRepeatedFood[];
  patterns: NutritionMealPatternInsight[];
};

function roundToSingleDecimal(value: number) {
  return Number(value.toFixed(1));
}

function formatNumber(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "нет данных";
  }

  return `${Math.round(value * 100)}%`;
}

function formatWindow(
  value: NutritionMealPatternStats["dominantWindow"],
) {
  switch (value) {
    case "morning":
      return "утро";
    case "midday":
      return "день";
    case "evening":
      return "вечер";
    default:
      return "нет данных";
  }
}

function getMealWindow(date: Date) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return "morning" as const;
  }

  if (hour >= 12 && hour < 18) {
    return "midday" as const;
  }

  return "evening" as const;
}

function buildDistributionPattern(
  stats: Omit<NutritionMealPatternStats, "patterns">,
): NutritionMealPatternInsight {
  if (stats.mealCount === 0 || stats.avgMealsPerTrackedDay === null) {
    return {
      key: "distribution",
      status: "watch",
      title: "Пока нет картины по структуре дня",
      metric: "нет логов приёмов пищи",
      summary:
        "Без приёмов пищи система не может понять, как распределяются калории в течение дня.",
      action:
        "Логируй сами приёмы пищи, а не только дневную сводку, чтобы AI видел структуру рациона.",
    };
  }

  if (
    stats.avgMealsPerTrackedDay >= 3 &&
    stats.avgMealsPerTrackedDay <= 5 &&
    stats.avgMealKcal !== null &&
    stats.avgMealKcal <= 750
  ) {
    return {
      key: "distribution",
      status: "positive",
      title: "Структура приёмов пищи выглядит ровной",
      metric: `${formatNumber(stats.avgMealsPerTrackedDay)} приёма в день`,
      summary:
        "Калории распределяются без чрезмерно редких и слишком крупных приёмов пищи, поэтому рацион легче держать под контролем.",
      action:
        "Сохраняй эту структуру и меняй в первую очередь состав блюд, а не весь ритм питания.",
    };
  }

  if (
    stats.avgMealsPerTrackedDay < 3 ||
    (stats.avgMealKcal !== null && stats.avgMealKcal >= 850)
  ) {
    return {
      key: "distribution",
      status: "attention",
      title: "День собирается из слишком крупных приёмов пищи",
      metric: `${formatNumber(stats.avgMealsPerTrackedDay)} приёма • ${formatNumber(
        stats.avgMealKcal,
      )} ккал в среднем`,
      summary:
        "Рацион выглядит сжатым в мало приёмов пищи, из-за чего легче улететь по калориям и сложнее удерживать белок ровно по дню.",
      action:
        "Добавь ещё один стабильный приём пищи или белковый перекус, чтобы убрать перегруз на 1-2 крупных окна.",
    };
  }

  return {
    key: "distribution",
    status: "watch",
    title: "Структура дня рабочая, но не идеальная",
    metric: `${formatNumber(stats.avgMealsPerTrackedDay)} приёма в день`,
    summary:
      "Распределение приёмов пищи уже выглядит понятным, но ещё есть перекос в сторону слишком редких или слишком плотных окон.",
    action:
      "Выбери один самый хаотичный кусок дня и стабилизируй его первым, не пытаясь перестроить весь рацион сразу.",
  };
}

function buildTimingPattern(
  stats: Omit<NutritionMealPatternStats, "patterns">,
): NutritionMealPatternInsight {
  if (stats.mealCount === 0) {
    return {
      key: "timing",
      status: "watch",
      title: "Временной рисунок питания пока пустой",
      metric: "нет тайминга приёмов пищи",
      summary:
        "Пока нет истории приёмов пищи, система не видит, на какое окно дня смещаются калории.",
      action:
        "Логируй время приёмов пищи хотя бы несколько дней подряд, чтобы увидеть перекос по окнам дня.",
    };
  }

  if (stats.eveningCaloriesShare !== null && stats.eveningCaloriesShare >= 0.5) {
    return {
      key: "timing",
      status: "attention",
      title: "Большая часть калорий уходит в вечер",
      metric: `${formatPercent(stats.eveningCaloriesShare)} калорий вечером`,
      summary:
        "Рацион заметно смещён на вечернее окно. Это не всегда плохо, но часто приводит к добору калорий в конце дня и нестабильному режиму.",
      action:
        "Перенеси часть калорий и белка в первую половину дня, чтобы не собирать основной объём вечером.",
    };
  }

  if (stats.eveningCaloriesShare !== null && stats.eveningCaloriesShare <= 0.35) {
    return {
      key: "timing",
      status: "positive",
      title: "Калории распределены без сильного перекоса в вечер",
      metric: `${formatPercent(stats.eveningCaloriesShare)} калорий вечером`,
      summary:
        "Питание не выглядит слишком поздним: калории распределяются спокойнее, и это помогает удерживать режим предсказуемым.",
      action:
        "Сохраняй текущий тайминг и корректируй объём через состав блюд, а не через поздние доборы калорий.",
    };
  }

  return {
    key: "timing",
    status: "watch",
    title: "Основное окно питания уже читается",
    metric: `доминирует ${formatWindow(stats.dominantWindow)}`,
    summary:
      "По времени приёмов пищи уже видно устойчивое окно дня, но оно ещё не выглядит полностью нейтральным по распределению калорий.",
    action:
      "Оцени, не добираешь ли ты слишком много калорий в последнем приёме пищи, и при необходимости сгладь день более ранним приёмом.",
  };
}

function buildProteinPattern(
  stats: Omit<NutritionMealPatternStats, "patterns">,
): NutritionMealPatternInsight {
  if (stats.mealCount === 0 || stats.avgProteinPerMeal === null) {
    return {
      key: "protein",
      status: "watch",
      title: "Пока нет картины по белку в приёмах пищи",
      metric: "нет meal-level данных",
      summary:
        "Без логов конкретных приёмов пищи система не видит, насколько равномерно белок распределён по дню.",
      action:
        "Фиксируй состав блюд, чтобы AI видел не только дневной белок, но и то, как он разбит по приёмам пищи.",
    };
  }

  if (
    stats.avgProteinPerMeal >= 25 &&
    stats.proteinDenseMealShare !== null &&
    stats.proteinDenseMealShare >= 0.5
  ) {
    return {
      key: "protein",
      status: "positive",
      title: "Белок распределён по дню достаточно плотно",
      metric: `${formatNumber(stats.avgProteinPerMeal)} г на приём`,
      summary:
        "В среднем приёмы пищи уже несут заметную белковую нагрузку, а не собирают белок только в одном окне дня.",
      action:
        "Сохраняй текущую структуру и добавляй белок точечно только в слабые окна, а не везде сразу.",
    };
  }

  if (stats.avgProteinPerMeal < 18) {
    return {
      key: "protein",
      status: "attention",
      title: "Белок по приёмам пищи распределён слишком слабо",
      metric: `${formatNumber(stats.avgProteinPerMeal)} г на приём`,
      summary:
        "Даже если по дню белок иногда добирается, meal-level структура показывает слишком лёгкие по белку приёмы пищи.",
      action:
        "Усиль 1-2 повторяющихся приёма пищи источником белка, чтобы белок рос по дню не только за счёт одного большого окна.",
    };
  }

  return {
    key: "protein",
    status: "watch",
    title: "Белок уже распределяется, но ещё неравномерно",
    metric: `${formatNumber(stats.avgProteinPerMeal)} г на приём`,
    summary:
      "Структура уже не выглядит слабой, но плотных белковых приёмов пищи пока недостаточно для максимально устойчивого восстановления.",
    action:
      "Подними белок в самом слабом приёме пищи, а не пытайся равномерно переписать всё меню.",
  };
}

function buildRepeatFoodsPattern(
  stats: Omit<NutritionMealPatternStats, "patterns">,
): NutritionMealPatternInsight {
  if (!stats.topFoods.length) {
    return {
      key: "repeat_foods",
      status: "watch",
      title: "Любимые продукты ещё не выделились",
      metric: "недостаточно meal-level истории",
      summary:
        "После нескольких дней с подробными блюдами здесь появится срез по тем продуктам, из которых реально состоит рацион.",
      action:
        "Логируй блюда подробнее, чтобы AI мог видеть повторяющиеся продукты и строить практичные рекомендации, а не абстрактный план.",
    };
  }

  const leadFood = stats.topFoods[0];
  const repeatShare = leadFood.appearances / Math.max(stats.mealCount, 1);

  if (repeatShare >= 0.45) {
    return {
      key: "repeat_foods",
      status: "watch",
      title: "Рацион сильно опирается на несколько повторяющихся продуктов",
      metric: `${leadFood.foodName} встречается ${leadFood.appearances} раз`,
      summary:
        "Это удобно для соблюдения плана, но может сделать рацион слишком узким и привести к однообразию по вкусу и насыщению.",
      action:
        "Сохрани базовые продукты-якоря, но добавь 1-2 альтернативы для тех же задач по калориям и белку.",
    };
  }

  return {
    key: "repeat_foods",
    status: "positive",
    title: "Есть понятная база продуктов без жёсткого перекоса",
    metric: `${leadFood.foodName} — частый якорь рациона`,
    summary:
      "Рацион уже строится на узнаваемых продуктах, но без явного доминирования одного и того же блюда во всех окнах дня.",
    action:
      "Используй эти частые продукты как основу для шаблонов питания и меняй вокруг них только детали.",
  };
}

export function buildNutritionMealPatternStats(
  meals: NutritionMealPatternMeal[],
): NutritionMealPatternStats {
  if (!meals.length) {
    return {
      trackedMealDays: 0,
      mealCount: 0,
      avgMealsPerTrackedDay: null,
      avgMealKcal: null,
      avgProteinPerMeal: null,
      proteinDenseMealShare: null,
      eveningCaloriesShare: null,
      dominantWindow: null,
      topFoods: [],
      patterns: [],
    };
  }

  const dayKeys = new Set(meals.map((meal) => meal.eatenAt.slice(0, 10)));
  const totalKcal = meals.reduce((sum, meal) => sum + meal.totals.kcal, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + meal.totals.protein, 0);
  const trackedMealDays = dayKeys.size;
  const avgMealsPerTrackedDay = trackedMealDays
    ? roundToSingleDecimal(meals.length / trackedMealDays)
    : null;
  const avgMealKcal = meals.length
    ? roundToSingleDecimal(totalKcal / meals.length)
    : null;
  const avgProteinPerMeal = meals.length
    ? roundToSingleDecimal(totalProtein / meals.length)
    : null;
  const proteinDenseMealShare = meals.length
    ? roundToSingleDecimal(
        meals.filter((meal) => meal.totals.protein >= 25).length / meals.length,
      )
    : null;

  const windowKcal = {
    morning: 0,
    midday: 0,
    evening: 0,
  };
  const foodMap = new Map<string, NutritionRepeatedFood>();

  for (const meal of meals) {
    const window = getMealWindow(new Date(meal.eatenAt));
    windowKcal[window] += meal.totals.kcal;

    for (const item of meal.items) {
      const foodName = item.foodNameSnapshot.trim();
      if (!foodName) {
        continue;
      }

      const current = foodMap.get(foodName) ?? {
        foodName,
        appearances: 0,
        totalKcal: 0,
        totalProtein: 0,
      };

      foodMap.set(foodName, {
        foodName,
        appearances: current.appearances + 1,
        totalKcal: current.totalKcal + item.kcal,
        totalProtein: current.totalProtein + item.protein,
      });
    }
  }

  const eveningCaloriesShare =
    totalKcal > 0 ? roundToSingleDecimal(windowKcal.evening / totalKcal) : null;
  const dominantWindow =
    totalKcal > 0
      ? (Object.entries(windowKcal).sort((left, right) => right[1] - left[1])[0]?.[0] as
          | "morning"
          | "midday"
          | "evening"
          | undefined) ?? null
      : null;
  const topFoods = [...foodMap.values()]
    .sort((left, right) => {
      if (right.appearances !== left.appearances) {
        return right.appearances - left.appearances;
      }

      return right.totalProtein - left.totalProtein;
    })
    .slice(0, 5);

  const statsBase = {
    trackedMealDays,
    mealCount: meals.length,
    avgMealsPerTrackedDay,
    avgMealKcal,
    avgProteinPerMeal,
    proteinDenseMealShare,
    eveningCaloriesShare,
    dominantWindow,
    topFoods,
  };

  return {
    ...statsBase,
    patterns: [
      buildDistributionPattern(statsBase),
      buildTimingPattern(statsBase),
      buildProteinPattern(statsBase),
      buildRepeatFoodsPattern(statsBase),
    ],
  };
}

export function formatNutritionMealPatternsForPrompt(
  stats: NutritionMealPatternStats,
) {
  if (!stats.patterns.length) {
    return "Meal-level паттерны питания пока не сформированы.";
  }

  const topFoods =
    stats.topFoods.length > 0
      ? `Частые продукты: ${stats.topFoods
          .map((food) => `${food.foodName} (${food.appearances})`)
          .join(", ")}.`
      : "Частые продукты пока не выделены.";

  return `${stats.patterns
    .map(
      (pattern, index) =>
        `${index + 1}. ${pattern.title} [${pattern.metric}] — ${pattern.summary} Следующий шаг: ${pattern.action}`,
    )
    .join("\n")}\n${topFoods}`;
}
