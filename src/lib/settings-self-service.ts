import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  isPrimarySuperAdminEmail,
} from "@/lib/admin-permissions";
import {
  BILLING_FEATURE_KEYS,
  readUserBillingAccessOrFallback,
} from "@/lib/billing-access";
import { logger } from "@/lib/logger";
import {
  DATA_EXPORT_FORMAT,
  getDefaultDeletionHoldUntil,
  type SettingsDataSnapshot,
} from "@/lib/settings-data";
import {
  buildUserDataExportBundle,
  loadSettingsDataSnapshotOrFallback,
} from "@/lib/settings-data-server";
import { buildUserDataExportArchive } from "@/lib/settings-export-archive";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthenticatedSettingsContext = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  user: {
    email?: string | null;
    id: string;
  };
};

export type SettingsBillingCenterData = {
  access: Awaited<ReturnType<typeof readUserBillingAccessOrFallback>>;
  snapshot: SettingsDataSnapshot;
};

type SettingsActionFailure = {
  code: string;
  details?: unknown;
  message: string;
  status: number;
};

type SettingsActionResult<T> =
  | {
      data: T;
      ok: true;
    }
  | ({
      ok: false;
    } & SettingsActionFailure);

export async function getAuthenticatedSettingsContext(): Promise<AuthenticatedSettingsContext | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    supabase,
    user: {
      email: user.email,
      id: user.id,
    },
  };
}

export async function writeSettingsAuditLog(input: {
  action: string;
  payload: Record<string, unknown>;
  reason: string;
  userId: string;
}) {
  try {
    const adminSupabase = createAdminSupabaseClient();

    const { error } = await adminSupabase.from("admin_audit_logs").insert({
      action: input.action,
      actor_user_id: input.userId,
      payload: input.payload,
      reason: input.reason,
      target_user_id: input.userId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.warn("settings audit log failed", {
      action: input.action,
      error,
      userId: input.userId,
    });
  }
}

export async function loadSettingsBillingCenterData(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  userEmail?: string | null,
): Promise<SettingsBillingCenterData> {
  const [snapshot, access] = await Promise.all([
    loadSettingsDataSnapshotOrFallback(supabase, userId),
    readUserBillingAccessOrFallback(supabase, userId, {
      email: userEmail,
    }),
  ]);

  return {
    access,
    snapshot,
  };
}

export async function queueSettingsDataExport(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  format?: string,
) {
  const { data: activeExportJob, error: activeExportError } = await supabase
    .from("export_jobs")
    .select("id, status")
    .eq("user_id", userId)
    .in("status", ["queued", "processing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeExportError) {
    throw activeExportError;
  }

  if (activeExportJob) {
    return {
      code: "SETTINGS_EXPORT_ALREADY_ACTIVE" as const,
      message:
        "У тебя уже есть активная выгрузка. Дождись её завершения перед новым запросом.",
      ok: false as const,
      status: 409,
    };
  }

  const { error: queueExportError } = await supabase.from("export_jobs").insert({
    format: format ?? DATA_EXPORT_FORMAT,
    requested_by: userId,
    status: "queued",
    user_id: userId,
  });

  if (queueExportError) {
    throw queueExportError;
  }

  await writeSettingsAuditLog({
    action: "user_requested_export",
    payload: {
      format: format ?? DATA_EXPORT_FORMAT,
    },
    reason: "self-service settings action",
    userId,
  });

  return { ok: true as const };
}

export async function requestSettingsDeletion(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  input: {
    reason?: string | null;
    userEmail?: string | null;
    userId: string;
  },
) {
  if (isPrimarySuperAdminEmail(input.userEmail ?? null)) {
    return {
      code: "PRIMARY_SUPER_ADMIN_PROTECTED" as const,
      message: `Основной супер-админ ${PRIMARY_SUPER_ADMIN_EMAIL} не может запустить удаление аккаунта.`,
      ok: false as const,
      status: 403,
    };
  }

  const holdUntil = getDefaultDeletionHoldUntil();

  const { error: deletionRequestError } = await supabase
    .from("deletion_requests")
    .upsert(
      {
        hold_until: holdUntil,
        requested_by: input.userId,
        status: "holding",
        user_id: input.userId,
      },
      {
        onConflict: "user_id",
      },
    );

  if (deletionRequestError) {
    throw deletionRequestError;
  }

  await writeSettingsAuditLog({
    action: "user_requested_deletion",
    payload: {
      holdUntil,
      reason: input.reason ?? null,
    },
    reason: "self-service settings action",
    userId: input.userId,
  });

  return { ok: true as const };
}

export async function cancelSettingsDeletion(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("deletion_requests")
    .update({
      requested_by: userId,
      status: "canceled",
    })
    .eq("user_id", userId)
    .in("status", ["queued", "holding"])
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      code: "SETTINGS_DELETION_NOT_FOUND" as const,
      message: "Активный запрос на удаление не найден.",
      ok: false as const,
      status: 404,
    };
  }

  await writeSettingsAuditLog({
    action: "user_canceled_deletion",
    payload: {
      deletionRequestId: data.id,
    },
    reason: "self-service settings action",
    userId,
  });

  return { ok: true as const };
}

export async function requestSettingsBillingAccessReview(input: {
  note?: string | null;
  requestedFeatures: string[];
  userId: string;
}) {
  const adminSupabase = createAdminSupabaseClient();
  const dedupedFeatures = [...new Set(input.requestedFeatures)].filter((feature) =>
    Object.values(BILLING_FEATURE_KEYS).includes(
      feature as (typeof BILLING_FEATURE_KEYS)[keyof typeof BILLING_FEATURE_KEYS],
    ),
  );

  const { data: activeReviewRequest, error: activeReviewRequestError } =
    await adminSupabase
      .from("support_actions")
      .select("id, status")
      .eq("target_user_id", input.userId)
      .eq("action", "billing_access_review")
      .eq("status", "queued")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (activeReviewRequestError) {
    throw activeReviewRequestError;
  }

  if (activeReviewRequest) {
    return {
      code: "SETTINGS_BILLING_REVIEW_ALREADY_ACTIVE" as const,
      message:
        "У тебя уже есть активный запрос на проверку доступа. Дождись обработки текущего обращения.",
      ok: false as const,
      status: 409,
    };
  }

  const { error: reviewRequestError } = await adminSupabase
    .from("support_actions")
    .insert({
      action: "billing_access_review",
      actor_user_id: input.userId,
      payload: {
        note: input.note ?? null,
        requestOrigin: "settings_billing_center",
        requestedFeatures: dedupedFeatures,
        source: "self_service",
      },
      status: "queued",
      target_user_id: input.userId,
    });

  if (reviewRequestError) {
    throw reviewRequestError;
  }

  await writeSettingsAuditLog({
    action: "user_requested_billing_access_review",
    payload: {
      note: input.note ?? null,
      requestedFeatures: dedupedFeatures,
    },
    reason: "self-service settings billing action",
    userId: input.userId,
  });

  return { ok: true as const };
}

export async function buildSettingsExportDownload(input: {
  exportId: string;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  user: {
    email?: string | null;
    id: string;
  };
}): Promise<
  SettingsActionResult<{
    archive: Uint8Array;
    filename: string;
    format: string;
  }>
> {
  const { data: exportJob, error: exportJobError } = await input.supabase
    .from("export_jobs")
    .select("id, status, format")
    .eq("id", input.exportId)
    .eq("user_id", input.user.id)
    .maybeSingle();

  if (exportJobError) {
    throw exportJobError;
  }

  if (!exportJob) {
    return {
      ok: false,
      status: 404,
      code: "SETTINGS_EXPORT_NOT_FOUND",
      message: "Выгрузка не найдена.",
    };
  }

  if (exportJob.status !== "completed") {
    return {
      ok: false,
      status: 409,
      code: "SETTINGS_EXPORT_NOT_READY",
      message: "Выгрузка ещё не готова к скачиванию.",
    };
  }

  const adminSupabase = createAdminSupabaseClient();
  const exportBundle = await buildUserDataExportBundle(adminSupabase, {
    userEmail: input.user.email ?? null,
    userId: input.user.id,
  });
  const archive = buildUserDataExportArchive(exportBundle);

  await writeSettingsAuditLog({
    action: "user_downloaded_export",
    payload: {
      exportJobId: exportJob.id,
    },
    reason: "self-service data export download",
    userId: input.user.id,
  });

  const dayStamp = new Date().toISOString().slice(0, 10);

  return {
    ok: true,
    data: {
      archive,
      filename: `fit-data-export-${dayStamp}.zip`,
      format: exportJob.format,
    },
  };
}
