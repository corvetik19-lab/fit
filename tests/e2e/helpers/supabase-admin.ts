import { loadEnvConfig } from "@next/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  buildDefaultOnboardingPayload,
  getAdminE2ECredentials,
  getAuthE2ECredentials,
} from "./auth";
import { requestSupabasePasswordAuth } from "./supabase-password-auth";

loadEnvConfig(process.cwd());

let adminClient: SupabaseClient | null = null;
const ADMIN_RETRY_DELAYS_MS = [750, 1_500, 3_000, 5_000, 8_000, 12_000] as const;
const authUserIdByEmailCache = new Map<string, string>();
const isLocalPlaywrightAuth = process.env.PLAYWRIGHT_SKIP_AUTH_SETUP === "1";

function readUserIdFromAuthPayload(payload: { user: Record<string, unknown> }) {
  const userId = payload.user.id;

  return typeof userId === "string" && userId.length > 0 ? userId : null;
}

async function resolveKnownPlaywrightUserIdByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const knownCredentials = [
    getAuthE2ECredentials(),
    getAdminE2ECredentials(),
  ].filter(
    (
      credentials,
    ): credentials is NonNullable<
      ReturnType<typeof getAuthE2ECredentials>
    > => Boolean(credentials),
  );

  const matchingCredentials = knownCredentials.find(
    (credentials) => credentials.email.trim().toLowerCase() === normalizedEmail,
  );

  if (!matchingCredentials) {
    return null;
  }

  const payload = await requestSupabasePasswordAuth({
    email: matchingCredentials.email,
    password: matchingCredentials.password,
  });
  const userId = readUserIdFromAuthPayload(payload);

  if (!userId) {
    return null;
  }

  authUserIdByEmailCache.set(normalizedEmail, userId);
  return userId;
}

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

export async function withAdminRetry<T>(factory: () => Promise<T>) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < ADMIN_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const result = await factory();

      if (
        result &&
        typeof result === "object" &&
        "error" in result &&
        result.error &&
        typeof result.error === "object"
      ) {
        const errorRecord = result.error as {
          details?: string;
          message?: string;
        };
        const serializedError = [
          errorRecord.message ?? "",
          errorRecord.details ?? "",
          JSON.stringify(result.error),
        ]
          .filter(Boolean)
          .join(" ");

        if (
          serializedError.includes("fetch failed") ||
          serializedError.includes("ECONNRESET") ||
          serializedError.includes("terminated")
        ) {
          throw new Error(serializedError);
        }
      }

      return result;
    } catch (error) {
      lastError = error;

      if (attempt === ADMIN_RETRY_DELAYS_MS.length - 1) {
        break;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, ADMIN_RETRY_DELAYS_MS[attempt]),
      );
    }
  }

  throw lastError;
}

export async function findAuthUserIdByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const cached = authUserIdByEmailCache.get(normalizedEmail);

  if (cached) {
    return cached;
  }

  if (isLocalPlaywrightAuth) {
    const adminEmail = getAdminE2ECredentials()?.email.trim().toLowerCase();
    const userEmail = getAuthE2ECredentials()?.email.trim().toLowerCase();
    const syntheticUserId =
      normalizedEmail === adminEmail
        ? "00000000-0000-4000-8000-000000000002"
        : normalizedEmail === userEmail
          ? "00000000-0000-4000-8000-000000000001"
          : null;

    if (syntheticUserId) {
      authUserIdByEmailCache.set(normalizedEmail, syntheticUserId);
      return syntheticUserId;
    }
  }

  try {
    const userId = await resolveKnownPlaywrightUserIdByEmail(email);

    if (userId) {
      return userId;
    }
  } catch {
    // Fall back to service-role lookup below when password auth is transiently unavailable.
  }

  const supabase = createSupabaseAdminTestClient();

  for (let page = 1; page <= 10; page += 1) {
    const {
      data: { users },
      error,
    } = await withAdminRetry(async () =>
      await supabase.auth.admin.listUsers({
        page,
        perPage: 200,
      }),
    );

    if (error) {
      throw error;
    }

    const targetUser = users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (targetUser) {
      authUserIdByEmailCache.set(normalizedEmail, targetUser.id);
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

  const { error: profileUpsertError } = await withAdminRetry(async () =>
    await supabase.from("profiles").upsert(
      {
        id: userId,
        user_id: userId,
        full_name: payload.fullName,
      },
      { onConflict: "id" },
    ),
  );

  if (profileUpsertError) {
    throw profileUpsertError;
  }

  const { error: onboardingError } = await withAdminRetry(async () =>
    await supabase
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
      ),
  );

  if (onboardingError) {
    throw onboardingError;
  }

  const { data: existingGoal, error: goalLookupError } = await withAdminRetry(
    async () =>
      await supabase
        .from("goals")
        .select("id")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
  );

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

  const { error: goalMutationError } = await withAdminRetry(
    async () => await goalMutation,
  );

  if (goalMutationError) {
    throw goalMutationError;
  }

  const { error: snapshotError } = await withAdminRetry(async () =>
    await supabase
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
      }),
  );

  if (snapshotError) {
    throw snapshotError;
  }
}
