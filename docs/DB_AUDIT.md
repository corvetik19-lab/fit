# Аудит базы данных `fit`

Последнее обновление: `2026-03-19`

Этот документ фиксирует текущее состояние Supabase-схемы проекта `fit` по итогам ручного аудита через MCP и служит source of truth для release-проверок DB-контура.

## Контекст

- Проект Supabase: `fit-dev`
- Project ref: `nactzaxrjzsdkyfqwecf`
- Источник данных: Supabase MCP (`list_tables`, `get_advisors`, прямые SQL-запросы к `pg_indexes`, `pg_policies`, `information_schema.routines`)

## Что было проверено

- схема `public` и наличие `RLS` на бизнес-таблицах;
- owner-only и deny-all policies на ключевых user/admin/system таблицах;
- публичные функции и их `security_type`;
- индексные пути для контуров:
  - `sync`
  - `workout`
  - `knowledge`
  - `admin`
  - `billing`
- актуальные Supabase advisors `security` и `performance`.

## Итог аудита

### 1. Таблицы и RLS

- Все обнаруженные таблицы `public`, которые используются приложением, находятся под `RLS`.
- Это включает пользовательские контуры:
  - `weekly_programs`, `workout_days`, `workout_exercises`, `workout_sets`
  - `foods`, `meals`, `recipes`, `meal_templates`, `nutrition_goals`, `body_metrics`
  - `ai_chat_sessions`, `ai_chat_messages`, `ai_plan_proposals`
  - `knowledge_chunks`, `knowledge_embeddings`, `user_context_snapshots`
  - `subscriptions`, `subscription_events`, `entitlements`, `usage_counters`
- И системные/операторские контуры:
  - `platform_admins`
  - `admin_audit_logs`
  - `support_actions`
  - `platform_settings`
  - `system_metrics_snapshots`
  - `ai_eval_runs`
  - `ai_eval_results`

### 2. Политики доступа

Подтверждены два базовых паттерна:

- `owner-only` для пользовательских данных:
  - `weekly_programs`
  - `workout_days`
  - `workout_exercises`
  - `workout_sets`
  - `ai_chat_sessions`
  - `ai_chat_messages`
  - `ai_plan_proposals`
  - `knowledge_chunks`
  - `knowledge_embeddings`
  - `user_context_snapshots`
- `deny-all` для системных таблиц:
  - `admin_audit_logs`
  - `support_actions`
  - `platform_settings`
  - `system_metrics_snapshots`

Это согласуется с route-level и direct `test:rls` проверками.

### 3. RPC / функции

Проверенные публичные функции:

- `handle_new_user` — `SECURITY DEFINER`
- `match_knowledge_chunks` — `SECURITY INVOKER`
- `search_knowledge_chunks_text` — `SECURITY INVOKER`
- `prevent_locked_program_change` — `SECURITY INVOKER`
- `set_updated_at` — `SECURITY INVOKER`

Что важно:

- `set_updated_at` уже был усилен отдельной миграцией и больше не светится в advisors по mutable `search_path`.
- Retrieval-функции knowledge-слоя остаются invoker-based и работают поверх `RLS`, а не в обход пользовательской изоляции.
- `prevent_locked_program_change` остаётся частью server/database guard-контура для locked workout execution.

## Индексные пути по критическим контурам

### Workout / Sync

Подтверждены ключевые индексы:

- `weekly_programs_user_id_idx`
- `weekly_programs_unique_active_week`
- `workout_days_user_id_idx`
- `workout_days_weekly_program_id_idx`
- `workout_exercises_user_id_idx`
- `workout_exercises_workout_day_id_idx`
- `workout_sets_user_id_idx`
- `workout_sets_workout_exercise_id_idx`

Вывод:

- owner-scoped чтение и mutation-контракты для workout execution не опираются на full table scan;
- locked-program и sync-потоки обеспечены базовыми индексами по владельцу и родительским связям.

### Knowledge / AI

Подтверждены ключевые индексы:

- `knowledge_chunks_user_id_idx`
- `knowledge_chunks_user_source_created_idx`
- `knowledge_chunks_user_content_fts_idx`
- `knowledge_embeddings_user_id_idx`
- `knowledge_embeddings_chunk_id_idx`
- `knowledge_embeddings_embedding_idx`
- `user_context_snapshots_user_id_idx`

Вывод:

- retrieval и snapshot-контур имеют нужные индексные опоры по `user_id`, времени и связке `chunk -> embedding`;
- часть индексов помечена advisors как `unused_index`, но это не признак отсутствия нужного query path, а признак того, что на текущем объёме или профиле нагрузки они ещё не были статистически задействованы.

### Admin / Self-service

Подтверждены ключевые индексы:

- `admin_audit_logs_actor_user_id_idx`
- `admin_audit_logs_target_user_id_idx`
- `support_actions_actor_user_id_idx`
- `support_actions_target_user_action_status_created_at_idx`
- `export_jobs_user_id_idx`
- `export_jobs_requested_by_idx`
- `export_jobs_user_status_created_at_idx`
- `deletion_requests_requested_by_idx`

Вывод:

- операторский контур и self-service export/deletion имеют адресные индексы под owner/admin drill-down и queue-паттерны;
- после corrective migrations missing-index backlog по этим таблицам закрыт.

### Billing

Подтверждены ключевые индексы:

- `subscriptions_user_id_idx`
- `subscriptions_provider_customer_id_idx`
- `subscriptions_provider_subscription_id_idx`
- `subscription_events_user_id_idx`
- `subscription_events_subscription_id_idx`
- `subscription_events_provider_event_id_idx`

Вывод:

- user-scoped billing slice и webhook/reconcile слой имеют нужные индексы под локальную синхронизацию и provider mapping.

## Advisors: текущее состояние

### Security

Остались только два platform-level warning:

1. `extension_in_public`
   - `vector` установлен в `public`
2. `auth_leaked_password_protection`
   - защита от скомпрометированных паролей выключена

Это не обычные repo-level DDL-хвосты и не закрываются простой прикладной миграцией из текущего кода.

### Performance

Блокирующих performance-warning не осталось.

Остались только `INFO` по `unused_index` на части таблиц, включая:

- `knowledge_embeddings`
- `period_metric_snapshots`
- `subscriptions`
- `subscription_events`
- `knowledge_chunks`
- `admin_audit_logs`
- `export_jobs`
- `deletion_requests`
- `support_actions`
- `ai_eval_results`
- `ai_eval_runs`
- `body_metrics`
- `feature_flags`
- `meal_items`
- `nutrition_goals`
- `platform_admins`
- `platform_settings`
- `recipe_items`
- `user_admin_states`
- `weekly_programs`
- `workout_exercises`

Это зафиксировано как отдельный backlog на последующую оптимизацию и само по себе не является blocker'ом для текущего production-hardening tranche.

## Что считается закрытым после этого аудита

- schema / RLS / RPC / index-path аудит по repo-controlled DB-контуру выполнен;
- query-path проверка для `sync`, `workout`, `knowledge`, `admin`, `billing` выполнена;
- текущие platform-level хвосты по Supabase теперь формализованы как release-политика, а не как неясный технический долг.

## Что остаётся внешним blocker'ом

Перед финальным release-ready статусом отдельно решить:

1. включать ли `leaked password protection` в Supabase Auth;
2. переносить ли `vector` из `public` или принимать это как осознанный platform risk.

Эти два пункта должны проверяться вместе с `docs/RELEASE_CHECKLIST.md` и `docs/PROD_READY.md`.

## Чем это подтверждено

- `npm run test:rls`
- owner-scoped e2e route contracts
- Supabase advisors `security` и `performance`
- прямые SQL-проверки по `pg_indexes`, `pg_policies`, `information_schema.routines`
