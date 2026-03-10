import { z } from "zod";

function normalizeEnv(value: string | undefined) {
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

const serverEnvSchema = z.object({
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),
  ADMIN_BOOTSTRAP_TOKEN: z.string().min(1).optional(),
  SENTRY_ENVIRONMENT: z.string().min(1).optional(),
  SENTRY_ORG: z.string().min(1).optional(),
  SENTRY_PROJECT: z.string().min(1).optional(),
  STRIPE_PREMIUM_MONTHLY_PRICE_ID: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
});

export const publicEnv = publicEnvSchema.parse({
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
  ADMIN_BOOTSTRAP_TOKEN: normalizeEnv(process.env.ADMIN_BOOTSTRAP_TOKEN),
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
