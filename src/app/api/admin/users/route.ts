import type { User } from "@supabase/supabase-js";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import { isPrimarySuperAdminEmail } from "@/lib/admin-permissions";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AdminRoleFilter = "all" | "super_admin" | "support_admin" | "analyst" | "user";
type ActivityFilter =
  | "all"
  | "active_7d"
  | "idle_30d"
  | "never_signed_in"
  | "backlog"
  | "paid";
type AdminUsersSortKey =
  | "created_desc"
  | "activity_desc"
  | "sign_in_desc"
  | "workout_desc"
  | "ai_desc"
  | "backlog_desc";
type ActivityBucket = "today" | "seven_days" | "thirty_days" | "stale" | "never";
type ActivitySource = "workout" | "nutrition" | "ai" | "auth" | "profile" | null;
type RecentBulkWave = {
  action: string;
  actor_user_id: string | null;
  created_at: string;
  id: string;
  payload: {
    action?: string;
    batchId?: string;
    failed?: number;
    processed?: number;
    succeeded?: number;
    userIds?: string[];
  } | null;
  reason: string | null;
};

const AUTH_USERS_PAGE_SIZE = 100;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const TERMINAL_OPERATION_STATUSES = new Set([
  "canceled",
  "cancelled",
  "completed",
  "done",
  "failed",
  "resolved",
  "restored",
]);
const ACTIVE_EXPORT_STATUSES = new Set(["queued", "processing", "running", "requested"]);
const ACTIVE_DELETION_STATUSES = new Set([
  "queued",
  "holding",
  "requested",
  "processing",
]);
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trial"]);

function parseRoleFilter(value: string | null): AdminRoleFilter {
  switch (value) {
    case "super_admin":
    case "support_admin":
    case "analyst":
    case "user":
      return value;
    default:
      return "all";
  }
}

function parseActivityFilter(value: string | null): ActivityFilter {
  switch (value) {
    case "active_7d":
    case "idle_30d":
    case "never_signed_in":
    case "backlog":
    case "paid":
      return value;
    default:
      return "all";
  }
}

function parseSortKey(value: string | null): AdminUsersSortKey {
  switch (value) {
    case "activity_desc":
    case "sign_in_desc":
    case "workout_desc":
    case "ai_desc":
    case "backlog_desc":
      return value;
    default:
      return "created_desc";
  }
}

function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getLatestDate(
  values: Array<string | null | undefined>,
): string | null {
  let latest: string | null = null;
  let latestTimestamp = 0;

  for (const value of values) {
    const timestamp = toTimestamp(value);
    if (timestamp > latestTimestamp) {
      latest = value ?? null;
      latestTimestamp = timestamp;
    }
  }

  return latest;
}

function getLatestActivity(
  entries: Array<{ source: Exclude<ActivitySource, null>; value: string | null | undefined }>,
) {
  let latestValue: string | null = null;
  let latestSource: ActivitySource = null;
  let latestTimestamp = 0;

  for (const entry of entries) {
    const timestamp = toTimestamp(entry.value);
    if (timestamp > latestTimestamp) {
      latestValue = entry.value ?? null;
      latestSource = entry.source;
      latestTimestamp = timestamp;
    }
  }

  return {
    value: latestValue,
    source: latestSource,
  };
}

function getActivityBucket(
  activityAt: string | null,
  lastSignInAt: string | null,
): ActivityBucket {
  const anchor = activityAt ?? lastSignInAt;

  if (!anchor) {
    return "never";
  }

  const age = Date.now() - toTimestamp(anchor);

  if (age <= DAY_IN_MS) {
    return "today";
  }

  if (age <= DAY_IN_MS * 7) {
    return "seven_days";
  }

  if (age <= DAY_IN_MS * 30) {
    return "thirty_days";
  }

  return "stale";
}

function isPendingOperationalStatus(status: string | null | undefined) {
  if (!status) {
    return false;
  }

  return !TERMINAL_OPERATION_STATUSES.has(status.toLowerCase());
}

function isActiveExportStatus(status: string | null | undefined) {
  return status ? ACTIVE_EXPORT_STATUSES.has(status.toLowerCase()) : false;
}

function isActiveDeletionStatus(status: string | null | undefined) {
  return status ? ACTIVE_DELETION_STATUSES.has(status.toLowerCase()) : false;
}

function isActiveSubscriptionStatus(status: string | null | undefined) {
  return status ? ACTIVE_SUBSCRIPTION_STATUSES.has(status.toLowerCase()) : false;
}

async function listAllAuthUsers(adminSupabase: ReturnType<typeof createAdminSupabaseClient>) {
  const users: User[] = [];
  let page = 1;

  while (true) {
    const result = await adminSupabase.auth.admin.listUsers({
      page,
      perPage: AUTH_USERS_PAGE_SIZE,
    });

    if (result.error) {
      throw result.error;
    }

    const batch = result.data.users ?? [];
    users.push(...batch);

    if (batch.length < AUTH_USERS_PAGE_SIZE) {
      return users;
    }

    page += 1;
  }
}

function matchesActivityFilter(
  user: {
    activity: { bucket: ActivityBucket };
    billing: { is_active: boolean };
    flags: { never_signed_in: boolean };
    operations: { has_backlog: boolean };
  },
  activityFilter: ActivityFilter,
) {
  switch (activityFilter) {
    case "active_7d":
      return (
        user.activity.bucket === "today" || user.activity.bucket === "seven_days"
      );
    case "idle_30d":
      return user.activity.bucket === "stale";
    case "never_signed_in":
      return user.flags.never_signed_in;
    case "backlog":
      return user.operations.has_backlog;
    case "paid":
      return user.billing.is_active;
    default:
      return true;
  }
}

function sortUsers<
  T extends {
    ai: { messages: number };
    activity: { last_activity_at: string | null };
    billing: { is_active: boolean; current_period_end: string | null };
    created_at: string;
    last_sign_in_at: string | null;
    operations: { has_backlog: boolean; pending_support_actions: number };
    workout: { completed_days: number; logged_sets: number };
  },
>(users: T[], sortKey: AdminUsersSortKey) {
  return [...users].sort((left, right) => {
    switch (sortKey) {
      case "activity_desc":
        return (
          toTimestamp(right.activity.last_activity_at ?? right.last_sign_in_at) -
          toTimestamp(left.activity.last_activity_at ?? left.last_sign_in_at)
        );
      case "sign_in_desc":
        return toTimestamp(right.last_sign_in_at) - toTimestamp(left.last_sign_in_at);
      case "workout_desc": {
        const rightScore = right.workout.logged_sets * 10 + right.workout.completed_days;
        const leftScore = left.workout.logged_sets * 10 + left.workout.completed_days;
        return rightScore - leftScore;
      }
      case "ai_desc":
        return right.ai.messages - left.ai.messages;
      case "backlog_desc": {
        const rightScore =
          Number(right.operations.has_backlog) * 1000 +
          right.operations.pending_support_actions * 10 +
          Number(right.billing.is_active);
        const leftScore =
          Number(left.operations.has_backlog) * 1000 +
          left.operations.pending_support_actions * 10 +
          Number(left.billing.is_active);

        if (rightScore !== leftScore) {
          return rightScore - leftScore;
        }

        return (
          toTimestamp(right.billing.current_period_end) -
          toTimestamp(left.billing.current_period_end)
        );
      }
      case "created_desc":
      default:
        return toTimestamp(right.created_at) - toTimestamp(left.created_at);
    }
  });
}

function getDisplayName(user: {
  full_name: string | null;
  email: string | null;
  user_id: string;
}) {
  return user.full_name ?? user.email ?? user.user_id;
}

export async function GET(request: Request) {
  try {
    await requireAdminRouteAccess("view_admin_users");
    const adminSupabase = createAdminSupabaseClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const roleFilter = parseRoleFilter(searchParams.get("role")?.trim() ?? "all");
    const activityFilter = parseActivityFilter(
      searchParams.get("activity")?.trim() ?? "all",
    );
    const sortKey = parseSortKey(searchParams.get("sort")?.trim() ?? "created_desc");

    const [
      { data: profiles, error: profilesError },
      { data: admins, error: adminsError },
      { data: workoutDays, error: workoutDaysError },
      { data: weeklyPrograms, error: weeklyProgramsError },
      { data: workoutSets, error: workoutSetsError },
      { data: meals, error: mealsError },
      { data: aiMessages, error: aiMessagesError },
      { data: supportActions, error: supportActionsError },
      { data: exportJobs, error: exportJobsError },
      { data: deletionRequests, error: deletionRequestsError },
      { data: subscriptions, error: subscriptionsError },
      { data: bulkWaveAuditLogs, error: bulkWaveAuditLogsError },
      authUsers,
    ] = await Promise.all([
      adminSupabase
        .from("profiles")
        .select("user_id, full_name, created_at, updated_at"),
      adminSupabase
        .from("platform_admins")
        .select("user_id, role, created_at, updated_at"),
      adminSupabase
        .from("workout_days")
        .select("user_id, status, updated_at"),
      adminSupabase
        .from("weekly_programs")
        .select("user_id, status, updated_at"),
      adminSupabase
        .from("workout_sets")
        .select("user_id, updated_at")
        .not("actual_reps", "is", null),
      adminSupabase
        .from("meals")
        .select("user_id, updated_at"),
      adminSupabase
        .from("ai_chat_messages")
        .select("user_id, updated_at"),
      adminSupabase
        .from("support_actions")
        .select("target_user_id, status, created_at"),
      adminSupabase
        .from("export_jobs")
        .select("user_id, status, updated_at"),
      adminSupabase
        .from("deletion_requests")
        .select("user_id, status, hold_until, updated_at"),
      adminSupabase
        .from("subscriptions")
        .select("user_id, status, provider, current_period_end, updated_at"),
      adminSupabase
        .from("admin_audit_logs")
        .select("id, actor_user_id, action, reason, payload, created_at")
        .eq("action", "bulk_wave_completed")
        .order("created_at", { ascending: false })
        .limit(8),
      listAllAuthUsers(adminSupabase),
    ]);

    const failedResult = [
      profilesError,
      adminsError,
      workoutDaysError,
      weeklyProgramsError,
      workoutSetsError,
      mealsError,
      aiMessagesError,
      supportActionsError,
      exportJobsError,
      deletionRequestsError,
      subscriptionsError,
      bulkWaveAuditLogsError,
    ].find(Boolean);

    if (failedResult) {
      throw failedResult;
    }

    const profilesByUserId = new Map(
      (profiles ?? []).map((profile) => [profile.user_id, profile]),
    );
    const adminsByUserId = new Map(
      (admins ?? []).map((admin) => [admin.user_id, admin]),
    );
    const aggregatesByUserId = new Map<
      string,
      {
        workout: {
          activePrograms: number;
          completedDays: number;
          inProgressDays: number;
          loggedSets: number;
          lastWorkoutAt: string | null;
        };
        nutrition: {
          meals: number;
          lastMealAt: string | null;
        };
        ai: {
          messages: number;
          lastAiAt: string | null;
        };
        operations: {
          pendingSupportActions: number;
          latestExportStatus: string | null;
          latestExportUpdatedAt: string | null;
          latestDeletionStatus: string | null;
          latestDeletionHoldUntil: string | null;
          latestDeletionUpdatedAt: string | null;
        };
        billing: {
          latestStatus: string | null;
          latestProvider: string | null;
          currentPeriodEnd: string | null;
          updatedAt: string | null;
        };
      }
    >();

    function ensureAggregate(userId: string) {
      const existing = aggregatesByUserId.get(userId);
      if (existing) {
        return existing;
      }

      const nextValue = {
        workout: {
          activePrograms: 0,
          completedDays: 0,
          inProgressDays: 0,
          loggedSets: 0,
          lastWorkoutAt: null,
        },
        nutrition: {
          meals: 0,
          lastMealAt: null,
        },
        ai: {
          messages: 0,
          lastAiAt: null,
        },
        operations: {
          pendingSupportActions: 0,
          latestExportStatus: null,
          latestExportUpdatedAt: null,
          latestDeletionStatus: null,
          latestDeletionHoldUntil: null,
          latestDeletionUpdatedAt: null,
        },
        billing: {
          latestStatus: null,
          latestProvider: null,
          currentPeriodEnd: null,
          updatedAt: null,
        },
      };

      aggregatesByUserId.set(userId, nextValue);
      return nextValue;
    }

    for (const row of workoutDays ?? []) {
      const aggregate = ensureAggregate(row.user_id);

      if (row.status === "done") {
        aggregate.workout.completedDays += 1;
      }

      if (row.status === "in_progress") {
        aggregate.workout.inProgressDays += 1;
      }

      aggregate.workout.lastWorkoutAt = getLatestDate([
        aggregate.workout.lastWorkoutAt,
        row.updated_at,
      ]);
    }

    for (const row of weeklyPrograms ?? []) {
      if (row.status === "active") {
        ensureAggregate(row.user_id).workout.activePrograms += 1;
      }
    }

    for (const row of workoutSets ?? []) {
      const aggregate = ensureAggregate(row.user_id);
      aggregate.workout.loggedSets += 1;
      aggregate.workout.lastWorkoutAt = getLatestDate([
        aggregate.workout.lastWorkoutAt,
        row.updated_at,
      ]);
    }

    for (const row of meals ?? []) {
      const aggregate = ensureAggregate(row.user_id);
      aggregate.nutrition.meals += 1;
      aggregate.nutrition.lastMealAt = getLatestDate([
        aggregate.nutrition.lastMealAt,
        row.updated_at,
      ]);
    }

    for (const row of aiMessages ?? []) {
      const aggregate = ensureAggregate(row.user_id);
      aggregate.ai.messages += 1;
      aggregate.ai.lastAiAt = getLatestDate([aggregate.ai.lastAiAt, row.updated_at]);
    }

    for (const row of supportActions ?? []) {
      if (!row.target_user_id) {
        continue;
      }

      if (isPendingOperationalStatus(row.status)) {
        ensureAggregate(row.target_user_id).operations.pendingSupportActions += 1;
      }
    }

    for (const row of exportJobs ?? []) {
      const aggregate = ensureAggregate(row.user_id);
      if (
        toTimestamp(row.updated_at) >=
        toTimestamp(aggregate.operations.latestExportUpdatedAt)
      ) {
        aggregate.operations.latestExportStatus = row.status;
        aggregate.operations.latestExportUpdatedAt = row.updated_at;
      }
    }

    for (const row of deletionRequests ?? []) {
      const aggregate = ensureAggregate(row.user_id);
      if (
        toTimestamp(row.updated_at) >=
        toTimestamp(aggregate.operations.latestDeletionUpdatedAt)
      ) {
        aggregate.operations.latestDeletionStatus = row.status;
        aggregate.operations.latestDeletionHoldUntil = row.hold_until;
        aggregate.operations.latestDeletionUpdatedAt = row.updated_at;
      }
    }

    for (const row of subscriptions ?? []) {
      const aggregate = ensureAggregate(row.user_id);
      if (toTimestamp(row.updated_at) >= toTimestamp(aggregate.billing.updatedAt)) {
        aggregate.billing.latestStatus = row.status;
        aggregate.billing.latestProvider = row.provider;
        aggregate.billing.currentPeriodEnd = row.current_period_end;
        aggregate.billing.updatedAt = row.updated_at;
      }
    }

    const mergedUsers = authUsers.map((authUser) => {
      const profile = profilesByUserId.get(authUser.id);
      const admin = adminsByUserId.get(authUser.id);
      const aggregate = aggregatesByUserId.get(authUser.id);
      const latestActivity = getLatestActivity([
        {
          source: "workout",
          value: aggregate?.workout.lastWorkoutAt ?? null,
        },
        {
          source: "nutrition",
          value: aggregate?.nutrition.lastMealAt ?? null,
        },
        {
          source: "ai",
          value: aggregate?.ai.lastAiAt ?? null,
        },
        {
          source: "auth",
          value: authUser.last_sign_in_at ?? null,
        },
        {
          source: "profile",
          value: profile?.updated_at ?? profile?.created_at ?? null,
        },
      ]);
      const exportStatus = aggregate?.operations.latestExportStatus ?? null;
      const deletionStatus = aggregate?.operations.latestDeletionStatus ?? null;
      const hasBacklog =
        (aggregate?.operations.pendingSupportActions ?? 0) > 0 ||
        isActiveExportStatus(exportStatus) ||
        isActiveDeletionStatus(deletionStatus);

      return {
        user_id: authUser.id,
        email: authUser.email ?? null,
        full_name:
          profile?.full_name ??
          ((authUser.user_metadata?.full_name as string | undefined) ?? null),
        created_at: profile?.created_at ?? authUser.created_at,
        updated_at: profile?.updated_at ?? authUser.updated_at ?? authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at ?? null,
        admin_role: admin?.role ?? null,
        activity: {
          bucket: getActivityBucket(
            latestActivity.value,
            authUser.last_sign_in_at ?? null,
          ),
          last_activity_at: latestActivity.value,
          source: latestActivity.source,
        },
        workout: {
          active_programs: aggregate?.workout.activePrograms ?? 0,
          completed_days: aggregate?.workout.completedDays ?? 0,
          in_progress_days: aggregate?.workout.inProgressDays ?? 0,
          logged_sets: aggregate?.workout.loggedSets ?? 0,
          last_workout_at: aggregate?.workout.lastWorkoutAt ?? null,
        },
        nutrition: {
          meals: aggregate?.nutrition.meals ?? 0,
          last_meal_at: aggregate?.nutrition.lastMealAt ?? null,
        },
        ai: {
          messages: aggregate?.ai.messages ?? 0,
          last_ai_at: aggregate?.ai.lastAiAt ?? null,
        },
        operations: {
          pending_support_actions: aggregate?.operations.pendingSupportActions ?? 0,
          export_status: exportStatus,
          export_updated_at: aggregate?.operations.latestExportUpdatedAt ?? null,
          deletion_status: deletionStatus,
          deletion_hold_until:
            aggregate?.operations.latestDeletionHoldUntil ?? null,
          deletion_updated_at:
            aggregate?.operations.latestDeletionUpdatedAt ?? null,
          has_backlog: hasBacklog,
        },
        billing: {
          subscription_status: aggregate?.billing.latestStatus ?? null,
          subscription_provider: aggregate?.billing.latestProvider ?? null,
          current_period_end: aggregate?.billing.currentPeriodEnd ?? null,
          is_active: isActiveSubscriptionStatus(aggregate?.billing.latestStatus),
        },
        flags: {
          has_profile: Boolean(profile),
          never_signed_in: !authUser.last_sign_in_at,
          is_primary_super_admin: isPrimarySuperAdminEmail(authUser.email ?? null),
        },
      };
    });

    const filteredUsers = sortUsers(
      mergedUsers
      .filter((user) => {
        if (roleFilter !== "all") {
          const effectiveRole = user.admin_role ?? "user";
          if (effectiveRole !== roleFilter) {
            return false;
          }
        }

        if (!query) {
          return matchesActivityFilter(user, activityFilter);
        }

        const haystack = [
          user.user_id,
          user.email ?? "",
          user.full_name ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query) && matchesActivityFilter(user, activityFilter);
      }),
      sortKey,
    );

    const summary = {
      totalUsers: mergedUsers.length,
      filteredUsers: filteredUsers.length,
      adminCounts: {
        superAdmins: mergedUsers.filter((user) => user.admin_role === "super_admin")
          .length,
        supportAdmins: mergedUsers.filter(
          (user) => user.admin_role === "support_admin",
        ).length,
        analysts: mergedUsers.filter((user) => user.admin_role === "analyst").length,
      },
      activityBuckets: {
        today: mergedUsers.filter((user) => user.activity.bucket === "today").length,
        sevenDays: mergedUsers.filter((user) => user.activity.bucket === "seven_days")
          .length,
        thirtyDays: mergedUsers.filter(
          (user) => user.activity.bucket === "thirty_days",
        ).length,
        stale: mergedUsers.filter((user) => user.activity.bucket === "stale").length,
        never: mergedUsers.filter((user) => user.activity.bucket === "never").length,
      },
      operations: {
        usersWithBacklog: mergedUsers.filter((user) => user.operations.has_backlog)
          .length,
        pendingSupportActions: mergedUsers.reduce(
          (sum, user) => sum + user.operations.pending_support_actions,
          0,
        ),
        queuedExports: mergedUsers.filter((user) =>
          isActiveExportStatus(user.operations.export_status),
        ).length,
        activeDeletionHolds: mergedUsers.filter((user) =>
          isActiveDeletionStatus(user.operations.deletion_status),
        ).length,
      },
      billing: {
        activeSubscriptions: mergedUsers.filter((user) => user.billing.is_active)
          .length,
        paidButStale: mergedUsers.filter(
          (user) =>
            user.billing.is_active &&
            (user.activity.bucket === "stale" || user.activity.bucket === "never"),
        ).length,
      },
      hygiene: {
        neverSignedIn: mergedUsers.filter((user) => user.flags.never_signed_in).length,
        withoutProfile: mergedUsers.filter((user) => !user.flags.has_profile).length,
        rootPolicyViolations: mergedUsers.filter(
          (user) =>
            user.admin_role === "super_admin" && !user.flags.is_primary_super_admin,
        ).length,
      },
    };

    const segments = {
      priorityQueue: sortUsers(
        mergedUsers.filter((user) => user.operations.has_backlog),
        "backlog_desc",
      )
        .slice(0, 5)
        .map((user) => ({
          user_id: user.user_id,
          display_name: getDisplayName(user),
          email: user.email,
          admin_role: user.admin_role ?? "user",
          activity_bucket: user.activity.bucket,
          pending_support_actions: user.operations.pending_support_actions,
          export_status: user.operations.export_status,
          deletion_status: user.operations.deletion_status,
          subscription_status: user.billing.subscription_status,
        })),
      inactivePaid: sortUsers(
        mergedUsers.filter(
          (user) =>
            user.billing.is_active &&
            (user.activity.bucket === "stale" || user.activity.bucket === "never"),
        ),
        "activity_desc",
      )
        .reverse()
        .slice(0, 5)
        .map((user) => ({
          user_id: user.user_id,
          display_name: getDisplayName(user),
          email: user.email,
          activity_bucket: user.activity.bucket,
          last_activity_at: user.activity.last_activity_at,
          subscription_status: user.billing.subscription_status,
          current_period_end: user.billing.current_period_end,
        })),
      newestUsers: sortUsers(mergedUsers, "created_desc")
        .slice(0, 5)
        .map((user) => ({
          user_id: user.user_id,
          display_name: getDisplayName(user),
          email: user.email,
          created_at: user.created_at,
          never_signed_in: user.flags.never_signed_in,
          has_profile: user.flags.has_profile,
        })),
      topWorkoutUsers: sortUsers(mergedUsers, "workout_desc")
        .slice(0, 5)
        .map((user) => ({
          user_id: user.user_id,
          display_name: getDisplayName(user),
          email: user.email,
          logged_sets: user.workout.logged_sets,
          completed_days: user.workout.completed_days,
          active_programs: user.workout.active_programs,
        })),
    };

    return Response.json({
      data: filteredUsers,
      total: filteredUsers.length,
      filters: {
        activity: activityFilter,
        role: roleFilter,
        sort: sortKey,
      },
      recentBulkWaves: ((bulkWaveAuditLogs ?? []) as RecentBulkWave[]).map((entry) => ({
        action: entry.payload?.action ?? entry.action,
        actor_user_id: entry.actor_user_id,
        batch_id: entry.payload?.batchId ?? null,
        created_at: entry.created_at,
        failed: entry.payload?.failed ?? 0,
        id: entry.id,
        processed: entry.payload?.processed ?? 0,
        reason: entry.reason,
        succeeded: entry.payload?.succeeded ?? 0,
        user_count: entry.payload?.userIds?.length ?? 0,
      })),
      summary,
      segments,
    });
  } catch (error) {
    logger.error("admin users route failed", { error });

    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    return createApiErrorResponse({
      status: 401,
      code: "ADMIN_REQUIRED",
      message: "Admin access is required.",
    });
  }
}
