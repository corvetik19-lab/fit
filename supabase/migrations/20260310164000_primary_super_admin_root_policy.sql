do $$
declare
  primary_user_id uuid;
begin
  select id
  into primary_user_id
  from auth.users
  where lower(email) = lower('corvetik1@yandex.ru')
  order by created_at asc
  limit 1;

  if primary_user_id is null then
    raise exception 'Primary super admin user corvetik1@yandex.ru was not found in auth.users';
  end if;

  update public.platform_admins
  set role = 'support_admin',
      updated_at = timezone('utc', now())
  where role = 'super_admin'
    and user_id <> primary_user_id;

  insert into public.platform_admins (
    user_id,
    role,
    granted_by
  )
  values (
    primary_user_id,
    'super_admin',
    primary_user_id
  )
  on conflict (user_id) do update
  set role = 'super_admin',
      granted_by = coalesce(public.platform_admins.granted_by, excluded.granted_by),
      updated_at = timezone('utc', now());

  insert into public.admin_audit_logs (
    actor_user_id,
    target_user_id,
    action,
    reason,
    payload
  )
  values (
    primary_user_id,
    primary_user_id,
    'primary_super_admin_enforced',
    'database migration enforcement',
    jsonb_build_object(
      'email', 'corvetik1@yandex.ru',
      'role', 'super_admin'
    )
  );
end
$$;

create unique index if not exists platform_admins_single_super_admin_idx
on public.platform_admins ((role))
where role = 'super_admin';
