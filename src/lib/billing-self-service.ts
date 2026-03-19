import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  getMissingStripeCheckoutEnv,
  getMissingStripePortalEnv,
  hasStripeCheckoutEnv,
  hasStripePortalEnv,
} from "@/lib/env";
import { logger } from "@/lib/logger";
import { loadSettingsBillingCenterData } from "@/lib/settings-self-service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ensureStripeCustomerForUser,
  getStripeClient,
  getStripePremiumMonthlyPriceId,
  reconcileStripeCheckoutSession,
  resolveRequestOrigin,
} from "@/lib/stripe-billing";

type BillingRouteSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

type BillingUser = {
  email?: string | null;
  id: string;
};

type BillingActionFailure = {
  code: string;
  details?: unknown;
  message: string;
  status: number;
};

type BillingActionSuccess<T> = {
  data: T;
  ok: true;
};

type BillingActionResult<T> =
  | BillingActionSuccess<T>
  | ({ ok: false } & BillingActionFailure);

export function createBillingActionErrorResponse(result: BillingActionFailure) {
  return createApiErrorResponse({
    status: result.status,
    code: result.code,
    message: result.message,
    details: result.details,
  });
}

async function writeStripeSelfServiceAuditLog(
  action: string,
  actorUserId: string,
  payload: Record<string, unknown>,
  reason: string,
) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    const { error } = await adminSupabase.from("admin_audit_logs").insert({
      action,
      actor_user_id: actorUserId,
      payload,
      reason,
      target_user_id: actorUserId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.warn("stripe self-service audit log failed", {
      action,
      actorUserId,
      error,
    });
  }
}

export async function startStripeCheckoutSessionForUser(input: {
  request: Request;
  supabase: BillingRouteSupabaseClient;
  user: BillingUser;
}): Promise<
  BillingActionResult<{
    id: string;
    url: string | null;
  }>
> {
  if (!hasStripeCheckoutEnv()) {
    return {
      ok: false,
      status: 503,
      code: "STRIPE_CHECKOUT_NOT_CONFIGURED",
      message: "Stripe Checkout пока не настроен.",
      details: {
        missing: getMissingStripeCheckoutEnv(),
      },
    };
  }

  const { data: profile, error: profileError } = await input.supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", input.user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const adminSupabase = createAdminSupabaseClient();
  const customerId = await ensureStripeCustomerForUser(adminSupabase, {
    email: input.user.email ?? null,
    fullName: profile?.full_name ?? null,
    userId: input.user.id,
  });

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    cancel_url: `${resolveRequestOrigin(input.request)}/settings?billing=canceled`,
    client_reference_id: input.user.id,
    customer: customerId,
    line_items: [
      {
        price: getStripePremiumMonthlyPriceId(),
        quantity: 1,
      },
    ],
    metadata: {
      flow: "settings_billing_center",
      userId: input.user.id,
    },
    mode: "subscription",
    subscription_data: {
      metadata: {
        userId: input.user.id,
      },
    },
    success_url: `${resolveRequestOrigin(input.request)}/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
  });

  await writeStripeSelfServiceAuditLog(
    "user_started_stripe_checkout",
    input.user.id,
    {
      checkoutSessionId: session.id,
      customerId,
      mode: session.mode,
      priceId: getStripePremiumMonthlyPriceId(),
    },
    "self-service stripe checkout flow",
  );

  return {
    ok: true,
    data: {
      id: session.id,
      url: session.url,
    },
  };
}

export async function reconcileStripeCheckoutReturnForUser(input: {
  sessionId: string;
  supabase: BillingRouteSupabaseClient;
  user: BillingUser;
}): Promise<
  BillingActionResult<{
    access: Awaited<ReturnType<typeof loadSettingsBillingCenterData>>["access"];
    checkoutReturn: {
      checkoutSessionId: string;
      paymentStatus: string | null;
      reconciled: boolean;
      sessionStatus: string | null;
    };
    snapshot: Awaited<ReturnType<typeof loadSettingsBillingCenterData>>["snapshot"];
  }>
> {
  if (!hasStripeCheckoutEnv()) {
    return {
      ok: false,
      status: 503,
      code: "STRIPE_CHECKOUT_NOT_CONFIGURED",
      message: "Stripe Checkout пока не настроен.",
      details: {
        missing: getMissingStripeCheckoutEnv(),
      },
    };
  }

  const stripe = getStripeClient();
  const checkoutSession = await stripe.checkout.sessions.retrieve(input.sessionId);
  const resolvedUserId =
    checkoutSession.client_reference_id ??
    checkoutSession.metadata?.userId ??
    null;

  if (resolvedUserId !== input.user.id) {
    return {
      ok: false,
      status: 403,
      code: "STRIPE_CHECKOUT_SESSION_FORBIDDEN",
      message: "Эта Stripe-сессия оплаты не относится к текущему пользователю.",
    };
  }

  if (checkoutSession.status !== "complete") {
    const data = await loadSettingsBillingCenterData(
      input.supabase,
      input.user.id,
      input.user.email,
    );

    return {
      ok: true,
      data: {
        ...data,
        checkoutReturn: {
          checkoutSessionId: checkoutSession.id,
          paymentStatus: checkoutSession.payment_status,
          reconciled: false,
          sessionStatus: checkoutSession.status,
        },
      },
    };
  }

  const adminSupabase = createAdminSupabaseClient();
  const reconciliation = await reconcileStripeCheckoutSession(
    adminSupabase,
    checkoutSession,
    null,
  );

  await writeStripeSelfServiceAuditLog(
    "user_reconciled_stripe_checkout_return",
    input.user.id,
    {
      checkoutSessionId: checkoutSession.id,
      paymentStatus: checkoutSession.payment_status,
      reconciled: Boolean(reconciliation),
      sessionStatus: checkoutSession.status,
    },
    "self-service stripe checkout return reconcile",
  );

  const data = await loadSettingsBillingCenterData(
    input.supabase,
    input.user.id,
    input.user.email,
  );

  return {
    ok: true,
    data: {
      ...data,
      checkoutReturn: {
        checkoutSessionId: checkoutSession.id,
        paymentStatus: checkoutSession.payment_status,
        reconciled: Boolean(reconciliation),
        sessionStatus: checkoutSession.status,
      },
    },
  };
}

export async function createStripePortalSessionForUser(input: {
  request: Request;
  userId: string;
}): Promise<
  BillingActionResult<{
    url: string;
  }>
> {
  if (!hasStripePortalEnv()) {
    return {
      ok: false,
      status: 503,
      code: "STRIPE_PORTAL_NOT_CONFIGURED",
      message: "Stripe Billing Portal пока не настроен.",
      details: {
        missing: getMissingStripePortalEnv(),
      },
    };
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data: subscription, error: subscriptionError } = await adminSupabase
    .from("subscriptions")
    .select("provider_customer_id, provider")
    .eq("user_id", input.userId)
    .eq("provider", "stripe")
    .not("provider_customer_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) {
    throw subscriptionError;
  }

  if (!subscription?.provider_customer_id) {
    return {
      ok: false,
      status: 409,
      code: "STRIPE_PORTAL_UNAVAILABLE",
      message: "Для этого аккаунта ещё не привязан Stripe customer.",
    };
  }

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.provider_customer_id,
    return_url: `${resolveRequestOrigin(input.request)}/settings?billing=portal`,
  });

  return {
    ok: true,
    data: {
      url: session.url,
    },
  };
}
