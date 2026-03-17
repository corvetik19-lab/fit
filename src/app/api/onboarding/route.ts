import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  age: z.number().int().min(13).max(100),
  sex: z.string().trim().min(1).max(40),
  heightCm: z.number().int().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  fitnessLevel: z.string().trim().min(1).max(40),
  equipment: z.array(z.string().trim().min(1).max(80)).max(20),
  injuries: z.array(z.string().trim().min(1).max(160)).max(20),
  dietaryPreferences: z.array(z.string().trim().min(1).max(160)).max(20),
  goalType: z.enum(["fat_loss", "maintenance", "muscle_gain", "performance"]),
  targetWeightKg: z.number().min(30).max(300).nullable(),
  weeklyTrainingDays: z.number().int().min(1).max(7),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы завершить онбординг.",
      });
    }

    const payload = onboardingSchema.parse(await request.json());

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        user_id: user.id,
        full_name: payload.fullName,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      throw profileError;
    }

    const { error: onboardingError } = await supabase
      .from("onboarding_profiles")
      .upsert(
        {
          user_id: user.id,
          age: payload.age,
          sex: payload.sex,
          height_cm: payload.heightCm,
          weight_kg: payload.weightKg,
          fitness_level: payload.fitnessLevel,
          equipment: payload.equipment,
          injuries: payload.injuries,
          dietary_preferences: payload.dietaryPreferences,
        },
        { onConflict: "user_id" },
      );

    if (onboardingError) {
      throw onboardingError;
    }

    const { data: existingGoal, error: goalLookupError } = await supabase
      .from("goals")
      .select("id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (goalLookupError) {
      throw goalLookupError;
    }

    const goalPayload = {
      user_id: user.id,
      goal_type: payload.goalType,
      target_weight_kg: payload.targetWeightKg,
      weekly_training_days: payload.weeklyTrainingDays,
    };

    const goalMutation = existingGoal?.id
      ? supabase.from("goals").update(goalPayload).eq("id", existingGoal.id)
      : supabase.from("goals").insert(goalPayload);

    const { error: goalMutationError } = await goalMutation;

    if (goalMutationError) {
      throw goalMutationError;
    }

    const { error: snapshotError } = await supabase
      .from("user_context_snapshots")
      .insert({
        user_id: user.id,
        snapshot_reason: "onboarding_completed",
        payload: {
          profile: {
            fullName: payload.fullName,
            age: payload.age,
            sex: payload.sex,
            heightCm: payload.heightCm,
            weightKg: payload.weightKg,
            fitnessLevel: payload.fitnessLevel,
          },
          goal: {
            goalType: payload.goalType,
            targetWeightKg: payload.targetWeightKg,
            weeklyTrainingDays: payload.weeklyTrainingDays,
          },
          equipment: payload.equipment,
          injuries: payload.injuries,
          dietaryPreferences: payload.dietaryPreferences,
        },
      });

    if (snapshotError) {
      throw snapshotError;
    }

    return Response.json({ ok: true });
  } catch (error) {
    logger.error("onboarding route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "ONBOARDING_PAYLOAD_INVALID",
        message: "Данные онбординга заполнены некорректно.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "ONBOARDING_SAVE_FAILED",
      message: "Не удалось сохранить данные онбординга.",
    });
  }
}
