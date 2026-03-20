import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AdminUserRequestsSupabase = ReturnType<typeof createAdminSupabaseClient>;

const DEFAULT_DELETION_HOLD_DAYS = 14;

function getDefaultDeletionHoldUntil() {
  const holdUntil = new Date();
  holdUntil.setDate(holdUntil.getDate() + DEFAULT_DELETION_HOLD_DAYS);
  return holdUntil.toISOString();
}

export async function queueAdminExportJob(params: {
  actorUserId: string;
  auditAction?: string;
  auditPayload?: Record<string, unknown>;
  auditReason: string;
  format?: "json_csv_zip";
  supabase: AdminUserRequestsSupabase;
  targetUserId: string;
}) {
  const {
    actorUserId,
    auditAction,
    auditPayload,
    auditReason,
    format,
    supabase,
    targetUserId,
  } = params;

  const { data, error } = await supabase
    .from("export_jobs")
    .insert({
      user_id: targetUserId,
      requested_by: actorUserId,
      format: format ?? "json_csv_zip",
      status: "queued",
    })
    .select("id, format, status, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  const { error: auditError } = await supabase.from("admin_audit_logs").insert({
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    action: auditAction ?? "queue_export_job",
    reason: auditReason,
    payload: {
      exportJobId: data.id,
      format: data.format,
      ...(auditPayload ?? {}),
    },
  });

  if (auditError) {
    throw auditError;
  }

  return data;
}

export async function holdAdminDeletionRequest(params: {
  actorUserId: string;
  auditReason: string;
  supabase: AdminUserRequestsSupabase;
  targetUserId: string;
}) {
  const { actorUserId, auditReason, supabase, targetUserId } = params;
  const holdUntil = getDefaultDeletionHoldUntil();

  const { data, error } = await supabase
    .from("deletion_requests")
    .upsert(
      {
        user_id: targetUserId,
        requested_by: actorUserId,
        status: "holding",
        hold_until: holdUntil,
      },
      {
        onConflict: "user_id",
      },
    )
    .select("id, status, hold_until, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  const { error: auditError } = await supabase.from("admin_audit_logs").insert({
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    action: "queue_deletion_request",
    reason: auditReason,
    payload: {
      deletionRequestId: data.id,
      holdUntil: data.hold_until,
    },
  });

  if (auditError) {
    throw auditError;
  }

  return data;
}

export async function cancelAdminDeletionRequest(params: {
  actorUserId: string;
  auditReason: string;
  supabase: AdminUserRequestsSupabase;
  targetUserId: string;
}) {
  const { actorUserId, auditReason, supabase, targetUserId } = params;

  const { data, error } = await supabase
    .from("deletion_requests")
    .update({
      requested_by: actorUserId,
      status: "canceled",
    })
    .eq("user_id", targetUserId)
    .select("id, status, hold_until, created_at, updated_at")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const { error: auditError } = await supabase.from("admin_audit_logs").insert({
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    action: "cancel_deletion_request",
    reason: auditReason,
    payload: {
      deletionRequestId: data.id,
    },
  });

  if (auditError) {
    throw auditError;
  }

  return data;
}
