import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import { serverEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type InternalJobAccessContext = {
  actorUserId: string | null;
  source: "admin" | "cron";
};

export class InternalJobParamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InternalJobParamError";
  }
}

export function isInternalJobParamError(error: unknown): error is InternalJobParamError {
  return error instanceof InternalJobParamError;
}

export function hasValidCronSecret(request: Request) {
  if (!serverEnv.CRON_SECRET) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
  const directHeader = request.headers.get("x-cron-secret")?.trim() ?? null;

  return (
    bearerToken === serverEnv.CRON_SECRET || directHeader === serverEnv.CRON_SECRET
  );
}

export function parsePositiveInt(
  value: string | null,
  fallback: number,
  max: number,
) {
  const parsed = Number(value ?? fallback);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(1, Math.trunc(parsed)));
}

export function parseOptionalUuidParam(
  value: string | null | undefined,
  fieldLabel: string,
) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = z.string().uuid().safeParse(value.trim());

  if (!parsed.success) {
    throw new InternalJobParamError(`${fieldLabel} must be a valid UUID.`);
  }

  return parsed.data;
}

export async function requireInternalAdminJobAccess(
  request: Request,
  jobLabel: string,
): Promise<InternalJobAccessContext | Response> {
  if (hasValidCronSecret(request)) {
    return {
      actorUserId: null,
      source: "cron",
    };
  }

  try {
    const { user } = await requireAdminRouteAccess("run_admin_jobs");

    return {
      actorUserId: user.id,
      source: "admin",
    };
  } catch (error) {
    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    return createApiErrorResponse({
      status: 401,
      code: "CRON_SECRET_REQUIRED",
      message: `Valid cron secret or root admin session is required for ${jobLabel}.`,
    });
  }
}

export async function resolveTargetUserIds(
  request: Request,
  options?: {
    defaultLimit?: number;
    maxLimit?: number;
    orderColumn?: "created_at" | "updated_at";
    userIdParam?: string;
  },
) {
  const { searchParams } = new URL(request.url);
  const userIdParam = options?.userIdParam ?? "userId";
  const explicitUserId = parseOptionalUuidParam(
    searchParams.get(userIdParam),
    userIdParam,
  );

  if (explicitUserId) {
    return [explicitUserId];
  }

  const limit = parsePositiveInt(
    searchParams.get("limit"),
    options?.defaultLimit ?? 25,
    options?.maxLimit ?? 100,
  );
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .order(options?.orderColumn ?? "updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => row.user_id)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}
