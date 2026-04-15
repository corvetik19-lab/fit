import { loadEnvConfig } from "@next/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { buildDefaultOnboardingPayload } from "./auth";

loadEnvConfig(process.cwd());

let adminClient: SupabaseClient | null = null;

function getRequiredEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for Playwright admin helpers.`);
  }

  return value;
}

export function createSupabaseAdminTestClient() {
  if (adminClient) {
    return adminClient;
  }

  adminClient = createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return adminClient;
}

export async function findAuthUserIdByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = createSupabaseAdminTestClient();

  for (let page = 1; page <= 10; page += 1) {
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const targetUser = users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (targetUser) {
      return targetUser.id;
    }

    if (users.length < 200) {
      break;
    }
  }

  throw new Error(`Playwright auth user not found for email: ${email}`);
}

export async function ensureOnboardingTestData(
  email: string,
  fullName: string,
) {
  const userId = await findAuthUserIdByEmail(email);
  const supabase = createSupabaseAdminTestClient();
  const payload = buildDefaultOnboardingPayload(fullName);

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      user_id: userId,
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
        user_id: userId,
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
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (goalLookupError) {
    throw goalLookupError;
  }

  const goalPayload = {
    user_id: userId,
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
      user_id: userId,
      snapshot_reason: "playwright_onboarding_bootstrap",
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
}
