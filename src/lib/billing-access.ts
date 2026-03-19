import type { SupabaseClient } from "@supabase/supabase-js";

import { isPrimarySuperAdminEmail } from "@/lib/admin-permissions";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";

export const BILLING_FEATURE_KEYS = {
  aiChat: "ai_chat",
  mealPlan: "meal_plan",
  workoutPlan: "workout_plan",
  mealPhoto: "meal_photo",
} as const;

type BillingFeatureConfig = {
  description: string;
  label: string;
  metricKey: string;
  requiresSubscription: boolean;
};

type BillingFeatureConfigMap = Record<
  (typeof BILLING_FEATURE_KEYS)[keyof typeof BILLING_FEATURE_KEYS],
  BillingFeatureConfig
>;

type BillingFeatureKey =
  (typeof BILLING_FEATURE_KEYS)[keyof typeof BILLING_FEATURE_KEYS];

type AccessSource = "default" | "subscription" | "entitlement" | "privileged";

type SubscriptionSnapshot = {
  currentPeriodEnd: string | null;
  isActive: boolean;
  isPrivilegedAccess: boolean;
  provider: string | null;
  status: string | null;
  updatedAt: string | null;
};

type FeatureUsageSnapshot = {
  count: number;
  limit: number | null;
  metricKey: string;
  remaining: number | null;
  resetAt: string | null;
};

export type FeatureAccessSnapshot = {
  allowed: boolean;
  description: string;
  featureKey: BillingFeatureKey;
  label: string;
  reason: string | null;
  source: AccessSource;
  usage: FeatureUsageSnapshot;
};

export type UserBillingAccessSnapshot = {
  features: Record<BillingFeatureKey, FeatureAccessSnapshot>;
  subscription: SubscriptionSnapshot;
};

type SubscriptionRow = {
  current_period_end: string | null;
  provider: string | null;
  status: string | null;
  updated_at: string | null;
};

type EntitlementRow = {
  feature_key: string;
  is_enabled: boolean;
  limit_value: number | null;
};

type UsageCounterRow = {
  id: string;
  metric_key: string;
  metric_window: string;
  reset_at: string | null;
  usage_count: number | string;
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trial"]);
const MONTHLY_WINDOW = "monthly";

const FEATURE_CONFIG: BillingFeatureConfigMap = {
  ai_chat: {
    label: "AI-чат",
    description: "Контекстный AI-коуч и диалог по профилю пользователя.",
    metricKey: "ai_chat_messages",
    requiresSubscription: false,
  },
  meal_plan: {
    label: "AI-план питания",
    description: "Сборка плана питания в черновик и применение его в приложение.",
    metricKey: "ai_meal_plan_generations",
    requiresSubscription: true,
  },
  workout_plan: {
    label: "AI-план тренировок",
    description: "Сборка тренировочной недели в черновик и применение её в приложение.",
    metricKey: "ai_workout_plan_generations",
    requiresSubscription: true,
  },
  meal_photo: {
    label: "AI-анализ фото еды",
    description: "Оценка состава блюда и КБЖУ по фотографии.",
    metricKey: "ai_meal_photo_analyses",
    requiresSubscription: true,
  },
};

function getNextMonthlyResetAt(now = new Date()) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  ).toISOString();
}

function isCounterExpired(resetAt: string | null, now = new Date()) {
  return !resetAt || new Date(resetAt).getTime() <= now.getTime();
}

function toSafeCount(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function isSubscriptionActive(row: SubscriptionRow | null) {
  if (!row?.status) {
    return false;
  }

  const normalizedStatus = row.status.trim().toLowerCase();

  if (!ACTIVE_SUBSCRIPTION_STATUSES.has(normalizedStatus)) {
    return false;
  }

  if (!row.current_period_end) {
    return true;
  }

  return new Date(row.current_period_end).getTime() >= Date.now();
}

function resolveUsageSnapshot(
  metricKey: string,
  limit: number | null,
  row: UsageCounterRow | null | undefined,
) {
  const expired = row ? isCounterExpired(row.reset_at) : true;
  const count = row && !expired ? toSafeCount(row.usage_count) : 0;
  const resetAt = row && !expired ? row.reset_at : getNextMonthlyResetAt();
  const remaining =
    typeof limit === "number" ? Math.max(limit - count, 0) : null;

  return {
    count,
    limit,
    metricKey,
    remaining,
    resetAt,
  };
}

function buildFeatureAccess(
  featureKey: BillingFeatureKey,
  subscription: SubscriptionRow | null,
  entitlement: EntitlementRow | null | undefined,
  usageCounter: UsageCounterRow | null | undefined,
): FeatureAccessSnapshot {
  const config = FEATURE_CONFIG[featureKey];
  const subscriptionActive = isSubscriptionActive(subscription);
  const hasEntitlement = Boolean(entitlement);
  const usage = resolveUsageSnapshot(
    config.metricKey,
    entitlement?.is_enabled ? entitlement.limit_value ?? null : null,
    usageCounter,
  );

  if (hasEntitlement && !entitlement?.is_enabled) {
    return {
      featureKey,
      label: config.label,
      description: config.description,
      allowed: false,
      reason: "Функция отключена администратором.",
      source: "entitlement",
      usage,
    };
  }

  if (hasEntitlement && entitlement?.is_enabled) {
    return {
      featureKey,
      label: config.label,
      description: config.description,
      allowed:
        typeof usage.limit === "number" ? usage.count < usage.limit : true,
      reason:
        typeof usage.limit === "number" && usage.count >= usage.limit
          ? "Лимит на текущий период исчерпан."
          : null,
      source: "entitlement",
      usage,
    };
  }

  if (config.requiresSubscription && !subscriptionActive) {
    return {
      featureKey,
      label: config.label,
      description: config.description,
      allowed: false,
      reason:
        "Нужен активный пробный доступ, подписка или ручное открытие функции супер-админом.",
      source: "default",
      usage,
    };
  }

  return {
    featureKey,
    label: config.label,
    description: config.description,
    allowed: true,
    reason: null,
    source:
      subscriptionActive && config.requiresSubscription
        ? "subscription"
        : "default",
    usage,
  };
}

export async function readUserBillingAccess(
  supabase: Pick<SupabaseClient, "from">,
  userId: string,
  options?: {
    email?: string | null;
  },
): Promise<UserBillingAccessSnapshot> {
  const featureKeys = Object.values(BILLING_FEATURE_KEYS);
  const metricKeys = Object.values(FEATURE_CONFIG).map(
    (feature) => feature.metricKey,
  );

  const [subscriptionResult, entitlementsResult, usageCountersResult] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("status, provider, current_period_end, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("entitlements")
        .select("feature_key, is_enabled, limit_value")
        .eq("user_id", userId)
        .in("feature_key", featureKeys),
      supabase
        .from("usage_counters")
        .select("id, metric_key, metric_window, usage_count, reset_at")
        .eq("user_id", userId)
        .eq("metric_window", MONTHLY_WINDOW)
        .in("metric_key", metricKeys),
    ]);

  if (subscriptionResult.error) {
    throw subscriptionResult.error;
  }

  if (entitlementsResult.error) {
    throw entitlementsResult.error;
  }

  if (usageCountersResult.error) {
    throw usageCountersResult.error;
  }

  const subscription =
    (subscriptionResult.data as SubscriptionRow | null) ?? null;
  const entitlementsByFeature = new Map(
    ((entitlementsResult.data as EntitlementRow[] | null) ?? []).map((row) => [
      row.feature_key,
      row,
    ]),
  );
  const usageByMetric = new Map(
    ((usageCountersResult.data as UsageCounterRow[] | null) ?? []).map(
      (row) => [row.metric_key, row],
    ),
  );

  if (isPrimarySuperAdminEmail(options?.email)) {
    const privilegedFeatures = Object.fromEntries(
      featureKeys.map((featureKey) => {
        const config = FEATURE_CONFIG[featureKey];
        const usage = resolveUsageSnapshot(
          config.metricKey,
          null,
          usageByMetric.get(config.metricKey),
        );

        return [
          featureKey,
          {
            featureKey,
            label: config.label,
            description: config.description,
            allowed: true,
            reason: null,
            source: "privileged",
            usage,
          } satisfies FeatureAccessSnapshot,
        ];
      }),
    ) as Record<BillingFeatureKey, FeatureAccessSnapshot>;

    return {
      subscription: {
        status: "root_access",
        provider: "admin",
        currentPeriodEnd: null,
        updatedAt: null,
        isActive: true,
        isPrivilegedAccess: true,
      },
      features: privilegedFeatures,
    };
  }

  const features = Object.fromEntries(
    featureKeys.map((featureKey) => [
      featureKey,
      buildFeatureAccess(
        featureKey,
        subscription,
        entitlementsByFeature.get(featureKey),
        usageByMetric.get(FEATURE_CONFIG[featureKey].metricKey),
      ),
    ]),
  ) as Record<BillingFeatureKey, FeatureAccessSnapshot>;

  return {
    subscription: {
      status: subscription?.status ?? null,
      provider: subscription?.provider ?? null,
      currentPeriodEnd: subscription?.current_period_end ?? null,
      updatedAt: subscription?.updated_at ?? null,
      isActive: isSubscriptionActive(subscription),
      isPrivilegedAccess: false,
    },
    features,
  };
}

export function createFallbackUserBillingAccessSnapshot(options?: {
  email?: string | null;
}): UserBillingAccessSnapshot {
  const featureKeys = Object.values(BILLING_FEATURE_KEYS);

  if (isPrimarySuperAdminEmail(options?.email)) {
    const privilegedFeatures = Object.fromEntries(
      featureKeys.map((featureKey) => {
        const config = FEATURE_CONFIG[featureKey];

        return [
          featureKey,
          {
            allowed: true,
            description: config.description,
            featureKey,
            label: config.label,
            reason: null,
            source: "privileged",
            usage: resolveUsageSnapshot(config.metricKey, null, null),
          } satisfies FeatureAccessSnapshot,
        ];
      }),
    ) as Record<BillingFeatureKey, FeatureAccessSnapshot>;

    return {
      subscription: {
        currentPeriodEnd: null,
        isActive: true,
        isPrivilegedAccess: true,
        provider: "admin",
        status: "root_access",
        updatedAt: null,
      },
      features: privilegedFeatures,
    };
  }

  const features = Object.fromEntries(
    featureKeys.map((featureKey) => [
      featureKey,
      buildFeatureAccess(featureKey, null, null, null),
    ]),
  ) as Record<BillingFeatureKey, FeatureAccessSnapshot>;

  return {
    subscription: {
      currentPeriodEnd: null,
      isActive: false,
      isPrivilegedAccess: false,
      provider: null,
      status: null,
      updatedAt: null,
    },
    features,
  };
}

export async function readUserBillingAccessOrFallback(
  supabase: Pick<SupabaseClient, "from">,
  userId: string,
  options?: {
    email?: string | null;
  },
): Promise<UserBillingAccessSnapshot> {
  try {
    return await readUserBillingAccess(supabase, userId, options);
  } catch (error) {
    logger.warn("billing access load failed, using fallback", {
      error,
      userId,
    });
    return createFallbackUserBillingAccessSnapshot(options);
  }
}

export function createFeatureAccessDeniedResponse(
  feature: FeatureAccessSnapshot,
  status = 403,
) {
  return createApiErrorResponse({
    status,
    code: "FEATURE_ACCESS_DENIED",
    message:
      feature.reason ?? "Эта функция недоступна для текущего плана доступа.",
    details: {
      featureKey: feature.featureKey,
      label: feature.label,
      source: feature.source,
      usage: feature.usage,
    },
  });
}

export async function incrementFeatureUsage(
  supabase: Pick<SupabaseClient, "from">,
  userId: string,
  featureKey: BillingFeatureKey,
  amount = 1,
) {
  if (amount <= 0) {
    return;
  }

  const metricKey = FEATURE_CONFIG[featureKey].metricKey;
  const now = new Date();
  const resetAt = getNextMonthlyResetAt(now);
  const { data: existingRow, error: existingRowError } = await supabase
    .from("usage_counters")
    .select("id, metric_key, metric_window, usage_count, reset_at")
    .eq("user_id", userId)
    .eq("metric_key", metricKey)
    .eq("metric_window", MONTHLY_WINDOW)
    .maybeSingle();

  if (existingRowError) {
    throw existingRowError;
  }

  const row = (existingRow as UsageCounterRow | null) ?? null;
  const nextUsageCount = row
    ? isCounterExpired(row.reset_at, now)
      ? amount
      : toSafeCount(row.usage_count) + amount
    : amount;

  const mutation = row
    ? supabase
        .from("usage_counters")
        .update({
          usage_count: nextUsageCount,
          reset_at: resetAt,
          updated_at: now.toISOString(),
        })
        .eq("id", row.id)
    : supabase.from("usage_counters").insert({
        user_id: userId,
        metric_key: metricKey,
        metric_window: MONTHLY_WINDOW,
        usage_count: nextUsageCount,
        reset_at: resetAt,
      });

  const { error } = await mutation;

  if (error) {
    throw error;
  }
}
