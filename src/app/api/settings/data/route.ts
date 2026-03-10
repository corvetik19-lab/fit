import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  isPrimarySuperAdminEmail,
} from "@/lib/admin-permissions";
import { logger } from "@/lib/logger";
import {
  DATA_EXPORT_FORMAT,
  getDefaultDeletionHoldUntil,
} from "@/lib/settings-data";
import { loadSettingsDataSnapshot } from "@/lib/settings-data-server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const settingsDataActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("queue_export"),
    format: z.literal(DATA_EXPORT_FORMAT).optional(),
  }),
  z.object({
    action: z.literal("request_deletion"),
    reason: z.string().trim().max(300).optional(),
  }),
]);

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
      reason: "self-service settings action",
      target_user_id: userId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.warn("settings data audit log failed", {
      action,
      error,
      userId,
    });
  }
}

export async function GET() {
  try {
    const context = await getAuthenticatedSettingsContext();

    if (!context) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Sign in before opening the data center.",
      });
    }

    const snapshot = await loadSettingsDataSnapshot(
      context.supabase,
      context.user.id,
    );

    return Response.json({ data: snapshot });
  } catch (error) {
    logger.error("settings data snapshot route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "SETTINGS_DATA_SNAPSHOT_FAILED",
      message: "Unable to load settings data center.",
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
        message: "Sign in before changing data center settings.",
      });
    }

    const payload = settingsDataActionSchema.parse(await request.json());

    if (payload.action === "queue_export") {
      const { data: activeExportJob, error: activeExportError } =
        await context.supabase
          .from("export_jobs")
          .select("id, status")
          .eq("user_id", context.user.id)
          .in("status", ["queued", "processing"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (activeExportError) {
        throw activeExportError;
      }

      if (activeExportJob) {
        return createApiErrorResponse({
          status: 409,
          code: "SETTINGS_EXPORT_ALREADY_ACTIVE",
          message: "У тебя уже есть активная выгрузка. Дождись её завершения.",
        });
      }

      const { error: queueExportError } = await context.supabase
        .from("export_jobs")
        .insert({
          format: payload.format ?? DATA_EXPORT_FORMAT,
          requested_by: context.user.id,
          status: "queued",
          user_id: context.user.id,
        });

      if (queueExportError) {
        throw queueExportError;
      }

      await writeAuditLog("user_requested_export", context.user.id, {
        format: payload.format ?? DATA_EXPORT_FORMAT,
      });
    }

    if (payload.action === "request_deletion") {
      if (isPrimarySuperAdminEmail(context.user.email ?? null)) {
        return createApiErrorResponse({
          status: 403,
          code: "PRIMARY_SUPER_ADMIN_PROTECTED",
          message: `Primary super admin ${PRIMARY_SUPER_ADMIN_EMAIL} cannot enter deletion workflow.`,
        });
      }

      const holdUntil = getDefaultDeletionHoldUntil();

      const { error: deletionRequestError } = await context.supabase
        .from("deletion_requests")
        .upsert(
          {
            hold_until: holdUntil,
            requested_by: context.user.id,
            status: "holding",
            user_id: context.user.id,
          },
          {
            onConflict: "user_id",
          },
        );

      if (deletionRequestError) {
        throw deletionRequestError;
      }

      await writeAuditLog("user_requested_deletion", context.user.id, {
        holdUntil,
        reason: payload.reason ?? null,
      });
    }

    const snapshot = await loadSettingsDataSnapshot(
      context.supabase,
      context.user.id,
    );

    return Response.json({
      data: snapshot,
    });
  } catch (error) {
    logger.error("settings data mutation route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "SETTINGS_DATA_INVALID",
        message: "Data center payload is invalid.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "SETTINGS_DATA_UPDATE_FAILED",
      message: "Unable to update settings data center.",
    });
  }
}

export async function DELETE() {
  try {
    const context = await getAuthenticatedSettingsContext();

    if (!context) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Sign in before changing data center settings.",
      });
    }

    const { data, error } = await context.supabase
      .from("deletion_requests")
      .update({
        requested_by: context.user.id,
        status: "canceled",
      })
      .eq("user_id", context.user.id)
      .in("status", ["queued", "holding"])
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return createApiErrorResponse({
        status: 404,
        code: "SETTINGS_DELETION_NOT_FOUND",
        message: "Активный запрос на удаление не найден.",
      });
    }

    await writeAuditLog("user_canceled_deletion", context.user.id, {
      deletionRequestId: data.id,
    });

    const snapshot = await loadSettingsDataSnapshot(
      context.supabase,
      context.user.id,
    );

    return Response.json({
      data: snapshot,
    });
  } catch (error) {
    logger.error("settings data deletion cancel route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "SETTINGS_DELETION_CANCEL_FAILED",
      message: "Unable to cancel deletion request.",
    });
  }
}
