import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { DATA_EXPORT_FORMAT } from "@/lib/settings-data";
import { loadSettingsDataSnapshotOrFallback } from "@/lib/settings-data-server";
import {
  cancelSettingsDeletion,
  getAuthenticatedSettingsContext,
  queueSettingsDataExport,
  requestSettingsDeletion,
} from "@/lib/settings-self-service";

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

export async function GET(request: Request) {
  try {
    const context = await getAuthenticatedSettingsContext(request);

    if (!context) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы открыть центр данных.",
      });
    }

    const snapshot = await loadSettingsDataSnapshotOrFallback(
      context.supabase,
      context.user.id,
    );

    return Response.json({ data: snapshot });
  } catch (error) {
    logger.error("settings data snapshot route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "SETTINGS_DATA_SNAPSHOT_FAILED",
      message: "Не удалось загрузить центр данных.",
    });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getAuthenticatedSettingsContext(request);

    if (!context) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы изменить настройки центра данных.",
      });
    }

    const payload = settingsDataActionSchema.parse(await request.json());

    if (payload.action === "queue_export") {
      const exportResult = await queueSettingsDataExport(
        context.supabase,
        context.user.id,
        payload.format,
      );

      if (!exportResult.ok) {
        return createApiErrorResponse({
          status: exportResult.status,
          code: exportResult.code,
          message: exportResult.message,
        });
      }
    }

    if (payload.action === "request_deletion") {
      await requestSettingsDeletion(context.supabase, {
        reason: payload.reason,
        userId: context.user.id,
      });
    }

    const snapshot = await loadSettingsDataSnapshotOrFallback(
      context.supabase,
      context.user.id,
    );

    return Response.json({
      data: snapshot,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "SETTINGS_DATA_INVALID",
        message: "Запрос к центру данных заполнен некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("settings data mutation route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "SETTINGS_DATA_UPDATE_FAILED",
      message: "Не удалось обновить настройки центра данных.",
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await getAuthenticatedSettingsContext(request);

    if (!context) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы изменить настройки центра данных.",
      });
    }

    const cancelResult = await cancelSettingsDeletion(
      context.supabase,
      context.user.id,
    );

    if (!cancelResult.ok) {
      return createApiErrorResponse({
        status: cancelResult.status,
        code: cancelResult.code,
        message: cancelResult.message,
      });
    }

    const snapshot = await loadSettingsDataSnapshotOrFallback(
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
      message: "Не удалось отменить запрос на удаление.",
    });
  }
}
