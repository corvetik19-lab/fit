import type { Route } from "next";
import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { redirect } from "next/navigation";

import type { PlatformAdminRole } from "@/lib/admin-permissions";
import { logger } from "@/lib/logger";
import { withTimeout, withTransientRetry } from "@/lib/runtime-retry";
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
  isSnapshotPartial: boolean;
};

const VIEWER_AUTH_TIMEOUT_MS = 12_000;
const VIEWER_DATA_TIMEOUT_MS = 10_000;
const VIEWER_RETRY_DELAYS_MS = [500, 1_500, 3_000, 5_000] as const;

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
  } = await withTimeout(
    withTransientRetry(async () => await supabase.auth.getUser(), {
      attempts: 5,
      delaysMs: VIEWER_RETRY_DELAYS_MS,
    }),
    VIEWER_AUTH_TIMEOUT_MS,
    "viewer auth",
  );

  if (!user) {
    return null;
  }

  const userId = user.id;

  async function readViewerSlice<T>(
    label: string,
    factory: () => Promise<{
      data: T | null;
      error: { code?: string; message?: string } | null;
    }>,
    options?: { allowMissingTable?: boolean },
  ) {
    try {
      const result = await withTimeout(
        withTransientRetry(factory, {
          attempts: 4,
          delaysMs: VIEWER_RETRY_DELAYS_MS,
        }),
        VIEWER_DATA_TIMEOUT_MS,
        label,
      );

      if (result.error) {
        if (options?.allowMissingTable && isMissingUserAdminStatesError(result.error)) {
          return {
            data: null,
            isPartial: false,
          };
        }

        throw result.error;
      }

      return {
        data: result.data,
        isPartial: false,
      };
    } catch (error) {
      logger.warn("viewer slice fallback activated", {
        error,
        label,
        userId,
      });

      return {
        data: null,
        isPartial: true,
      };
    }
  }

  const [profileResult, onboardingResult, goalResult, adminResult, userAdminStateResult] =
    await Promise.all([
      readViewerSlice("viewer profile", async () =>
        await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", userId)
          .maybeSingle(),
      ),
      readViewerSlice("viewer onboarding", async () =>
        await supabase
          .from("onboarding_profiles")
          .select(
            "age, sex, height_cm, weight_kg, fitness_level, equipment, injuries, dietary_preferences",
          )
          .eq("user_id", userId)
          .maybeSingle(),
      ),
      readViewerSlice("viewer goal", async () =>
        await supabase
          .from("goals")
          .select("goal_type, target_weight_kg, weekly_training_days")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ),
      readViewerSlice<{ id: string; role: PlatformAdminRole }>(
        "viewer platform admin",
        async () =>
        await supabase
          .from("platform_admins")
          .select("id, role")
          .eq("user_id", userId)
          .maybeSingle(),
      ),
      readViewerSlice<UserAdminStateRow>(
        "viewer admin state",
        async () =>
          await supabase
            .from("user_admin_states")
            .select("is_suspended, suspended_at, restored_at, state_reason, metadata")
            .eq("user_id", userId)
            .maybeSingle(),
        { allowMissingTable: true },
      ),
    ]);

  const onboarding = (onboardingResult.data as OnboardingRow | null) ?? null;
  const goal = (goalResult.data as GoalRow | null) ?? null;
  const isSnapshotPartial =
    profileResult.isPartial ||
    onboardingResult.isPartial ||
    goalResult.isPartial ||
    adminResult.isPartial ||
    userAdminStateResult.isPartial;

  return {
    user,
    profile: (profileResult.data as ProfileRow | null) ?? null,
    onboarding,
    goal,
    adminState: (userAdminStateResult.data as UserAdminStateRow | null) ?? null,
    isPlatformAdmin: Boolean(adminResult.data),
    platformAdminRole:
      (adminResult.data?.role as PlatformAdminRole | undefined) ?? null,
    hasCompletedOnboarding: isSnapshotPartial
      ? true
      : hasCompletedOnboarding(onboarding, goal),
    isSnapshotPartial,
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

