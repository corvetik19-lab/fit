import { reindexUserKnowledgeBase } from "@/lib/ai/knowledge";
import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  isInternalJobParamError,
  requireInternalAdminJobAccess,
  resolveTargetUserIds,
} from "@/lib/internal-jobs";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
export const maxDuration = 60;

type KnowledgeReindexMode = "embeddings" | "full";

function parseMode(value: string | null): KnowledgeReindexMode {
  return value === "full" ? "full" : "embeddings";
}

async function recordKnowledgeReindexResult(params: {
  actorUserId: string | null;
  details:
    | {
        embeddingsIndexed: number;
        indexedChunks: number;
        mode: KnowledgeReindexMode;
        searchMode: "text" | "vector";
      }
    | {
        message: string;
        mode: KnowledgeReindexMode;
      };
  source: "admin" | "cron";
  status: "completed" | "failed";
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  targetUserId: string;
}) {
  const { actorUserId, details, source, status, supabase, targetUserId } = params;

  const { error } = await supabase.from("support_actions").insert({
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    action: "reindex_knowledge",
    status,
    payload: {
      ...details,
      jobType: "scheduled_knowledge_reindex",
      source,
    },
  });

  if (error) {
    throw error;
  }
}

async function reindexKnowledgeForUsers(
  userIds: string[],
  options: {
    actorUserId: string | null;
    mode: KnowledgeReindexMode;
    source: "admin" | "cron";
  },
) {
  const supabase = createAdminSupabaseClient();
  const results: Array<{
    embeddingsIndexed?: number;
    indexedChunks?: number;
    message?: string;
    searchMode?: "text" | "vector";
    status: "ok" | "error";
    userId: string;
  }> = [];

  for (const userId of userIds) {
    try {
      const result = await reindexUserKnowledgeBase(supabase, userId, {
        mode: options.mode,
      });

      await recordKnowledgeReindexResult({
        actorUserId: options.actorUserId,
        details: {
          embeddingsIndexed: result.embeddingsIndexed,
          indexedChunks: result.indexedChunks,
          mode: result.mode,
          searchMode: result.searchMode,
        },
        source: options.source,
        status: "completed",
        supabase,
        targetUserId: userId,
      });

      results.push({
        embeddingsIndexed: result.embeddingsIndexed,
        indexedChunks: result.indexedChunks,
        searchMode: result.searchMode,
        status: "ok",
        userId,
      });
    } catch (error) {
      logger.error("knowledge reindex job failed for user", {
        error,
        mode: options.mode,
        userId,
      });

      const message =
        error instanceof Error
          ? error.message
          : "Unexpected knowledge reindex job failure.";

      try {
        await recordKnowledgeReindexResult({
          actorUserId: options.actorUserId,
          details: {
            message,
            mode: options.mode,
          },
          source: options.source,
          status: "failed",
          supabase,
          targetUserId: userId,
        });
      } catch (logError) {
        logger.error("knowledge reindex job failed to record support action", {
          error: logError,
          userId,
        });
      }

      results.push({
        message,
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
    "knowledge reindex jobs",
  );

  if (access instanceof Response) {
    return access;
  }

  try {
    const { searchParams } = new URL(request.url);
    const mode = parseMode(searchParams.get("mode"));
    const userIds = await resolveTargetUserIds(request, {
      defaultLimit: DEFAULT_LIMIT,
      maxLimit: MAX_LIMIT,
    });
    const results = await reindexKnowledgeForUsers(userIds, {
      actorUserId: access.actorUserId,
      mode,
      source: access.source,
    });
    const successCount = results.filter((result) => result.status === "ok").length;
    const errorCount = results.length - successCount;

    return Response.json({
      data: {
        errorCount,
        mode,
        processedUsers: results.length,
        results,
        successCount,
      },
      message:
        errorCount > 0
          ? "Knowledge reindex job completed with partial failures."
          : "Knowledge reindex job completed successfully.",
    });
  } catch (error) {
    if (isInternalJobParamError(error)) {
      return createApiErrorResponse({
        status: 400,
        code: "KNOWLEDGE_REINDEX_JOB_INVALID",
        message: error.message,
      });
    }

    logger.error("knowledge reindex job failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "KNOWLEDGE_REINDEX_JOB_FAILED",
      message: "Unable to refresh the knowledge index.",
    });
  }
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
