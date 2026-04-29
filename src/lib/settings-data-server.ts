import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import type {
  SettingsBillingEvent,
  SettingsDataSnapshot,
  SettingsPrivacyEvent,
} from "@/lib/settings-data";
import {
  createEmptySettingsDataSnapshot,
  mapBillingAuditEvent,
  mapBillingReviewRequest,
  mapBillingSubscriptionEvent,
  mapDeletionRequest,
  mapExportJob,
  mapPrivacyEvent,
  SETTINGS_BILLING_AUDIT_ACTIONS,
  SETTINGS_BILLING_EVENT_TYPES,
  SETTINGS_PRIVACY_AUDIT_ACTIONS,
} from "@/lib/settings-data-server-model";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { repairMojibakeDeep } from "@/lib/text/repair-mojibake";

async function loadSettingsPrivacyEvents(userId: string) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from("admin_audit_logs")
      .select("id, actor_user_id, action, reason, payload, created_at")
      .eq("target_user_id", userId)
      .in("action", [...SETTINGS_PRIVACY_AUDIT_ACTIONS])
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return (data ?? [])
      .map((row) => mapPrivacyEvent(row, userId))
      .filter((event): event is SettingsPrivacyEvent => Boolean(event));
  } catch (error) {
    logger.warn("settings privacy events load failed", { error, userId });
    return [];
  }
}

async function loadSettingsBillingReviewRequest(userId: string) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    const { data, error } = await adminSupabase
      .from("support_actions")
      .select("id, status, payload, created_at, updated_at")
      .eq("target_user_id", userId)
      .eq("action", "billing_access_review")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapBillingReviewRequest(data) : null;
  } catch (error) {
    logger.warn("settings billing review request load failed", { error, userId });
    return null;
  }
}

async function loadSettingsBillingEvents(
  supabase: SupabaseClient,
  userId: string,
) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    const [subscriptionEventsResult, auditEventsResult] = await Promise.all([
      supabase
        .from("subscription_events")
        .select("id, event_type, payload, created_at")
        .eq("user_id", userId)
        .in("event_type", [...SETTINGS_BILLING_EVENT_TYPES])
        .order("created_at", { ascending: false })
        .limit(12),
      adminSupabase
        .from("admin_audit_logs")
        .select("id, actor_user_id, action, reason, payload, created_at")
        .eq("target_user_id", userId)
        .in("action", [...SETTINGS_BILLING_AUDIT_ACTIONS])
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    if (subscriptionEventsResult.error) {
      throw subscriptionEventsResult.error;
    }

    if (auditEventsResult.error) {
      throw auditEventsResult.error;
    }

    return [
      ...((subscriptionEventsResult.data ?? [])
        .map((row) => mapBillingSubscriptionEvent(row, userId))
        .filter((event): event is SettingsBillingEvent => Boolean(event))),
      ...((auditEventsResult.data ?? [])
        .map((row) => mapBillingAuditEvent(row, userId))
        .filter((event): event is SettingsBillingEvent => Boolean(event))),
    ]
      .sort((left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      .slice(0, 12);
  } catch (error) {
    logger.warn("settings billing events load failed", { error, userId });
    return [];
  }
}

export async function loadSettingsDataSnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<SettingsDataSnapshot> {
  const [
    exportJobsResult,
    deletionRequestResult,
    privacyEvents,
    billingReviewRequest,
    billingEvents,
  ] =
    await Promise.all([
      supabase
        .from("export_jobs")
        .select("id, format, status, artifact_path, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("deletion_requests")
        .select("id, status, hold_until, created_at, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
      loadSettingsPrivacyEvents(userId),
      loadSettingsBillingReviewRequest(userId),
      loadSettingsBillingEvents(supabase, userId),
    ]);

  if (exportJobsResult.error) {
    throw exportJobsResult.error;
  }

  if (deletionRequestResult.error) {
    throw deletionRequestResult.error;
  }

  return repairMojibakeDeep({
    billingEvents,
    billingReviewRequest,
    deletionRequest: deletionRequestResult.data
      ? mapDeletionRequest(deletionRequestResult.data)
      : null,
    exportJobs: (exportJobsResult.data ?? []).map(mapExportJob),
    privacyEvents,
  });
}

export async function loadSettingsDataSnapshotOrFallback(
  supabase: SupabaseClient,
  userId: string,
): Promise<SettingsDataSnapshot> {
  try {
    return await loadSettingsDataSnapshot(supabase, userId);
  } catch (error) {
    logger.warn("settings data snapshot load failed, using fallback", {
      error,
      userId,
    });
    return createEmptySettingsDataSnapshot();
  }
}

export async function buildUserDataExportBundle(
  supabase: SupabaseClient,
  {
    userEmail,
    userId,
  }: {
    userEmail: string | null;
    userId: string;
  },
) {
  const [
    profileResult,
    onboardingResult,
    goalsResult,
    nutritionGoalsResult,
    exerciseLibraryResult,
    workoutTemplatesResult,
    weeklyProgramsResult,
    workoutDaysResult,
    workoutSetsResult,
    foodsResult,
    mealsResult,
    mealTemplatesResult,
    recipesResult,
    recipeItemsResult,
    bodyMetricsResult,
    aiChatSessionsResult,
    aiChatMessagesResult,
    memoryFactsResult,
    contextSnapshotsResult,
    exportJobsResult,
    deletionRequestsResult,
    subscriptionsResult,
    entitlementsResult,
    usageCountersResult,
    adminStateResult,
    platformAdminsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("onboarding_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("nutrition_goals")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("exercise_library")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("workout_templates")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("weekly_programs")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("workout_days")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("workout_sets")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("foods")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false }),
    supabase
      .from("meal_templates")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("recipes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("recipe_items")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("body_metrics")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_memory_facts")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("user_context_snapshots")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("export_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("deletion_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("entitlements")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("usage_counters")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("user_admin_states")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("platform_admins")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const failedResult = [
    profileResult,
    onboardingResult,
    goalsResult,
    nutritionGoalsResult,
    exerciseLibraryResult,
    workoutTemplatesResult,
    weeklyProgramsResult,
    workoutDaysResult,
    workoutSetsResult,
    foodsResult,
    mealsResult,
    mealTemplatesResult,
    recipesResult,
    recipeItemsResult,
    bodyMetricsResult,
    aiChatSessionsResult,
    aiChatMessagesResult,
    memoryFactsResult,
    contextSnapshotsResult,
    exportJobsResult,
    deletionRequestsResult,
    subscriptionsResult,
    entitlementsResult,
    usageCountersResult,
    adminStateResult,
    platformAdminsResult,
  ].find((result) => result.error);

  if (failedResult?.error) {
    throw failedResult.error;
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    user: {
      adminState: adminStateResult.data ?? null,
      email: userEmail,
      id: userId,
      onboarding: onboardingResult.data ?? null,
      platformAdmin: platformAdminsResult.data ?? null,
      profile: profileResult.data ?? null,
    },
    goals: {
      history: goalsResult.data ?? [],
      nutrition: nutritionGoalsResult.data ?? [],
      primary: goalsResult.data?.[0] ?? null,
    },
    workouts: {
      exerciseLibrary: exerciseLibraryResult.data ?? [],
      weeklyPrograms: weeklyProgramsResult.data ?? [],
      workoutDays: workoutDaysResult.data ?? [],
      workoutSets: workoutSetsResult.data ?? [],
      workoutTemplates: workoutTemplatesResult.data ?? [],
    },
    nutrition: {
      bodyMetrics: bodyMetricsResult.data ?? [],
      foods: foodsResult.data ?? [],
      mealTemplates: mealTemplatesResult.data ?? [],
      meals: mealsResult.data ?? [],
      recipeItems: recipeItemsResult.data ?? [],
      recipes: recipesResult.data ?? [],
    },
    ai: {
      chatMessages: aiChatMessagesResult.data ?? [],
      chatSessions: aiChatSessionsResult.data ?? [],
      contextSnapshots: contextSnapshotsResult.data ?? [],
      memoryFacts: memoryFactsResult.data ?? [],
    },
    billing: {
      entitlements: entitlementsResult.data ?? [],
      subscriptions: subscriptionsResult.data ?? [],
      usageCounters: usageCountersResult.data ?? [],
    },
    privacy: {
      deletionRequests: deletionRequestsResult.data ?? [],
      exportJobs: exportJobsResult.data ?? [],
    },
    summary: {
      aiChatMessages: aiChatMessagesResult.data?.length ?? 0,
      aiChatSessions: aiChatSessionsResult.data?.length ?? 0,
      bodyMetrics: bodyMetricsResult.data?.length ?? 0,
      entitlements: entitlementsResult.data?.length ?? 0,
      exportJobs: exportJobsResult.data?.length ?? 0,
      foods: foodsResult.data?.length ?? 0,
      goals: goalsResult.data?.length ?? 0,
      mealTemplates: mealTemplatesResult.data?.length ?? 0,
      meals: mealsResult.data?.length ?? 0,
      nutritionGoals: nutritionGoalsResult.data?.length ?? 0,
      recipes: recipesResult.data?.length ?? 0,
      subscriptions: subscriptionsResult.data?.length ?? 0,
      usageCounters: usageCountersResult.data?.length ?? 0,
      weeklyPrograms: weeklyProgramsResult.data?.length ?? 0,
      workoutDays: workoutDaysResult.data?.length ?? 0,
      workoutSets: workoutSetsResult.data?.length ?? 0,
      workoutTemplates: workoutTemplatesResult.data?.length ?? 0,
    },
  };
}

export type UserDataExportBundle = Awaited<
  ReturnType<typeof buildUserDataExportBundle>
>;
