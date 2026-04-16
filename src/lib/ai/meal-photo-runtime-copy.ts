export const AI_MEAL_PHOTO_NOT_CONFIGURED_MESSAGE =
  "Анализ фото временно недоступен. Контур обработки изображений ещё не настроен.";
export const AI_MEAL_PHOTO_UNAUTHORIZED_MESSAGE =
  "Нужно войти в аккаунт, чтобы использовать ИИ-анализ фото.";
export const AI_MEAL_PHOTO_IMAGE_REQUIRED_MESSAGE =
  "Нужно приложить изображение блюда.";
export const AI_MEAL_PHOTO_IMAGE_INVALID_MESSAGE =
  "Поддерживаются только изображения.";
export const AI_MEAL_PHOTO_TOO_LARGE_MESSAGE =
  "Изображение слишком большое. Используй файл до 8 МБ.";
export const AI_MEAL_PHOTO_SAFETY_MESSAGE =
  "Комментарий к фото вышел за безопасный контур приложения. Переформулируй запрос в рамках питания и фитнеса.";
export const AI_MEAL_PHOTO_SCHEMA_INVALID_MESSAGE =
  "AI вернул неполный анализ фото. Попробуй другое фото блюда или более чёткий ракурс.";

type MealPhotoAnalysis = {
  title: string;
  summary: string;
  confidence: "low" | "medium" | "high";
  estimatedKcal: number;
  macros: {
    protein: number;
    fat: number;
    carbs: number;
  };
  items: Array<{
    name: string;
    portion: string;
    confidence: "low" | "medium" | "high";
  }>;
  suggestions: string[];
};

function buildMealPhotoFallbackFromNotes(notes: string | null): MealPhotoAnalysis {
  const normalized = notes?.toLowerCase() ?? "";

  if (
    normalized.includes("nutella") ||
    (normalized.includes("орех") && normalized.includes("паста"))
  ) {
    return {
      title: "Похоже на ореховую пасту",
      summary:
        "Живой vision-анализ временно недоступен, поэтому я собрал осторожный черновик по текстовому описанию. Проверь название и состав перед сохранением.",
      confidence: "low",
      estimatedKcal: 539,
      macros: {
        protein: 6,
        fat: 31,
        carbs: 58,
      },
      items: [
        {
          name: "Ореховая паста",
          portion: "1 порция по фото, нужна ручная проверка",
          confidence: "low",
        },
      ],
      suggestions: [
        "Проверь бренд и вес упаковки перед сохранением.",
        "Если это другой продукт, скорректируй название вручную после импорта.",
      ],
    };
  }

  return {
    title: "Блюдо с фото",
    summary:
      "Живой vision-анализ временно недоступен, поэтому я сохранил безопасный черновик. Уточни название, состав и порцию вручную перед использованием в плане питания.",
    confidence: "low",
    estimatedKcal: 0,
    macros: {
      protein: 0,
      fat: 0,
      carbs: 0,
    },
    items: [
      {
        name: "Не удалось точно распознать блюдо",
        portion: "Нужна ручная проверка",
        confidence: "low",
      },
    ],
    suggestions: [
      "Добавь короткое описание блюда, чтобы уточнить состав.",
      "После сохранения скорректируй калории и БЖУ вручную, если знаешь их точнее.",
    ],
  };
}

export function buildMealPhotoVisionPrompt(notes: string | null) {
  return [
    "Ты анализируешь фото еды для фитнес-приложения fit.",
    "Верни только структурированный объект анализа блюда.",
    "Пиши summary и suggestions только по-русски.",
    "Не давай медицинских советов и не выдумывай ингредиенты, если фото неясное.",
    "Если уверенность низкая, честно укажи это и снизь confidence.",
    `Дополнительный пользовательский контекст: ${notes ?? "без дополнительного контекста"}.`,
  ].join(" ");
}

export function buildMealPhotoFailureResponse(error: unknown) {
  const raw =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const normalized = raw.toLowerCase();
  const providerUnavailable =
    normalized.includes("credit card") ||
    normalized.includes("insufficient credits") ||
    normalized.includes("payment required") ||
    normalized.includes("quota") ||
    normalized.includes("billing");

  if (providerUnavailable) {
    return {
      code: "AI_PROVIDER_UNAVAILABLE" as const,
      message:
        "Анализ фото временно недоступен. Провайдер не активирован для обработки изображений.",
      status: 503,
    };
  }

  return {
    code: "MEAL_PHOTO_FAILED" as const,
    message:
      "Не удалось выполнить анализ фото прямо сейчас. Попробуй ещё раз немного позже.",
    status: 502,
  };
}

export function buildMealPhotoDeterministicFallback(notes: string | null) {
  return buildMealPhotoFallbackFromNotes(notes);
}

export function buildMealPhotoUserChatMessage(notes: string | null) {
  return notes?.trim()
    ? `Загрузил фото еды. Контекст: ${notes.trim()}`
    : "Загрузил фото еды для анализа.";
}

export function formatMealPhotoConfidence(value: "low" | "medium" | "high") {
  switch (value) {
    case "high":
      return "высокая";
    case "medium":
      return "средняя";
    default:
      return "низкая";
  }
}

export function buildMealPhotoAssistantChatMessage(result: MealPhotoAnalysis) {
  const items =
    result.items.length > 0
      ? result.items
          .map(
            (item) =>
              `- ${item.name} • ${item.portion} • уверенность ${formatMealPhotoConfidence(item.confidence)}`,
          )
          .join("\n")
      : "- Состав блюда определить точно не удалось.";
  const suggestions =
    result.suggestions.length > 0
      ? result.suggestions.map((item) => `- ${item}`).join("\n")
      : "- Можно продолжить вопросом про рецепт, замены или план питания.";

  return [
    `### ${result.title}`,
    result.summary,
    "",
    `Оценка: **${result.estimatedKcal} ккал**`,
    `Белки: **${result.macros.protein} г** • Жиры: **${result.macros.fat} г** • Углеводы: **${result.macros.carbs} г**`,
    `Уверенность анализа: **${formatMealPhotoConfidence(result.confidence)}**`,
    "",
    "Что видно на фото:",
    items,
    "",
    "Что можно сделать дальше:",
    suggestions,
  ].join("\n");
}
