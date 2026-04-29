import type { Route } from "next";
import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { redirect } from "next/navigation";

import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  type PlatformAdminRole,
} from "@/lib/admin-permissions";
import { logger } from "@/lib/logger";
import { withTimeout, withTransientRetry } from "@/lib/runtime-retry";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readServerUserOrNull } from "@/lib/supabase/server-user";

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

const isPlaywrightRuntime = process.env.PLAYWRIGHT_TEST_HOOKS === "1";
const VIEWER_AUTH_TIMEOUT_MS = isPlaywrightRuntime ? 2_500 : 12_000;
const VIEWER_DATA_TIMEOUT_MS = isPlaywrightRuntime ? 1_500 : 10_000;
const VIEWER_RETRY_DELAYS_MS = isPlaywrightRuntime
  ? ([150, 300] as const)
  : ([500, 1_500, 3_000, 5_000] as const);

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? null;
}

function buildPlaywrightViewerSnapshot(user: User): Viewer {
  const email = normalizeEmail(user.email);
  const adminEmail = normalizeEmail(process.env.PLAYWRIGHT_ADMIN_EMAIL);
  const isAdmin =
    Boolean(email && adminEmail && email === adminEmail) ||
    email === normalizeEmail(PRIMARY_SUPER_ADMIN_EMAIL);

  return {
    user,
    profile: {
      full_name: isAdmin
        ? process.env.PLAYWRIGHT_ADMIN_FULL_NAME ?? "Root Admin"
        : process.env.PLAYWRIGHT_TEST_FULL_NAME ?? "Leva Demo",
    },
    onboarding: {
      age: 30,
      sex: "male",
      height_cm: 180,
      weight_kg: 80,
      fitness_level: "intermediate",
      equipment: ["barbell", "dumbbells"],
      injuries: [],
      dietary_preferences: ["high_protein"],
    },
    goal: {
      goal_type: "maintenance",
      target_weight_kg: 76,
      weekly_training_days: 4,
    },
    adminState: null,
    isPlatformAdmin: isAdmin,
    platformAdminRole: isAdmin ? "super_admin" : null,
    hasCompletedOnboarding: true,
    isSnapshotPartial: true,
  };
}

async function recoverViewerAdminSlices(userId: string) {
  const adminSupabase = createAdminSupabaseClient();

  return await withTimeout(
    withTransientRetry(
      async () => {
        const [adminResult, userAdminStateResult] = await Promise.all([
          adminSupabase
            .from("platform_admins")
            .select("id, role")
            .eq("user_id", userId)
            .maybeSingle(),
          adminSupabase
            .from("user_admin_states")
            .select("is_suspended, suspended_at, restored_at, state_reason, metadata")
            .eq("user_id", userId)
            .maybeSingle(),
        ]);

        if (adminResult.error) {
          throw adminResult.error;
        }

        if (
          userAdminStateResult.error &&
          !isMissingUserAdminStatesError(userAdminStateResult.error)
        ) {
          throw userAdminStateResult.error;
        }

        return {
          admin:
            (adminResult.data as { id: string; role: PlatformAdminRole } | null) ?? null,
          adminState:
            (userAdminStateResult.data as UserAdminStateRow | null) ?? null,
        };
      },
      {
        attempts: 3,
        delaysMs: VIEWER_RETRY_DELAYS_MS,
      },
    ),
    VIEWER_AUTH_TIMEOUT_MS,
    "viewer admin fallback",
  );
}

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
  let user = null;

  try {
    user = await withTimeout(
      withTransientRetry(async () => await readServerUserOrNull(supabase), {
        attempts: 5,
        delaysMs: VIEWER_RETRY_DELAYS_MS,
      }),
      VIEWER_AUTH_TIMEOUT_MS,
      "viewer auth",
    );
  } catch (error) {
    logger.warn("viewer auth fallback returned null after runtime failure", {
      error,
    });
    return null;
  }

  if (!user) {
    return null;
  }

  const userId = user.id;

  if (isPlaywrightRuntime) {
    return buildPlaywrightViewerSnapshot(user);
  }

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
  let adminData =
    (adminResult.data as { id: string; role: PlatformAdminRole } | null) ?? null;
  let adminState = (userAdminStateResult.data as UserAdminStateRow | null) ?? null;
  let isAdminPartial = adminResult.isPartial;
  let isAdminStatePartial = userAdminStateResult.isPartial;

  if (isAdminPartial || isAdminStatePartial) {
    try {
      const recoveredAdmin = await recoverViewerAdminSlices(userId);

      if (isAdminPartial) {
        adminData = recoveredAdmin.admin;
        isAdminPartial = false;
      }

      if (isAdminStatePartial) {
        adminState = recoveredAdmin.adminState;
        isAdminStatePartial = false;
      }
    } catch (error) {
      logger.warn("viewer admin fallback remained degraded", {
        error,
        userId,
      });
    }
  }

  const isSnapshotPartial =
    profileResult.isPartial ||
    onboardingResult.isPartial ||
    goalResult.isPartial ||
    isAdminPartial ||
    isAdminStatePartial;

  return {
    user,
    profile: (profileResult.data as ProfileRow | null) ?? null,
    onboarding,
    goal,
    adminState,
    isPlatformAdmin: Boolean(adminData),
    platformAdminRole: adminData?.role ?? null,
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

