import type { User } from "@supabase/supabase-js";

import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  DELETION_REQUEST_ACTIVE_STATUSES,
  DELETION_REQUEST_TERMINAL_STATUSES,
  EXPORT_JOB_ACTIVE_STATUSES,
  EXPORT_JOB_TERMINAL_STATUSES,
  SUPPORT_ACTION_PENDING_STATUSES,
  SUPPORT_ACTION_TERMINAL_STATUSES,
  getAvailableOperationActions,
  type AdminOperationKind,
} from "@/lib/admin-operations";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const PENDING_LIMIT = 24;
const RECENT_LIMIT = 12;
const AUTH_USERS_PAGE_SIZE = 100;

type AuthUserSummary = {
  email: string | null;
  full_name: string | null;
  id: string;
};

function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

async function listAllAuthUsers(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
) {
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

function mapAuthUsers(
  authUsers: User[],
  profiles: Array<{ full_name: string | null; user_id: string }>,
) {
  const profileNamesByUserId = new Map(
    profiles.map((profile) => [profile.user_id, profile.full_name]),
  );

  return new Map<string, AuthUserSummary>(
    authUsers.map((user) => [
      user.id,
      {
        email: user.email ?? null,
        full_name:
          profileNamesByUserId.get(user.id) ??
          ((user.user_metadata?.full_name as string | undefined) ?? null),
        id: user.id,
      },
    ]),
  );
}

function getUserRef(
  userId: string | null,
  authUsersById: Map<string, AuthUserSummary>,
) {
  if (!userId) {
    return null;
  }

  const authUser = authUsersById.get(userId);

  return {
    email: authUser?.email ?? null,
    full_name: authUser?.full_name ?? null,
    id: userId,
  };
}

function sortByActivity<T extends { created_at: string; updated_at?: string | null }>(
  values: T[],
) {
  return [...values].sort((left, right) => {
    const rightTimestamp = Math.max(
      toTimestamp(right.updated_at),
      toTimestamp(right.created_at),
    );
    const leftTimestamp = Math.max(
      toTimestamp(left.updated_at),
      toTimestamp(left.created_at),
    );

    return rightTimestamp - leftTimestamp;
  });
}

function createFallbackOperationsSnapshot() {
  return {
    inbox: [],
    recent: [],
    summary: {
      pending: {
        deletionRequests: 0,
        exportJobs: 0,
        supportActions: 0,
        total: 0,
      },
      recent: {
        canceled: 0,
        completed: 0,
        failed: 0,
      },
    },
  };
}

export async function GET() {
  try {
    await requireAdminRouteAccess("view_admin_dashboard");
    const adminSupabase = createAdminSupabaseClient();

    const [
      profilesResult,
      supportPendingResult,
      supportRecentResult,
      exportPendingResult,
      exportRecentResult,
      deletionPendingResult,
      deletionRecentResult,
      authUsers,
    ] = await Promise.all([
      adminSupabase.from("profiles").select("user_id, full_name"),
      adminSupabase
        .from("support_actions")
        .select(
          "id, action, status, created_at, updated_at, target_user_id, actor_user_id, payload",
        )
        .in("status", [...SUPPORT_ACTION_PENDING_STATUSES])
        .order("updated_at", { ascending: false })
        .limit(PENDING_LIMIT),
      adminSupabase
        .from("support_actions")
        .select(
          "id, action, status, created_at, updated_at, target_user_id, actor_user_id, payload",
        )
        .in("status", [...SUPPORT_ACTION_TERMINAL_STATUSES])
        .order("updated_at", { ascending: false })
        .limit(RECENT_LIMIT),
      adminSupabase
        .from("export_jobs")
        .select(
          "id, user_id, requested_by, format, status, created_at, updated_at",
        )
        .in("status", [...EXPORT_JOB_ACTIVE_STATUSES])
        .order("updated_at", { ascending: false })
        .limit(PENDING_LIMIT),
      adminSupabase
        .from("export_jobs")
        .select(
          "id, user_id, requested_by, format, status, created_at, updated_at",
        )
        .in("status", [...EXPORT_JOB_TERMINAL_STATUSES])
        .order("updated_at", { ascending: false })
        .limit(RECENT_LIMIT),
      adminSupabase
        .from("deletion_requests")
        .select(
          "id, user_id, requested_by, status, hold_until, created_at, updated_at",
        )
        .in("status", [...DELETION_REQUEST_ACTIVE_STATUSES])
        .order("updated_at", { ascending: false })
        .limit(PENDING_LIMIT),
      adminSupabase
        .from("deletion_requests")
        .select(
          "id, user_id, requested_by, status, hold_until, created_at, updated_at",
        )
        .in("status", [...DELETION_REQUEST_TERMINAL_STATUSES])
        .order("updated_at", { ascending: false })
        .limit(RECENT_LIMIT),
      listAllAuthUsers(adminSupabase),
    ]);

    const failedResult = [
      profilesResult,
      supportPendingResult,
      supportRecentResult,
      exportPendingResult,
      exportRecentResult,
      deletionPendingResult,
      deletionRecentResult,
    ].find((result) => result.error);

    if (failedResult?.error) {
      throw failedResult.error;
    }

    const authUsersById = mapAuthUsers(authUsers, profilesResult.data ?? []);

    const supportInbox = (supportPendingResult.data ?? []).map((item) => ({
      actor_user: getUserRef(item.actor_user_id, authUsersById),
      available_actions: getAvailableOperationActions(
        "support_action",
        item.status,
      ),
      created_at: item.created_at,
      detail: null,
      id: item.id,
      kind: "support_action" as AdminOperationKind,
      meta: {
        action: item.action,
      },
      status: item.status,
      target_user: getUserRef(item.target_user_id, authUsersById),
      title: item.action,
      updated_at: item.updated_at ?? item.created_at,
    }));

    const exportInbox = (exportPendingResult.data ?? []).map((item) => ({
      actor_user: getUserRef(item.requested_by, authUsersById),
      available_actions: getAvailableOperationActions("export_job", item.status),
      created_at: item.created_at,
      detail: item.format ?? null,
      id: item.id,
      kind: "export_job" as AdminOperationKind,
      meta: {
        format: item.format,
      },
      status: item.status,
      target_user: getUserRef(item.user_id, authUsersById),
      title: "user data export",
      updated_at: item.updated_at ?? item.created_at,
    }));

    const deletionInbox = (deletionPendingResult.data ?? []).map((item) => ({
      actor_user: getUserRef(item.requested_by, authUsersById),
      available_actions: getAvailableOperationActions(
        "deletion_request",
        item.status,
      ),
      created_at: item.created_at,
      detail: item.hold_until ?? null,
      id: item.id,
      kind: "deletion_request" as AdminOperationKind,
      meta: {
        hold_until: item.hold_until,
      },
      status: item.status,
      target_user: getUserRef(item.user_id, authUsersById),
      title: "deletion request",
      updated_at: item.updated_at ?? item.created_at,
    }));

    const recentItems = sortByActivity([
      ...(supportRecentResult.data ?? []).map((item) => ({
        actor_user: getUserRef(item.actor_user_id, authUsersById),
        available_actions: [],
        created_at: item.created_at,
        detail: null,
        id: item.id,
        kind: "support_action" as AdminOperationKind,
        meta: {
          action: item.action,
        },
        status: item.status,
        target_user: getUserRef(item.target_user_id, authUsersById),
        title: item.action,
        updated_at: item.updated_at ?? item.created_at,
      })),
      ...(exportRecentResult.data ?? []).map((item) => ({
        actor_user: getUserRef(item.requested_by, authUsersById),
        available_actions: [],
        created_at: item.created_at,
        detail: item.format ?? null,
        id: item.id,
        kind: "export_job" as AdminOperationKind,
        meta: {
          format: item.format,
        },
        status: item.status,
        target_user: getUserRef(item.user_id, authUsersById),
        title: "user data export",
        updated_at: item.updated_at ?? item.created_at,
      })),
      ...(deletionRecentResult.data ?? []).map((item) => ({
        actor_user: getUserRef(item.requested_by, authUsersById),
        available_actions: [],
        created_at: item.created_at,
        detail: item.hold_until ?? null,
        id: item.id,
        kind: "deletion_request" as AdminOperationKind,
        meta: {
          hold_until: item.hold_until,
        },
        status: item.status,
        target_user: getUserRef(item.user_id, authUsersById),
        title: "deletion request",
        updated_at: item.updated_at ?? item.created_at,
      })),
    ]).slice(0, RECENT_LIMIT);

    const inboxItems = sortByActivity([
      ...supportInbox,
      ...exportInbox,
      ...deletionInbox,
    ]).slice(0, PENDING_LIMIT);

    return Response.json({
      data: {
        inbox: inboxItems,
        recent: recentItems,
        summary: {
          pending: {
            deletionRequests: deletionInbox.length,
            exportJobs: exportInbox.length,
            supportActions: supportInbox.length,
            total: inboxItems.length,
          },
          recent: {
            canceled: recentItems.filter((item) => item.status === "canceled").length,
            completed: recentItems.filter((item) => item.status === "completed").length,
            failed: recentItems.filter((item) => item.status === "failed").length,
          },
        },
      },
    });
  } catch (error) {
    if (!isAdminAccessError(error)) {
      logger.warn("admin operations route degraded to fallback", { error });

      return Response.json({
        data: createFallbackOperationsSnapshot(),
        meta: {
          degraded: true,
        },
      });
    }

    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_OPERATIONS_FAILED",
      message: "Не удалось загрузить операционный inbox.",
    });
  }
}
