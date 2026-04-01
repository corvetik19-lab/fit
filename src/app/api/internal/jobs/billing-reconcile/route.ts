import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  getActiveBillingProvider,
  getBillingProviderLabel,
  getMissingActiveBillingCheckoutEnv,
  hasActiveBillingCheckoutEnv,
} from "@/lib/billing-provider";
import { reconcileCloudpaymentsSubscriptionForUser } from "@/lib/cloudpayments-billing";
import {
  isInternalJobParamError,
  parseOptionalUuidParam,
  parsePositiveInt,
  requireInternalAdminJobAccess,
} from "@/lib/internal-jobs";
import { logger } from "@/lib/logger";
import { reconcileStripeSubscriptionForUser } from "@/lib/stripe-billing";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
export const maxDuration = 60;

function parseBillingReconcileRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const explicitUserId = parseOptionalUuidParam(
    searchParams.get("userId"),
    "userId",
  );
  const limit = parsePositiveInt(
    searchParams.get("limit"),
    DEFAULT_LIMIT,
    MAX_LIMIT,
  );

  return {
    explicitUserId,
    limit,
  };
}

async function resolveBillingTargetUserIds(params: {
  explicitUserId: string | null;
  limit: number;
}) {
  if (params.explicitUserId) {
    return [params.explicitUserId];
  }

  const provider = getActiveBillingProvider();
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, provider_subscription_id, provider_customer_id, updated_at")
    .eq("provider", provider)
    .order("updated_at", { ascending: false })
    .limit(params.limit * 4);

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

    if (userIds.length >= params.limit) {
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
  const provider = getActiveBillingProvider();
  const results: Array<{
    message?: string;
    source?: "account_id" | "provider_customer_id" | "provider_subscription_id";
    status: "error" | "ok" | "skipped";
    subscriptionStatus?: string;
    userId: string;
  }> = [];

  for (const userId of userIds) {
    try {
      const reconciliation =
        provider === "cloudpayments"
          ? await reconcileCloudpaymentsSubscriptionForUser(supabase, userId)
          : await reconcileStripeSubscriptionForUser(supabase, userId);

      if (!reconciliation) {
        const message =
          provider === "cloudpayments"
            ? "Для этого пользователя не удалось определить связанную подписку CloudPayments."
            : "Для этого пользователя не удалось определить связанную подписку Stripe.";

        await recordBillingReconcileResult({
          actorUserId: options.actorUserId,
          details: {
            message,
            outcome: "skipped_not_linked",
            provider,
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
          lookupSource: reconciliation.source,
          outcome: "reconciled",
          previousPeriodEnd:
            reconciliation.previousSubscription?.current_period_end ?? null,
          previousStatus: reconciliation.previousSubscription?.status ?? null,
          provider,
          providerCustomerId:
            reconciliation.subscription.provider_customer_id ?? null,
          providerSubscriptionId:
            reconciliation.subscription.provider_subscription_id ?? null,
          status: reconciliation.subscription.status,
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
        provider,
        userId,
      });

      const message =
        error instanceof Error
          ? error.message
          : `Непредвиденная ошибка сверки подписки ${getBillingProviderLabel(provider)}.`;

      try {
        await recordBillingReconcileResult({
          actorUserId: options.actorUserId,
          details: {
            message,
            outcome: "failed",
            provider,
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
            provider,
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
    "сверка платёжного провайдера",
  );

  if (access instanceof Response) {
    return access;
  }

  try {
    const query = parseBillingReconcileRequest(request);
    const provider = getActiveBillingProvider();

    if (!hasActiveBillingCheckoutEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "BILLING_RECONCILE_NOT_CONFIGURED",
        message: `Сверка ${getBillingProviderLabel(provider)} пока не настроена.`,
        details: {
          missing: getMissingActiveBillingCheckoutEnv(),
          provider,
        },
      });
    }

    const userIds = await resolveBillingTargetUserIds(query);
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
        provider,
        results,
        skippedCount,
        successCount,
      },
      message:
        errorCount > 0
          ? `Сверка ${getBillingProviderLabel(provider)} завершена частично: есть пользователи с ошибками.`
          : `Сверка ${getBillingProviderLabel(provider)} завершена успешно.`,
    });
  } catch (error) {
    if (isInternalJobParamError(error)) {
      return createApiErrorResponse({
        status: 400,
        code: "BILLING_RECONCILE_JOB_INVALID",
        message: error.message,
      });
    }

    logger.error("billing reconciliation job failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "BILLING_RECONCILE_JOB_FAILED",
      message: "Не удалось сверить состояние подписок у платёжного провайдера.",
    });
  }
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
