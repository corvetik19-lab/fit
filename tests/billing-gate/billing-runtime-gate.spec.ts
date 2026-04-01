import { createHmac } from "node:crypto";

import { expect, test } from "@playwright/test";

import {
  hasAuthE2ECredentials,
  signInAndFinishOnboarding,
} from "../e2e/helpers/auth";
import { fetchJson } from "../e2e/helpers/http";
import { expectNoHorizontalOverflow } from "../e2e/helpers/layout";
import { navigateStable } from "../e2e/helpers/navigation";

type CheckoutResponse = {
  data?: {
    id?: string;
    provider?: "cloudpayments" | "stripe";
    url?: string | null;
  };
};

type CheckoutReconcileResponse = {
  data?: {
    access?: {
      features?: {
        ai_chat?: {
          allowed?: boolean;
        };
      };
      subscription?: {
        isActive?: boolean;
        provider?: string | null;
        status?: string | null;
      };
    };
    checkoutReturn?: {
      paymentStatus?: string | null;
      provider?: "cloudpayments" | "stripe";
      reconciled?: boolean;
      sessionStatus?: string | null;
    };
  };
};

type BillingManagementResponse = {
  data?: {
    provider?: "cloudpayments" | "stripe";
    url?: string | null;
  };
};

type CloudpaymentsIntentResponse = {
  data?: {
    amount?: number;
    currency?: string;
    description?: string;
    externalId?: string;
    paymentSchema?: string;
    publicTerminalId?: string;
    recurrent?: {
      amount?: number;
      interval?: string;
      period?: number;
    };
    userInfo?: {
      accountId?: string;
    };
  };
};

const mobileUse = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
} as const;

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

function isCloudpaymentsMockMode() {
  return process.env.CLOUDPAYMENTS_TEST_MODE?.trim() === "mock";
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

  test.skip(
    getActiveBillingProvider() !== "cloudpayments" || !isCloudpaymentsMockMode(),
    "requires cloudpayments mock mode",
  );

  test("cloudpayments mock flow covers intent, webhook, reconcile and billing center", async ({
    page,
  }) => {
    await signInAndFinishOnboarding(page);
    await navigateStable(page, "/settings?section=billing", /\/settings/);

    const checkoutResult = await fetchJson<CheckoutResponse>(page, {
      method: "POST",
      url: "/api/billing/checkout",
    });

    expect(checkoutResult.status).toBe(200);
    expect(checkoutResult.body?.data?.provider).toBe("cloudpayments");
    expect(checkoutResult.body?.data?.id).toBeTruthy();

    const referenceId = checkoutResult.body?.data?.id;
    expect(referenceId).toBeTruthy();
    if (!referenceId) {
      throw new Error("CloudPayments checkout did not return a reference id.");
    }

    const checkoutUrl = new URL(checkoutResult.body?.data?.url ?? "", page.url());
    expect(checkoutUrl.pathname).toBe("/billing/cloudpayments");
    expect(checkoutUrl.searchParams.get("reference")).toBe(referenceId);

    const intentResult = await fetchJson<CloudpaymentsIntentResponse>(page, {
      method: "GET",
      url: `/api/billing/cloudpayments/intent?reference=${encodeURIComponent(referenceId)}`,
    });

    expect(intentResult.status).toBe(200);
    expect(intentResult.body?.data?.externalId).toBe(referenceId);
    expect(intentResult.body?.data?.publicTerminalId).toBeTruthy();
    expect(intentResult.body?.data?.userInfo?.accountId).toBeTruthy();

    const accountId = intentResult.body?.data?.userInfo?.accountId;
    expect(accountId).toBeTruthy();
    if (!accountId) {
      throw new Error("CloudPayments intent did not return an account id.");
    }

    const webhookSecret =
      process.env.CLOUDPAYMENTS_WEBHOOK_SECRET?.trim() ||
      process.env.CLOUDPAYMENTS_API_SECRET?.trim();
    expect(webhookSecret).toBeTruthy();
    if (!webhookSecret) {
      throw new Error("CloudPayments mock flow requires webhook signing secret.");
    }

    const webhookPayload = {
      AccountId: accountId,
      Status: "Active",
      SubscriptionId: `mock-cloudpayments-sub-${accountId}`,
      SuccessfulTransactionsNumber: 1,
      TransactionId: `mock-tx-${referenceId}`,
    };
    const rawWebhookBody = JSON.stringify(webhookPayload);
    const webhookSignature = createHmac("sha256", webhookSecret)
      .update(rawWebhookBody, "utf8")
      .digest("base64");

    const webhookResponse = await page.context().request.fetch(
      `${process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100"}/api/billing/webhook/cloudpayments/pay`,
      {
        method: "POST",
        headers: {
          "Content-HMAC": webhookSignature,
          "Content-Type": "application/json",
        },
        data: rawWebhookBody,
        failOnStatusCode: false,
      },
    );

    expect(webhookResponse.status()).toBe(200);
    await expect(await webhookResponse.json()).toMatchObject({
      code: 0,
      data: {
        duplicate: false,
        received: true,
      },
    });

    const reconcileResult = await fetchJson<CheckoutReconcileResponse>(page, {
      method: "POST",
      url: "/api/billing/checkout/reconcile",
      body: {
        referenceId,
      },
    });

    expect(reconcileResult.status).toBe(200);
    expect(reconcileResult.body?.data?.checkoutReturn?.provider).toBe(
      "cloudpayments",
    );
    expect(reconcileResult.body?.data?.checkoutReturn?.reconciled).toBe(true);
    expect(reconcileResult.body?.data?.access?.subscription?.provider).toBe(
      "cloudpayments",
    );
    expect(reconcileResult.body?.data?.access?.subscription?.isActive).toBe(true);
    expect(reconcileResult.body?.data?.access?.subscription?.status).toBe(
      "active",
    );
    expect(reconcileResult.body?.data?.access?.features?.ai_chat?.allowed).toBe(
      true,
    );

    const managementResult = await fetchJson<BillingManagementResponse>(page, {
      method: "POST",
      url: "/api/billing/portal",
    });

    expect(managementResult.status).toBe(200);
    expect(managementResult.body?.data?.provider).toBe("cloudpayments");
    expect(managementResult.body?.data?.url).toBe("https://my.cloudpayments.ru/");
  });

  test.describe("cloudpayments mobile checkout surface", () => {
    test.use(mobileUse);

    test.skip(
      getActiveBillingProvider() !== "cloudpayments" || !isCloudpaymentsMockMode(),
      "requires cloudpayments mock mode",
    );

    test("cloudpayments checkout page stays usable on mobile pwa", async ({
      page,
    }) => {
      await page.route(
        "https://widget.cloudpayments.ru/bundles/cloudpayments.js",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/javascript",
            body: [
              "window.cp = {",
              "  CloudPayments: function CloudPayments() {",
              "    this.start = function start() {",
              "      return new Promise(function () {});",
              "    };",
              "  },",
              "};",
            ].join("\n"),
          });
        },
      );

      await signInAndFinishOnboarding(page);

      const checkoutResult = await fetchJson<CheckoutResponse>(page, {
        method: "POST",
        url: "/api/billing/checkout",
      });

      expect(checkoutResult.status).toBe(200);
      expect(checkoutResult.body?.data?.provider).toBe("cloudpayments");
      expect(checkoutResult.body?.data?.url).toBeTruthy();

      const checkoutUrl = new URL(checkoutResult.body?.data?.url ?? "", page.url());
      await navigateStable(
        page,
        `${checkoutUrl.pathname}${checkoutUrl.search}`,
        /\/billing\/cloudpayments\?reference=/,
      );
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);

      await expect(page.getByTestId("cloudpayments-checkout-page")).toBeVisible();
      await expect(
        page.getByTestId("cloudpayments-checkout-heading"),
      ).toContainText("fit Premium");
      await expect(page.getByTestId("cloudpayments-checkout-open")).toBeDisabled();
      await expect(page.getByTestId("cloudpayments-checkout-back")).toBeVisible();
      await expectNoHorizontalOverflow(page, "cloudpayments mobile checkout");
    });
  });
});
