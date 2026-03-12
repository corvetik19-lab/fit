alter table public.workout_days
  add column if not exists session_duration_seconds integer;

alter table public.workout_days
  drop constraint if exists workout_days_session_duration_seconds_check;

alter table public.workout_days
  add constraint workout_days_session_duration_seconds_check
  check (
    session_duration_seconds is null
    or session_duration_seconds >= 0
    and session_duration_seconds <= 43200
  );
