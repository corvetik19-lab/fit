create extension if not exists pgcrypto;
create extension if not exists vector;

create type public.goal_type as enum ('fat_loss', 'maintenance', 'muscle_gain', 'performance');
create type public.program_status as enum ('draft', 'active', 'completed', 'archived');
create type public.day_status as enum ('planned', 'in_progress', 'done');
create type public.subscription_status as enum ('trial', 'active', 'past_due', 'canceled');
create type public.admin_role as enum ('super_admin', 'support_admin', 'analyst');
create type public.support_action_status as enum ('queued', 'completed', 'failed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_type public.goal_type not null,
  target_weight_kg numeric(5,2),
  weekly_training_days integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.onboarding_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  age integer,
  sex text,
  height_cm integer,
  weight_kg numeric(5,2),
  fitness_level text,
  equipment jsonb not null default '[]'::jsonb,
  injuries jsonb not null default '[]'::jsonb,
  dietary_preferences jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  muscle_group text not null,
  description text,
  note text,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.weekly_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  status public.program_status not null default 'draft',
  week_start_date date not null,
  week_end_date date not null,
  is_locked boolean not null default false,
  source_program_id uuid references public.weekly_programs (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists weekly_programs_unique_active_week
on public.weekly_programs (user_id, week_start_date)
where status = 'active';

create table if not exists public.workout_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weekly_program_id uuid not null references public.weekly_programs (id) on delete cascade,
  day_of_week integer not null check (day_of_week between 1 and 7),
  status public.day_status not null default 'planned',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_day_id uuid not null references public.workout_days (id) on delete cascade,
  exercise_library_id uuid references public.exercise_library (id) on delete set null,
  exercise_title_snapshot text not null,
  sets_count integer not null check (sets_count > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  set_number integer not null check (set_number > 0),
  planned_reps integer not null check (planned_reps > 0),
  actual_reps integer check (actual_reps >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weight_kg numeric(5,2),
  body_fat_pct numeric(5,2),
  measured_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.nutrition_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  kcal_target integer,
  protein_target integer,
  fat_target integer,
  carbs_target integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  source text not null default 'custom',
  name text not null,
  kcal integer not null default 0,
  protein numeric(6,2) not null default 0,
  fat numeric(6,2) not null default 0,
  carbs numeric(6,2) not null default 0,
  barcode text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  eaten_at timestamptz not null default timezone('utc', now()),
  source text not null default 'manual',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.meal_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_id uuid not null references public.meals (id) on delete cascade,
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

create table if not exists public.daily_nutrition_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  summary_date date not null,
  kcal integer not null default 0,
  protein numeric(8,2) not null default 0,
  fat numeric(8,2) not null default 0,
  carbs numeric(8,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, summary_date)
);

create table if not exists public.ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.ai_chat_sessions (id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_plan_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  proposal_type text not null,
  status text not null default 'draft',
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  source_type text not null,
  source_id text,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.knowledge_embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  chunk_id uuid not null references public.knowledge_chunks (id) on delete cascade,
  embedding vector(1024) not null,
  model text not null default 'voyage/voyage-4-large',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists knowledge_embeddings_embedding_idx
on public.knowledge_embeddings
using hnsw (embedding vector_cosine_ops);;
