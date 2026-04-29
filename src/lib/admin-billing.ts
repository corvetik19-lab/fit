import {
  isTransientRuntimeError,
  withTransientRetry,
} from "@/lib/runtime-retry";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type AdminSubscriptionAction =
  | "grant_trial"
  | "activate_subscription"
  | "mark_past_due"
  | "cancel_subscription";

export type AdminEntitlementAction =
  | "enable_entitlement"
  | "disable_entitlement";

type AdminBillingSupabase = ReturnType<typeof createAdminSupabaseClient>;

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SUBSCRIPTION_DAYS = 30;
const DEFAULT_TRIAL_DAYS = 14;
const MAX_ADMIN_PERIOD_DAYS = 365;
const ADMIN_BILLING_RETRY_OPTIONS = {
  attempts: 4,
  delaysMs: [500, 1_500, 3_000],
} as const;

async function runAdminBillingQuery<T extends { error: unknown | null }>(
  factory: () => Promise<T>,
) {
  return await withTransientRetry(async () => {
    const result = await factory();

    if (result.error && isTransientRuntimeError(result.error)) {
      throw result.error;
    }

    return result;
  }, ADMIN_BILLING_RETRY_OPTIONS);
}

function normalizePeriodDays(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(value ?? fallback), 1), MAX_ADMIN_PERIOD_DAYS);
}

function getDateTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function getExtensionBaseDate(
  currentPeriodEnd: string | null | undefined,
  now: Date,
) {
  const currentPeriodEndTime = getDateTime(currentPeriodEnd);

  if (currentPeriodEndTime && currentPeriodEndTime > now.getTime()) {
    return new Date(currentPeriodEndTime);
  }

  return now;
}

function getExtendedPeriodEnd(baseDate: Date, days: number) {
  return new Date(baseDate.getTime() + days * DAY_IN_MS).toISOString();
}

function shouldReuseCurrentPeriodStart(input: {
  currentPeriodEnd: string | null | undefined;
  currentPeriodStart: string | null | undefined;
  now: Date;
  status: string | null | undefined;
  nextStatus: string;
}) {
  if (!input.currentPeriodStart || input.status !== input.nextStatus) {
    return false;
  }

  const currentPeriodEndTime = getDateTime(input.currentPeriodEnd);
  return Boolean(currentPeriodEndTime && currentPeriodEndTime > input.now.getTime());
}

export async function applyAdminSubscriptionAction(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  {
    action,
    durationDays,
    provider,
    userId,
  }: {
    action: AdminSubscriptionAction;
    durationDays?: number;
    provider?: string;
    userId: string;
  },
) {
  const { data: existingSubscription, error: existingSubscriptionError } =
    await runAdminBillingQuery(
      async () =>
        await adminSupabase
          .from("subscriptions")
          .select("id, provider, status, current_period_start, current_period_end")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
    );

  if (existingSubscriptionError) {
    throw existingSubscriptionError;
  }

  const nowDate = new Date();
  const now = nowDate.toISOString();
  const providerValue =
    provider?.trim() ||
    (action === "grant_trial"
      ? "admin_trial"
      : existingSubscription?.provider || "admin_console");
  const nextStatus =
    action === "grant_trial"
      ? "trial"
      : action === "activate_subscription"
        ? "active"
        : action === "mark_past_due"
          ? "past_due"
          : "canceled";
  const normalizedDurationDays =
    action === "grant_trial"
      ? normalizePeriodDays(durationDays, DEFAULT_TRIAL_DAYS)
      : action === "activate_subscription"
        ? normalizePeriodDays(durationDays, DEFAULT_SUBSCRIPTION_DAYS)
        : null;
  const periodBaseDate =
    normalizedDurationDays !== null
      ? getExtensionBaseDate(existingSubscription?.current_period_end, nowDate)
      : null;
  const nextPeriodEnd =
    normalizedDurationDays !== null && periodBaseDate
      ? getExtendedPeriodEnd(periodBaseDate, normalizedDurationDays)
      : action === "cancel_subscription"
        ? now
        : existingSubscription?.current_period_end ?? null;
  const nextPeriodStart =
    normalizedDurationDays !== null
      ? shouldReuseCurrentPeriodStart({
          currentPeriodEnd: existingSubscription?.current_period_end,
          currentPeriodStart: existingSubscription?.current_period_start,
          nextStatus,
          now: nowDate,
          status: existingSubscription?.status,
        })
        ? existingSubscription?.current_period_start
        : now
      : null;
  const periodStartMutationValue =
    action === "grant_trial" || action === "activate_subscription"
      ? nextPeriodStart
      : undefined;
  const periodStartInsertValue =
    action === "grant_trial" || action === "activate_subscription"
      ? nextPeriodStart
      : null;
  const { data, error } = await runAdminBillingQuery(async () => {
    const mutation = existingSubscription?.id
      ? adminSupabase
          .from("subscriptions")
          .update({
            provider: providerValue,
            status: nextStatus,
            current_period_start: periodStartMutationValue,
            current_period_end: nextPeriodEnd,
            updated_at: now,
          })
          .eq("id", existingSubscription.id)
      : adminSupabase.from("subscriptions").insert({
          user_id: userId,
          provider: providerValue,
          status: nextStatus,
          current_period_start: periodStartInsertValue,
          current_period_end: nextPeriodEnd,
          updated_at: now,
        });

    return await mutation
      .select(
        "id, status, provider, current_period_start, current_period_end, updated_at",
      )
      .single();
  });

  if (error) {
    throw error;
  }

  return {
    ...data,
    admin_duration_days: normalizedDurationDays,
    admin_period_base: periodBaseDate?.toISOString() ?? null,
    admin_previous_period_end: existingSubscription?.current_period_end ?? null,
  };
}

export async function applyAdminEntitlementAction(
  adminSupabase: AdminBillingSupabase,
  {
    action,
    featureKey,
    limitValue,
    userId,
  }: {
    action: AdminEntitlementAction;
    featureKey: string;
    limitValue?: number | null;
    userId: string;
  },
) {
  const { data, error } = await runAdminBillingQuery(
    async () =>
      await adminSupabase
        .from("entitlements")
        .upsert(
          {
            user_id: userId,
            feature_key: featureKey,
            limit_value: limitValue ?? null,
            is_enabled: action === "enable_entitlement",
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,feature_key",
          },
        )
        .select("id, feature_key, limit_value, is_enabled, updated_at")
        .single(),
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function recordAdminSubscriptionEvent(
  adminSupabase: AdminBillingSupabase,
  input: {
    eventType: string;
    payload: Record<string, unknown>;
    subscriptionId?: string | null;
    userId: string;
  },
) {
  const { error } = await runAdminBillingQuery(
    async () =>
      await adminSupabase.from("subscription_events").insert({
        user_id: input.userId,
        subscription_id: input.subscriptionId ?? null,
        event_type: input.eventType,
        payload: input.payload,
      }),
  );

  if (error) {
    throw error;
  }
}

export async function recordAdminBillingAudit(
  adminSupabase: AdminBillingSupabase,
  input: {
    action: string;
    actorUserId: string;
    payload: Record<string, unknown>;
    reason: string;
    targetUserId: string;
  },
) {
  const { error } = await runAdminBillingQuery(
    async () =>
      await adminSupabase.from("admin_audit_logs").insert({
        actor_user_id: input.actorUserId,
        target_user_id: input.targetUserId,
        action: input.action,
        reason: input.reason,
        payload: input.payload,
      }),
  );

  if (error) {
    throw error;
  }
}
