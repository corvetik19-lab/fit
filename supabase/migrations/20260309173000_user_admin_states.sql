create table if not exists public.user_admin_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  is_suspended boolean not null default false,
  suspended_at timestamptz,
  suspended_by uuid references auth.users (id) on delete set null,
  restored_at timestamptz,
  restored_by uuid references auth.users (id) on delete set null,
  state_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_admin_states_user_id_idx
on public.user_admin_states (user_id);

drop trigger if exists user_admin_states_set_updated_at on public.user_admin_states;
create trigger user_admin_states_set_updated_at
before update on public.user_admin_states
for each row execute function public.set_updated_at();

alter table public.user_admin_states enable row level security;

drop policy if exists user_admin_states_owner_select on public.user_admin_states;
create policy user_admin_states_owner_select
on public.user_admin_states
for select
using (auth.uid() = user_id);
