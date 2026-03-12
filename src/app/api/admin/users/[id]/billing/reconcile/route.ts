import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  reconcileStripeSubscriptionForUser,
} from "@/lib/stripe-billing";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentAdmin = await requireAdminRouteAccess("manage_billing");
    const { id } = await params;
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
          "No linked Stripe subscription was found for this user or the mapping could not be resolved.",
      });
    }

    const { error: auditError } = await adminSupabase
      .from("admin_audit_logs")
      .insert({
        actor_user_id: currentAdmin.user.id,
        target_user_id: id,
        action: "admin_reconcile_stripe_subscription",
        reason: "manual stripe reconcile",
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
      });

    if (auditError) {
      throw auditError;
    }

    return Response.json({
      data: {
        subscription: reconciliation.subscription,
        userId: reconciliation.userId,
      },
    });
  } catch (error) {
    logger.error("admin billing reconcile route failed", { error });

    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_BILLING_RECONCILE_FAILED",
      message: "Unable to reconcile Stripe subscription state.",
    });
  }
}
