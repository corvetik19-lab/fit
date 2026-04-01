import { z } from "zod";

function normalizeEnv(value: string | undefined) {
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const publicEnvSchema = z.object({
  NEXT_PUBLIC_BILLING_PROVIDER: z
    .enum(["cloudpayments", "stripe"])
    .optional(),
  NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

const serverEnvSchema = z.object({
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),
  AI_RETRIEVAL_MODE: z
    .enum(["legacy", "hybrid", "shadow"])
    .optional(),
  AI_RETRIEVAL_TELEMETRY: z.string().min(1).optional(),
  ADMIN_BOOTSTRAP_TOKEN: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  CLOUDPAYMENTS_API_SECRET: z.string().min(1).optional(),
  CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB: z.string().min(1).optional(),
  CLOUDPAYMENTS_PREMIUM_MONTHLY_DESCRIPTION: z.string().min(1).optional(),
  CLOUDPAYMENTS_WEBHOOK_SECRET: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_APP_NAME: z.string().min(1).optional(),
  OPENROUTER_BASE_URL: z.string().url().optional(),
  OPENROUTER_CHAT_MODEL: z.string().min(1).optional(),
  OPENROUTER_SITE_URL: z.string().url().optional(),
  OPENROUTER_VISION_MODEL: z.string().min(1).optional(),
  SENTRY_ENVIRONMENT: z.string().min(1).optional(),
  SENTRY_ORG: z.string().min(1).optional(),
  SENTRY_PROJECT: z.string().min(1).optional(),
  STRIPE_PREMIUM_MONTHLY_PRICE_ID: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  VOYAGE_API_KEY: z.string().min(1).optional(),
  VOYAGE_EMBEDDING_MODEL: z.string().min(1).optional(),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_BILLING_PROVIDER: normalizeEnv(
    process.env.NEXT_PUBLIC_BILLING_PROVIDER,
  ),
  NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID: normalizeEnv(
    process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID,
  ),
  NEXT_PUBLIC_SUPABASE_URL: normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: normalizeEnv(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: normalizeEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  NEXT_PUBLIC_SENTRY_DSN: normalizeEnv(process.env.NEXT_PUBLIC_SENTRY_DSN),
});

export const serverEnv = serverEnvSchema.parse({
  AI_GATEWAY_API_KEY: normalizeEnv(process.env.AI_GATEWAY_API_KEY),
  AI_RETRIEVAL_MODE: normalizeEnv(process.env.AI_RETRIEVAL_MODE),
  AI_RETRIEVAL_TELEMETRY: normalizeEnv(process.env.AI_RETRIEVAL_TELEMETRY),
  ADMIN_BOOTSTRAP_TOKEN: normalizeEnv(process.env.ADMIN_BOOTSTRAP_TOKEN),
  CRON_SECRET: normalizeEnv(process.env.CRON_SECRET),
  CLOUDPAYMENTS_API_SECRET: normalizeEnv(process.env.CLOUDPAYMENTS_API_SECRET),
  CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB: normalizeEnv(
    process.env.CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB,
  ),
  CLOUDPAYMENTS_PREMIUM_MONTHLY_DESCRIPTION: normalizeEnv(
    process.env.CLOUDPAYMENTS_PREMIUM_MONTHLY_DESCRIPTION,
  ),
  CLOUDPAYMENTS_WEBHOOK_SECRET: normalizeEnv(
    process.env.CLOUDPAYMENTS_WEBHOOK_SECRET,
  ),
  OPENROUTER_API_KEY: normalizeEnv(process.env.OPENROUTER_API_KEY),
  OPENROUTER_APP_NAME: normalizeEnv(process.env.OPENROUTER_APP_NAME),
  OPENROUTER_BASE_URL: normalizeEnv(process.env.OPENROUTER_BASE_URL),
  OPENROUTER_CHAT_MODEL: normalizeEnv(process.env.OPENROUTER_CHAT_MODEL),
  OPENROUTER_SITE_URL: normalizeEnv(process.env.OPENROUTER_SITE_URL),
  OPENROUTER_VISION_MODEL: normalizeEnv(process.env.OPENROUTER_VISION_MODEL),
  SENTRY_ENVIRONMENT: normalizeEnv(process.env.SENTRY_ENVIRONMENT),
  SENTRY_ORG: normalizeEnv(process.env.SENTRY_ORG),
  SENTRY_PROJECT: normalizeEnv(process.env.SENTRY_PROJECT),
  STRIPE_PREMIUM_MONTHLY_PRICE_ID: normalizeEnv(
    process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
  ),
  STRIPE_SECRET_KEY: normalizeEnv(process.env.STRIPE_SECRET_KEY),
  STRIPE_WEBHOOK_SECRET: normalizeEnv(process.env.STRIPE_WEBHOOK_SECRET),
  SUPABASE_SERVICE_ROLE_KEY: normalizeEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ),
  SENTRY_AUTH_TOKEN: normalizeEnv(process.env.SENTRY_AUTH_TOKEN),
  VOYAGE_API_KEY: normalizeEnv(process.env.VOYAGE_API_KEY),
  VOYAGE_EMBEDDING_MODEL: normalizeEnv(process.env.VOYAGE_EMBEDDING_MODEL),
});

const SENTRY_RUNTIME_ENV_KEYS = ["NEXT_PUBLIC_SENTRY_DSN"] as const;
const SENTRY_BUILD_ENV_KEYS = [
  "SENTRY_AUTH_TOKEN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
] as const;
const STRIPE_CHECKOUT_ENV_KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PREMIUM_MONTHLY_PRICE_ID",
] as const;
const CLOUDPAYMENTS_CHECKOUT_ENV_KEYS = [
  "NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID",
  "CLOUDPAYMENTS_API_SECRET",
  "CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB",
] as const;
const CLOUDPAYMENTS_MANAGEMENT_ENV_KEYS = [] as const;
const CLOUDPAYMENTS_WEBHOOK_ENV_KEYS = [
  "NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID",
  "CLOUDPAYMENTS_API_SECRET",
] as const;
const STRIPE_WEBHOOK_ENV_KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;
const STRIPE_PORTAL_ENV_KEYS = ["STRIPE_SECRET_KEY"] as const;

export function hasSupabasePublicEnv() {
  return Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_URL && getSupabasePublicKey());
}

export function getSupabasePublicKey() {
  return (
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function hasAiGatewayEnv() {
  return Boolean(serverEnv.AI_GATEWAY_API_KEY);
}

export function hasOpenRouterEnv() {
  return Boolean(serverEnv.OPENROUTER_API_KEY);
}

export function hasVoyageEnv() {
  return Boolean(serverEnv.VOYAGE_API_KEY);
}

export function hasAiRuntimeEnv() {
  return hasOpenRouterEnv() || hasAiGatewayEnv();
}

export function hasAiEmbeddingEnv() {
  return hasVoyageEnv() || hasAiGatewayEnv();
}

export function getAiRetrievalMode() {
  return serverEnv.AI_RETRIEVAL_MODE ?? "hybrid";
}

export function hasAiRetrievalTelemetryEnv() {
  return serverEnv.AI_RETRIEVAL_TELEMETRY === "1";
}

export function hasSentryRuntimeEnv() {
  return Boolean(publicEnv.NEXT_PUBLIC_SENTRY_DSN);
}

export function getMissingSentryRuntimeEnv() {
  return SENTRY_RUNTIME_ENV_KEYS.filter((key) => !publicEnv[key]);
}

export function hasSentryBuildEnv() {
  return Boolean(
    serverEnv.SENTRY_AUTH_TOKEN &&
      serverEnv.SENTRY_ORG &&
      serverEnv.SENTRY_PROJECT,
  );
}

export function getMissingSentryBuildEnv() {
  return SENTRY_BUILD_ENV_KEYS.filter((key) => !serverEnv[key]);
}

export function getVercelRuntimeEnv() {
  return (
    normalizeEnv(process.env.VERCEL_ENV) ??
    normalizeEnv(process.env.NEXT_PUBLIC_VERCEL_ENV) ??
    normalizeEnv(process.env.VERCEL) ??
    null
  );
}

export function hasVercelRuntimeEnv() {
  return Boolean(getVercelRuntimeEnv());
}

export function hasStripeCheckoutEnv() {
  return Boolean(
    serverEnv.STRIPE_SECRET_KEY && serverEnv.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
  );
}

export function getMissingStripeCheckoutEnv() {
  return STRIPE_CHECKOUT_ENV_KEYS.filter((key) => !serverEnv[key]);
}

export function hasStripeWebhookEnv() {
  return Boolean(
    serverEnv.STRIPE_SECRET_KEY && serverEnv.STRIPE_WEBHOOK_SECRET,
  );
}

export function getMissingStripeWebhookEnv() {
  return STRIPE_WEBHOOK_ENV_KEYS.filter((key) => !serverEnv[key]);
}

export function hasStripePortalEnv() {
  return Boolean(serverEnv.STRIPE_SECRET_KEY);
}

export function getMissingStripePortalEnv() {
  return STRIPE_PORTAL_ENV_KEYS.filter((key) => !serverEnv[key]);
}

export function hasCloudpaymentsCheckoutEnv() {
  return Boolean(
    publicEnv.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID &&
      serverEnv.CLOUDPAYMENTS_API_SECRET &&
      serverEnv.CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB,
  );
}

export function getMissingCloudpaymentsCheckoutEnv() {
  return CLOUDPAYMENTS_CHECKOUT_ENV_KEYS.filter((key) => {
    if (key in publicEnv) {
      return !publicEnv[key as keyof typeof publicEnv];
    }

    return !serverEnv[key as keyof typeof serverEnv];
  });
}

export function hasCloudpaymentsManagementEnv() {
  return true;
}

export function getMissingCloudpaymentsManagementEnv() {
  return CLOUDPAYMENTS_MANAGEMENT_ENV_KEYS;
}

export function hasCloudpaymentsWebhookEnv() {
  return Boolean(
    publicEnv.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID &&
      serverEnv.CLOUDPAYMENTS_API_SECRET,
  );
}

export function getMissingCloudpaymentsWebhookEnv() {
  return CLOUDPAYMENTS_WEBHOOK_ENV_KEYS.filter((key) => {
    if (key in publicEnv) {
      return !publicEnv[key as keyof typeof publicEnv];
    }

    return !serverEnv[key as keyof typeof serverEnv];
  });
}
