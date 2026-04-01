import { createApiErrorResponse } from "@/lib/api/error-response";
import { recordAdminBillingAudit } from "@/lib/admin-billing";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import {
  isAdminRouteParamError,
  parseAdminUserIdParam,
} from "@/lib/admin-route-params";
import { getActiveBillingProvider } from "@/lib/billing-provider";
import { reconcileCloudpaymentsSubscriptionForUser } from "@/lib/cloudpayments-billing";
import { logger } from "@/lib/logger";
import { reconcileStripeSubscriptionForUser } from "@/lib/stripe-billing";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function getUnresolvedMessage(provider: "cloudpayments" | "stripe") {
  return provider === "cloudpayments"
    ? "Для этого пользователя не найдена связанная подписка CloudPayments или её не удалось подтянуть из провайдера."
    : "Для этого пользователя не найдена связанная подписка Stripe или её не удалось подтянуть из провайдера.";
}

function getAuditAction(provider: "cloudpayments" | "stripe") {
  return provider === "cloudpayments"
    ? "admin_reconcile_cloudpayments_subscription"
    : "admin_reconcile_stripe_subscription";
}

function getAuditReason(provider: "cloudpayments" | "stripe") {
  return provider === "cloudpayments"
    ? "ручная сверка подписки CloudPayments"
    : "ручная сверка подписки Stripe";
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentAdmin = await requireAdminRouteAccess("manage_billing");
    const { id: rawId } = await params;
    const id = parseAdminUserIdParam(rawId, {
      code: "ADMIN_BILLING_RECONCILE_TARGET_INVALID",
      message: "Идентификатор целевого пользователя заполнен некорректно.",
    });
    const adminSupabase = createAdminSupabaseClient();
    const provider = getActiveBillingProvider();
    const reconciliation =
      provider === "cloudpayments"
        ? await reconcileCloudpaymentsSubscriptionForUser(adminSupabase, id)
        : await reconcileStripeSubscriptionForUser(adminSupabase, id);

    if (!reconciliation) {
      return createApiErrorResponse({
        status: 404,
        code: "BILLING_SUBSCRIPTION_RECONCILE_UNRESOLVED",
        message: getUnresolvedMessage(provider),
      });
    }

    await recordAdminBillingAudit(adminSupabase, {
      action: getAuditAction(provider),
      actorUserId: currentAdmin.user.id,
      payload: {
        provider: reconciliation.subscription.provider,
        providerCustomerId:
          reconciliation.subscription.provider_customer_id ?? null,
        providerSubscriptionId:
          reconciliation.subscription.provider_subscription_id ?? null,
        previousStatus: reconciliation.previousSubscription?.status ?? null,
        source: reconciliation.source,
        status: reconciliation.subscription.status,
        subscriptionId: reconciliation.subscription.id,
      },
      reason: getAuditReason(provider),
      targetUserId: id,
    });

    return Response.json({
      data: {
        subscription: reconciliation.subscription,
        userId: reconciliation.userId,
      },
    });
  } catch (error) {
    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    if (isAdminRouteParamError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    logger.error("admin billing reconcile route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_BILLING_RECONCILE_FAILED",
      message: "Не удалось сверить состояние подписки у платёжного провайдера.",
    });
  }
}
