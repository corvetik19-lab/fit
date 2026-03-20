import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AdminSupportActionSupabase = ReturnType<typeof createAdminSupabaseClient>;

type AdminSupportActionRow = {
  action: string;
  created_at: string;
  id: string;
  payload?: Record<string, unknown> | null;
  status: string;
};

export async function queueAdminSupportAction(params: {
  action: string;
  actorUserId: string;
  auditAction?: string;
  auditPayload?: Record<string, unknown>;
  auditReason: string;
  payload?: Record<string, unknown>;
  supabase: AdminSupportActionSupabase;
  targetUserId: string;
}) {
  const {
    action,
    actorUserId,
    auditAction,
    auditPayload,
    auditReason,
    payload,
    supabase,
    targetUserId,
  } = params;

  const { data, error } = await supabase
    .from("support_actions")
    .insert({
      actor_user_id: actorUserId,
      target_user_id: targetUserId,
      action,
      status: "queued",
      payload: payload ?? {},
    })
    .select("id, action, status, created_at, payload")
    .single();

  if (error) {
    throw error;
  }

  const { error: auditError } = await supabase.from("admin_audit_logs").insert({
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    action: auditAction ?? action,
    reason: auditReason,
    payload: {
      supportActionId: data.id,
      ...(auditPayload ?? {}),
    },
  });

  if (auditError) {
    throw auditError;
  }

  return data as AdminSupportActionRow;
}
