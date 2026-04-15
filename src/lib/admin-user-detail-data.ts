import type { User } from "@supabase/supabase-js";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AdminUserDetailSupabase = ReturnType<typeof createAdminSupabaseClient>;
type JsonRecord = Record<string, unknown> | null;
type UserReference = {
  email: string | null;
  full_name: string | null;
  id: string;
};

const OPERATION_AUDIT_ACTIONS = [
  "queue_export_job",
  "queue_deletion_request",
  "cancel_deletion_request",
  "queue_deletion_purge_action",
  "support_action_status_updated",
  "export_job_status_updated",
  "deletion_request_status_updated",
] as const;

function asJsonRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function isMissingUserAdminStatesError(error: { code?: string } | null | undefined) {
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST204" ||
    error?.code === "PGRST205"
  );
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

async function loadUserReferences(
  adminSupabase: AdminUserDetailSupabase,
  userIds: Array<string | null | undefined>,
) {
  const uniqueUserIds = [...new Set(userIds.filter((value): value is string => Boolean(value)))];

  if (!uniqueUserIds.length) {
    return new Map<string, UserReference>();
  }

  const [{ data: profiles, error: profilesError }, authUsers] = await Promise.all([
    adminSupabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", uniqueUserIds),
    Promise.all(
      uniqueUserIds.map(async (userId) => ({
        userId,
        result: await adminSupabase.auth.admin.getUserById(userId),
      })),
    ),
  ]);

  if (profilesError) {
    throw profilesError;
  }

  const profilesByUserId = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile]),
  );
  const references = new Map<string, UserReference>();

  for (const { userId, result } of authUsers) {
    const authUser = result.data.user;
    if (!authUser) {
      continue;
    }

    const profile = profilesByUserId.get(userId);
    references.set(userId, {
      email: authUser.email ?? null,
      full_name:
        profile?.full_name ??
        ((authUser.user_metadata?.full_name as string | undefined) ?? null),
      id: userId,
    });
  }

  return references;
}

function getUserReference(
  references: Map<string, UserReference>,
  userId: string | null | undefined,
) {
  return userId ? references.get(userId) ?? null : null;
}

export function createFallbackAdminUserDetailResponse(input: {
  authUser: User;
  currentAdminRole: string;
  userId: string;
}) {
  const authEmail = input.authUser.email ?? null;

  return {
    data: {
      id: input.userId,
      currentAdminRole: input.currentAdminRole,
      authUser: {
        created_at: input.authUser.created_at,
        email: authEmail,
        last_sign_in_at: input.authUser.last_sign_in_at ?? null,
      },
      profile: null,
      onboarding: null,
      latestGoal: null,
      adminRole: null,
      adminState: null,
      superAdminPolicy: {
        primaryEmail: null,
        targetCanBeSuperAdmin: true,
      },
      stats: {
        workout: {
          activeExercises: 0,
          activePrograms: 0,
          completedDays: 0,
          inProgressDays: 0,
          latestWorkoutAt: null,
          loggedSets: 0,
          programs: 0,
          templates: 0,
        },
        nutrition: {
          foods: 0,
          latestMealAt: null,
          mealItems: 0,
          meals: 0,
          recipes: 0,
          summaryDays: 0,
          templates: 0,
        },
        ai: {
          chatMessages: 0,
          chatSessions: 0,
          contextSnapshots: 0,
          knowledgeChunks: 0,
          latestAiAt: null,
          proposals: 0,
          safetyEvents: 0,
        },
        lifecycle: {
          bodyMetrics: 0,
          deletionRequest: null,
          deletionRequests: 0,
          entitlements: 0,
          exportJobs: 0,
          latestExportJob: null,
          latestProfileUpdateAt: null,
          latestSubscription: null,
          recentEntitlements: [],
          recentSubscriptionEvents: [],
      recentUsageCounters: [],
      subscriptions: 0,
      usageCounters: 0,
    },
  },
  recentSupportActions: [],
  recentExportJobs: [],
  recentExercises: [],
  recentFoods: [],
  recentOperationAuditLogs: [],
  recentAdminAuditLogs: [],
},
    meta: {
      degraded: true,
    },
  };
}

export async function loadAdminUserDetailData(params: {
  adminSupabase: AdminUserDetailSupabase;
  authUser: User;
  currentAdminRole: string;
  forceFallback?: boolean;
  userId: string;
}) {
  const { adminSupabase, authUser, currentAdminRole, forceFallback, userId } = params;
  const targetEmail = authUser.email ?? null;

  if (forceFallback) {
    throw new Error("TEST_FORCE_ADMIN_USER_DETAIL_FALLBACK");
  }

  const [
    profileResult,
    onboardingResult,
    goalResult,
    adminRoleResult,
    userAdminStateResult,
    activeExercisesCountResult,
    workoutTemplatesCountResult,
    programsCountResult,
    activeProgramsCountResult,
    completedWorkoutDaysCountResult,
    inProgressWorkoutDaysCountResult,
    loggedWorkoutSetsCountResult,
    foodsCountResult,
    mealsCountResult,
    mealItemsCountResult,
    recipesCountResult,
    mealTemplatesCountResult,
    nutritionDaysCountResult,
    bodyMetricsCountResult,
    aiChatSessionsCountResult,
    aiChatMessagesCountResult,
    aiPlanProposalsCountResult,
    aiSafetyEventsCountResult,
    userContextSnapshotsCountResult,
    knowledgeChunksCountResult,
    exportJobsCountResult,
    deletionRequestsCountResult,
    subscriptionsCountResult,
    entitlementsCountResult,
    usageCountersCountResult,
    latestExportJobResult,
    latestDeletionRequestResult,
    latestSubscriptionResult,
    recentEntitlementsResult,
    usageCountersResult,
    subscriptionEventsResult,
    latestWorkoutSetResult,
    latestMealResult,
    latestAiMessageResult,
    recentExercisesResult,
    recentFoodsResult,
    recentSupportActionsResult,
    recentExportJobsResult,
    operationAuditLogsResult,
    auditLogsResult,
  ] = await Promise.all([
    adminSupabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, created_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    adminSupabase
      .from("onboarding_profiles")
      .select(
        "age, sex, height_cm, weight_kg, fitness_level, equipment, injuries, dietary_preferences, created_at, updated_at",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    adminSupabase
      .from("goals")
      .select(
        "goal_type, target_weight_kg, weekly_training_days, created_at, updated_at",
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminSupabase
      .from("platform_admins")
      .select("role, created_at")
      .eq("user_id", userId)
      .maybeSingle(),
    adminSupabase
      .from("user_admin_states")
      .select("is_suspended, suspended_at, restored_at, state_reason, metadata")
      .eq("user_id", userId)
      .maybeSingle(),
    adminSupabase
      .from("exercise_library")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_archived", false),
    adminSupabase
      .from("workout_templates")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("weekly_programs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("weekly_programs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active"),
    adminSupabase
      .from("workout_days")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "done"),
    adminSupabase
      .from("workout_days")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "in_progress"),
    adminSupabase
      .from("workout_sets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("actual_reps", "is", null),
    adminSupabase.from("foods").select("*", { count: "exact", head: true }).eq("user_id", userId),
    adminSupabase.from("meals").select("*", { count: "exact", head: true }).eq("user_id", userId),
    adminSupabase
      .from("meal_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase.from("recipes").select("*", { count: "exact", head: true }).eq("user_id", userId),
    adminSupabase
      .from("meal_templates")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("daily_nutrition_summaries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("body_metrics")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("ai_chat_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("ai_chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("ai_plan_proposals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("ai_safety_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("user_context_snapshots")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("knowledge_chunks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("export_jobs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("deletion_requests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("entitlements")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("usage_counters")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    adminSupabase
      .from("export_jobs")
      .select(
        "id, requested_by, format, status, artifact_path, created_at, updated_at",
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminSupabase
      .from("deletion_requests")
      .select("id, requested_by, status, hold_until, created_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    adminSupabase
      .from("subscriptions")
      .select(
        "id, status, provider, provider_customer_id, provider_subscription_id, current_period_start, current_period_end, updated_at",
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminSupabase
      .from("entitlements")
      .select("id, feature_key, limit_value, is_enabled, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(8),
    adminSupabase
      .from("usage_counters")
      .select(
        "id, metric_key, metric_window, usage_count, reset_at, updated_at",
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(8),
    adminSupabase
      .from("subscription_events")
      .select("id, event_type, provider_event_id, payload, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
    adminSupabase
      .from("workout_sets")
      .select("updated_at")
      .eq("user_id", userId)
      .not("actual_reps", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminSupabase
      .from("meals")
      .select("updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminSupabase
      .from("ai_chat_messages")
      .select("updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminSupabase
      .from("exercise_library")
      .select("id, title, muscle_group, image_url, is_archived, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(6),
    adminSupabase
      .from("foods")
      .select("id, name, brand, source, image_url, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(6),
    adminSupabase
      .from("support_actions")
      .select("id, action, status, payload, actor_user_id, created_at, updated_at")
      .eq("target_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    adminSupabase
      .from("export_jobs")
      .select(
        "id, requested_by, format, status, artifact_path, created_at, updated_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
    adminSupabase
      .from("admin_audit_logs")
      .select("id, action, reason, payload, actor_user_id, created_at, updated_at")
      .eq("target_user_id", userId)
      .in("action", [...OPERATION_AUDIT_ACTIONS])
      .order("created_at", { ascending: false })
      .limit(12),
    adminSupabase
      .from("admin_audit_logs")
      .select("id, action, reason, payload, actor_user_id, created_at, updated_at")
      .eq("target_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const failedResult = [
    profileResult,
    onboardingResult,
    goalResult,
    adminRoleResult,
    ...(userAdminStateResult.error &&
    !isMissingUserAdminStatesError(userAdminStateResult.error)
      ? [userAdminStateResult]
      : []),
    activeExercisesCountResult,
    workoutTemplatesCountResult,
    programsCountResult,
    activeProgramsCountResult,
    completedWorkoutDaysCountResult,
    inProgressWorkoutDaysCountResult,
    loggedWorkoutSetsCountResult,
    foodsCountResult,
    mealsCountResult,
    mealItemsCountResult,
    recipesCountResult,
    mealTemplatesCountResult,
    nutritionDaysCountResult,
    bodyMetricsCountResult,
    aiChatSessionsCountResult,
    aiChatMessagesCountResult,
    aiPlanProposalsCountResult,
    aiSafetyEventsCountResult,
    userContextSnapshotsCountResult,
    knowledgeChunksCountResult,
    exportJobsCountResult,
    deletionRequestsCountResult,
    subscriptionsCountResult,
    entitlementsCountResult,
    usageCountersCountResult,
    latestExportJobResult,
    latestDeletionRequestResult,
    latestSubscriptionResult,
    recentEntitlementsResult,
    usageCountersResult,
    subscriptionEventsResult,
    latestWorkoutSetResult,
    latestMealResult,
    latestAiMessageResult,
    recentExercisesResult,
    recentFoodsResult,
    recentSupportActionsResult,
    recentExportJobsResult,
    operationAuditLogsResult,
    auditLogsResult,
  ].find((result) => result.error);

  if (failedResult?.error) {
    throw failedResult.error;
  }

  const actorUserIds = new Set<string>();

  const pushActorId = (value: string | null | undefined) => {
    if (value) {
      actorUserIds.add(value);
    }
  };

  pushActorId(latestExportJobResult.data?.requested_by ?? null);
  pushActorId(latestDeletionRequestResult.data?.requested_by ?? null);

  for (const action of recentSupportActionsResult.data ?? []) {
    pushActorId(action.actor_user_id ?? null);
    pushActorId(readString(asJsonRecord(action.payload)?.resolvedBy));
  }

  for (const exportJob of recentExportJobsResult.data ?? []) {
    pushActorId(exportJob.requested_by ?? null);
  }

  for (const event of subscriptionEventsResult.data ?? []) {
    pushActorId(readString(asJsonRecord(event.payload)?.actorUserId));
  }

  for (const entry of operationAuditLogsResult.data ?? []) {
    pushActorId(entry.actor_user_id ?? null);
  }

  for (const entry of auditLogsResult.data ?? []) {
    pushActorId(entry.actor_user_id ?? null);
  }

  const userReferences = await loadUserReferences(
    adminSupabase,
    Array.from(actorUserIds),
  );

  return {
    data: {
      id: userId,
      currentAdminRole,
      authUser: {
        created_at: authUser.created_at,
        email: targetEmail,
        last_sign_in_at: authUser.last_sign_in_at ?? null,
      },
      profile: profileResult.data,
      onboarding: onboardingResult.data,
      latestGoal: goalResult.data,
      adminRole: adminRoleResult.data,
      adminState: userAdminStateResult.error ? null : userAdminStateResult.data,
      superAdminPolicy: {
        primaryEmail: null,
        targetCanBeSuperAdmin: true,
      },
      stats: {
        workout: {
          activeExercises: activeExercisesCountResult.count ?? 0,
          activePrograms: activeProgramsCountResult.count ?? 0,
          completedDays: completedWorkoutDaysCountResult.count ?? 0,
          inProgressDays: inProgressWorkoutDaysCountResult.count ?? 0,
          latestWorkoutAt: latestWorkoutSetResult.data?.updated_at ?? null,
          loggedSets: loggedWorkoutSetsCountResult.count ?? 0,
          programs: programsCountResult.count ?? 0,
          templates: workoutTemplatesCountResult.count ?? 0,
        },
        nutrition: {
          foods: foodsCountResult.count ?? 0,
          latestMealAt: latestMealResult.data?.updated_at ?? null,
          mealItems: mealItemsCountResult.count ?? 0,
          meals: mealsCountResult.count ?? 0,
          recipes: recipesCountResult.count ?? 0,
          summaryDays: nutritionDaysCountResult.count ?? 0,
          templates: mealTemplatesCountResult.count ?? 0,
        },
        ai: {
          chatMessages: aiChatMessagesCountResult.count ?? 0,
          chatSessions: aiChatSessionsCountResult.count ?? 0,
          contextSnapshots: userContextSnapshotsCountResult.count ?? 0,
          knowledgeChunks: knowledgeChunksCountResult.count ?? 0,
          latestAiAt: latestAiMessageResult.data?.updated_at ?? null,
          proposals: aiPlanProposalsCountResult.count ?? 0,
          safetyEvents: aiSafetyEventsCountResult.count ?? 0,
        },
        lifecycle: {
          bodyMetrics: bodyMetricsCountResult.count ?? 0,
          deletionRequest: latestDeletionRequestResult.data
            ? {
                ...latestDeletionRequestResult.data,
                requested_by_user: getUserReference(
                  userReferences,
                  latestDeletionRequestResult.data.requested_by,
                ),
              }
            : null,
          deletionRequests: deletionRequestsCountResult.count ?? 0,
          entitlements: entitlementsCountResult.count ?? 0,
          exportJobs: exportJobsCountResult.count ?? 0,
          latestExportJob: latestExportJobResult.data
            ? {
                ...latestExportJobResult.data,
                requested_by_user: getUserReference(
                  userReferences,
                  latestExportJobResult.data.requested_by,
                ),
              }
            : null,
          latestProfileUpdateAt: profileResult.data?.updated_at ?? null,
          latestSubscription: latestSubscriptionResult.data ?? null,
          recentEntitlements: recentEntitlementsResult.data ?? [],
          recentSubscriptionEvents: (subscriptionEventsResult.data ?? []).map(
            (event) => {
              const payload = asJsonRecord(event.payload);
              const actorUserId = readString(payload?.actorUserId);

              return {
                ...event,
                actor_user: getUserReference(userReferences, actorUserId),
                actor_user_id: actorUserId,
                payload,
              };
            },
          ),
          recentUsageCounters: usageCountersResult.data ?? [],
          subscriptions: subscriptionsCountResult.count ?? 0,
          usageCounters: usageCountersCountResult.count ?? 0,
        },
      },
      recentSupportActions: (recentSupportActionsResult.data ?? []).map((action) => {
        const payload = asJsonRecord(action.payload);
        const resolvedBy = readString(payload?.resolvedBy);

        return {
          ...action,
          actor_user: getUserReference(userReferences, action.actor_user_id),
          payload,
          resolved_by_user: getUserReference(userReferences, resolvedBy),
        };
      }),
      recentExportJobs: (recentExportJobsResult.data ?? []).map((exportJob) => ({
        ...exportJob,
        requested_by_user: getUserReference(
          userReferences,
          exportJob.requested_by,
        ),
      })),
      recentExercises: recentExercisesResult.data ?? [],
      recentFoods: recentFoodsResult.data ?? [],
      recentOperationAuditLogs: (operationAuditLogsResult.data ?? []).map((entry) => ({
        ...entry,
        actor_user: getUserReference(userReferences, entry.actor_user_id),
        payload: asJsonRecord(entry.payload),
      })),
      recentAdminAuditLogs: (auditLogsResult.data ?? []).map((entry) => ({
        ...entry,
        actor_user: getUserReference(userReferences, entry.actor_user_id),
        payload: asJsonRecord(entry.payload),
      })),
    },
  };
}
