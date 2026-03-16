import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  applyAdminEntitlementAction,
  applyAdminSubscriptionAction,
} from "@/lib/admin-billing";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import {
  PRIMARY_SUPER_ADMIN_GUARD_MESSAGE,
  assertUserIsNotPrimarySuperAdmin,
} from "@/lib/admin-target-guard";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const bulkActionSchema = z
  .object({
    action: z.enum([
      "queue_export",
      "queue_resync",
      "queue_suspend",
      "grant_trial",
      "enable_entitlement",
    ]),
    user_ids: z.array(z.string().uuid()).min(1).max(25),
    duration_days: z.number().int().min(1).max(365).optional(),
    feature_key: z.string().trim().min(2).max(120).optional(),
    limit_value: z.number().int().min(0).max(1_000_000).nullable().optional(),
    reason: z.string().trim().max(300).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "enable_entitlement" && !value.feature_key) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "feature_key is required for entitlement bulk actions.",
        path: ["feature_key"],
      });
    }
  });

export async function POST(request: Request) {
  try {
    const { user } = await requireAdminRouteAccess("bulk_manage_users");
    const payload = bulkActionSchema.parse(await request.json().catch(() => ({})));
    const adminSupabase = createAdminSupabaseClient();
    const batchId = crypto.randomUUID();
    const results: Array<{
      message?: string;
      status: "ok" | "failed";
      user_id: string;
    }> = [];

    for (const userId of payload.user_ids) {
      try {
        if (payload.action === "queue_export") {
          const { data, error } = await adminSupabase
            .from("export_jobs")
            .insert({
              user_id: userId,
              requested_by: user.id,
              format: "json_csv_zip",
              status: "queued",
            })
            .select("id")
            .single();

          if (error) {
            throw error;
          }

          const { error: auditError } = await adminSupabase
            .from("admin_audit_logs")
            .insert({
              actor_user_id: user.id,
              target_user_id: userId,
              action: "bulk_queue_export_job",
              reason: payload.reason ?? "bulk export queue",
              payload: {
                batchId,
                exportJobId: data.id,
              },
            });

          if (auditError) {
            throw auditError;
          }
        } else if (payload.action === "queue_resync") {
          const { data, error } = await adminSupabase
            .from("support_actions")
            .insert({
              actor_user_id: user.id,
              target_user_id: userId,
              action: "resync_user_context",
              status: "queued",
              payload: {
                source: "admin-bulk-actions",
              },
            })
            .select("id")
            .single();

          if (error) {
            throw error;
          }

          const { error: auditError } = await adminSupabase
            .from("admin_audit_logs")
            .insert({
              actor_user_id: user.id,
              target_user_id: userId,
              action: "bulk_resync_user_context",
              reason: payload.reason ?? "bulk user resync",
              payload: {
                batchId,
                supportActionId: data.id,
              },
            });

          if (auditError) {
            throw auditError;
          }
        } else if (payload.action === "queue_suspend") {
          await assertUserIsNotPrimarySuperAdmin(adminSupabase, userId);

          const { data, error } = await adminSupabase
            .from("support_actions")
            .insert({
              actor_user_id: user.id,
              target_user_id: userId,
              action: "suspend_user",
              status: "queued",
              payload: {
                source: "admin-bulk-actions",
              },
            })
            .select("id")
            .single();

          if (error) {
            throw error;
          }

          const { error: auditError } = await adminSupabase
            .from("admin_audit_logs")
            .insert({
              actor_user_id: user.id,
              target_user_id: userId,
              action: "bulk_suspend_user",
              reason: payload.reason ?? "bulk suspend queue",
              payload: {
                batchId,
                supportActionId: data.id,
              },
            });

          if (auditError) {
            throw auditError;
          }
        } else if (payload.action === "grant_trial") {
          const subscription = await applyAdminSubscriptionAction(adminSupabase, {
            action: "grant_trial",
            durationDays: payload.duration_days,
            provider: "admin_console",
            userId,
          });

          const { error: auditError } = await adminSupabase
            .from("admin_audit_logs")
            .insert({
              actor_user_id: user.id,
              target_user_id: userId,
              action: "bulk_grant_trial",
              reason: payload.reason ?? "bulk trial grant",
              payload: {
                batchId,
                subscriptionId: subscription.id,
                currentPeriodEnd: subscription.current_period_end,
              },
            });

          if (auditError) {
            throw auditError;
          }

          const { error: subscriptionEventError } = await adminSupabase
            .from("subscription_events")
            .insert({
              user_id: userId,
              subscription_id: subscription.id,
              event_type: "admin_bulk_grant_trial",
              payload: {
                actorUserId: user.id,
                batchId,
                currentPeriodEnd: subscription.current_period_end,
              },
            });

          if (subscriptionEventError) {
            throw subscriptionEventError;
          }
        } else {
          const entitlement = await applyAdminEntitlementAction(adminSupabase, {
            action: "enable_entitlement",
            featureKey: payload.feature_key ?? "",
            limitValue: payload.limit_value ?? null,
            userId,
          });

          const { error: auditError } = await adminSupabase
            .from("admin_audit_logs")
            .insert({
              actor_user_id: user.id,
              target_user_id: userId,
              action: "bulk_enable_entitlement",
              reason: payload.reason ?? "bulk entitlement enable",
              payload: {
                batchId,
                entitlementId: entitlement.id,
                featureKey: entitlement.feature_key,
                limitValue: entitlement.limit_value,
              },
            });

          if (auditError) {
            throw auditError;
          }
        }

        results.push({
          status: "ok",
          user_id: userId,
        });
      } catch (error) {
        logger.error("admin bulk action failed for user", {
          action: payload.action,
          error,
          userId,
        });

        results.push({
          message:
            error instanceof Error &&
            error.message === PRIMARY_SUPER_ADMIN_GUARD_MESSAGE
              ? error.message
              : error instanceof Error
                ? error.message
                : "Unknown bulk action error.",
          status: "failed",
          user_id: userId,
        });
      }
    }

    const summary = {
      action: payload.action,
      batchId,
      failed: results.filter((result) => result.status === "failed").length,
      processed: results.length,
      results,
      succeeded: results.filter((result) => result.status === "ok").length,
      userIds: payload.user_ids,
    };

    const { error: bulkAuditError } = await adminSupabase
      .from("admin_audit_logs")
      .insert({
        actor_user_id: user.id,
        target_user_id: null,
        action: "bulk_wave_completed",
        reason: payload.reason ?? `bulk ${payload.action}`,
        payload: summary,
      });

    if (bulkAuditError) {
      throw bulkAuditError;
    }

    return Response.json({
      data: {
        ...summary,
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

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "ADMIN_BULK_INVALID",
        message: "Bulk admin payload is invalid.",
        details: error.flatten(),
      });
    }

    logger.error("admin bulk route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_BULK_FAILED",
      message: "Unable to execute bulk admin action.",
    });
  }
}
