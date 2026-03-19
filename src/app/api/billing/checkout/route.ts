import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  getMissingStripeCheckoutEnv,
  hasStripeCheckoutEnv,
} from "@/lib/env";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ensureStripeCustomerForUser,
  getStripeClient,
  getStripePremiumMonthlyPriceId,
  resolveRequestOrigin,
} from "@/lib/stripe-billing";

async function writeAuditLog(
  actorUserId: string,
  payload: Record<string, unknown>,
) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    const { error } = await adminSupabase.from("admin_audit_logs").insert({
      action: "user_started_stripe_checkout",
      actor_user_id: actorUserId,
      payload,
      reason: "self-service stripe checkout flow",
      target_user_id: actorUserId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.warn("stripe checkout audit log failed", { actorUserId, error });
  }
}

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
        message: "Нужно войти в аккаунт, чтобы начать оплату.",
      });
    }

    if (!hasStripeCheckoutEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "STRIPE_CHECKOUT_NOT_CONFIGURED",
        message: "Stripe Checkout пока не настроен.",
        details: {
          missing: getMissingStripeCheckoutEnv(),
        },
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const adminSupabase = createAdminSupabaseClient();
    const customerId = await ensureStripeCustomerForUser(adminSupabase, {
      email: user.email ?? null,
      fullName: profile?.full_name ?? null,
      userId: user.id,
    });

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      cancel_url: `${resolveRequestOrigin(request)}/settings?billing=canceled`,
      client_reference_id: user.id,
      customer: customerId,
      line_items: [
        {
          price: getStripePremiumMonthlyPriceId(),
          quantity: 1,
        },
      ],
      metadata: {
        flow: "settings_billing_center",
        userId: user.id,
      },
      mode: "subscription",
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
      success_url: `${resolveRequestOrigin(request)}/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    });

    await writeAuditLog(user.id, {
      checkoutSessionId: session.id,
      customerId,
      mode: session.mode,
      priceId: getStripePremiumMonthlyPriceId(),
    });

    return Response.json({
      data: {
        id: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    logger.error("stripe checkout route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "STRIPE_CHECKOUT_FAILED",
      message: "Не удалось запустить Stripe Checkout.",
    });
  }
}
