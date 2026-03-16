begin;

do $$
declare
  target_tables text[] := array[
    'body_metrics',
    'daily_metrics',
    'daily_nutrition_summaries',
    'entitlements',
    'exercise_library',
    'foods',
    'goals',
    'meal_items',
    'meal_templates',
    'meals',
    'nutrition_goals',
    'nutrition_profiles',
    'onboarding_profiles',
    'period_metric_snapshots',
    'recipe_items',
    'recipes',
    'usage_counters',
    'user_memory_facts',
    'weekly_programs',
    'workout_exercises',
    'workout_sets',
    'workout_templates'
  ];
  table_name text;
begin
  foreach table_name in array target_tables loop
    execute format('drop policy if exists %I_owner_select on public.%I', table_name, table_name);
    execute format(
      'create policy %I_owner_select on public.%I for select using ((select auth.uid()) = user_id)',
      table_name,
      table_name
    );

    execute format('drop policy if exists %I_owner_insert on public.%I', table_name, table_name);
    execute format(
      'create policy %I_owner_insert on public.%I for insert with check ((select auth.uid()) = user_id)',
      table_name,
      table_name
    );

    execute format('drop policy if exists %I_owner_update on public.%I', table_name, table_name);
    execute format(
      'create policy %I_owner_update on public.%I for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      table_name,
      table_name
    );

    execute format('drop policy if exists %I_owner_delete on public.%I', table_name, table_name);
    execute format(
      'create policy %I_owner_delete on public.%I for delete using ((select auth.uid()) = user_id)',
      table_name,
      table_name
    );
  end loop;
end $$;

drop policy if exists foods_owner_shared_select on public.foods;
create policy foods_owner_shared_select
on public.foods
for select
using (((select auth.uid()) = user_id) or user_id is null);

drop policy if exists platform_admins_self_select on public.platform_admins;
create policy platform_admins_self_select
on public.platform_admins
for select
using ((select auth.uid()) = user_id);

drop policy if exists user_admin_states_owner_select on public.user_admin_states;
create policy user_admin_states_owner_select
on public.user_admin_states
for select
using ((select auth.uid()) = user_id);

commit;
