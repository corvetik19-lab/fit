import { createApiErrorResponse } from "@/lib/api/error-response";
import { recordAdminBillingAudit } from "@/lib/admin-billing";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import {
  isAdminRouteParamError,
  parseAdminUserIdParam,
} from "@/lib/admin-route-params";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { reconcileStripeSubscriptionForUser } from "@/lib/stripe-billing";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentAdmin = await requireAdminRouteAccess("manage_billing");
    const { id: rawId } = await params;
    const id = parseAdminUserIdParam(rawId, {
      code: "ADMIN_BILLING_RECONCILE_TARGET_INVALID",
      message: "Target user id is invalid.",
    });
    const adminSupabase = createAdminSupabaseClient();
    const reconciliation = await reconcileStripeSubscriptionForUser(
      adminSupabase,
      id,
    );

    if (!reconciliation) {
      return createApiErrorResponse({
        status: 404,
        code: "STRIPE_SUBSCRIPTION_RECONCILE_UNRESOLVED",
        message:
          "Для этого пользователя не найдена связанная Stripe-подписка или маппинг не удалось разрешить.",
      });
    }

    await recordAdminBillingAudit(adminSupabase, {
      action: "admin_reconcile_stripe_subscription",
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
        stripeSubscriptionId: reconciliation.stripeSubscriptionId,
        subscriptionId: reconciliation.subscription.id,
      },
      reason: "manual stripe reconcile",
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
      message: "Не удалось сверить состояние Stripe-подписки.",
    });
  }
}
