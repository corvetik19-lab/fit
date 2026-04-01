import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { serverEnv, publicEnv } from "@/lib/env";
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

type CloudpaymentsLinkedSubscriptionRow = Pick<
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

export type CloudpaymentsSubscriptionModel = {
  AccountId: string | null;
  Amount: number | null;
  Currency: string | null;
  Description: string | null;
  Email: string | null;
  FailedTransactionsNumber: number | null;
  Id: string;
  Interval: string | null;
  LastTransactionDateIso: string | null;
  MaxPeriods: number | null;
  NextTransactionDateIso: string | null;
  Period: number | null;
  StartDateIso: string | null;
  Status: string | null;
  SuccessfulTransactionsNumber: number | null;
};

export type CloudpaymentsUserSubscriptionReconciliation = {
  cloudpaymentsSubscriptionId: string;
  previousSubscription: CloudpaymentsLinkedSubscriptionRow | null;
  source: "account_id" | "provider_subscription_id";
  subscription: SubscriptionRow;
  userId: string;
};

export type CloudpaymentsWebhookProcessResult = {
  duplicate: boolean;
  received: true;
};

type CloudpaymentsApiEnvelope<TModel> = {
  Message: string | null;
  Model: TModel;
  Success: boolean;
};

type CloudpaymentsApiListEnvelope<TModel> = {
  Message: string | null;
  Model: TModel[];
  Success: boolean;
};

export type CloudpaymentsCheckoutIntent = {
  amount: number;
  currency: "RUB";
  culture: "ru-RU";
  description: string;
  email?: string;
  externalId: string;
  paymentSchema: "Single";
  publicTerminalId: string;
  skin?: "classic" | "modern" | "mini";
  recurrent: {
    amount: number;
    interval: "Month";
    period: 1;
  };
  userInfo: {
    accountId: string;
    email?: string;
    fullName?: string;
  };
};

const CLOUDPAYMENTS_MANAGEMENT_URL = "https://my.cloudpayments.ru/";

type CloudpaymentsWebhookPayload = Record<string, unknown>;

function parseAmount(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = Number(value.replace(",", "."));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

function normalizeIso(value: unknown) {
  return typeof value === "string" && value.trim().length ? value : null;
}

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim().length ? value : null;
}

function normalizeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function mapCloudpaymentsSubscription(raw: Record<string, unknown>): CloudpaymentsSubscriptionModel {
  return {
    AccountId: normalizeString(raw.AccountId),
    Amount: normalizeNumber(raw.Amount),
    Currency: normalizeString(raw.Currency),
    Description: normalizeString(raw.Description),
    Email: normalizeString(raw.Email),
    FailedTransactionsNumber: normalizeNumber(raw.FailedTransactionsNumber),
    Id: normalizeString(raw.Id) ?? "",
    Interval: normalizeString(raw.Interval),
    LastTransactionDateIso: normalizeIso(raw.LastTransactionDateIso),
    MaxPeriods: normalizeNumber(raw.MaxPeriods),
    NextTransactionDateIso: normalizeIso(raw.NextTransactionDateIso),
    Period: normalizeNumber(raw.Period),
    StartDateIso: normalizeIso(raw.StartDateIso),
    Status: normalizeString(raw.Status),
    SuccessfulTransactionsNumber: normalizeNumber(raw.SuccessfulTransactionsNumber),
  };
}

function mapCloudpaymentsStatus(status: string | null) {
  switch (status?.trim().toLowerCase()) {
    case "active":
      return "active";
    case "cancelled":
    case "canceled":
      return "canceled";
    case "completed":
      return "canceled";
    case "pending":
      return "past_due";
    default:
      return status ? "past_due" : "canceled";
  }
}

function getCloudpaymentsApiBaseUrl() {
  return "https://api.cloudpayments.ru";
}

export function getCloudpaymentsPublicId() {
  if (!publicEnv.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID) {
    throw new Error("NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID is not configured.");
  }

  return publicEnv.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID;
}

export function getCloudpaymentsApiSecret() {
  if (!serverEnv.CLOUDPAYMENTS_API_SECRET) {
    throw new Error("CLOUDPAYMENTS_API_SECRET is not configured.");
  }

  return serverEnv.CLOUDPAYMENTS_API_SECRET;
}

export function getCloudpaymentsWebhookSecret() {
  return serverEnv.CLOUDPAYMENTS_WEBHOOK_SECRET ?? getCloudpaymentsApiSecret();
}

export function getCloudpaymentsPremiumMonthlyAmountRub() {
  const parsed = parseAmount(serverEnv.CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB);

  if (!parsed) {
    throw new Error(
      "CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB is not configured.",
    );
  }

  return parsed;
}

export function getCloudpaymentsPremiumMonthlyDescription() {
  return (
    serverEnv.CLOUDPAYMENTS_PREMIUM_MONTHLY_DESCRIPTION?.trim() || "fit Premium"
  );
}

export function getCloudpaymentsManagementUrl() {
  return CLOUDPAYMENTS_MANAGEMENT_URL;
}

function getCloudpaymentsAuthorizationHeader() {
  return `Basic ${Buffer.from(
    `${getCloudpaymentsPublicId()}:${getCloudpaymentsApiSecret()}`,
  ).toString("base64")}`;
}

async function callCloudpaymentsApi<TModel>(
  path: string,
  body: Record<string, unknown>,
): Promise<TModel> {
  const response = await fetch(`${getCloudpaymentsApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      Authorization: getCloudpaymentsAuthorizationHeader(),
      "Content-Type": "application/json",
      "X-Request-ID": randomUUID(),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | CloudpaymentsApiEnvelope<TModel>
    | CloudpaymentsApiListEnvelope<TModel>
    | null;

  if (!response.ok) {
    throw new Error(
      `CloudPayments API request failed: ${response.status} ${response.statusText}`,
    );
  }

  if (!payload?.Success) {
    throw new Error(
      payload?.Message || `CloudPayments API request failed for ${path}.`,
    );
  }

  return payload.Model as TModel;
}

async function findCloudpaymentsSubscriptionRowByReferences(
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
      .eq("provider", "cloudpayments")
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
      .eq("provider", "cloudpayments")
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
      .eq("provider", "cloudpayments")
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

export async function findCloudpaymentsSubscriptionsByAccountId(accountId: string) {
  const models = await callCloudpaymentsApi<Record<string, unknown>[]>(
    "/subscriptions/find",
    {
      accountId,
    },
  );

  return models.map((model) => mapCloudpaymentsSubscription(model));
}

export async function getCloudpaymentsSubscriptionById(id: string) {
  const model = await callCloudpaymentsApi<Record<string, unknown>>(
    "/subscriptions/get",
    {
      Id: id,
    },
  );

  return mapCloudpaymentsSubscription(model);
}

function pickLatestCloudpaymentsSubscription(
  subscriptions: CloudpaymentsSubscriptionModel[],
) {
  const sorted = [...subscriptions].sort((left, right) => {
    const leftWeight = new Date(
      left.NextTransactionDateIso ??
        left.LastTransactionDateIso ??
        left.StartDateIso ??
        "1970-01-01T00:00:00.000Z",
    ).getTime();
    const rightWeight = new Date(
      right.NextTransactionDateIso ??
        right.LastTransactionDateIso ??
        right.StartDateIso ??
        "1970-01-01T00:00:00.000Z",
    ).getTime();

    return rightWeight - leftWeight;
  });

  return (
    sorted.find(
      (subscription) =>
        mapCloudpaymentsStatus(subscription.Status) === "active",
    ) ?? sorted[0] ?? null
  );
}

export async function upsertCloudpaymentsSubscriptionRecord(
  adminSupabase: AdminSupabaseClient,
  {
    subscription,
    userId,
  }: {
    subscription: CloudpaymentsSubscriptionModel;
    userId: string;
  },
) {
  const existingRow = await findCloudpaymentsSubscriptionRowByReferences(
    adminSupabase,
    {
      providerCustomerId: subscription.AccountId,
      providerSubscriptionId: subscription.Id,
      userId,
    },
  );

  const nextValues = {
    current_period_end:
      subscription.NextTransactionDateIso ??
      subscription.LastTransactionDateIso ??
      null,
    current_period_start: subscription.StartDateIso,
    provider: "cloudpayments",
    provider_customer_id: subscription.AccountId,
    provider_subscription_id: subscription.Id,
    status: mapCloudpaymentsStatus(subscription.Status),
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

async function hasProcessedCloudpaymentsEvent(
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

export async function recordCloudpaymentsEvent(
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
    const alreadyProcessed = await hasProcessedCloudpaymentsEvent(
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

export async function reconcileCloudpaymentsSubscription(
  adminSupabase: AdminSupabaseClient,
  {
    providerEventId,
    sourceEventType,
    subscription,
    userId,
  }: {
    providerEventId?: string | null;
    sourceEventType?: string | null;
    subscription: CloudpaymentsSubscriptionModel;
    userId: string;
  },
) {
  const subscriptionRow = await upsertCloudpaymentsSubscriptionRecord(
    adminSupabase,
    {
      subscription,
      userId,
    },
  );

  await recordCloudpaymentsEvent(adminSupabase, {
    eventType: sourceEventType ?? "cloudpayments.subscription.reconciled",
    payload: {
      amount: subscription.Amount,
      interval: subscription.Interval,
      nextTransactionDate: subscription.NextTransactionDateIso,
      provider: "cloudpayments",
      providerCustomerId: subscription.AccountId,
      providerSubscriptionId: subscription.Id,
      status: mapCloudpaymentsStatus(subscription.Status),
      successfulTransactionsNumber: subscription.SuccessfulTransactionsNumber,
      userId,
    },
    providerEventId: providerEventId ?? null,
    subscriptionId: subscriptionRow.id,
    userId,
  });

  return {
    subscription: subscriptionRow,
    userId,
  };
}

export async function reconcileCloudpaymentsSubscriptionForUser(
  adminSupabase: AdminSupabaseClient,
  userId: string,
): Promise<CloudpaymentsUserSubscriptionReconciliation | null> {
  const previousSubscription =
    (await findCloudpaymentsSubscriptionRowByReferences(adminSupabase, {
      userId,
    })) as CloudpaymentsLinkedSubscriptionRow | null;
  const subscriptions = await findCloudpaymentsSubscriptionsByAccountId(userId);
  const subscription = pickLatestCloudpaymentsSubscription(subscriptions);

  if (!subscription) {
    return null;
  }

  const reconciliation = await reconcileCloudpaymentsSubscription(adminSupabase, {
    sourceEventType: "cloudpayments.subscription.reconciled",
    subscription,
    userId,
  });

  return {
    cloudpaymentsSubscriptionId: subscription.Id,
    previousSubscription,
    source: previousSubscription?.provider_subscription_id
      ? "provider_subscription_id"
      : "account_id",
    subscription: reconciliation.subscription,
    userId: reconciliation.userId,
  };
}

export function buildCloudpaymentsCheckoutIntent(input: {
  fullName?: string | null;
  referenceId?: string | null;
  user: {
    email?: string | null;
    id: string;
  };
}): CloudpaymentsCheckoutIntent {
  const amount = getCloudpaymentsPremiumMonthlyAmountRub();
  const description = getCloudpaymentsPremiumMonthlyDescription();

  return {
    amount,
    currency: "RUB",
    culture: "ru-RU",
    description,
    email: input.user.email ?? undefined,
    externalId:
      input.referenceId?.trim() || `fit-premium-${input.user.id}-${Date.now()}`,
    paymentSchema: "Single",
    publicTerminalId: getCloudpaymentsPublicId(),
    skin: "modern",
    recurrent: {
      amount,
      interval: "Month",
      period: 1,
    },
    userInfo: {
      accountId: input.user.id,
      email: input.user.email ?? undefined,
      fullName: input.fullName ?? undefined,
    },
  };
}

function getCloudpaymentsNotificationSignature(
  request: Request,
  rawBody: string,
) {
  const headerSignature =
    request.headers.get("Content-HMAC") ??
    request.headers.get("X-Content-HMAC") ??
    request.headers.get("content-hmac") ??
    null;

  if (!headerSignature) {
    return {
      expected: null,
      received: null,
      valid: false,
    };
  }

  const expectedSignature = createHmac(
    "sha256",
    getCloudpaymentsWebhookSecret(),
  )
    .update(rawBody, "utf8")
    .digest("base64");

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(headerSignature);
  const valid =
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer);

  return {
    expected: expectedSignature,
    received: headerSignature,
    valid,
  };
}

export function verifyCloudpaymentsWebhookRequest(
  request: Request,
  rawBody: string,
) {
  return getCloudpaymentsNotificationSignature(request, rawBody);
}

function buildCloudpaymentsEventId(
  kind: string,
  payload: CloudpaymentsWebhookPayload,
) {
  const transactionId = normalizeString(payload.TransactionId);
  const subscriptionId =
    normalizeString(payload.SubscriptionId) ?? normalizeString(payload.Id);
  const status = normalizeString(payload.Status);
  const accountId = normalizeString(payload.AccountId);
  const statusWeight =
    normalizeNumber(payload.SuccessfulTransactionsNumber) ??
    normalizeNumber(payload.FailedTransactionsNumber) ??
    0;

  if (transactionId) {
    return `cloudpayments:${kind}:tx:${transactionId}`;
  }

  if (subscriptionId) {
    return `cloudpayments:${kind}:sub:${subscriptionId}:${status ?? "unknown"}:${statusWeight}`;
  }

  if (accountId) {
    return `cloudpayments:${kind}:account:${accountId}:${status ?? "unknown"}:${statusWeight}`;
  }

  return null;
}

async function resolveCloudpaymentsWebhookUserId(
  adminSupabase: AdminSupabaseClient,
  payload: CloudpaymentsWebhookPayload,
) {
  const explicitAccountId = normalizeString(payload.AccountId);

  if (explicitAccountId) {
    return explicitAccountId;
  }

  const subscriptionId =
    normalizeString(payload.SubscriptionId) ?? normalizeString(payload.Id);

  if (subscriptionId) {
    const existingRow = await findCloudpaymentsSubscriptionRowByReferences(
      adminSupabase,
      {
        providerSubscriptionId: subscriptionId,
      },
    );

    return existingRow?.user_id ?? null;
  }

  return null;
}

export async function processCloudpaymentsWebhookNotification(
  adminSupabase: AdminSupabaseClient,
  kind: string,
  payload: CloudpaymentsWebhookPayload,
): Promise<CloudpaymentsWebhookProcessResult> {
  const providerEventId = buildCloudpaymentsEventId(kind, payload);

  if (
    providerEventId &&
    (await hasProcessedCloudpaymentsEvent(adminSupabase, providerEventId))
  ) {
    return {
      duplicate: true,
      received: true,
    };
  }

  const userId = await resolveCloudpaymentsWebhookUserId(adminSupabase, payload);

  if (!userId) {
    logger.warn("cloudpayments webhook skipped because user could not be resolved", {
      kind,
      payload,
    });

    return {
      duplicate: false,
      received: true,
    };
  }

  const subscriptionId =
    normalizeString(payload.SubscriptionId) ?? normalizeString(payload.Id);

  if (subscriptionId) {
    const subscription = await getCloudpaymentsSubscriptionById(subscriptionId);

    await reconcileCloudpaymentsSubscription(adminSupabase, {
      providerEventId,
      sourceEventType: `cloudpayments.${kind}`,
      subscription,
      userId,
    });
  } else {
    await recordCloudpaymentsEvent(adminSupabase, {
      eventType: `cloudpayments.${kind}`,
      payload: {
        ...payload,
        provider: "cloudpayments",
      },
      providerEventId,
      subscriptionId: null,
      userId,
    });
  }

  return {
    duplicate: false,
    received: true,
  };
}
