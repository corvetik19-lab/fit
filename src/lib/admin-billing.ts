import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type AdminSubscriptionAction =
  | "grant_trial"
  | "activate_subscription"
  | "mark_past_due"
  | "cancel_subscription";

export type AdminEntitlementAction =
  | "enable_entitlement"
  | "disable_entitlement";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getPeriodEnd(days: number) {
  return new Date(Date.now() + days * DAY_IN_MS).toISOString();
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
    await adminSupabase
      .from("subscriptions")
      .select("id, provider, current_period_end")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (existingSubscriptionError) {
    throw existingSubscriptionError;
  }

  const now = new Date().toISOString();
  const providerValue =
    provider?.trim() || existingSubscription?.provider || "admin_console";
  const nextStatus =
    action === "grant_trial"
      ? "trial"
      : action === "activate_subscription"
        ? "active"
        : action === "mark_past_due"
          ? "past_due"
          : "canceled";
  const nextPeriodEnd =
    action === "grant_trial"
      ? getPeriodEnd(durationDays ?? 14)
      : action === "activate_subscription"
        ? getPeriodEnd(durationDays ?? 30)
        : action === "cancel_subscription"
          ? now
          : existingSubscription?.current_period_end ?? null;
  const mutation = existingSubscription?.id
    ? adminSupabase
        .from("subscriptions")
        .update({
          provider: providerValue,
          status: nextStatus,
          current_period_start:
            action === "grant_trial" || action === "activate_subscription"
              ? now
              : undefined,
          current_period_end: nextPeriodEnd,
          updated_at: now,
        })
        .eq("id", existingSubscription.id)
    : adminSupabase.from("subscriptions").insert({
        user_id: userId,
        provider: providerValue,
        status: nextStatus,
        current_period_start:
          action === "grant_trial" || action === "activate_subscription" ? now : null,
        current_period_end: nextPeriodEnd,
        updated_at: now,
      });

  const { data, error } = await mutation
    .select(
      "id, status, provider, current_period_start, current_period_end, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function applyAdminEntitlementAction(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
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
  const { data, error } = await adminSupabase
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
    .single();

  if (error) {
    throw error;
  }

  return data;
}
