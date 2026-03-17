import { createApiErrorResponse } from "@/lib/api/error-response";
import { getAiRuntimeContext } from "@/lib/ai/user-context";
import {
  DASHBOARD_AGGREGATE_LOOKBACK_DAYS,
  DASHBOARD_AGGREGATE_SNAPSHOT_MAX_AGE_MS,
  DASHBOARD_AGGREGATE_SNAPSHOT_REASON,
  getDashboardAggregateBundle,
  getDashboardRuntimeMetrics,
} from "@/lib/dashboard/metrics";
import {
  isInternalJobParamError,
  requireInternalAdminJobAccess,
  resolveTargetUserIds,
} from "@/lib/internal-jobs";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

async function warmDashboardSnapshotsForUsers(userIds: string[]) {
  const supabase = createAdminSupabaseClient();
  const results: Array<{
    message?: string;
    status: "ok" | "error";
    userId: string;
  }> = [];

  for (const userId of userIds) {
    try {
      await getDashboardAggregateBundle(supabase, userId, {
        defaultMaxAgeMs: DASHBOARD_AGGREGATE_SNAPSHOT_MAX_AGE_MS,
        defaultSnapshotReason: DASHBOARD_AGGREGATE_SNAPSHOT_REASON,
        forceRefresh: true,
        lookbackDays: DASHBOARD_AGGREGATE_LOOKBACK_DAYS,
        persistSnapshot: true,
      });
      await getDashboardRuntimeMetrics(supabase, userId, {
        forceRefresh: true,
        persistSnapshot: true,
      });
      await getAiRuntimeContext(supabase, userId, {
        forceRefresh: true,
        persistSnapshot: true,
      });

      results.push({
        status: "ok",
        userId,
      });
    } catch (error) {
      logger.error("dashboard warm job failed for user", { error, userId });
      results.push({
        message:
          error instanceof Error
            ? error.message
            : "Unexpected dashboard warm job failure.",
        status: "error",
        userId,
      });
    }
  }

  return results;
}

async function handleRequest(request: Request) {
  const access = await requireInternalAdminJobAccess(
    request,
    "dashboard warm jobs",
  );

  if (access instanceof Response) {
    return access;
  }

  try {
    const userIds = await resolveTargetUserIds(request);
    const results = await warmDashboardSnapshotsForUsers(userIds);
    const successCount = results.filter((result) => result.status === "ok").length;
    const errorCount = results.length - successCount;

    return Response.json({
      data: {
        errorCount,
        processedUsers: results.length,
        results,
        successCount,
      },
      message:
        errorCount > 0
          ? "Dashboard warm job completed with partial failures."
          : "Dashboard warm job completed successfully.",
    });
  } catch (error) {
    if (isInternalJobParamError(error)) {
      return createApiErrorResponse({
        status: 400,
        code: "DASHBOARD_WARM_JOB_INVALID",
        message: error.message,
      });
    }

    logger.error("dashboard warm job failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "DASHBOARD_WARM_JOB_FAILED",
      message: "Не удалось прогреть snapshots дашборда.",
    });
  }
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
