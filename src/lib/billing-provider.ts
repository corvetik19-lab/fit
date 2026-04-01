import {
  getMissingCloudpaymentsCheckoutEnv,
  getMissingCloudpaymentsManagementEnv,
  getMissingCloudpaymentsWebhookEnv,
  hasCloudpaymentsCheckoutEnv,
  hasCloudpaymentsManagementEnv,
  hasCloudpaymentsWebhookEnv,
  publicEnv,
} from "@/lib/env";
import {
  getMissingStripeCheckoutEnv,
  getMissingStripePortalEnv,
  getMissingStripeWebhookEnv,
  hasStripeCheckoutEnv,
  hasStripePortalEnv,
  hasStripeWebhookEnv,
} from "@/lib/env";

export type BillingProvider = "cloudpayments" | "stripe";

export function getActiveBillingProvider(): BillingProvider {
  const explicitProvider = publicEnv.NEXT_PUBLIC_BILLING_PROVIDER;

  if (explicitProvider) {
    return explicitProvider;
  }

  if (publicEnv.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID) {
    return "cloudpayments";
  }

  return "stripe";
}

export function getBillingProviderLabel(provider: BillingProvider) {
  switch (provider) {
    case "cloudpayments":
      return "CloudPayments";
    case "stripe":
      return "Stripe";
    default:
      return provider;
  }
}

export function hasActiveBillingCheckoutEnv() {
  const provider = getActiveBillingProvider();

  return provider === "cloudpayments"
    ? hasCloudpaymentsCheckoutEnv()
    : hasStripeCheckoutEnv();
}

export function getMissingActiveBillingCheckoutEnv() {
  const provider = getActiveBillingProvider();

  return provider === "cloudpayments"
    ? getMissingCloudpaymentsCheckoutEnv()
    : getMissingStripeCheckoutEnv();
}

export function hasActiveBillingManagementEnv() {
  const provider = getActiveBillingProvider();

  return provider === "cloudpayments"
    ? hasCloudpaymentsManagementEnv()
    : hasStripePortalEnv();
}

export function getMissingActiveBillingManagementEnv() {
  const provider = getActiveBillingProvider();

  return provider === "cloudpayments"
    ? getMissingCloudpaymentsManagementEnv()
    : getMissingStripePortalEnv();
}

export function hasActiveBillingWebhookEnv() {
  const provider = getActiveBillingProvider();

  return provider === "cloudpayments"
    ? hasCloudpaymentsWebhookEnv()
    : hasStripeWebhookEnv();
}

export function getMissingActiveBillingWebhookEnv() {
  const provider = getActiveBillingProvider();

  return provider === "cloudpayments"
    ? getMissingCloudpaymentsWebhookEnv()
    : getMissingStripeWebhookEnv();
}
