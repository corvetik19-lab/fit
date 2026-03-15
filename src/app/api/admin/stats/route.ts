import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  DELETION_REQUEST_ACTIVE_STATUSES,
  EXPORT_JOB_ACTIVE_STATUSES,
} from "@/lib/admin-operations";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import {
  getMissingStripeCheckoutEnv,
  getMissingStripePortalEnv,
  getMissingStripeWebhookEnv,
  getMissingSentryBuildEnv,
  getMissingSentryRuntimeEnv,
  getVercelRuntimeEnv,
  hasAiEmbeddingEnv,
  hasAiGatewayEnv,
  hasAiRuntimeEnv,
  hasOpenRouterEnv,
  hasStripeCheckoutEnv,
  hasStripePortalEnv,
  hasStripeWebhookEnv,
  hasSentryBuildEnv,
  hasSentryRuntimeEnv,
  hasSupabasePublicEnv,
  hasVoyageEnv,
  hasVercelRuntimeEnv,
  serverEnv,
} from "@/lib/env";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { AI_RUNTIME_CONTEXT_SNAPSHOT_REASON } from "@/lib/ai/user-context";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createFallbackAdminStatsSnapshot() {
  return {
    readiness: {
      supabasePublicEnv: hasSupabasePublicEnv(),
      aiGatewayEnv: hasAiGatewayEnv(),
      aiRuntimeEnv: hasAiRuntimeEnv(),
      aiEmbeddingEnv: hasAiEmbeddingEnv(),
      openRouterEnv: hasOpenRouterEnv(),
      voyageEnv: hasVoyageEnv(),
      serviceRoleEnv: Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY),
      sentryRuntimeEnv: hasSentryRuntimeEnv(),
      sentryBuildEnv: hasSentryBuildEnv(),
      stripeCheckoutEnv: hasStripeCheckoutEnv(),
      stripePortalEnv: hasStripePortalEnv(),
      stripeWebhookEnv: hasStripeWebhookEnv(),
      vercelRuntimeEnv: hasVercelRuntimeEnv(),
      workoutSyncPullEnv: true,
    },
    observability: {
      sentry: {
        runtimeMissing: getMissingSentryRuntimeEnv(),
        buildMissing: getMissingSentryBuildEnv(),
        org: serverEnv.SENTRY_ORG ?? null,
        project: serverEnv.SENTRY_PROJECT ?? null,
        environment: serverEnv.SENTRY_ENVIRONMENT ?? null,
      },
      vercel: {
        environment: getVercelRuntimeEnv(),
      },
      stripe: {
        checkoutMissing: getMissingStripeCheckoutEnv(),
        portalMissing: getMissingStripePortalEnv(),
        webhookMissing: getMissingStripeWebhookEnv(),
        priceId: serverEnv.STRIPE_PREMIUM_MONTHLY_PRICE_ID ?? null,
      },
      ai: {
        gatewayEnabled: hasAiGatewayEnv(),
        runtimeEnabled: hasAiRuntimeEnv(),
        embeddingEnabled: hasAiEmbeddingEnv(),
        openRouterEnabled: hasOpenRouterEnv(),
        voyageEnabled: hasVoyageEnv(),
        openRouterBaseUrl: serverEnv.OPENROUTER_BASE_URL ?? null,
        openRouterModel: serverEnv.OPENROUTER_CHAT_MODEL ?? null,
        voyageModel: serverEnv.VOYAGE_EMBEDDING_MODEL ?? null,
      },
    },
    snapshot: {
      users: 0,
      exercises: 0,
      activePrograms: 0,
      queuedSupportActions: 0,
      aiEvalRuns: 0,
      aiChatSessions: 0,
      aiChatMessages: 0,
      aiPlanProposals: 0,
      aiSafetyEvents: 0,
      knowledgeChunks: 0,
      knowledgeEmbeddings: 0,
      knowledgeReindexes: 0,
    },
    systemHealth: {
      users: 0,
      exercises: 0,
      activePrograms: 0,
      knowledgeChunks: 0,
      knowledgeEmbeddings: 0,
      latestProfileAt: null,
      latestProgramAt: null,
    },
    knowledgeHealth: {
      runtimeSnapshots: 0,
      structuredFactSheets: 0,
      structuredFacts: 0,
      recentReindexes24h: 0,
      embeddingCoverageRatio: null,
      latestRuntimeSnapshotAt: null,
      latestReindexAt: null,
      latestReindexMode: null,
      latestReindexSearchMode: null,
    },
    syncHealth: {
      workoutDaysInProgress: 0,
      workoutDaysDone: 0,
      loggedWorkoutSets: 0,
      queuedSupportActions: 0,
      completedSupportActions: 0,
      failedSupportActions: 0,
      queuedExportJobs: 0,
      activeDeletionRequests: 0,
      dueDeletionRequests: 0,
      queuedAiEvalRuns: 0,
      runningAiEvalRuns: 0,
      failedAiEvalRuns: 0,
      latestWorkoutSetAt: null,
      latestSupportActionAt: null,
      latestExportJobAt: null,
      latestDeletionRequestAt: null,
      latestAiEvalRunAt: null,
    },
    billingHealth: {
      stripeSubscriptions: 0,
      stripeActiveSubscriptions: 0,
      stripeTrialSubscriptions: 0,
      stripePastDueSubscriptions: 0,
      stripeLinkedCustomers: 0,
      queuedBillingReviews: 0,
      completedBillingReviews: 0,
      recentBillingReconciles: 0,
      failedBillingReconciles: 0,
      recentCheckoutReturnReconciles: 0,
      latestBillingReviewAt: null,
      latestBillingReconcileAt: null,
      latestStripeEventAt: null,
      latestCheckoutReturnReconcileAt: null,
    },
  };
}

export async function GET() {
  try {
    await requireAdminRouteAccess("view_admin_dashboard");
    const adminSupabase = createAdminSupabaseClient();

    const [
      usersCountResult,
      exercisesCountResult,
      activeProgramsCountResult,
      queuedSupportActionsCountResult,
      completedSupportActionsCountResult,
      failedSupportActionsCountResult,
      queuedBillingReviewActionsCountResult,
      completedBillingReviewActionsCountResult,
      queuedExportJobsCountResult,
      activeDeletionRequestsCountResult,
      dueDeletionRequestsCountResult,
      stripeSubscriptionsCountResult,
      stripeActiveSubscriptionsCountResult,
      stripeTrialSubscriptionsCountResult,
      stripePastDueSubscriptionsCountResult,
      stripeLinkedCustomersCountResult,
      recentCheckoutReturnReconcilesCountResult,
      recentBillingReconcilesCountResult,
      failedBillingReconcilesCountResult,
      aiEvalRunsCountResult,
      queuedAiEvalRunsCountResult,
      runningAiEvalRunsCountResult,
      failedAiEvalRunsCountResult,
      aiChatSessionsCountResult,
      aiChatMessagesCountResult,
      aiPlanProposalsCountResult,
      aiSafetyEventsCountResult,
      knowledgeChunksCountResult,
      knowledgeEmbeddingsCountResult,
      runtimeContextSnapshotsCountResult,
      structuredFactSheetsCountResult,
      structuredFactsCountResult,
      reindexActionsCountResult,
      reindexActions24hCountResult,
      workoutDaysInProgressCountResult,
      workoutDaysDoneCountResult,
      loggedWorkoutSetsCountResult,
      latestProfileResult,
      latestProgramResult,
      latestWorkoutSetResult,
      latestSupportActionResult,
      latestBillingReviewActionResult,
      latestBillingReconcileResult,
      latestExportJobResult,
      latestDeletionRequestResult,
      latestAiEvalRunResult,
      latestStripeEventResult,
      latestCheckoutReturnReconcileResult,
      latestRuntimeContextSnapshotResult,
      latestReindexActionResult,
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
        .from("support_actions")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed"),
      adminSupabase
        .from("support_actions")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed"),
      adminSupabase
        .from("support_actions")
        .select("*", { count: "exact", head: true })
        .eq("action", "billing_access_review")
        .eq("status", "queued"),
      adminSupabase
        .from("support_actions")
        .select("*", { count: "exact", head: true })
        .eq("action", "billing_access_review")
        .eq("status", "completed"),
      adminSupabase
        .from("export_jobs")
        .select("*", { count: "exact", head: true })
        .in("status", [...EXPORT_JOB_ACTIVE_STATUSES]),
      adminSupabase
        .from("deletion_requests")
        .select("*", { count: "exact", head: true })
        .in("status", [...DELETION_REQUEST_ACTIVE_STATUSES]),
      adminSupabase
        .from("deletion_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "holding")
        .lte("hold_until", new Date().toISOString()),
      adminSupabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("provider", "stripe"),
      adminSupabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("provider", "stripe")
        .eq("status", "active"),
      adminSupabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("provider", "stripe")
        .eq("status", "trial"),
      adminSupabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("provider", "stripe")
        .eq("status", "past_due"),
      adminSupabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("provider", "stripe")
        .not("provider_customer_id", "is", null),
      adminSupabase
        .from("admin_audit_logs")
        .select("*", { count: "exact", head: true })
        .eq("action", "user_reconciled_stripe_checkout_return")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      adminSupabase
        .from("support_actions")
        .select("*", { count: "exact", head: true })
        .eq("action", "reconcile_billing_state")
        .gte("updated_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      adminSupabase
        .from("support_actions")
        .select("*", { count: "exact", head: true })
        .eq("action", "reconcile_billing_state")
        .eq("status", "failed"),
      adminSupabase
        .from("ai_eval_runs")
        .select("*", { count: "exact", head: true }),
      adminSupabase
        .from("ai_eval_runs")
        .select("*", { count: "exact", head: true })
        .eq("status", "queued"),
      adminSupabase
        .from("ai_eval_runs")
        .select("*", { count: "exact", head: true })
        .eq("status", "running"),
      adminSupabase
        .from("ai_eval_runs")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed"),
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
        .from("user_context_snapshots")
        .select("*", { count: "exact", head: true })
        .eq("snapshot_reason", AI_RUNTIME_CONTEXT_SNAPSHOT_REASON),
      adminSupabase
        .from("knowledge_chunks")
        .select("*", { count: "exact", head: true })
        .eq("source_type", "structured_fact_sheet"),
      adminSupabase
        .from("knowledge_chunks")
        .select("*", { count: "exact", head: true })
        .eq("source_type", "structured_fact"),
      adminSupabase
        .from("support_actions")
        .select("*", { count: "exact", head: true })
        .eq("action", "reindex_knowledge"),
      adminSupabase
        .from("support_actions")
        .select("*", { count: "exact", head: true })
        .eq("action", "reindex_knowledge")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      adminSupabase
        .from("workout_days")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_progress"),
      adminSupabase
        .from("workout_days")
        .select("*", { count: "exact", head: true })
        .eq("status", "done"),
      adminSupabase
        .from("workout_sets")
        .select("*", { count: "exact", head: true })
        .not("actual_reps", "is", null),
      adminSupabase
        .from("profiles")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("weekly_programs")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("workout_sets")
        .select("updated_at")
        .not("actual_reps", "is", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("support_actions")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("support_actions")
        .select("updated_at")
        .eq("action", "billing_access_review")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("support_actions")
        .select("updated_at")
        .eq("action", "reconcile_billing_state")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("export_jobs")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("deletion_requests")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("ai_eval_runs")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("subscription_events")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("admin_audit_logs")
        .select("created_at")
        .eq("action", "user_reconciled_stripe_checkout_return")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("user_context_snapshots")
        .select("created_at, snapshot_reason")
        .eq("snapshot_reason", AI_RUNTIME_CONTEXT_SNAPSHOT_REASON)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("support_actions")
        .select("created_at, payload")
        .eq("action", "reindex_knowledge")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const results = [
      usersCountResult,
      exercisesCountResult,
      activeProgramsCountResult,
      queuedSupportActionsCountResult,
      completedSupportActionsCountResult,
      failedSupportActionsCountResult,
      queuedBillingReviewActionsCountResult,
      completedBillingReviewActionsCountResult,
      queuedExportJobsCountResult,
      activeDeletionRequestsCountResult,
      dueDeletionRequestsCountResult,
      stripeSubscriptionsCountResult,
      stripeActiveSubscriptionsCountResult,
      stripeTrialSubscriptionsCountResult,
      stripePastDueSubscriptionsCountResult,
      stripeLinkedCustomersCountResult,
      recentCheckoutReturnReconcilesCountResult,
      recentBillingReconcilesCountResult,
      failedBillingReconcilesCountResult,
      aiEvalRunsCountResult,
      queuedAiEvalRunsCountResult,
      runningAiEvalRunsCountResult,
      failedAiEvalRunsCountResult,
      aiChatSessionsCountResult,
      aiChatMessagesCountResult,
      aiPlanProposalsCountResult,
      aiSafetyEventsCountResult,
      knowledgeChunksCountResult,
      knowledgeEmbeddingsCountResult,
      runtimeContextSnapshotsCountResult,
      structuredFactSheetsCountResult,
      structuredFactsCountResult,
      reindexActionsCountResult,
      reindexActions24hCountResult,
      workoutDaysInProgressCountResult,
      workoutDaysDoneCountResult,
      loggedWorkoutSetsCountResult,
      latestProfileResult,
      latestProgramResult,
      latestWorkoutSetResult,
      latestSupportActionResult,
      latestBillingReviewActionResult,
      latestBillingReconcileResult,
      latestExportJobResult,
      latestDeletionRequestResult,
      latestAiEvalRunResult,
      latestStripeEventResult,
      latestCheckoutReturnReconcileResult,
      latestRuntimeContextSnapshotResult,
      latestReindexActionResult,
    ];

    const failedResult = results.find((result) => result.error);

    if (failedResult?.error) {
      throw failedResult.error;
    }

    const latestReindexPayload = isRecord(latestReindexActionResult.data?.payload)
      ? latestReindexActionResult.data.payload
      : null;
    const latestReindexMode =
      latestReindexPayload?.mode === "embeddings" ||
      latestReindexPayload?.mode === "full"
        ? latestReindexPayload.mode
        : null;
    const latestReindexSearchMode =
      latestReindexPayload?.searchMode === "text" ||
      latestReindexPayload?.searchMode === "vector"
        ? latestReindexPayload.searchMode
        : null;
    const knowledgeChunks = knowledgeChunksCountResult.count ?? 0;
    const knowledgeEmbeddings = knowledgeEmbeddingsCountResult.count ?? 0;
    const embeddingCoverageRatio =
      knowledgeChunks > 0
        ? Number((knowledgeEmbeddings / knowledgeChunks).toFixed(2))
        : null;

    return Response.json({
      data: {
        readiness: {
          supabasePublicEnv: hasSupabasePublicEnv(),
          aiGatewayEnv: hasAiGatewayEnv(),
          aiRuntimeEnv: hasAiRuntimeEnv(),
          aiEmbeddingEnv: hasAiEmbeddingEnv(),
          openRouterEnv: hasOpenRouterEnv(),
          voyageEnv: hasVoyageEnv(),
          serviceRoleEnv: Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY),
          sentryRuntimeEnv: hasSentryRuntimeEnv(),
          sentryBuildEnv: hasSentryBuildEnv(),
          stripeCheckoutEnv: hasStripeCheckoutEnv(),
          stripePortalEnv: hasStripePortalEnv(),
          stripeWebhookEnv: hasStripeWebhookEnv(),
          vercelRuntimeEnv: hasVercelRuntimeEnv(),
          workoutSyncPullEnv: true,
        },
        observability: {
          sentry: {
            runtimeMissing: getMissingSentryRuntimeEnv(),
            buildMissing: getMissingSentryBuildEnv(),
            org: serverEnv.SENTRY_ORG ?? null,
            project: serverEnv.SENTRY_PROJECT ?? null,
            environment: serverEnv.SENTRY_ENVIRONMENT ?? null,
          },
          vercel: {
            environment: getVercelRuntimeEnv(),
          },
          stripe: {
            checkoutMissing: getMissingStripeCheckoutEnv(),
            portalMissing: getMissingStripePortalEnv(),
            webhookMissing: getMissingStripeWebhookEnv(),
            priceId: serverEnv.STRIPE_PREMIUM_MONTHLY_PRICE_ID ?? null,
          },
          ai: {
            gatewayEnabled: hasAiGatewayEnv(),
            runtimeEnabled: hasAiRuntimeEnv(),
            embeddingEnabled: hasAiEmbeddingEnv(),
            openRouterEnabled: hasOpenRouterEnv(),
            voyageEnabled: hasVoyageEnv(),
            openRouterBaseUrl: serverEnv.OPENROUTER_BASE_URL ?? null,
            openRouterModel: serverEnv.OPENROUTER_CHAT_MODEL ?? null,
            voyageModel: serverEnv.VOYAGE_EMBEDDING_MODEL ?? null,
          },
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
          knowledgeChunks,
          knowledgeEmbeddings,
          knowledgeReindexes: reindexActionsCountResult.count ?? 0,
        },
        systemHealth: {
          users: usersCountResult.count ?? 0,
          exercises: exercisesCountResult.count ?? 0,
          activePrograms: activeProgramsCountResult.count ?? 0,
          knowledgeChunks,
          knowledgeEmbeddings,
          latestProfileAt: latestProfileResult.data?.created_at ?? null,
          latestProgramAt: latestProgramResult.data?.updated_at ?? null,
        },
        knowledgeHealth: {
          runtimeSnapshots: runtimeContextSnapshotsCountResult.count ?? 0,
          structuredFactSheets: structuredFactSheetsCountResult.count ?? 0,
          structuredFacts: structuredFactsCountResult.count ?? 0,
          recentReindexes24h: reindexActions24hCountResult.count ?? 0,
          embeddingCoverageRatio,
          latestRuntimeSnapshotAt:
            latestRuntimeContextSnapshotResult.data?.created_at ?? null,
          latestReindexAt: latestReindexActionResult.data?.created_at ?? null,
          latestReindexMode,
          latestReindexSearchMode,
        },
        syncHealth: {
          workoutDaysInProgress: workoutDaysInProgressCountResult.count ?? 0,
          workoutDaysDone: workoutDaysDoneCountResult.count ?? 0,
          loggedWorkoutSets: loggedWorkoutSetsCountResult.count ?? 0,
          queuedSupportActions: queuedSupportActionsCountResult.count ?? 0,
          completedSupportActions: completedSupportActionsCountResult.count ?? 0,
          failedSupportActions: failedSupportActionsCountResult.count ?? 0,
          queuedExportJobs: queuedExportJobsCountResult.count ?? 0,
          activeDeletionRequests: activeDeletionRequestsCountResult.count ?? 0,
          dueDeletionRequests: dueDeletionRequestsCountResult.count ?? 0,
          queuedAiEvalRuns: queuedAiEvalRunsCountResult.count ?? 0,
          runningAiEvalRuns: runningAiEvalRunsCountResult.count ?? 0,
          failedAiEvalRuns: failedAiEvalRunsCountResult.count ?? 0,
          latestWorkoutSetAt: latestWorkoutSetResult.data?.updated_at ?? null,
          latestSupportActionAt: latestSupportActionResult.data?.updated_at ?? null,
          latestExportJobAt: latestExportJobResult.data?.updated_at ?? null,
          latestDeletionRequestAt:
            latestDeletionRequestResult.data?.updated_at ?? null,
          latestAiEvalRunAt: latestAiEvalRunResult.data?.updated_at ?? null,
        },
        billingHealth: {
          stripeSubscriptions: stripeSubscriptionsCountResult.count ?? 0,
          stripeActiveSubscriptions: stripeActiveSubscriptionsCountResult.count ?? 0,
          stripeTrialSubscriptions: stripeTrialSubscriptionsCountResult.count ?? 0,
          stripePastDueSubscriptions: stripePastDueSubscriptionsCountResult.count ?? 0,
          stripeLinkedCustomers: stripeLinkedCustomersCountResult.count ?? 0,
          queuedBillingReviews: queuedBillingReviewActionsCountResult.count ?? 0,
          completedBillingReviews:
            completedBillingReviewActionsCountResult.count ?? 0,
          recentBillingReconciles: recentBillingReconcilesCountResult.count ?? 0,
          failedBillingReconciles: failedBillingReconcilesCountResult.count ?? 0,
          recentCheckoutReturnReconciles:
            recentCheckoutReturnReconcilesCountResult.count ?? 0,
          latestBillingReviewAt:
            latestBillingReviewActionResult.data?.updated_at ?? null,
          latestBillingReconcileAt:
            latestBillingReconcileResult.data?.updated_at ?? null,
          latestStripeEventAt: latestStripeEventResult.data?.created_at ?? null,
          latestCheckoutReturnReconcileAt:
            latestCheckoutReturnReconcileResult.data?.created_at ?? null,
        },
      },
    });
  } catch (error) {
    if (!isAdminAccessError(error)) {
      logger.warn("admin stats route degraded to fallback", { error });

      return Response.json({
        data: createFallbackAdminStatsSnapshot(),
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
      status: 401,
      code: "ADMIN_REQUIRED",
      message: "Для чтения admin-статистики нужен доступ администратора.",
    });
  }
}
