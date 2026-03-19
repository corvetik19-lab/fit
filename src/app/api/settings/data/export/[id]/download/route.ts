import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  buildSettingsExportDownload,
  getAuthenticatedSettingsContext,
} from "@/lib/settings-self-service";
import { logger } from "@/lib/logger";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = paramsSchema.parse(await params);
    const context = await getAuthenticatedSettingsContext();

    if (!context) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы скачать выгрузку.",
      });
    }

    const result = await buildSettingsExportDownload({
      exportId: id,
      supabase: context.supabase,
      user: context.user,
    });

    if (!result.ok) {
      return createApiErrorResponse({
        status: result.status,
        code: result.code,
        message: result.message,
        details: result.details,
      });
    }

    const archiveBytes = Uint8Array.from(result.data.archive);

    return new Response(archiveBytes.buffer, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${result.data.filename}"`,
        "Content-Type": "application/zip",
        "X-Export-Format": result.data.format,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "SETTINGS_EXPORT_INVALID",
        message: "Некорректный идентификатор выгрузки.",
        details: error.flatten(),
      });
    }

    logger.error("settings export download route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "SETTINGS_EXPORT_DOWNLOAD_FAILED",
      message: "Не удалось подготовить выгрузку к скачиванию.",
    });
  }
}
