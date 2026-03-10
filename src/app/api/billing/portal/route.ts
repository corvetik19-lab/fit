import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripeClient, resolveRequestOrigin } from "@/lib/stripe-billing";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Sign in before opening the billing portal.",
      });
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: subscription, error: subscriptionError } = await adminSupabase
      .from("subscriptions")
      .select("provider_customer_id, provider")
      .eq("user_id", user.id)
      .eq("provider", "stripe")
      .not("provider_customer_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    if (!subscription?.provider_customer_id) {
      return createApiErrorResponse({
        status: 409,
        code: "STRIPE_PORTAL_UNAVAILABLE",
        message: "Stripe customer is not linked yet for this account.",
      });
    }

    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.provider_customer_id,
      return_url: `${resolveRequestOrigin(request)}/settings?billing=portal`,
    });

    return Response.json({
      data: {
        url: session.url,
      },
    });
  } catch (error) {
    logger.error("stripe billing portal route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "STRIPE_PORTAL_FAILED",
      message: "Unable to open Stripe billing portal.",
    });
  }
}
