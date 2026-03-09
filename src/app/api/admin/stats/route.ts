import { createApiErrorResponse } from "@/lib/api/error-response";
import { requireAdminRouteAccess } from "@/lib/admin-auth";
import { hasAiGatewayEnv, hasSupabasePublicEnv, serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireAdminRouteAccess();
    const adminSupabase = createAdminSupabaseClient();

    const [
      usersCountResult,
      exercisesCountResult,
      activeProgramsCountResult,
      queuedSupportActionsCountResult,
      aiEvalRunsCountResult,
      aiChatSessionsCountResult,
      aiChatMessagesCountResult,
      aiPlanProposalsCountResult,
      aiSafetyEventsCountResult,
      knowledgeChunksCountResult,
      knowledgeEmbeddingsCountResult,
      reindexActionsCountResult,
    ] = await Promise.all([
      adminSupabase
        .from("profiles")
        .select("*", { count: "exact", head: true }),
      adminSupabase
        .from("exercise_library")
        .select("*", { count: "exact", head: true })
        .eq("is_archived", false),
      adminSupabase
        .from("weekly_programs")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      adminSupabase
        .from("support_actions")
        .select("*", { count: "exact", head: true })
        .eq("status", "queued"),
      adminSupabase
        .from("ai_eval_runs")
        .select("*", { count: "exact", head: true }),
      adminSupabase
        .from("ai_chat_sessions")
        .select("*", { count: "exact", head: true }),
      adminSupabase
        .from("ai_chat_messages")
        .select("*", { count: "exact", head: true }),
      adminSupabase
        .from("ai_plan_proposals")
        .select("*", { count: "exact", head: true }),
      adminSupabase
        .from("ai_safety_events")
        .select("*", { count: "exact", head: true }),
      adminSupabase
        .from("knowledge_chunks")
        .select("*", { count: "exact", head: true }),
      adminSupabase
        .from("knowledge_embeddings")
        .select("*", { count: "exact", head: true }),
      adminSupabase
        .from("support_actions")
        .select("*", { count: "exact", head: true })
        .eq("action", "reindex_knowledge"),
    ]);

    const counts = [
      usersCountResult,
      exercisesCountResult,
      activeProgramsCountResult,
      queuedSupportActionsCountResult,
      aiEvalRunsCountResult,
      aiChatSessionsCountResult,
      aiChatMessagesCountResult,
      aiPlanProposalsCountResult,
      aiSafetyEventsCountResult,
      knowledgeChunksCountResult,
      knowledgeEmbeddingsCountResult,
      reindexActionsCountResult,
    ];

    const failedResult = counts.find((result) => result.error);

    if (failedResult?.error) {
      throw failedResult.error;
    }

    return Response.json({
      data: {
        readiness: {
          supabasePublicEnv: hasSupabasePublicEnv(),
          aiGatewayEnv: hasAiGatewayEnv(),
          serviceRoleEnv: Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY),
        },
        snapshot: {
          users: usersCountResult.count ?? 0,
          exercises: exercisesCountResult.count ?? 0,
          activePrograms: activeProgramsCountResult.count ?? 0,
          queuedSupportActions: queuedSupportActionsCountResult.count ?? 0,
          aiEvalRuns: aiEvalRunsCountResult.count ?? 0,
          aiChatSessions: aiChatSessionsCountResult.count ?? 0,
          aiChatMessages: aiChatMessagesCountResult.count ?? 0,
          aiPlanProposals: aiPlanProposalsCountResult.count ?? 0,
          aiSafetyEvents: aiSafetyEventsCountResult.count ?? 0,
          knowledgeChunks: knowledgeChunksCountResult.count ?? 0,
          knowledgeEmbeddings: knowledgeEmbeddingsCountResult.count ?? 0,
          knowledgeReindexes: reindexActionsCountResult.count ?? 0,
        },
      },
    });
  } catch (error) {
    logger.error("admin stats route failed", { error });

    return createApiErrorResponse({
      status: 401,
      code: "ADMIN_REQUIRED",
      message: "Для чтения admin-статистики нужен доступ администратора.",
    });
  }
}
