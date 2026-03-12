alter table public.workout_sets
  add column if not exists rest_seconds integer,
  add column if not exists set_note text;

alter table public.workout_sets
  drop constraint if exists workout_sets_rest_seconds_check;

alter table public.workout_sets
  add constraint workout_sets_rest_seconds_check
  check (rest_seconds is null or (rest_seconds >= 0 and rest_seconds <= 3600));

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
    if (to_jsonb(new) - 'status' - 'body_weight_kg' - 'session_note' - 'updated_at') <>
       (to_jsonb(old) - 'status' - 'body_weight_kg' - 'session_note' - 'updated_at') then
      raise exception 'Locked workout days only allow status/body_weight_kg/session_note updates.';
    end if;
  elsif tg_table_name = 'workout_exercises' then
    if (to_jsonb(new) - 'updated_at') <>
       (to_jsonb(old) - 'updated_at') then
      raise exception 'Locked workout exercises are immutable.';
    end if;
  elsif tg_table_name = 'workout_sets' then
    if (to_jsonb(new) - 'actual_reps' - 'actual_weight_kg' - 'actual_rpe' - 'rest_seconds' - 'set_note' - 'updated_at') <>
       (to_jsonb(old) - 'actual_reps' - 'actual_weight_kg' - 'actual_rpe' - 'rest_seconds' - 'set_note' - 'updated_at') then
      raise exception 'Locked workout sets only allow actual_reps/actual_weight_kg/actual_rpe/rest_seconds/set_note updates.';
    end if;
  end if;

  return new;
end;
$$;
