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
});

const serverEnvSchema = z.object({
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),
  ADMIN_BOOTSTRAP_TOKEN: z.string().min(1).optional(),
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
});

export const serverEnv = serverEnvSchema.parse({
  AI_GATEWAY_API_KEY: normalizeEnv(process.env.AI_GATEWAY_API_KEY),
  ADMIN_BOOTSTRAP_TOKEN: normalizeEnv(process.env.ADMIN_BOOTSTRAP_TOKEN),
  SUPABASE_SERVICE_ROLE_KEY: normalizeEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ),
  SENTRY_AUTH_TOKEN: normalizeEnv(process.env.SENTRY_AUTH_TOKEN),
});

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
