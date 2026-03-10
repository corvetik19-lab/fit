import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { BILLING_FEATURE_KEYS, readUserBillingAccess } from "@/lib/billing-access";
import { logger } from "@/lib/logger";
import { loadSettingsDataSnapshot } from "@/lib/settings-data-server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const billingFeatureKeySchema = z.enum([
  BILLING_FEATURE_KEYS.aiChat,
  BILLING_FEATURE_KEYS.mealPlan,
  BILLING_FEATURE_KEYS.workoutPlan,
  BILLING_FEATURE_KEYS.mealPhoto,
]);

const settingsBillingActionSchema = z.object({
  action: z.literal("request_access_review"),
  feature_keys: z.array(billingFeatureKeySchema).min(1).max(4),
  note: z.string().trim().max(300).optional(),
});

async function getAuthenticatedSettingsContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return { supabase, user };
}

async function writeAuditLog(
  action: string,
  userId: string,
  payload: Record<string, unknown>,
) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    const { error } = await adminSupabase.from("admin_audit_logs").insert({
      action,
      actor_user_id: userId,
      payload,
      reason: "self-service settings billing action",
      target_user_id: userId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.warn("settings billing audit log failed", {
      action,
      error,
      userId,
    });
  }
}

async function loadBillingCenterData(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
) {
  const [snapshot, access] = await Promise.all([
    loadSettingsDataSnapshot(supabase, userId),
    readUserBillingAccess(supabase, userId),
  ]);

  return {
    access,
    snapshot,
  };
}

export async function GET() {
  try {
    const context = await getAuthenticatedSettingsContext();

    if (!context) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Sign in before opening billing settings.",
      });
    }

    const data = await loadBillingCenterData(context.supabase, context.user.id);

    return Response.json({ data });
  } catch (error) {
    logger.error("settings billing snapshot route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "SETTINGS_BILLING_SNAPSHOT_FAILED",
      message: "Не удалось загрузить billing-центр.",
    });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getAuthenticatedSettingsContext();

    if (!context) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Sign in before changing billing settings.",
      });
    }

    const payload = settingsBillingActionSchema.parse(
      await request.json().catch(() => ({})),
    );
    const adminSupabase = createAdminSupabaseClient();
    const requestedFeatures = [...new Set(payload.feature_keys)];

    const { data: activeReviewRequest, error: activeReviewRequestError } =
      await adminSupabase
        .from("support_actions")
        .select("id, status")
        .eq("target_user_id", context.user.id)
        .eq("action", "billing_access_review")
        .eq("status", "queued")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (activeReviewRequestError) {
      throw activeReviewRequestError;
    }

    if (activeReviewRequest) {
      return createApiErrorResponse({
        status: 409,
        code: "SETTINGS_BILLING_REVIEW_ALREADY_ACTIVE",
        message: "У тебя уже есть активный billing review. Дождись его обработки.",
      });
    }

    const { error: reviewRequestError } = await adminSupabase
      .from("support_actions")
      .insert({
        action: "billing_access_review",
        actor_user_id: context.user.id,
        payload: {
          note: payload.note ?? null,
          requestedFeatures,
          requestOrigin: "settings_billing_center",
          source: "self_service",
        },
        status: "queued",
        target_user_id: context.user.id,
      });

    if (reviewRequestError) {
      throw reviewRequestError;
    }

    await writeAuditLog("user_requested_billing_access_review", context.user.id, {
      note: payload.note ?? null,
      requestedFeatures,
    });

    const data = await loadBillingCenterData(context.supabase, context.user.id);

    return Response.json({ data });
  } catch (error) {
    logger.error("settings billing mutation route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "SETTINGS_BILLING_INVALID",
        message: "Billing payload is invalid.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "SETTINGS_BILLING_UPDATE_FAILED",
      message: "Не удалось отправить billing review.",
    });
  }
}
