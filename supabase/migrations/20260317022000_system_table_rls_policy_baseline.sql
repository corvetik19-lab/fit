begin;

do $$
declare
  target_tables text[] := array[
    'admin_audit_logs',
    'ai_eval_results',
    'ai_eval_runs',
    'feature_flags',
    'platform_settings',
    'support_actions',
    'system_metrics_snapshots'
  ];
  table_name text;
begin
  foreach table_name in array target_tables loop
    execute format('drop policy if exists %I_deny_all on public.%I', table_name, table_name);
    execute format(
      'create policy %I_deny_all on public.%I for all using (false) with check (false)',
      table_name,
      table_name
    );
  end loop;
end $$;

commit;
