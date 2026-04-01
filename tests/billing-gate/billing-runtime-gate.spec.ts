import { expect, test } from "@playwright/test";

import {
  hasAuthE2ECredentials,
  signInAndFinishOnboarding,
} from "../e2e/helpers/auth";
import { fetchJson } from "../e2e/helpers/http";
import { navigateStable } from "../e2e/helpers/navigation";

type CheckoutResponse = {
  data?: {
    id?: string;
    provider?: "cloudpayments" | "stripe";
    url?: string | null;
  };
};

function getActiveBillingProvider() {
  if (process.env.NEXT_PUBLIC_BILLING_PROVIDER?.trim()) {
    return process.env.NEXT_PUBLIC_BILLING_PROVIDER as "cloudpayments" | "stripe";
  }

  if (process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID?.trim()) {
    return "cloudpayments";
  }

  return "stripe";
}

function hasCloudpaymentsRuntimeEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID?.trim() &&
      process.env.CLOUDPAYMENTS_API_SECRET?.trim() &&
      process.env.CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB?.trim(),
  );
}

function hasStripeRuntimeEnv() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID?.trim(),
  );
}

function hasActiveBillingRuntimeEnv() {
  return getActiveBillingProvider() === "cloudpayments"
    ? hasCloudpaymentsRuntimeEnv()
    : hasStripeRuntimeEnv();
}

test.describe("billing runtime gate", () => {
  test.describe.configure({ timeout: 120_000 });

  test.skip(
    !hasAuthE2ECredentials(),
    "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
  );

  test.skip(
    !hasActiveBillingRuntimeEnv(),
    "requires runtime env for the active billing provider",
  );

  test("billing center bootstraps a live checkout flow for the active provider", async ({
    page,
  }) => {
    const provider = getActiveBillingProvider();

    await signInAndFinishOnboarding(page);
    await navigateStable(page, "/settings?section=billing", /\/settings/);

    const result = await fetchJson<CheckoutResponse>(page, {
      method: "POST",
      url: "/api/billing/checkout",
    });

    expect(result.status).toBe(200);
    expect(result.body?.data?.id).toBeTruthy();
    expect(result.body?.data?.url).toBeTruthy();
    expect(result.body?.data?.provider).toBe(provider);

    const checkoutUrl = new URL(result.body?.data?.url ?? "", page.url());

    if (provider === "cloudpayments") {
      expect(checkoutUrl.pathname).toBe("/billing/cloudpayments");
    } else {
      expect(checkoutUrl.protocol).toBe("https:");
      expect(checkoutUrl.hostname).toContain("stripe.com");
    }
  });
});
