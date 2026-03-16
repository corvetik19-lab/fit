create index if not exists ai_eval_results_run_id_idx
  on public.ai_eval_results (run_id);

create index if not exists ai_eval_runs_requested_by_idx
  on public.ai_eval_runs (requested_by);

create index if not exists ai_safety_events_user_id_idx
  on public.ai_safety_events (user_id);

create index if not exists body_metrics_user_id_idx
  on public.body_metrics (user_id);

create index if not exists feature_flags_updated_by_idx
  on public.feature_flags (updated_by);

create index if not exists foods_user_id_idx
  on public.foods (user_id);

create index if not exists knowledge_embeddings_chunk_id_idx
  on public.knowledge_embeddings (chunk_id);

create index if not exists meal_items_food_id_idx
  on public.meal_items (food_id);

create index if not exists meal_items_meal_id_idx
  on public.meal_items (meal_id);

create index if not exists meal_templates_user_id_idx
  on public.meal_templates (user_id);

create index if not exists nutrition_goals_user_id_idx
  on public.nutrition_goals (user_id);

create index if not exists platform_admins_granted_by_idx
  on public.platform_admins (granted_by);

create index if not exists platform_settings_updated_by_idx
  on public.platform_settings (updated_by);

create index if not exists recipe_items_food_id_idx
  on public.recipe_items (food_id);

create index if not exists recipe_items_recipe_id_idx
  on public.recipe_items (recipe_id);

create index if not exists recipe_items_user_id_idx
  on public.recipe_items (user_id);

create index if not exists recipes_user_id_idx
  on public.recipes (user_id);

create index if not exists subscription_events_subscription_id_idx
  on public.subscription_events (subscription_id);

create index if not exists subscription_events_user_id_idx
  on public.subscription_events (user_id);

create index if not exists user_admin_states_restored_by_idx
  on public.user_admin_states (restored_by);

create index if not exists user_admin_states_suspended_by_idx
  on public.user_admin_states (suspended_by);

create index if not exists user_memory_facts_user_id_idx
  on public.user_memory_facts (user_id);

create index if not exists weekly_programs_source_program_id_idx
  on public.weekly_programs (source_program_id);

create index if not exists workout_exercises_exercise_library_id_idx
  on public.workout_exercises (exercise_library_id);

drop policy if exists profiles_owner_delete on public.profiles;
create policy profiles_owner_delete
  on public.profiles
  for delete
  using ((select auth.uid()) = user_id);

drop policy if exists profiles_owner_insert on public.profiles;
create policy profiles_owner_insert
  on public.profiles
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists profiles_owner_select on public.profiles;
create policy profiles_owner_select
  on public.profiles
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update
  on public.profiles
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists subscriptions_owner_delete on public.subscriptions;
create policy subscriptions_owner_delete
  on public.subscriptions
  for delete
  using ((select auth.uid()) = user_id);

drop policy if exists subscriptions_owner_insert on public.subscriptions;
create policy subscriptions_owner_insert
  on public.subscriptions
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists subscriptions_owner_select on public.subscriptions;
create policy subscriptions_owner_select
  on public.subscriptions
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists subscriptions_owner_update on public.subscriptions;
create policy subscriptions_owner_update
  on public.subscriptions
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists subscription_events_owner_delete on public.subscription_events;
create policy subscription_events_owner_delete
  on public.subscription_events
  for delete
  using ((select auth.uid()) = user_id);

drop policy if exists subscription_events_owner_insert on public.subscription_events;
create policy subscription_events_owner_insert
  on public.subscription_events
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists subscription_events_owner_select on public.subscription_events;
create policy subscription_events_owner_select
  on public.subscription_events
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists subscription_events_owner_update on public.subscription_events;
create policy subscription_events_owner_update
  on public.subscription_events
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists workout_days_owner_delete on public.workout_days;
create policy workout_days_owner_delete
  on public.workout_days
  for delete
  using ((select auth.uid()) = user_id);

drop policy if exists workout_days_owner_insert on public.workout_days;
create policy workout_days_owner_insert
  on public.workout_days
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists workout_days_owner_select on public.workout_days;
create policy workout_days_owner_select
  on public.workout_days
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists workout_days_owner_update on public.workout_days;
create policy workout_days_owner_update
  on public.workout_days
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists ai_plan_proposals_owner_delete on public.ai_plan_proposals;
create policy ai_plan_proposals_owner_delete
  on public.ai_plan_proposals
  for delete
  using ((select auth.uid()) = user_id);

drop policy if exists ai_plan_proposals_owner_insert on public.ai_plan_proposals;
create policy ai_plan_proposals_owner_insert
  on public.ai_plan_proposals
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists ai_plan_proposals_owner_select on public.ai_plan_proposals;
create policy ai_plan_proposals_owner_select
  on public.ai_plan_proposals
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists ai_plan_proposals_owner_update on public.ai_plan_proposals;
create policy ai_plan_proposals_owner_update
  on public.ai_plan_proposals
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
