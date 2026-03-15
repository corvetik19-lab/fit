create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create index if not exists admin_audit_logs_actor_user_id_idx
  on public.admin_audit_logs (actor_user_id);

create index if not exists admin_audit_logs_target_user_id_idx
  on public.admin_audit_logs (target_user_id);

create index if not exists ai_chat_messages_session_id_idx
  on public.ai_chat_messages (session_id);

create index if not exists ai_chat_messages_user_session_created_at_idx
  on public.ai_chat_messages (user_id, session_id, created_at desc);

create index if not exists export_jobs_requested_by_idx
  on public.export_jobs (requested_by);

create index if not exists export_jobs_user_status_created_at_idx
  on public.export_jobs (user_id, status, created_at desc);

create index if not exists deletion_requests_requested_by_idx
  on public.deletion_requests (requested_by);

create index if not exists support_actions_actor_user_id_idx
  on public.support_actions (actor_user_id);

create index if not exists support_actions_target_user_action_status_created_at_idx
  on public.support_actions (target_user_id, action, status, created_at desc);
