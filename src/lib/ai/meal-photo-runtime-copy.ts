export const AI_MEAL_PHOTO_NOT_CONFIGURED_MESSAGE =
  "Meal photo analysis is temporarily unavailable. The image-analysis runtime is not configured yet.";

export const AI_MEAL_PHOTO_UNAUTHORIZED_MESSAGE =
  "You need to sign in before using AI meal-photo analysis.";

export const AI_MEAL_PHOTO_IMAGE_REQUIRED_MESSAGE =
  "Please attach a food image first.";

export const AI_MEAL_PHOTO_IMAGE_INVALID_MESSAGE =
  "Only image files are supported.";

export const AI_MEAL_PHOTO_TOO_LARGE_MESSAGE =
  "The image is too large. Please use a file up to 8 MB.";

export const AI_MEAL_PHOTO_SAFETY_MESSAGE =
  "The meal-photo note went outside the safe food-and-fitness scope. Please rephrase it inside a nutrition context.";

export const AI_MEAL_PHOTO_SCHEMA_INVALID_MESSAGE =
  "The AI model returned an incomplete meal-photo analysis. Please try a clearer image or another angle.";

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

  if (normalized.includes("nutella") || normalized.includes("hazelnut spread")) {
    return {
      title: "Likely a hazelnut spread",
      summary:
        "Live vision analysis is temporarily unavailable, so this is a cautious fallback draft based on the text context only. Please verify the brand, serving size, and nutrition before saving it.",
      confidence: "low",
      estimatedKcal: 539,
      macros: {
        protein: 6,
        fat: 31,
        carbs: 58,
      },
      items: [
        {
          name: "Hazelnut spread",
          portion: "One photo-based serving, needs manual review",
          confidence: "low",
        },
      ],
      suggestions: [
        "Check the brand and package size before saving.",
        "If this is a different product, rename it manually after import.",
      ],
    };
  }

  return {
    title: "Food from photo",
    summary:
      "Live vision analysis is temporarily unavailable, so this is a safe fallback draft. Please review the title, composition, and portion manually before using it in your nutrition log.",
    confidence: "low",
    estimatedKcal: 0,
    macros: {
      protein: 0,
      fat: 0,
      carbs: 0,
    },
    items: [
      {
        name: "Dish could not be identified with confidence",
        portion: "Manual review required",
        confidence: "low",
      },
    ],
    suggestions: [
      "Add a short description of the dish to help with identification.",
      "After saving, adjust calories and macros manually if you know the exact values.",
    ],
  };
}

export function buildMealPhotoVisionPrompt(notes: string | null) {
  return [
    "You are analyzing a food photo for the fit app.",
    "Return only the structured meal-photo object.",
    "Keep summary and suggestions in English.",
    "Do not invent ingredients if the photo is unclear.",
    "If confidence is low, say so directly and lower the confidence field.",
    `Additional user context: ${notes ?? "no extra context"}.`,
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
        "Meal photo analysis is temporarily unavailable because the provider is not active for image processing.",
      status: 503,
    };
  }

  return {
    code: "MEAL_PHOTO_FAILED" as const,
    message:
      "Meal photo analysis could not be completed right now. Please try again a bit later.",
    status: 502,
  };
}

export function buildMealPhotoDeterministicFallback(notes: string | null) {
  return buildMealPhotoFallbackFromNotes(notes);
}

export function buildMealPhotoUserChatMessage(notes: string | null) {
  return notes?.trim()
    ? `Uploaded a food photo. Context: ${notes.trim()}`
    : "Uploaded a food photo for analysis.";
}

export function formatMealPhotoConfidence(value: "low" | "medium" | "high") {
  switch (value) {
    case "high":
      return "high";
    case "medium":
      return "medium";
    default:
      return "low";
  }
}

export function buildMealPhotoAssistantChatMessage(result: MealPhotoAnalysis) {
  const items =
    result.items.length > 0
      ? result.items
          .map(
            (item) =>
              `- ${item.name} • ${item.portion} • confidence ${formatMealPhotoConfidence(item.confidence)}`,
          )
          .join("\n")
      : "- Could not identify the visible food confidently.";
  const suggestions =
    result.suggestions.length > 0
      ? result.suggestions.map((item) => `- ${item}`).join("\n")
      : "- You can continue with a follow-up question about substitutions or meal planning.";

  return [
    `### ${result.title}`,
    result.summary,
    "",
    `Estimate: **${result.estimatedKcal} kcal**`,
    `Protein: **${result.macros.protein} g** • Fat: **${result.macros.fat} g** • Carbs: **${result.macros.carbs} g**`,
    `Confidence: **${formatMealPhotoConfidence(result.confidence)}**`,
    "",
    "What is visible in the photo:",
    items,
    "",
    "What to do next:",
    suggestions,
  ].join("\n");
}
