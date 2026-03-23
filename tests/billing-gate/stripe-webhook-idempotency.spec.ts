import { loadEnvConfig } from "@next/env";
import { expect, test } from "@playwright/test";
import Stripe from "stripe";

import { processStripeWebhookEvent } from "../../src/lib/stripe-billing";
import {
  createSupabaseAdminTestClient,
  findAuthUserIdByEmail,
} from "../e2e/helpers/supabase-admin";

loadEnvConfig(process.cwd());

function hasBillingWebhookGateEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      process.env.PLAYWRIGHT_TEST_EMAIL?.trim(),
  );
}

function getBillingWebhookGateEmail() {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL?.trim();

  if (!email) {
    throw new Error(
      "PLAYWRIGHT_TEST_EMAIL is required for the Stripe webhook billing gate.",
    );
  }

  return email;
}

function buildStripeSubscriptionFixture(
  seed: string,
  userId: string,
): Stripe.Subscription {
  const currentPeriodStart = Math.floor(
    new Date("2036-01-01T00:00:00.000Z").getTime() / 1000,
  );
  const currentPeriodEnd = Math.floor(
    new Date("2036-02-01T00:00:00.000Z").getTime() / 1000,
  );

  return {
    billing_cycle_anchor: currentPeriodStart,
    cancel_at: null,
    cancel_at_period_end: false,
    customer: `cus_gate_${seed}`,
    id: `sub_gate_${seed}`,
    items: {
      data: [
        {
          current_period_end: currentPeriodEnd,
          current_period_start: currentPeriodStart,
        },
      ],
    },
    metadata: {
      userId,
    },
    object: "subscription",
    start_date: currentPeriodStart,
    status: "active",
  } as unknown as Stripe.Subscription;
}

test.describe("stripe webhook billing gate", () => {
  test.describe.configure({ timeout: 120_000 });

  test.skip(
    !hasBillingWebhookGateEnv(),
    "requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and PLAYWRIGHT_TEST_EMAIL",
  );

  test("subscription webhook stays idempotent and does not mutate entitlements or usage counters", async () => {
    const supabase = createSupabaseAdminTestClient();
    const userId = await findAuthUserIdByEmail(getBillingWebhookGateEmail());
    const seed = crypto.randomUUID().slice(0, 8);
    const featureKey = `billing_gate_feature_${seed}`;
    const metricKey = `billing_gate_metric_${seed}`;
    const providerSubscriptionId = `sub_gate_${seed}`;
    const providerCustomerId = `cus_gate_${seed}`;
    const providerEventId = `evt_gate_${seed}`;
    const currentPeriodStart = new Date("2036-01-01T00:00:00.000Z").toISOString();
    const currentPeriodEnd = new Date("2036-02-01T00:00:00.000Z").toISOString();
    const expectedUsageCount = 3;
    const expectedEntitlementLimit = 5;

    try {
      const { error: seedSubscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          current_period_end: currentPeriodEnd,
          current_period_start: currentPeriodStart,
          provider: "stripe",
          provider_customer_id: providerCustomerId,
          provider_subscription_id: providerSubscriptionId,
          status: "trial",
          user_id: userId,
        });

      if (seedSubscriptionError) {
        throw seedSubscriptionError;
      }

      const { error: seedEntitlementError } = await supabase
        .from("entitlements")
        .upsert(
          {
            feature_key: featureKey,
            is_enabled: true,
            limit_value: expectedEntitlementLimit,
            user_id: userId,
          },
          {
            onConflict: "user_id,feature_key",
          },
        );

      if (seedEntitlementError) {
        throw seedEntitlementError;
      }

      const { error: seedUsageCounterError } = await supabase
        .from("usage_counters")
        .upsert(
          {
            metric_key: metricKey,
            metric_window: "monthly",
            reset_at: currentPeriodEnd,
            usage_count: expectedUsageCount,
            user_id: userId,
          },
          {
            onConflict: "user_id,metric_key,metric_window",
          },
        );

      if (seedUsageCounterError) {
        throw seedUsageCounterError;
      }

      const stripeSubscription = buildStripeSubscriptionFixture(seed, userId);
      const stripeEvent = {
        data: {
          object: stripeSubscription,
        },
        id: providerEventId,
        object: "event",
        type: "customer.subscription.updated",
      } as Stripe.Event;

      const firstResult = await processStripeWebhookEvent(
        supabase as never,
        stripeEvent,
      );

      expect(firstResult).toEqual({
        duplicate: false,
        received: true,
      });

      const { data: firstSubscription, error: firstSubscriptionError } =
        await supabase
          .from("subscriptions")
          .select(
            "provider_subscription_id, provider_customer_id, status, current_period_start, current_period_end, updated_at",
          )
          .eq("user_id", userId)
          .eq("provider_subscription_id", providerSubscriptionId)
          .maybeSingle();

      if (firstSubscriptionError) {
        throw firstSubscriptionError;
      }

      const { data: firstEvents, error: firstEventsError } = await supabase
        .from("subscription_events")
        .select("id")
        .eq("provider_event_id", providerEventId);

      if (firstEventsError) {
        throw firstEventsError;
      }

      const { data: firstEntitlement, error: firstEntitlementError } =
        await supabase
          .from("entitlements")
          .select("feature_key, is_enabled, limit_value")
          .eq("user_id", userId)
          .eq("feature_key", featureKey)
          .maybeSingle();

      if (firstEntitlementError) {
        throw firstEntitlementError;
      }

      const { data: firstUsageCounter, error: firstUsageCounterError } =
        await supabase
          .from("usage_counters")
          .select("metric_key, usage_count, reset_at")
          .eq("user_id", userId)
          .eq("metric_key", metricKey)
          .eq("metric_window", "monthly")
          .maybeSingle();

      if (firstUsageCounterError) {
        throw firstUsageCounterError;
      }

      expect(firstSubscription?.status).toBe("active");
      expect(firstSubscription?.provider_customer_id).toBe(providerCustomerId);
      expect(firstEvents ?? []).toHaveLength(1);
      expect(firstEntitlement?.is_enabled).toBe(true);
      expect(firstEntitlement?.limit_value).toBe(expectedEntitlementLimit);
      expect(firstUsageCounter?.usage_count).toBe(expectedUsageCount);
      expect(
        new Date(firstUsageCounter?.reset_at ?? 0).toISOString(),
      ).toBe(currentPeriodEnd);

      const firstUpdatedAt = firstSubscription?.updated_at ?? null;

      const secondResult = await processStripeWebhookEvent(
        supabase as never,
        stripeEvent,
      );

      expect(secondResult).toEqual({
        duplicate: true,
        received: true,
      });

      const { data: secondSubscription, error: secondSubscriptionError } =
        await supabase
          .from("subscriptions")
          .select(
            "provider_subscription_id, provider_customer_id, status, current_period_start, current_period_end, updated_at",
          )
          .eq("user_id", userId)
          .eq("provider_subscription_id", providerSubscriptionId)
          .maybeSingle();

      if (secondSubscriptionError) {
        throw secondSubscriptionError;
      }

      const { data: secondEvents, error: secondEventsError } = await supabase
        .from("subscription_events")
        .select("id")
        .eq("provider_event_id", providerEventId);

      if (secondEventsError) {
        throw secondEventsError;
      }

      const { data: secondEntitlement, error: secondEntitlementError } =
        await supabase
          .from("entitlements")
          .select("feature_key, is_enabled, limit_value")
          .eq("user_id", userId)
          .eq("feature_key", featureKey)
          .maybeSingle();

      if (secondEntitlementError) {
        throw secondEntitlementError;
      }

      const { data: secondUsageCounter, error: secondUsageCounterError } =
        await supabase
          .from("usage_counters")
          .select("metric_key, usage_count, reset_at")
          .eq("user_id", userId)
          .eq("metric_key", metricKey)
          .eq("metric_window", "monthly")
          .maybeSingle();

      if (secondUsageCounterError) {
        throw secondUsageCounterError;
      }

      expect(secondSubscription?.status).toBe("active");
      expect(secondSubscription?.provider_customer_id).toBe(providerCustomerId);
      expect(secondSubscription?.updated_at).toBe(firstUpdatedAt);
      expect(secondEvents ?? []).toHaveLength(1);
      expect(secondEntitlement).toEqual(firstEntitlement);
      expect(secondUsageCounter).toEqual(firstUsageCounter);
    } finally {
      await supabase
        .from("subscription_events")
        .delete()
        .eq("provider_event_id", providerEventId);
      await supabase
        .from("usage_counters")
        .delete()
        .eq("user_id", userId)
        .eq("metric_key", metricKey)
        .eq("metric_window", "monthly");
      await supabase
        .from("entitlements")
        .delete()
        .eq("user_id", userId)
        .eq("feature_key", featureKey);
      await supabase
        .from("subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("provider_subscription_id", providerSubscriptionId);
    }
  });
});
