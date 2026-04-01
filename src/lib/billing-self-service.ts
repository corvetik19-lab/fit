import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  getActiveBillingProvider,
  getBillingProviderLabel,
  getMissingActiveBillingCheckoutEnv,
  getMissingActiveBillingManagementEnv,
  type BillingProvider,
  hasActiveBillingCheckoutEnv,
  hasActiveBillingManagementEnv,
} from "@/lib/billing-provider";
import {
  buildCloudpaymentsCheckoutIntent,
  getCloudpaymentsManagementUrl,
  reconcileCloudpaymentsSubscriptionForUser,
} from "@/lib/cloudpayments-billing";
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

type BillingRouteSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

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

type BillingCheckoutReturn = {
  checkoutSessionId: string;
  paymentStatus: string | null;
  provider: BillingProvider;
  reconciled: boolean;
  sessionStatus: string | null;
};

type BillingCenterResponseData = {
  access: Awaited<ReturnType<typeof loadSettingsBillingCenterData>>["access"];
  checkoutReturn: BillingCheckoutReturn;
  snapshot: Awaited<ReturnType<typeof loadSettingsBillingCenterData>>["snapshot"];
};

export function createBillingActionErrorResponse(result: BillingActionFailure) {
  return createApiErrorResponse({
    status: result.status,
    code: result.code,
    message: result.message,
    details: result.details,
  });
}

async function writeBillingSelfServiceAuditLog(
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
    logger.warn("billing self-service audit log failed", {
      action,
      actorUserId,
      error,
    });
  }
}

async function startStripeCheckoutSessionForUser(input: {
  request: Request;
  supabase: BillingRouteSupabaseClient;
  user: BillingUser;
}): Promise<
  BillingActionResult<{
    id: string;
    provider: BillingProvider;
    url: string | null;
  }>
> {
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
    cancel_url: `${resolveRequestOrigin(input.request)}/settings?billing=canceled&section=billing`,
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
    success_url: `${resolveRequestOrigin(input.request)}/settings?billing=success&section=billing&session_id={CHECKOUT_SESSION_ID}`,
  });

  await writeBillingSelfServiceAuditLog(
    "user_started_stripe_checkout",
    input.user.id,
    {
      checkoutSessionId: session.id,
      customerId,
      mode: session.mode,
      priceId: getStripePremiumMonthlyPriceId(),
      provider: "stripe",
    },
    "self-service stripe checkout flow",
  );

  return {
    ok: true,
    data: {
      id: session.id,
      provider: "stripe",
      url: session.url,
    },
  };
}

async function startCloudpaymentsCheckoutSessionForUser(input: {
  request: Request;
  supabase: BillingRouteSupabaseClient;
  user: BillingUser;
}): Promise<
  BillingActionResult<{
    id: string;
    provider: BillingProvider;
    url: string | null;
  }>
> {
  const { data: profile, error: profileError } = await input.supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", input.user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const intent = buildCloudpaymentsCheckoutIntent({
    fullName: profile?.full_name ?? null,
    user: input.user,
  });
  const checkoutUrl = `${resolveRequestOrigin(input.request)}/billing/cloudpayments?reference=${encodeURIComponent(intent.externalId)}`;

  await writeBillingSelfServiceAuditLog(
    "user_started_cloudpayments_checkout",
    input.user.id,
    {
      amount: intent.amount,
      currency: intent.currency,
      description: intent.description,
      externalId: intent.externalId,
      provider: "cloudpayments",
    },
    "self-service cloudpayments checkout flow",
  );

  return {
    ok: true,
    data: {
      id: intent.externalId,
      provider: "cloudpayments",
      url: checkoutUrl,
    },
  };
}

export async function startBillingCheckoutSessionForUser(input: {
  request: Request;
  supabase: BillingRouteSupabaseClient;
  user: BillingUser;
}): Promise<
  BillingActionResult<{
    id: string;
    provider: BillingProvider;
    url: string | null;
  }>
> {
  const provider = getActiveBillingProvider();

  if (!hasActiveBillingCheckoutEnv()) {
    return {
      ok: false,
      status: 503,
      code: "BILLING_CHECKOUT_NOT_CONFIGURED",
      message: `${getBillingProviderLabel(provider)} пока не настроен для запуска оплаты.`,
      details: {
        missing: getMissingActiveBillingCheckoutEnv(),
        provider,
      },
    };
  }

  return provider === "cloudpayments"
    ? startCloudpaymentsCheckoutSessionForUser(input)
    : startStripeCheckoutSessionForUser(input);
}

async function reconcileStripeCheckoutReturnForUser(input: {
  sessionId: string;
  supabase: BillingRouteSupabaseClient;
  user: BillingUser;
}): Promise<BillingActionResult<BillingCenterResponseData>> {
  const stripe = getStripeClient();
  const checkoutSession = await stripe.checkout.sessions.retrieve(input.sessionId);
  const resolvedUserId =
    checkoutSession.client_reference_id ?? checkoutSession.metadata?.userId ?? null;

  if (resolvedUserId !== input.user.id) {
    return {
      ok: false,
      status: 403,
      code: "BILLING_CHECKOUT_SESSION_FORBIDDEN",
      message: "Эта платёжная сессия не относится к текущему пользователю.",
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
          provider: "stripe",
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

  await writeBillingSelfServiceAuditLog(
    "user_reconciled_stripe_checkout_return",
    input.user.id,
    {
      checkoutSessionId: checkoutSession.id,
      paymentStatus: checkoutSession.payment_status,
      provider: "stripe",
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
        provider: "stripe",
        reconciled: Boolean(reconciliation),
        sessionStatus: checkoutSession.status,
      },
    },
  };
}

async function reconcileCloudpaymentsCheckoutReturnForUser(input: {
  referenceId?: string | null;
  supabase: BillingRouteSupabaseClient;
  user: BillingUser;
}): Promise<BillingActionResult<BillingCenterResponseData>> {
  const adminSupabase = createAdminSupabaseClient();
  const reconciliation = await reconcileCloudpaymentsSubscriptionForUser(
    adminSupabase,
    input.user.id,
  );

  await writeBillingSelfServiceAuditLog(
    "user_reconciled_cloudpayments_checkout_return",
    input.user.id,
    {
      provider: "cloudpayments",
      reconciliationReference: input.referenceId ?? null,
      reconciled: Boolean(reconciliation),
      subscriptionId: reconciliation?.subscription.id ?? null,
    },
    "self-service cloudpayments checkout return reconcile",
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
        checkoutSessionId:
          reconciliation?.subscription.provider_subscription_id ??
          input.referenceId ??
          "cloudpayments",
        paymentStatus: reconciliation?.subscription.status ?? null,
        provider: "cloudpayments",
        reconciled: Boolean(reconciliation?.subscription),
        sessionStatus:
          reconciliation?.subscription.status === "active" ? "complete" : "pending",
      },
    },
  };
}

export async function reconcileBillingCheckoutReturnForUser(input: {
  referenceId?: string | null;
  sessionId?: string | null;
  supabase: BillingRouteSupabaseClient;
  user: BillingUser;
}): Promise<BillingActionResult<BillingCenterResponseData>> {
  const provider = getActiveBillingProvider();

  if (!hasActiveBillingCheckoutEnv()) {
    return {
      ok: false,
      status: 503,
      code: "BILLING_CHECKOUT_NOT_CONFIGURED",
      message: `${getBillingProviderLabel(provider)} пока не настроен для подтверждения оплаты.`,
      details: {
        missing: getMissingActiveBillingCheckoutEnv(),
        provider,
      },
    };
  }

  if (provider === "cloudpayments") {
    return reconcileCloudpaymentsCheckoutReturnForUser({
      referenceId: input.referenceId ?? input.sessionId ?? null,
      supabase: input.supabase,
      user: input.user,
    });
  }

  if (!input.sessionId) {
    return {
      ok: false,
      status: 400,
      code: "BILLING_CHECKOUT_RECONCILE_INVALID",
      message: "Не передан идентификатор оплаты для подтверждения.",
    };
  }

  return reconcileStripeCheckoutReturnForUser({
    sessionId: input.sessionId,
    supabase: input.supabase,
    user: input.user,
  });
}

export async function createBillingManagementSessionForUser(input: {
  request: Request;
  userId: string;
}): Promise<
  BillingActionResult<{
    provider: BillingProvider;
    url: string;
  }>
> {
  const provider = getActiveBillingProvider();

  if (!hasActiveBillingManagementEnv()) {
    return {
      ok: false,
      status: 503,
      code: "BILLING_MANAGEMENT_NOT_CONFIGURED",
      message: `${getBillingProviderLabel(provider)} пока не настроен для управления оплатой.`,
      details: {
        missing: getMissingActiveBillingManagementEnv(),
        provider,
      },
    };
  }

  if (provider === "cloudpayments") {
    return {
      ok: true,
      data: {
        provider,
        url: getCloudpaymentsManagementUrl(),
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
      code: "BILLING_MANAGEMENT_UNAVAILABLE",
      message:
        "Для этого аккаунта ещё не найден идентификатор клиента у платёжного провайдера.",
      details: {
        provider: "stripe",
      },
    };
  }

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.provider_customer_id,
    return_url: `${resolveRequestOrigin(input.request)}/settings?billing=portal_return&section=billing`,
  });

  return {
    ok: true,
    data: {
      provider: "stripe",
      url: session.url,
    },
  };
}
