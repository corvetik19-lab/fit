import type { Route } from "next";
import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { redirect } from "next/navigation";

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

export type Viewer = {
  user: User;
  profile: ProfileRow | null;
  onboarding: OnboardingRow | null;
  goal: GoalRow | null;
  isPlatformAdmin: boolean;
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

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [profileResult, onboardingResult, goalResult, adminResult] =
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
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const onboarding = (onboardingResult.data as OnboardingRow | null) ?? null;
  const goal = (goalResult.data as GoalRow | null) ?? null;

  return {
    user,
    profile: (profileResult.data as ProfileRow | null) ?? null,
    onboarding,
    goal,
    isPlatformAdmin: Boolean(adminResult.data),
    hasCompletedOnboarding: hasCompletedOnboarding(onboarding, goal),
  };
});

export async function requireViewer() {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/auth" as Route);
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
