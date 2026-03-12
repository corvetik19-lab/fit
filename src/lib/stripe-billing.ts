import Stripe from "stripe";

import { serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>;

type SubscriptionRow = {
  current_period_end: string | null;
  current_period_start: string | null;
  id: string;
  provider: string;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  status: string;
  updated_at: string | null;
  user_id: string;
};

type StripeLinkedSubscriptionRow = Pick<
  SubscriptionRow,
  | "current_period_end"
  | "current_period_start"
  | "id"
  | "provider"
  | "provider_customer_id"
  | "provider_subscription_id"
  | "status"
  | "updated_at"
  | "user_id"
>;

export type StripeUserSubscriptionReconciliation = {
  previousSubscription: StripeLinkedSubscriptionRow | null;
  source: "provider_customer_id" | "provider_subscription_id";
  stripeSubscriptionId: string;
  subscription: SubscriptionRow;
  userId: string;
};

let stripeClient: Stripe | null = null;

function toIsoTimestamp(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "trialing":
      return "trial";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
    case "paused":
      return "canceled";
    default:
      return "canceled";
  }
}

function getStripeCustomerId(
  customer:
    | string
    | Stripe.Customer
    | Stripe.DeletedCustomer
    | null
    | undefined,
) {
  if (!customer) {
    return null;
  }

  return typeof customer === "string" ? customer : customer.id;
}

function getStripeSubscriptionId(
  subscription:
    | string
    | Stripe.Subscription
    | null
    | undefined,
) {
  if (!subscription) {
    return null;
  }

  return typeof subscription === "string" ? subscription : subscription.id;
}

function getStripeSubscriptionPeriod(stripeSubscription: Stripe.Subscription) {
  let currentPeriodStart: number | null = null;
  let currentPeriodEnd: number | null = null;

  for (const item of stripeSubscription.items.data) {
    currentPeriodStart =
      currentPeriodStart === null
        ? item.current_period_start
        : Math.min(currentPeriodStart, item.current_period_start);
    currentPeriodEnd =
      currentPeriodEnd === null
        ? item.current_period_end
        : Math.max(currentPeriodEnd, item.current_period_end);
  }

  return {
    currentPeriodEnd:
      currentPeriodEnd ?? stripeSubscription.cancel_at ?? null,
    currentPeriodStart:
      currentPeriodStart ??
      stripeSubscription.billing_cycle_anchor ??
      stripeSubscription.start_date,
  };
}

function getStripeMetadataUserId(metadata: Record<string, string> | null | undefined) {
  const userId = metadata?.userId?.trim();
  return userId ? userId : null;
}

export function getStripeClient() {
  if (!serverEnv.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  stripeClient ??= new Stripe(serverEnv.STRIPE_SECRET_KEY);
  return stripeClient;
}

export function getStripePremiumMonthlyPriceId() {
  if (!serverEnv.STRIPE_PREMIUM_MONTHLY_PRICE_ID) {
    throw new Error("STRIPE_PREMIUM_MONTHLY_PRICE_ID is not configured.");
  }

  return serverEnv.STRIPE_PREMIUM_MONTHLY_PRICE_ID;
}

export function resolveRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost && forwardedProto) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

async function findStripeSubscriptionRowByReferences(
  adminSupabase: AdminSupabaseClient,
  {
    providerCustomerId,
    providerSubscriptionId,
    userId,
  }: {
    providerCustomerId?: string | null;
    providerSubscriptionId?: string | null;
    userId?: string | null;
  },
) {
  if (providerSubscriptionId) {
    const { data, error } = await adminSupabase
      .from("subscriptions")
      .select(
        "id, user_id, provider, provider_subscription_id, provider_customer_id, status, current_period_start, current_period_end, updated_at",
      )
      .eq("provider", "stripe")
      .eq("provider_subscription_id", providerSubscriptionId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data as SubscriptionRow;
    }
  }

  if (providerCustomerId) {
    const { data, error } = await adminSupabase
      .from("subscriptions")
      .select(
        "id, user_id, provider, provider_subscription_id, provider_customer_id, status, current_period_start, current_period_end, updated_at",
      )
      .eq("provider", "stripe")
      .eq("provider_customer_id", providerCustomerId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data as SubscriptionRow;
    }
  }

  if (userId) {
    const { data, error } = await adminSupabase
      .from("subscriptions")
      .select(
        "id, user_id, provider, provider_subscription_id, provider_customer_id, status, current_period_start, current_period_end, updated_at",
      )
      .eq("provider", "stripe")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data as SubscriptionRow;
    }
  }

  return null;
}

export async function ensureStripeCustomerForUser(
  adminSupabase: AdminSupabaseClient,
  {
    email,
    fullName,
    userId,
  }: {
    email: string | null;
    fullName?: string | null;
    userId: string;
  },
) {
  const existingRow = await findStripeSubscriptionRowByReferences(adminSupabase, {
    userId,
  });

  if (existingRow?.provider_customer_id) {
    return existingRow.provider_customer_id;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: {
      userId,
    },
    name: fullName ?? undefined,
  });

  return customer.id;
}

export async function resolveStripeUserId(
  adminSupabase: AdminSupabaseClient,
  {
    explicitUserId,
    providerCustomerId,
    providerSubscriptionId,
  }: {
    explicitUserId?: string | null;
    providerCustomerId?: string | null;
    providerSubscriptionId?: string | null;
  },
) {
  if (explicitUserId) {
    return explicitUserId;
  }

  const existingRow = await findStripeSubscriptionRowByReferences(adminSupabase, {
    providerCustomerId,
    providerSubscriptionId,
  });

  return existingRow?.user_id ?? null;
}

export async function hasProcessedStripeEvent(
  adminSupabase: AdminSupabaseClient,
  providerEventId: string,
) {
  const { data, error } = await adminSupabase
    .from("subscription_events")
    .select("id")
    .eq("provider_event_id", providerEventId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function recordStripeEvent(
  adminSupabase: AdminSupabaseClient,
  {
    eventType,
    payload,
    providerEventId,
    subscriptionId,
    userId,
  }: {
    eventType: string;
    payload: Record<string, unknown>;
    providerEventId?: string | null;
    subscriptionId?: string | null;
    userId: string;
  },
) {
  if (providerEventId) {
    const alreadyProcessed = await hasProcessedStripeEvent(
      adminSupabase,
      providerEventId,
    );

    if (alreadyProcessed) {
      return null;
    }
  }

  const { data, error } = await adminSupabase
    .from("subscription_events")
    .insert({
      event_type: eventType,
      payload,
      provider_event_id: providerEventId ?? null,
      subscription_id: subscriptionId ?? null,
      user_id: userId,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertStripeSubscriptionRecord(
  adminSupabase: AdminSupabaseClient,
  {
    providerCustomerId,
    stripeSubscription,
    userId,
  }: {
    providerCustomerId: string | null;
    stripeSubscription: Stripe.Subscription;
    userId: string;
  },
) {
  const existingRow = await findStripeSubscriptionRowByReferences(adminSupabase, {
    providerCustomerId,
    providerSubscriptionId: stripeSubscription.id,
    userId,
  });
  const subscriptionPeriod = getStripeSubscriptionPeriod(stripeSubscription);
  const nextValues = {
    current_period_end: toIsoTimestamp(subscriptionPeriod.currentPeriodEnd),
    current_period_start: toIsoTimestamp(subscriptionPeriod.currentPeriodStart),
    provider: "stripe",
    provider_customer_id: providerCustomerId,
    provider_subscription_id: stripeSubscription.id,
    status: mapStripeSubscriptionStatus(stripeSubscription.status),
    updated_at: new Date().toISOString(),
  };

  const mutation = existingRow?.id
    ? adminSupabase
        .from("subscriptions")
        .update(nextValues)
        .eq("id", existingRow.id)
    : adminSupabase.from("subscriptions").insert({
        ...nextValues,
        user_id: userId,
      });

  const { data, error } = await mutation
    .select(
      "id, user_id, provider, provider_customer_id, provider_subscription_id, status, current_period_start, current_period_end, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return data as SubscriptionRow;
}

export async function reconcileStripeSubscription(
  adminSupabase: AdminSupabaseClient,
  {
    event,
    stripeSubscription,
  }: {
    event?: Stripe.Event | null;
    stripeSubscription: Stripe.Subscription;
  },
) {
  const providerCustomerId = getStripeCustomerId(stripeSubscription.customer);
  const explicitUserId = getStripeMetadataUserId(stripeSubscription.metadata);
  const userId = await resolveStripeUserId(adminSupabase, {
    explicitUserId,
    providerCustomerId,
    providerSubscriptionId: stripeSubscription.id,
  });

  if (!userId) {
    logger.warn("stripe subscription reconciliation skipped because user could not be resolved", {
      eventId: event?.id ?? null,
      providerCustomerId,
      providerSubscriptionId: stripeSubscription.id,
      stripeStatus: stripeSubscription.status,
    });

    return null;
  }

  const subscription = await upsertStripeSubscriptionRecord(adminSupabase, {
    providerCustomerId,
    stripeSubscription,
    userId,
  });

  await recordStripeEvent(adminSupabase, {
    eventType: event?.type ?? "stripe.subscription.reconciled",
    payload: {
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      currentPeriodEnd: subscription.current_period_end,
      currentPeriodStart: subscription.current_period_start,
      providerCustomerId,
      providerSubscriptionId: stripeSubscription.id,
      stripeStatus: stripeSubscription.status,
      userId,
    },
    providerEventId: event?.id ?? null,
    subscriptionId: subscription.id,
    userId,
  });

  return {
    subscription,
    userId,
  };
}

export async function reconcileStripeCheckoutSession(
  adminSupabase: AdminSupabaseClient,
  checkoutSession: Stripe.Checkout.Session,
  event?: Stripe.Event | null,
) {
  const stripe = getStripeClient();
  const providerSubscriptionId = getStripeSubscriptionId(checkoutSession.subscription);
  const providerCustomerId = getStripeCustomerId(checkoutSession.customer);
  const explicitUserId =
    getStripeMetadataUserId(checkoutSession.metadata) ??
    checkoutSession.client_reference_id ??
    null;

  if (!providerSubscriptionId) {
    if (explicitUserId) {
      await recordStripeEvent(adminSupabase, {
        eventType: event?.type ?? "checkout.session.completed",
        payload: {
          checkoutSessionId: checkoutSession.id,
          mode: checkoutSession.mode,
          providerCustomerId,
          providerSubscriptionId: null,
        },
        providerEventId: event?.id ?? null,
        subscriptionId: null,
        userId: explicitUserId,
      });
    }

    return null;
  }

  const subscription = await stripe.subscriptions.retrieve(providerSubscriptionId);
  const reconciliation = await reconcileStripeSubscription(adminSupabase, {
    event,
    stripeSubscription: subscription,
  });

  if (reconciliation) {
    return reconciliation;
  }

  const resolvedUserId = await resolveStripeUserId(adminSupabase, {
    explicitUserId,
    providerCustomerId,
    providerSubscriptionId,
  });

  if (!resolvedUserId) {
    return null;
  }

  await recordStripeEvent(adminSupabase, {
    eventType: event?.type ?? "checkout.session.completed",
    payload: {
      checkoutSessionId: checkoutSession.id,
      mode: checkoutSession.mode,
      providerCustomerId,
      providerSubscriptionId,
    },
    providerEventId: event?.id ?? null,
    subscriptionId: null,
    userId: resolvedUserId,
  });

  return null;
}

export async function reconcileStripeSubscriptionForUser(
  adminSupabase: AdminSupabaseClient,
  userId: string,
): Promise<StripeUserSubscriptionReconciliation | null> {
  const { data: subscriptionRow, error: subscriptionRowError } = await adminSupabase
    .from("subscriptions")
    .select(
      "id, user_id, provider, provider_subscription_id, provider_customer_id, status, current_period_start, current_period_end, updated_at",
    )
    .eq("user_id", userId)
    .eq("provider", "stripe")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionRowError) {
    throw subscriptionRowError;
  }

  if (!subscriptionRow) {
    return null;
  }

  const previousSubscription = subscriptionRow as StripeLinkedSubscriptionRow;
  const stripe = getStripeClient();
  let source: StripeUserSubscriptionReconciliation["source"] | null = null;
  let stripeSubscription: Stripe.Subscription | null = null;

  if (subscriptionRow.provider_subscription_id) {
    stripeSubscription = await stripe.subscriptions.retrieve(
      subscriptionRow.provider_subscription_id,
    );
    source = "provider_subscription_id";
  } else if (subscriptionRow.provider_customer_id) {
    const subscriptions = await stripe.subscriptions.list({
      customer: subscriptionRow.provider_customer_id,
      limit: 1,
      status: "all",
    });

    stripeSubscription = subscriptions.data[0] ?? null;
    source = stripeSubscription ? "provider_customer_id" : null;
  }

  if (!stripeSubscription || !source) {
    return null;
  }

  const reconciliation = await reconcileStripeSubscription(adminSupabase, {
    event: null,
    stripeSubscription,
  });

  if (!reconciliation) {
    return null;
  }

  return {
    previousSubscription,
    source,
    stripeSubscriptionId: stripeSubscription.id,
    subscription: reconciliation.subscription,
    userId: reconciliation.userId,
  };
}
