import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  getStripeClient,
  reconcileStripeSubscription,
} from "@/lib/stripe-billing";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentAdmin = await requireAdminRouteAccess("manage_billing");
    const { id } = await params;
    const adminSupabase = createAdminSupabaseClient();
    const stripe = getStripeClient();
    const { data: subscriptionRow, error: subscriptionRowError } =
      await adminSupabase
        .from("subscriptions")
        .select("provider_subscription_id, provider_customer_id")
        .eq("user_id", id)
        .eq("provider", "stripe")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (subscriptionRowError) {
      throw subscriptionRowError;
    }

    let stripeSubscriptionId = subscriptionRow?.provider_subscription_id ?? null;

    if (!stripeSubscriptionId && subscriptionRow?.provider_customer_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: subscriptionRow.provider_customer_id,
        limit: 1,
        status: "all",
      });

      stripeSubscriptionId = subscriptions.data[0]?.id ?? null;
    }

    if (!stripeSubscriptionId) {
      return createApiErrorResponse({
        status: 404,
        code: "STRIPE_SUBSCRIPTION_NOT_LINKED",
        message: "No linked Stripe subscription was found for this user.",
      });
    }

    const stripeSubscription =
      await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const reconciliation = await reconcileStripeSubscription(adminSupabase, {
      event: null,
      stripeSubscription,
    });

    if (!reconciliation) {
      return createApiErrorResponse({
        status: 404,
        code: "STRIPE_SUBSCRIPTION_RECONCILE_UNRESOLVED",
        message:
          "Stripe subscription was found, but the user mapping could not be resolved.",
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
          status: reconciliation.subscription.status,
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
