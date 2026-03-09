import { z } from "zod";

const confidenceSchema = z.enum(["low", "medium", "high"]);

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
