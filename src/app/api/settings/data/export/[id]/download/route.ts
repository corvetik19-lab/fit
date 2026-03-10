import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { buildUserDataExportBundle } from "@/lib/settings-data-server";
import { buildUserDataExportArchive } from "@/lib/settings-export-archive";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function writeDownloadAuditLog(exportJobId: string, userId: string) {
  try {
    const adminSupabase = createAdminSupabaseClient();

    const { error } = await adminSupabase.from("admin_audit_logs").insert({
      action: "user_downloaded_export",
      actor_user_id: userId,
      payload: {
        exportJobId,
      },
      reason: "self-service data export download",
      target_user_id: userId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.warn("settings export download audit log failed", {
      error,
      exportJobId,
      userId,
    });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Sign in before downloading an export.",
      });
    }

    const { data: exportJob, error: exportJobError } = await supabase
      .from("export_jobs")
      .select("id, status, format")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (exportJobError) {
      throw exportJobError;
    }

    if (!exportJob) {
      return createApiErrorResponse({
        status: 404,
        code: "SETTINGS_EXPORT_NOT_FOUND",
        message: "Экспорт не найден.",
      });
    }

    if (exportJob.status !== "completed") {
      return createApiErrorResponse({
        status: 409,
        code: "SETTINGS_EXPORT_NOT_READY",
        message: "Экспорт ещё не готов к скачиванию.",
      });
    }

    const adminSupabase = createAdminSupabaseClient();
    const exportBundle = await buildUserDataExportBundle(adminSupabase, {
      userEmail: user.email ?? null,
      userId: user.id,
    });
    const archive = buildUserDataExportArchive(exportBundle);

    await writeDownloadAuditLog(exportJob.id, user.id);

    const dayStamp = new Date().toISOString().slice(0, 10);

    return new Response(archive, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="fit-data-export-${dayStamp}.zip"`,
        "Content-Type": "application/zip",
        "X-Export-Format": exportJob.format,
      },
    });
  } catch (error) {
    logger.error("settings export download route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "SETTINGS_EXPORT_DOWNLOAD_FAILED",
      message: "Unable to prepare export download.",
    });
  }
}
