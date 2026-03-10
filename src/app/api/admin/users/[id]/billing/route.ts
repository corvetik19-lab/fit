import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  applyAdminEntitlementAction,
  applyAdminSubscriptionAction,
} from "@/lib/admin-billing";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const billingActionSchema = z
  .object({
    action: z.enum([
      "grant_trial",
      "activate_subscription",
      "mark_past_due",
      "cancel_subscription",
      "enable_entitlement",
      "disable_entitlement",
    ]),
    duration_days: z.number().int().min(1).max(365).optional(),
    provider: z.string().trim().min(2).max(80).optional(),
    feature_key: z.string().trim().min(2).max(120).optional(),
    limit_value: z.number().int().min(0).max(1_000_000).nullable().optional(),
    reason: z.string().trim().max(300).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      (value.action === "enable_entitlement" ||
        value.action === "disable_entitlement") &&
      !value.feature_key
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "feature_key is required for entitlement actions.",
        path: ["feature_key"],
      });
    }
  });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAdminRouteAccess("manage_billing");
    const { id } = await params;
    const payload = billingActionSchema.parse(
      await request.json().catch(() => ({})),
    );
    const adminSupabase = createAdminSupabaseClient();

    let responseData: Record<string, unknown>;
    let auditPayload: Record<string, unknown>;

    if (
      payload.action === "enable_entitlement" ||
      payload.action === "disable_entitlement"
    ) {
      const entitlement = await applyAdminEntitlementAction(adminSupabase, {
        action: payload.action,
        featureKey: payload.feature_key ?? "",
        limitValue: payload.limit_value ?? null,
        userId: id,
      });

      const { error: subscriptionEventError } = await adminSupabase
        .from("subscription_events")
        .insert({
          user_id: id,
          subscription_id: null,
          event_type: `admin_${payload.action}`,
          payload: {
            actorUserId: user.id,
            featureKey: entitlement.feature_key,
            isEnabled: entitlement.is_enabled,
            limitValue: entitlement.limit_value,
          },
        });

      if (subscriptionEventError) {
        throw subscriptionEventError;
      }

      responseData = {
        entitlement,
      };
      auditPayload = {
        entitlementId: entitlement.id,
        featureKey: entitlement.feature_key,
        isEnabled: entitlement.is_enabled,
        limitValue: entitlement.limit_value,
      };
    } else {
      const subscription = await applyAdminSubscriptionAction(adminSupabase, {
        action: payload.action,
        durationDays: payload.duration_days,
        provider: payload.provider,
        userId: id,
      });

      const { error: subscriptionEventError } = await adminSupabase
        .from("subscription_events")
        .insert({
          user_id: id,
          subscription_id: subscription.id,
          event_type: `admin_${payload.action}`,
          payload: {
            actorUserId: user.id,
            currentPeriodEnd: subscription.current_period_end,
            provider: subscription.provider,
            status: subscription.status,
          },
        });

      if (subscriptionEventError) {
        throw subscriptionEventError;
      }

      responseData = {
        subscription,
      };
      auditPayload = {
        subscriptionId: subscription.id,
        status: subscription.status,
        provider: subscription.provider,
        currentPeriodEnd: subscription.current_period_end,
      };
    }

    const { error: auditError } = await adminSupabase
      .from("admin_audit_logs")
      .insert({
        actor_user_id: user.id,
        target_user_id: id,
        action: `admin_${payload.action}`,
        reason: payload.reason ?? `manual ${payload.action}`,
        payload: auditPayload,
      });

    if (auditError) {
      throw auditError;
    }

    return Response.json({
      data: {
        targetUserId: id,
        ...responseData,
      },
    });
  } catch (error) {
    logger.error("admin billing route failed", { error });

    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "ADMIN_BILLING_INVALID",
        message: "Billing payload is invalid.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_BILLING_FAILED",
      message: "Unable to update billing or entitlement state.",
    });
  }
}
