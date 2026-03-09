alter table public.workout_sets
  add column if not exists planned_reps_min integer,
  add column if not exists planned_reps_max integer;

alter table public.workout_sets
  drop constraint if exists workout_sets_planned_rep_range_check;

alter table public.workout_sets
  add constraint workout_sets_planned_rep_range_check
  check (
    (
      planned_reps_min is null and planned_reps_max is null
    )
    or (
      planned_reps_min is not null
      and planned_reps_max is not null
      and planned_reps_min > 0
      and planned_reps_max >= planned_reps_min
      and planned_reps between planned_reps_min and planned_reps_max
    )
  );
