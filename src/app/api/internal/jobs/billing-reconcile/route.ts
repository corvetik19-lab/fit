import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  getMissingStripePortalEnv,
  hasStripePortalEnv,
} from "@/lib/env";
import {
  parsePositiveInt,
  requireInternalAdminJobAccess,
} from "@/lib/internal-jobs";
import { logger } from "@/lib/logger";
import {
  reconcileStripeSubscriptionForUser,
} from "@/lib/stripe-billing";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
export const maxDuration = 60;

async function resolveBillingTargetUserIds(request: Request) {
  const { searchParams } = new URL(request.url);
  const explicitUserId = searchParams.get("userId")?.trim() ?? null;

  if (explicitUserId) {
    return [explicitUserId];
  }

  const limit = parsePositiveInt(
    searchParams.get("limit"),
    DEFAULT_LIMIT,
    MAX_LIMIT,
  );
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, provider_subscription_id, provider_customer_id, updated_at")
    .eq("provider", "stripe")
    .order("updated_at", { ascending: false })
    .limit(limit * 4);

  if (error) {
    throw error;
  }

  const seen = new Set<string>();
  const userIds: string[] = [];

  for (const row of data ?? []) {
    const userId = row.user_id?.trim();

    if (!userId || seen.has(userId)) {
      continue;
    }

    if (!row.provider_subscription_id && !row.provider_customer_id) {
      continue;
    }

    seen.add(userId);
    userIds.push(userId);

    if (userIds.length >= limit) {
      break;
    }
  }

  return userIds;
}

async function recordBillingReconcileResult(params: {
  actorUserId: string | null;
  details: Record<string, unknown>;
  source: "admin" | "cron";
  status: "completed" | "failed";
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  targetUserId: string;
}) {
  const { actorUserId, details, source, status, supabase, targetUserId } = params;

  const { error } = await supabase.from("support_actions").insert({
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    action: "reconcile_billing_state",
    status,
    payload: {
      ...details,
      jobType: "scheduled_billing_reconcile",
      source,
    },
  });

  if (error) {
    throw error;
  }
}

async function reconcileBillingForUsers(
  userIds: string[],
  options: {
    actorUserId: string | null;
    source: "admin" | "cron";
  },
) {
  const supabase = createAdminSupabaseClient();
  const results: Array<{
    message?: string;
    source?: "provider_customer_id" | "provider_subscription_id";
    status: "ok" | "error" | "skipped";
    subscriptionStatus?: string;
    userId: string;
  }> = [];

  for (const userId of userIds) {
    try {
      const reconciliation = await reconcileStripeSubscriptionForUser(
        supabase,
        userId,
      );

      if (!reconciliation) {
        const message =
          "No linked Stripe subscription could be resolved for this user.";

        await recordBillingReconcileResult({
          actorUserId: options.actorUserId,
          details: {
            message,
            outcome: "skipped_not_linked",
          },
          source: options.source,
          status: "completed",
          supabase,
          targetUserId: userId,
        });

        results.push({
          message,
          status: "skipped",
          userId,
        });
        continue;
      }

      await recordBillingReconcileResult({
        actorUserId: options.actorUserId,
        details: {
          currentPeriodEnd: reconciliation.subscription.current_period_end,
          currentPeriodStart: reconciliation.subscription.current_period_start,
          outcome: "reconciled",
          previousPeriodEnd:
            reconciliation.previousSubscription?.current_period_end ?? null,
          previousStatus: reconciliation.previousSubscription?.status ?? null,
          providerCustomerId:
            reconciliation.subscription.provider_customer_id ?? null,
          providerSubscriptionId:
            reconciliation.subscription.provider_subscription_id ?? null,
          lookupSource: reconciliation.source,
          status: reconciliation.subscription.status,
          stripeSubscriptionId: reconciliation.stripeSubscriptionId,
          subscriptionId: reconciliation.subscription.id,
        },
        source: options.source,
        status: "completed",
        supabase,
        targetUserId: userId,
      });

      results.push({
        source: reconciliation.source,
        status: "ok",
        subscriptionStatus: reconciliation.subscription.status,
        userId,
      });
    } catch (error) {
      logger.error("billing reconciliation job failed for user", {
        error,
        userId,
      });

      const message =
        error instanceof Error
          ? error.message
          : "Unexpected billing reconciliation failure.";

      try {
        await recordBillingReconcileResult({
          actorUserId: options.actorUserId,
          details: {
            message,
            outcome: "failed",
          },
          source: options.source,
          status: "failed",
          supabase,
          targetUserId: userId,
        });
      } catch (logError) {
        logger.error(
          "billing reconciliation job failed to record support action",
          {
            error: logError,
            userId,
          },
        );
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
    "billing reconciliation jobs",
  );

  if (access instanceof Response) {
    return access;
  }

  try {
    if (!hasStripePortalEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "STRIPE_BILLING_RECONCILE_NOT_CONFIGURED",
        message: "Stripe billing reconciliation is not configured yet.",
        details: {
          missing: getMissingStripePortalEnv(),
        },
      });
    }

    const userIds = await resolveBillingTargetUserIds(request);
    const results = await reconcileBillingForUsers(userIds, {
      actorUserId: access.actorUserId,
      source: access.source,
    });
    const successCount = results.filter((result) => result.status === "ok").length;
    const skippedCount = results.filter((result) => result.status === "skipped").length;
    const errorCount = results.length - successCount - skippedCount;

    return Response.json({
      data: {
        errorCount,
        processedUsers: results.length,
        results,
        skippedCount,
        successCount,
      },
      message:
        errorCount > 0
          ? "Billing reconciliation job completed with partial failures."
          : "Billing reconciliation job completed successfully.",
    });
  } catch (error) {
    logger.error("billing reconciliation job failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "BILLING_RECONCILE_JOB_FAILED",
      message: "Unable to reconcile Stripe billing state.",
    });
  }
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
