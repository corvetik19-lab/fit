import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  isInternalJobParamError,
  parsePositiveInt,
  requireInternalAdminJobAccess,
  resolveTargetUserIds,
} from "@/lib/internal-jobs";
import { logger } from "@/lib/logger";
import { recalculateDailyNutritionSummary } from "@/lib/nutrition/meal-logging";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const DEFAULT_DAYS = 3;
const DEFAULT_LIMIT = 25;
const MAX_DAYS = 14;
export const maxDuration = 60;

function getSummaryDates(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);

    return date.toISOString().slice(0, 10);
  });
}
async function recalculateSummariesForUsers(userIds: string[], days: number) {
  const supabase = createAdminSupabaseClient();
  const summaryDates = getSummaryDates(days);
  const results: Array<{
    message?: string;
    status: "ok" | "error";
    userId: string;
  }> = [];

  for (const userId of userIds) {
    try {
      for (const summaryDate of summaryDates) {
        await recalculateDailyNutritionSummary(supabase, userId, summaryDate);
      }

      results.push({
        status: "ok",
        userId,
      });
    } catch (error) {
      logger.error("nutrition summaries job failed for user", { error, userId });
      results.push({
        message:
          error instanceof Error
            ? error.message
            : "Unexpected nutrition summary job failure.",
        status: "error",
        userId,
      });
    }
  }

  return {
    results,
    summaryDates,
  };
}

async function handleRequest(request: Request) {
  const access = await requireInternalAdminJobAccess(
    request,
    "nutrition summary jobs",
  );

  if (access instanceof Response) {
    return access;
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = parsePositiveInt(searchParams.get("days"), DEFAULT_DAYS, MAX_DAYS);
    const userIds = await resolveTargetUserIds(request, {
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: 100,
    });
    const { results, summaryDates } = await recalculateSummariesForUsers(
      userIds,
      days,
    );
    const successCount = results.filter((result) => result.status === "ok").length;
    const errorCount = results.length - successCount;

    return Response.json({
      data: {
        days,
        errorCount,
        processedUsers: results.length,
        results,
        successCount,
        summaryDates,
      },
      message:
        errorCount > 0
          ? "Nutrition summaries job completed with partial failures."
          : "Nutrition summaries job completed successfully.",
    });
  } catch (error) {
    if (isInternalJobParamError(error)) {
      return createApiErrorResponse({
        status: 400,
        code: "NUTRITION_SUMMARIES_JOB_INVALID",
        message: error.message,
      });
    }

    logger.error("nutrition summaries job failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "NUTRITION_SUMMARIES_JOB_FAILED",
      message: "Не удалось пересчитать nutrition summaries.",
    });
  }
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
