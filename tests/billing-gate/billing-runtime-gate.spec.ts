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
    url?: string | null;
  };
};

function hasStripeRuntimeEnv() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID?.trim(),
  );
}

test.describe("billing runtime gate", () => {
  test.describe.configure({ timeout: 120_000 });

  test.skip(
    !hasAuthE2ECredentials(),
    "requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD",
  );

  test.skip(
    !hasStripeRuntimeEnv(),
    "requires STRIPE_SECRET_KEY and STRIPE_PREMIUM_MONTHLY_PRICE_ID",
  );

  test("billing center bootstraps a live Stripe checkout session", async ({
    page,
  }) => {
    await signInAndFinishOnboarding(page);
    await navigateStable(page, "/settings?section=billing", /\/settings/);

    const result = await fetchJson<CheckoutResponse>(page, {
      method: "POST",
      url: "/api/billing/checkout",
    });

    expect(result.status).toBe(200);
    expect(result.body?.data?.id).toBeTruthy();
    expect(result.body?.data?.url).toBeTruthy();

    const checkoutUrl = new URL(result.body?.data?.url ?? "");
    expect(checkoutUrl.protocol).toBe("https:");
    expect(checkoutUrl.hostname).toContain("stripe.com");
  });
});
