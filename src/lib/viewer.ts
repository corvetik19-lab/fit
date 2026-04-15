import type { Route } from "next";
import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { redirect } from "next/navigation";

import type { PlatformAdminRole } from "@/lib/admin-permissions";
import { withTransientRetry } from "@/lib/runtime-retry";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ProfileRow = {
  full_name: string | null;
};

type OnboardingRow = {
  age: number | null;
  sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_level: string | null;
  equipment: string[];
  injuries: string[];
  dietary_preferences: string[];
};

type GoalRow = {
  goal_type: "fat_loss" | "maintenance" | "muscle_gain" | "performance";
  target_weight_kg: number | null;
  weekly_training_days: number | null;
};

type UserAdminStateRow = {
  is_suspended: boolean;
  metadata: Record<string, unknown> | null;
  restored_at: string | null;
  state_reason: string | null;
  suspended_at: string | null;
};

export type Viewer = {
  user: User;
  profile: ProfileRow | null;
  onboarding: OnboardingRow | null;
  goal: GoalRow | null;
  adminState: UserAdminStateRow | null;
  isPlatformAdmin: boolean;
  platformAdminRole: PlatformAdminRole | null;
  hasCompletedOnboarding: boolean;
};

function hasCompletedOnboarding(
  onboarding: OnboardingRow | null,
  goal: GoalRow | null,
) {
  if (!onboarding || !goal) {
    return false;
  }

  return Boolean(
    onboarding.age &&
      onboarding.height_cm &&
      onboarding.weight_kg &&
      onboarding.fitness_level &&
      goal.weekly_training_days,
  );
}

function isMissingUserAdminStatesError(error: { code?: string } | null | undefined) {
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST204" ||
    error?.code === "PGRST205"
  );
}

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await withTransientRetry(async () => await supabase.auth.getUser());

  if (!user) {
    return null;
  }

  const [
    profileResult,
    onboardingResult,
    goalResult,
    adminResult,
    userAdminStateResult,
  ] = await withTransientRetry(async () =>
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("onboarding_profiles")
        .select(
          "age, sex, height_cm, weight_kg, fitness_level, equipment, injuries, dietary_preferences",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("goals")
        .select("goal_type, target_weight_kg, weekly_training_days")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("platform_admins")
        .select("id, role")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("user_admin_states")
        .select("is_suspended, suspended_at, restored_at, state_reason, metadata")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]),
  );

  if (
    userAdminStateResult.error &&
    !isMissingUserAdminStatesError(userAdminStateResult.error)
  ) {
    throw userAdminStateResult.error;
  }

  const onboarding = (onboardingResult.data as OnboardingRow | null) ?? null;
  const goal = (goalResult.data as GoalRow | null) ?? null;

  return {
    user,
    profile: (profileResult.data as ProfileRow | null) ?? null,
    onboarding,
    goal,
    adminState: userAdminStateResult.error
      ? null
      : ((userAdminStateResult.data as UserAdminStateRow | null) ?? null),
    isPlatformAdmin: Boolean(adminResult.data),
    platformAdminRole:
      (adminResult.data?.role as PlatformAdminRole | undefined) ?? null,
    hasCompletedOnboarding: hasCompletedOnboarding(onboarding, goal),
  };
});

export async function requireViewer() {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/" as Route);
  }

  if (viewer.adminState?.is_suspended && !viewer.isPlatformAdmin) {
    redirect("/suspended" as Route);
  }

  return viewer;
}

export async function requireReadyViewer() {
  const viewer = await requireViewer();

  if (!viewer.hasCompletedOnboarding) {
    redirect("/onboarding" as Route);
  }

  return viewer;
}

export async function requirePlatformAdminViewer() {
  const viewer = await requireViewer();

  if (!viewer.isPlatformAdmin) {
    redirect("/admin" as Route);
  }

  return viewer;
}

