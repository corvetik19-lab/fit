create type public.export_job_status as enum ('queued', 'processing', 'completed', 'failed');
create type public.deletion_request_status as enum ('queued', 'holding', 'completed', 'canceled');
create type public.ai_eval_status as enum ('queued', 'running', 'completed', 'failed');

create table if not exists public.nutrition_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_type public.goal_type not null,
  kcal_target integer,
  protein_target integer,
  fat_target integer,
  carbs_target integer,
  effective_from date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  instructions text,
  servings numeric(8,2) not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  food_id uuid references public.foods (id) on delete set null,
  food_name_snapshot text not null,
  servings numeric(8,2) not null default 1,
  kcal integer not null default 0,
  protein numeric(6,2) not null default 0,
  fat numeric(6,2) not null default 0,
  carbs numeric(6,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.meal_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  metric_date date not null,
  workout_count integer not null default 0,
  total_reps integer not null default 0,
  total_kcal integer not null default 0,
  adherence_score numeric(6,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, metric_date)
);

create table if not exists public.period_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_key text not null,
  period_start date not null,
  period_end date not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_memory_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fact_type text not null,
  content text not null,
  source text not null default 'app',
  confidence numeric(4,3) not null default 0.5,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_context_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  snapshot_reason text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'stripe',
  provider_subscription_id text,
  status public.subscription_status not null default 'trial',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature_key text not null,
  limit_value integer,
  is_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, feature_key)
);

create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  metric_key text not null,
  metric_window text not null default 'monthly',
  usage_count bigint not null default 0,
  reset_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, metric_key, metric_window)
);

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  provider_event_id text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role public.admin_role not null default 'support_admin',
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  target_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.support_actions (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  target_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  status public.support_action_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platform_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  is_enabled boolean not null default false,
  rollout_percentage integer not null default 0 check (rollout_percentage between 0 and 100),
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.system_metrics_snapshots (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  payload jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  route_key text not null,
  action text not null,
  prompt_excerpt text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  requested_by uuid references auth.users (id) on delete set null,
  format text not null default 'json_csv_zip',
  status public.export_job_status not null default 'queued',
  artifact_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  requested_by uuid references auth.users (id) on delete set null,
  status public.deletion_request_status not null default 'queued',
  hold_until timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_eval_runs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid references auth.users (id) on delete set null,
  label text not null,
  model_id text not null,
  status public.ai_eval_status not null default 'queued',
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_eval_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_eval_runs (id) on delete cascade,
  dataset_name text not null,
  metric_name text not null,
  score numeric(8,4),
  verdict text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists goals_user_id_idx on public.goals (user_id);
create index if not exists exercise_library_user_id_idx on public.exercise_library (user_id);
create index if not exists workout_templates_user_id_idx on public.workout_templates (user_id);
create index if not exists weekly_programs_user_id_idx on public.weekly_programs (user_id);
create index if not exists workout_days_user_id_idx on public.workout_days (user_id);
create index if not exists workout_days_weekly_program_id_idx on public.workout_days (weekly_program_id);
create index if not exists workout_exercises_user_id_idx on public.workout_exercises (user_id);
create index if not exists workout_exercises_workout_day_id_idx on public.workout_exercises (workout_day_id);
create index if not exists workout_sets_user_id_idx on public.workout_sets (user_id);
create index if not exists workout_sets_workout_exercise_id_idx on public.workout_sets (workout_exercise_id);
create index if not exists meals_user_id_idx on public.meals (user_id);
create index if not exists meal_items_user_id_idx on public.meal_items (user_id);
create index if not exists ai_chat_sessions_user_id_idx on public.ai_chat_sessions (user_id);
create index if not exists ai_plan_proposals_user_id_idx on public.ai_plan_proposals (user_id);
create index if not exists knowledge_chunks_user_id_idx on public.knowledge_chunks (user_id);
create index if not exists knowledge_embeddings_user_id_idx on public.knowledge_embeddings (user_id);
create index if not exists period_metric_snapshots_user_id_idx on public.period_metric_snapshots (user_id);
create index if not exists user_context_snapshots_user_id_idx on public.user_context_snapshots (user_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists entitlements_user_id_idx on public.entitlements (user_id);
create index if not exists usage_counters_user_id_idx on public.usage_counters (user_id);
create index if not exists export_jobs_user_id_idx on public.export_jobs (user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, full_name)
  values (
    new.id,
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.prevent_locked_program_change()
returns trigger
language plpgsql
as $$
declare
  parent_program_id uuid;
  parent_exercise_id uuid;
  locked_program boolean;
begin
  if tg_table_name = 'weekly_programs' then
    if old.is_locked then
      if new.is_locked = false then
        raise exception 'Locked weekly programs cannot be unlocked.';
      end if;

      if (to_jsonb(new) - 'status' - 'is_locked' - 'updated_at') <>
         (to_jsonb(old) - 'status' - 'is_locked' - 'updated_at') then
        raise exception 'Locked weekly programs are immutable.';
      end if;
    end if;

    return new;
  end if;

  if tg_table_name = 'workout_days' then
    parent_program_id := case when tg_op = 'DELETE' then old.weekly_program_id else new.weekly_program_id end;

    select wp.is_locked
    into locked_program
    from public.weekly_programs wp
    where wp.id = parent_program_id;
  elsif tg_table_name = 'workout_exercises' then
    parent_program_id := case when tg_op = 'DELETE' then old.workout_day_id else new.workout_day_id end;

    select wp.is_locked
    into locked_program
    from public.weekly_programs wp
    join public.workout_days wd on wd.weekly_program_id = wp.id
    where wd.id = parent_program_id;
  elsif tg_table_name = 'workout_sets' then
    parent_exercise_id := case when tg_op = 'DELETE' then old.workout_exercise_id else new.workout_exercise_id end;

    select wp.is_locked
    into locked_program
    from public.weekly_programs wp
    join public.workout_days wd on wd.weekly_program_id = wp.id
    join public.workout_exercises we on we.workout_day_id = wd.id
    where we.id = parent_exercise_id;
  end if;

  if coalesce(locked_program, false) = false then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if tg_op in ('INSERT', 'DELETE') then
    raise exception 'Locked weekly programs cannot be structurally modified.';
  end if;

  if tg_table_name = 'workout_days' then
    if (to_jsonb(new) - 'status' - 'updated_at') <>
       (to_jsonb(old) - 'status' - 'updated_at') then
      raise exception 'Locked workout days only allow status updates.';
    end if;
  elsif tg_table_name = 'workout_exercises' then
    if (to_jsonb(new) - 'updated_at') <>
       (to_jsonb(old) - 'updated_at') then
      raise exception 'Locked workout exercises are immutable.';
    end if;
  elsif tg_table_name = 'workout_sets' then
    if (to_jsonb(new) - 'actual_reps' - 'updated_at') <>
       (to_jsonb(old) - 'actual_reps' - 'updated_at') then
      raise exception 'Locked workout sets only allow actual_reps updates.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists weekly_programs_lock_guard on public.weekly_programs;
create trigger weekly_programs_lock_guard
before update on public.weekly_programs
for each row execute function public.prevent_locked_program_change();

drop trigger if exists workout_days_lock_guard on public.workout_days;
create trigger workout_days_lock_guard
before insert or update or delete on public.workout_days
for each row execute function public.prevent_locked_program_change();

drop trigger if exists workout_exercises_lock_guard on public.workout_exercises;
create trigger workout_exercises_lock_guard
before insert or update or delete on public.workout_exercises
for each row execute function public.prevent_locked_program_change();

drop trigger if exists workout_sets_lock_guard on public.workout_sets;
create trigger workout_sets_lock_guard
before insert or update or delete on public.workout_sets
for each row execute function public.prevent_locked_program_change();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'goals',
    'onboarding_profiles',
    'exercise_library',
    'workout_templates',
    'weekly_programs',
    'workout_days',
    'workout_exercises',
    'workout_sets',
    'body_metrics',
    'nutrition_profiles',
    'nutrition_goals',
    'foods',
    'recipes',
    'recipe_items',
    'meal_templates',
    'meals',
    'meal_items',
    'daily_nutrition_summaries',
    'daily_metrics',
    'period_metric_snapshots',
    'ai_chat_sessions',
    'ai_chat_messages',
    'ai_plan_proposals',
    'knowledge_chunks',
    'knowledge_embeddings',
    'user_memory_facts',
    'user_context_snapshots',
    'subscriptions',
    'entitlements',
    'usage_counters',
    'subscription_events',
    'platform_admins',
    'admin_audit_logs',
    'support_actions',
    'platform_settings',
    'feature_flags',
    'system_metrics_snapshots',
    'ai_safety_events',
    'export_jobs',
    'deletion_requests',
    'ai_eval_runs',
    'ai_eval_results'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_set_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', table_name || '_set_updated_at', table_name);
  end loop;
end
$$;

create or replace function public.apply_owner_rls(target_table text, user_column text)
returns void
language plpgsql
as $$
begin
  execute format('alter table public.%I enable row level security', target_table);

  execute format('drop policy if exists %I on public.%I', target_table || '_owner_select', target_table);
  execute format('drop policy if exists %I on public.%I', target_table || '_owner_insert', target_table);
  execute format('drop policy if exists %I on public.%I', target_table || '_owner_update', target_table);
  execute format('drop policy if exists %I on public.%I', target_table || '_owner_delete', target_table);

  execute format(
    'create policy %I on public.%I for select using (auth.uid() = %I)',
    target_table || '_owner_select',
    target_table,
    user_column
  );
  execute format(
    'create policy %I on public.%I for insert with check (auth.uid() = %I)',
    target_table || '_owner_insert',
    target_table,
    user_column
  );
  execute format(
    'create policy %I on public.%I for update using (auth.uid() = %I) with check (auth.uid() = %I)',
    target_table || '_owner_update',
    target_table,
    user_column,
    user_column
  );
  execute format(
    'create policy %I on public.%I for delete using (auth.uid() = %I)',
    target_table || '_owner_delete',
    target_table,
    user_column
  );
end;
$$;

create or replace function public.apply_owner_or_shared_select_rls(target_table text, user_column text)
returns void
language plpgsql
as $$
begin
  execute format('alter table public.%I enable row level security', target_table);

  execute format('drop policy if exists %I on public.%I', target_table || '_owner_shared_select', target_table);
  execute format('drop policy if exists %I on public.%I', target_table || '_owner_insert', target_table);
  execute format('drop policy if exists %I on public.%I', target_table || '_owner_update', target_table);
  execute format('drop policy if exists %I on public.%I', target_table || '_owner_delete', target_table);

  execute format(
    'create policy %I on public.%I for select using (auth.uid() = %I or %I is null)',
    target_table || '_owner_shared_select',
    target_table,
    user_column,
    user_column
  );
  execute format(
    'create policy %I on public.%I for insert with check (auth.uid() = %I)',
    target_table || '_owner_insert',
    target_table,
    user_column
  );
  execute format(
    'create policy %I on public.%I for update using (auth.uid() = %I) with check (auth.uid() = %I)',
    target_table || '_owner_update',
    target_table,
    user_column,
    user_column
  );
  execute format(
    'create policy %I on public.%I for delete using (auth.uid() = %I)',
    target_table || '_owner_delete',
    target_table,
    user_column
  );
end;
$$;

select public.apply_owner_rls('profiles', 'user_id');
select public.apply_owner_rls('goals', 'user_id');
select public.apply_owner_rls('onboarding_profiles', 'user_id');
select public.apply_owner_rls('exercise_library', 'user_id');
select public.apply_owner_rls('workout_templates', 'user_id');
select public.apply_owner_rls('weekly_programs', 'user_id');
select public.apply_owner_rls('workout_days', 'user_id');
select public.apply_owner_rls('workout_exercises', 'user_id');
select public.apply_owner_rls('workout_sets', 'user_id');
select public.apply_owner_rls('body_metrics', 'user_id');
select public.apply_owner_rls('nutrition_profiles', 'user_id');
select public.apply_owner_rls('nutrition_goals', 'user_id');
select public.apply_owner_or_shared_select_rls('foods', 'user_id');
select public.apply_owner_rls('recipes', 'user_id');
select public.apply_owner_rls('recipe_items', 'user_id');
select public.apply_owner_rls('meal_templates', 'user_id');
select public.apply_owner_rls('meals', 'user_id');
select public.apply_owner_rls('meal_items', 'user_id');
select public.apply_owner_rls('daily_nutrition_summaries', 'user_id');
select public.apply_owner_rls('daily_metrics', 'user_id');
select public.apply_owner_rls('period_metric_snapshots', 'user_id');
select public.apply_owner_rls('ai_chat_sessions', 'user_id');
select public.apply_owner_rls('ai_chat_messages', 'user_id');
select public.apply_owner_rls('ai_plan_proposals', 'user_id');
select public.apply_owner_or_shared_select_rls('knowledge_chunks', 'user_id');
select public.apply_owner_or_shared_select_rls('knowledge_embeddings', 'user_id');
select public.apply_owner_rls('user_memory_facts', 'user_id');
select public.apply_owner_rls('user_context_snapshots', 'user_id');
select public.apply_owner_rls('subscriptions', 'user_id');
select public.apply_owner_rls('entitlements', 'user_id');
select public.apply_owner_rls('usage_counters', 'user_id');
select public.apply_owner_rls('subscription_events', 'user_id');
select public.apply_owner_rls('ai_safety_events', 'user_id');
select public.apply_owner_rls('export_jobs', 'user_id');
select public.apply_owner_rls('deletion_requests', 'user_id');

alter table public.platform_admins enable row level security;
drop policy if exists platform_admins_self_select on public.platform_admins;
create policy platform_admins_self_select
on public.platform_admins
for select
using (auth.uid() = user_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'admin_audit_logs',
    'support_actions',
    'platform_settings',
    'feature_flags',
    'system_metrics_snapshots',
    'ai_eval_runs',
    'ai_eval_results'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end
$$;

drop function if exists public.apply_owner_rls(text, text);
drop function if exists public.apply_owner_or_shared_select_rls(text, text);
