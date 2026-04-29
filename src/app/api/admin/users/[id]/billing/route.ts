import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  applyAdminEntitlementAction,
  applyAdminSubscriptionAction,
  recordAdminBillingAudit,
  recordAdminSubscriptionEvent,
} from "@/lib/admin-billing";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import {
  isAdminRouteParamError,
  parseAdminUserIdParam,
} from "@/lib/admin-route-params";
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
        message: "Для действий с entitlement нужно указать feature_key.",
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
    const { id: rawId } = await params;
    const id = parseAdminUserIdParam(rawId, {
      code: "ADMIN_BILLING_TARGET_INVALID",
      message: "Идентификатор целевого пользователя заполнен некорректно.",
    });
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

      await recordAdminSubscriptionEvent(adminSupabase, {
        eventType: `admin_${payload.action}`,
        payload: {
          actorUserId: user.id,
          featureKey: entitlement.feature_key,
          isEnabled: entitlement.is_enabled,
          limitValue: entitlement.limit_value,
        },
        subscriptionId: null,
        userId: id,
      });

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

      await recordAdminSubscriptionEvent(adminSupabase, {
        eventType: `admin_${payload.action}`,
        payload: {
          actorUserId: user.id,
          currentPeriodEnd: subscription.current_period_end,
          durationDays: subscription.admin_duration_days,
          periodBase: subscription.admin_period_base,
          previousPeriodEnd: subscription.admin_previous_period_end,
          provider: subscription.provider,
          status: subscription.status,
        },
        subscriptionId: subscription.id,
        userId: id,
      });

      responseData = {
        subscription,
      };
      auditPayload = {
        subscriptionId: subscription.id,
        status: subscription.status,
        provider: subscription.provider,
        currentPeriodEnd: subscription.current_period_end,
        durationDays: subscription.admin_duration_days,
        periodBase: subscription.admin_period_base,
        previousPeriodEnd: subscription.admin_previous_period_end,
      };
    }

    await recordAdminBillingAudit(adminSupabase, {
      action: `admin_${payload.action}`,
      actorUserId: user.id,
      payload: auditPayload,
      reason: payload.reason ?? `ручное billing-действие: ${payload.action}`,
      targetUserId: id,
    });

    return Response.json({
      data: {
        targetUserId: id,
        ...responseData,
      },
    });
  } catch (error) {
    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    if (isAdminRouteParamError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "ADMIN_BILLING_INVALID",
        message: "Параметры биллинга заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("admin billing route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_BILLING_FAILED",
      message: "Не удалось обновить биллинг или состояние entitlement.",
    });
  }
}
