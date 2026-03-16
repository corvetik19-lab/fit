import { z } from "zod";

const confidenceSchema = z.enum(["low", "medium", "high"]);

const optionalTrimmedText = (max: number) =>
  z.preprocess(
    (value) => {
      if (value === undefined) {
        return undefined;
      }

      if (value === null) {
        return null;
      }

      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
      }

      return value;
    },
    z.string().max(max).nullable().optional(),
  );

export const mealPlanRequestSchema = z
  .object({
    goal: optionalTrimmedText(120),
    kcalTarget: z.number().int().min(1000).max(8000).nullable().optional(),
    dietaryNotes: optionalTrimmedText(600),
    mealsPerDay: z.number().int().min(1).max(8).nullable().optional(),
  })
  .strict();

export const workoutPlanRequestSchema = z
  .object({
    goal: optionalTrimmedText(120),
    equipment: z
      .array(z.string().trim().min(1).max(80))
      .max(20)
      .optional(),
    daysPerWeek: z.number().int().min(1).max(7).nullable().optional(),
    focus: optionalTrimmedText(200),
  })
  .strict();

export const workoutPlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  days: z.array(
    z.object({
      day: z.string(),
      focus: z.string(),
      exercises: z.array(
        z.object({
          name: z.string(),
          sets: z.number().int().positive(),
          reps: z.string(),
        }),
      ),
    }),
  ),
});

export const mealPlanSchema = z.object({
  title: z.string(),
  caloriesTarget: z.number().int().positive(),
  macros: z.object({
    protein: z.number().int().positive(),
    fat: z.number().int().positive(),
    carbs: z.number().int().positive(),
  }),
  meals: z.array(
    z.object({
      name: z.string(),
      kcal: z.number().int().positive(),
      items: z.array(z.string()),
    }),
  ),
});

export const mealPhotoAnalysisSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  confidence: confidenceSchema,
  estimatedKcal: z.number().int().nonnegative(),
  macros: z.object({
    protein: z.number().int().nonnegative(),
    fat: z.number().int().nonnegative(),
    carbs: z.number().int().nonnegative(),
  }),
  items: z.array(
    z.object({
      name: z.string().min(1),
      portion: z.string().min(1),
      confidence: confidenceSchema,
    }),
  ),
  suggestions: z.array(z.string().min(1)).max(6),
});
