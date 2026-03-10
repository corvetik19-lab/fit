# Документация по бэкенду

## Стек

- Supabase Auth
- Supabase Postgres
- pgvector
- Row Level Security
- SQL migrations в `supabase/migrations`
- Next.js route handlers для server-side API access

## Текущий Supabase project

- Имя проекта: `fit-dev`
- Project ref: `nactzaxrjzsdkyfqwecf`

Реальные service-role и API-ключи в эту документацию не записывать.

## Миграции

- `20260308093000_initial_fit_platform.sql`
- `20260308095500_platform_admin_ai_rls.sql`
- `20260309121000_workout_rep_ranges.sql`

## Основные домены, уже смоделированные в схеме

- profiles и goals
- onboarding profiles
- exercise library и workout templates
- weekly programs, workout days, workout exercises, workout sets
- body metrics
- foods, meals, meal items, nutrition goals, recipes, meal templates, daily summaries
- AI chat sessions и messages
- AI plan proposals
- knowledge chunks и embeddings
- user context snapshots и memory facts
- subscriptions, entitlements, usage counters, subscription events
- platform admins, audit logs, support actions, settings, feature flags, system snapshots
- AI safety events, export jobs, deletion requests, AI eval runs и results

## Правила безопасности и данных

- бизнес-данные пользователя по умолчанию изолированы через `user_id`
- бизнес-таблицы работают с RLS policies
- `weekly_programs`, `workout_days`, `workout_exercises` и `workout_sets` защищены lock guards
- admin-данные отделены от обычных пользовательских данных

## Текущие server routes

- `src/app/api/chat/route.ts`
- `src/app/api/ai/workout-plan/route.ts`
- `src/app/api/ai/meal-plan/route.ts`
- `src/app/api/ai/meal-photo/route.ts`
- `src/app/api/ai/reindex/route.ts`
- `src/app/api/exercises/route.ts`
- `src/app/api/exercises/[id]/route.ts`
- `src/app/api/foods/route.ts`
- `src/app/api/foods/[id]/route.ts`
- `src/app/api/meals/route.ts`
- `src/app/api/meals/[id]/route.ts`
- `src/app/api/nutrition/targets/route.ts`
- `src/app/api/onboarding/route.ts`
- `src/app/api/weekly-programs/route.ts`
- `src/app/api/weekly-programs/[id]/clone/route.ts`
- `src/app/api/weekly-programs/[id]/lock/route.ts`
- `src/app/api/workout-days/[id]/route.ts`
- `src/app/api/workout-sets/[id]/route.ts`
- `src/app/api/workout-templates/route.ts`
- `src/app/api/dashboard/period-compare/route.ts`
- `src/app/api/sync/pull/route.ts`
- `src/app/api/sync/push/route.ts`
- admin API routes внутри `src/app/api/admin/*`

## Текущее backend-состояние

### Последние обновления

- `GET /api/admin/stats` теперь отдает отдельный `billingHealth` slice с counters по Stripe subscriptions, linked customers, billing review queue и checkout return reconcile activity за последние 24 часа.
- `POST /api/billing/checkout/reconcile` продолжает быть прямым Stripe return reconciliation endpoint, а frontend теперь использует его с auto-retry/backoff вместо одного одноразового запроса.
- `GET /api/admin/users/[id]` уже возвращал self-service billing audit logs через `recentAdminAuditLogs`, а UI теперь лучше раскрывает payload этих записей для super-admin.

Реализовано:

- schema и RLS foundation
- onboarding persistence route
- Supabase browser/server client contracts
- нормализация env
- рабочие exercise library routes для create/list/update/archive/restore
- weekly program create/list route для draft-недель
- clone route для создания нового draft из истории
- lock route для перевода weekly program в `active`
- workout execution routes для `status` дня и `actual_reps` подходов
- workout template routes для сохранения и повторного использования структуры недели
- workout rep range contract с `planned_reps_min` / `planned_reps_max` и общими пресетами диапазонов повторов
- совместимый fallback для `workout_sets` на случай, если remote Supabase ещё не получила миграцию с rep range колонками
- execution helper для workout day/status updates и sync push поверх того же server-side контракта
- admin bootstrap route для первого `super_admin`
- session-based admin access через `platform_admins`
- `src/lib/admin-permissions.ts` задаёт capability-matrix для `super_admin`, `support_admin`, `analyst`, а `src/lib/admin-auth.ts` использует её для route-level authorization
- `src/lib/admin-permissions.ts` теперь также закрепляет primary super-admin policy для `corvetik1@yandex.ru`, а `admin-auth` не даёт управлять admin-ролями никому вне этого root-контекста
- `GET /api/admin/stats` теперь отдаёт не только counters, но и `systemHealth` / `syncHealth` с readiness-флагами, backlog по support/eval и свежестью последних operational updates
- `GET /api/admin/users` теперь объединяет `profiles`, `platform_admins` и `auth.admin.listUsers`, а также поддерживает поиск по email/UUID и фильтр по admin role
- `GET /api/admin/users/[id]` теперь отдаёт auth metadata, текущую роль администратора и последние записи audit log по конкретному пользователю
- `PATCH` / `DELETE` `/api/admin/users/[id]/role` управляют `platform_admins` через server-side валидацию и пишут события в `admin_audit_logs`
- queueing для `support_actions`, `ai_eval_runs` и `ai/reindex` admin flows
- audit log записи для privileged admin действий
- real user detail/admin support routes под `/api/admin/users/[id]/*`
- реальные dashboard metrics queries через `src/lib/dashboard/metrics.ts`
- реальный `/api/dashboard/period-compare` для сравнения периодов пользователя
- реальные workout trend queries для dashboard charts
- реальные nutrition trend queries для dashboard charts
- nutrition server routes для продуктов, приёмов пищи и nutrition targets
- nutrition server routes для recipes и meal templates
- AI route для анализа фото блюда через Vercel AI Gateway OpenResponses
- AI routes для meal/workout proposals теперь работают с реальным user context и persistence
- AI proposal confirmation/apply routes теперь переводят предложения в `approved`/`applied`
- автоматический пересчёт `daily_nutrition_summaries` после создания и удаления приёма пищи
- `src/lib/nutrition/meal-logging.ts` как общий слой выборки nutrition-данных, recipes/templates и пересчёта дневных summary
- `typecheck` завязан на `next typegen`, чтобы `.next/types` генерировались до запуска `tsc`
- локальная production-сборка переключена на webpack из-за нестабильного Turbopack panic в CSS-пайплайне

Есть только scaffold, но не полная логика:

- sync APIs
- AI proposal routes
- часть admin UI и downstream worker-логики для queued actions
- lock/apply/history use-cases для workout domain

## Что сейчас делает workout backend

- `GET /api/exercises` и `POST /api/exercises` обслуживают библиотеку упражнений
- `PATCH /api/exercises/[id]` обновляет и архивирует упражнения
- `GET /api/weekly-programs` отдаёт последние weekly programs текущего пользователя
- `POST /api/weekly-programs` создаёт draft weekly program вместе с `workout_days`, `workout_exercises` и `workout_sets`, сохраняя диапазон повторов в `planned_reps_min/max`
- `POST /api/weekly-programs/[id]/clone` создаёт новый draft на основе предыдущей недели и копирует плановую структуру вместе с диапазонами повторов
- `POST /api/weekly-programs/[id]/lock` переводит draft-программу в `active` и блокирует её от дальнейших структурных изменений
- `PATCH /api/workout-days/[id]` меняет статус тренировочного дня только для locked week
- `PATCH /api/workout-sets/[id]` сохраняет `actual_reps` только для locked week
- `POST /api/sync/push` принимает офлайн-мутации workout execution и прогоняет их через тот же execution helper, что и прямые PATCH routes
- `GET /api/sync/pull?scope=workout_day&dayId=...` отдаёт канонический snapshot workout day для клиентской Dexie-гидрации после offline/online переходов
- `GET /api/workout-templates` отдаёт последние workout templates пользователя вместе с rep range metadata в payload
- `POST /api/workout-templates` сохраняет выбранную weekly program как template с payload в `workout_templates`, включая диапазоны повторов
- `src/lib/workout/workout-sets.ts` централизует fallback для select/insert в `workout_sets`, если удалённая БД ещё живёт на legacy-схеме без `planned_reps_min/max`
- fallback для insert учитывает как Postgres-ошибку `42703`, так и PostgREST schema-cache ошибку `PGRST204`
- при неудаче создания weekly program route пытается откатить созданную программу удалением корневой записи
- `getDashboardSnapshot` считает реальные summary-метрики по weekly programs, workout days, workout sets, exercise library, workout templates, AI chat sessions и nutrition summaries
- `getDashboardPeriodComparison` считает сравнение текущего и предыдущего периода по завершённым тренировкам, калориям и AI-сессиям
- `getDashboardWorkoutCharts` строит недельные workout-тренды по завершённым дням и сохранённым `actual_reps`
- `getDashboardNutritionCharts` строит 7-дневный nutrition trend по калориям и КБЖУ
- `listNutritionRecipes` и `listMealTemplates` отдают пользовательские nutrition-конструкции для UI `/nutrition`
- `listNutritionSummaryTrend` строит 7-дневный ряд для goal adherence на nutrition-экране
- `POST /api/recipes` создаёт рецепт со snapshot-значениями по продуктам и КБЖУ
- `DELETE /api/recipes/[id]` удаляет рецепт текущего пользователя
- `POST /api/meal-templates` сохраняет шаблон приёма пищи с payload в `meal_templates`
- `DELETE /api/meal-templates/[id]` удаляет шаблон приёма пищи текущего пользователя
- barcode flow v1 работает без отдельного backend route: UI ищет штрихкод по уже загруженной пользовательской базе продуктов
- `POST /api/ai/meal-photo` принимает `FormData`, валидирует изображение, отправляет его в AI Gateway и возвращает структурированный proposal-ответ по блюду
- `src/lib/ai/user-context.ts` собирает контекст пользователя для AI routes из profiles, onboarding, goals, nutrition profiles, body metrics и daily summaries
- `src/lib/ai/proposals.ts` отвечает за выборку и сохранение `ai_plan_proposals`
- `POST /api/ai/meal-plan` генерирует proposal плана питания и сохраняет его в `ai_plan_proposals`
- `POST /api/ai/workout-plan` генерирует proposal тренировочного плана и сохраняет его в `ai_plan_proposals`
- `POST /api/ai/proposals/[id]/approve` подтверждает предложение без немедленного применения
- `POST /api/ai/proposals/[id]/apply` применяет workout proposal в draft weekly program, восстанавливая ближайший rep range preset из AI-текста, а meal proposal — в `meal_templates` как reference-only артефакты

## Что сейчас делает admin backend

- `POST /api/admin/bootstrap` назначает текущего авторизованного пользователя первым `super_admin` по `ADMIN_BOOTSTRAP_TOKEN`
- `GET /api/admin/users` отдаёт список пользователей с email, last sign-in и admin-role, поддерживает поиск и role filter
- `GET /api/admin/users` теперь также поддерживает activity filters и sort keys, обходит все страницы `auth.admin.listUsers` и агрегирует user-level workout/nutrition/AI/support/export/deletion/subscription сигналы для операционного каталога
- `GET /api/admin/users` дополнительно возвращает server-side `summary` и `segments` с cohort analytics, backlog totals, billing risk и приоритетными user slices для super-admin UX
- `GET /api/admin/users/[id]` отдаёт профиль, onboarding, goal snapshot, auth metadata, последние support actions и admin audit log по пользователю
- `GET /api/admin/users/[id]` дополнительно агрегирует workout / nutrition / AI / lifecycle counters и последние timestamps активности по пользователю
- `GET /api/admin/users/[id]` теперь также возвращает текущие `latestExportJob`, `deletionRequest` и `latestSubscription` для operator-facing user card
- `GET /api/admin/users/[id]` теперь также возвращает `recentEntitlements` и `recentUsageCounters` для billing/access блока в user detail
- `PATCH /api/admin/users/[id]/role` назначает или обновляет `super_admin`, `support_admin`, `analyst`
- `DELETE /api/admin/users/[id]/role` отзывает admin-доступ и фиксирует это в audit log
- `POST /api/admin/bootstrap`, `PATCH /api/admin/users/[id]/role` и `DELETE /api/admin/users/[id]/role` серверно запрещают выдавать, понижать или отзывать root `super_admin` вне политики `corvetik1@yandex.ru`
- `POST /api/admin/users/[id]/export` ставит export job в очередь от имени администратора и пишет audit log
- `POST /api/admin/users/[id]/deletion` переводит deletion request пользователя в `holding` с hold window, а `DELETE /api/admin/users/[id]/deletion` отменяет этот запрос и пишет audit log
- `POST /api/admin/users/[id]/billing` даёт root super-admin server-backed управление `subscriptions` и `entitlements`, включая `grant_trial`, `activate_subscription`, `mark_past_due`, `cancel_subscription`, `enable_entitlement` и `disable_entitlement`
- `POST /api/admin/users/bulk` запускает root-only массовые действия по выбранным users: export queue, context resync, suspend queue, bulk trial grant и bulk entitlement enable
- `POST /api/admin/users/[id]/billing` дополнительно пишет `subscription_events`, чтобы billing timeline не зависел только от `admin_audit_logs`
- `POST /api/admin/users/bulk` теперь пишет summary audit entry `bulk_wave_completed` с `batchId`, processed/succeeded/failed и target user list
- `GET /api/admin/users` возвращает `recentBulkWaves`, а `GET /api/admin/users/[id]` возвращает `recentSubscriptionEvents` для super-admin observability
- `POST /api/admin/users/[id]/suspend` и `POST /api/admin/users/[id]/restore` создают queued support actions и пишут audit log, но доступны только ролям с capability `queue_support_actions`
- `POST /api/admin/users/[id]/support-action` создаёт произвольный queued support action и пишет audit log, но также закрыт capability-gate
- `GET /api/admin/ai-evals` отдаёт последние eval runs
- `POST /api/admin/ai-evals/run` ставит AI eval run в очередь только при наличии capability `queue_ai_eval_runs` и возвращает тот же расширенный payload (`model_id`, `started_at`, `completed_at`), который использует live admin UI
- `GET /api/admin/stats` агрегирует runtime readiness, workload counters, backlog очередей и timestamps последних обновлений для admin observability-панели
- `POST /api/ai/reindex` запускает reindex только при наличии capability `run_knowledge_reindex`

## Env-контракт

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` или `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_GATEWAY_API_KEY`
- `ADMIN_BOOTSTRAP_TOKEN`
- `SENTRY_AUTH_TOKEN`

## Заметки для будущих разработчиков

- все schema changes делать только через migrations
- service-role использовать только server-side
- лучше расширять текущие route handlers, чем создавать параллельный API-слой
- при rollout schema changes учитывать, что Vercel может задеплоить код раньше, чем remote Supabase получит миграцию; для user-facing workout flow теперь есть временный backward-compatible fallback, но это не замена нормальному применению миграций
- sync push и scoped sync pull уже реализованы для workout execution slice; остальные домены ещё не переведены на incremental sync
## AI chat и knowledge indexing

- Добавлен рабочий route [chat/route.ts](/C:/fit/src/app/api/ai/chat/route.ts).
- Route:
  - требует авторизованного пользователя;
  - сохраняет сообщения в `ai_chat_sessions` и `ai_chat_messages`;
  - использует retrieval по `knowledge_chunks` и `knowledge_embeddings`;
  - возвращает assistant message вместе со списком источников контекста.
- Добавлен knowledge helper [knowledge.ts](/C:/fit/src/lib/ai/knowledge.ts), который:
  - собирает user-scoped документы из тренировок, питания, профиля, memory facts и snapshots;
  - переиндексирует пользовательскую базу знаний;
  - выполняет retrieval через embeddings и cosine similarity.
- Route [reindex/route.ts](/C:/fit/src/app/api/ai/reindex/route.ts) больше не является заглушкой очереди и теперь реально запускает переиндексацию через admin flow.
## Admin operations inbox backend

- `GET /api/admin/operations` агрегирует pending и recent queue items из `support_actions`, `export_jobs` и `deletion_requests`, подтягивает actor/target identity и возвращает summary для operations inbox на `/admin`.
- `PATCH /api/admin/operations/[kind]/[id]` реализует ручной status workflow для queue items и пишет все transitions в `admin_audit_logs`.
- `GET /api/admin/stats` больше не считает несуществующий `running` для `support_actions`; support queue теперь строится по реальным `queued/completed/failed`, а export/deletion backlog вынесен в отдельные counters.

## Admin user detail backend

- `GET /api/admin/users/[id]` теперь собирает не только high-level counters, но и operational history, пригодную для ручного разбора пользователя из super-admin панели.
- Route возвращает `recentExportJobs`, `recentOperationAuditLogs`, enriched `recentSupportActions`, actor-aware `recentSubscriptionEvents`, а также requester refs для текущего export job и deletion request.
- Для actor enrichment route поднимает auth/profile references серверно, поэтому UI получает готовые `email/full_name` по администраторам и не строит эти связи на клиенте.

## Admin queue processor backend

- Новый helper `src/lib/admin-queue-processing.ts` реализует пакетную обработку admin очередей без отдельного воркера: export jobs и deletion requests прогоняются через детерминированный server-side flow.
- `POST /api/admin/operations/process` запускает queue wave и возвращает summary по exports/deletions/support actions, не требуя прямого SQL или ручного обновления каждой записи.
- Export processor переводит queued jobs в `processing`, затем в `completed`, проставляет synthetic `artifact_path` и пишет audit log на каждый transition.
- Deletion processor нормализует legacy `queued` записи в `holding`, а просроченные hold-записи переводит в `completed` и создает queued support action `purge_user_data` вместе с audit action `queue_deletion_purge_action`.
- `GET /api/admin/stats` теперь дополнительно отдает `dueDeletionRequests`, `latestExportJobAt` и `latestDeletionRequestAt`, чтобы health dashboard отражал server queue processor state, а не только статические backlog counters.

## Support action execution backend

- Добавлена миграция `user_admin_states`: это server-owned persisted state для suspend/restore lifecycle, который читается пользователем только на уровне собственного аккаунта через RLS select policy.
- `processAdminOperationQueues` теперь исполняет queued support actions серверно, а не только оставляет их в inbox. Поддерживаются `suspend_user`, `restore_user`, `resync_user_context` и `purge_user_data`.
- `suspend_user` / `restore_user` обновляют `user_admin_states`, а `resync_user_context` / `purge_user_data` создают `user_context_snapshots` c `snapshot_reason` `admin_support_resync` и `admin_purge_manifest`.
- `getViewer` учитывает `user_admin_states` и отправляет suspended non-admin пользователя на `/suspended`; при отсутствии новой таблицы route временно деградирует в `adminState: null`, чтобы код не падал до применения миграции.
## Settings data center backend

- Added authenticated `GET/POST/DELETE /api/settings/data` as the user-scoped control plane for export/deletion lifecycle in settings.
- `POST /api/settings/data` supports two actions:
  - `queue_export`: creates a new `export_jobs` row unless another export is already active.
  - `request_deletion`: upserts a `deletion_requests` row into `holding` with the default 14-day hold window.
- `DELETE /api/settings/data` cancels an active deletion hold for the current user.
- Added `GET /api/settings/data/export/[id]/download`, which checks ownership and completed status, builds a full export bundle, and returns a ZIP archive with `export.json` plus CSV slices from workouts, nutrition, AI, billing, snapshots, and privacy tables.
- Settings actions also write best-effort audit log records through the admin client so self-service lifecycle actions remain visible to admin operators.
- `loadSettingsDataSnapshot` now also aggregates a filtered privacy timeline from `admin_audit_logs`, mapping export/deletion lifecycle events into user-safe `you / support / system` events for the settings UI.

## Hard-delete purge execution backend

- `src/lib/admin-queue-processing.ts` now turns queued `purge_user_data` support actions into a real hard-delete flow: build purge manifest, persist it into surviving support/audit payloads, then execute `auth.admin.deleteUser(userId, false)`.
- The purge manifest was expanded to include workout, nutrition, AI, billing, privacy, admin-state, and retained admin-history tables so operators can see what the processor removed or intentionally retained.
- Added primary root-account protection to destructive flows: self-service deletion, admin deletion requests, direct destructive support actions, and bulk suspend all reject `corvetik1@yandex.ru`.
- No new SQL migration was required for this slice, so there was nothing additional to apply to Supabase beyond the already-applied remote migrations.

## Sentry and Vercel observability backend

- Added `src/instrumentation.ts` with `register()` and `onRequestError` so Sentry captures App Router request/server-component errors in current Next.js flow.
- Added `src/instrumentation-client.ts`, `src/sentry.server.config.ts`, and `src/sentry.edge.config.ts` for runtime initialization across browser, Node.js, and Edge.
- `next.config.ts` now conditionally enables `withSentryConfig(...)` when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are present, which allows source-map upload, Sentry tunnel routing, and automatic Vercel monitor wiring without breaking builds where those env vars are absent.
- `src/lib/logger.ts` now forwards handled server-side errors into Sentry through `captureException` / `captureMessage`, so API failures are observable even when the route returns a controlled JSON error response.
- `src/lib/env.ts` and `GET /api/admin/stats` now surface observability readiness for `NEXT_PUBLIC_SENTRY_DSN`, build-time Sentry upload credentials, and Vercel runtime presence.
- Added root-only `POST /api/admin/observability/sentry-test`, which requires the primary super-admin, validates runtime DSN presence, emits a real Sentry smoke-test exception, flushes the transport, and returns the event id.
- `GET /api/admin/stats` now also returns non-secret Sentry/Vercel diagnostics: missing env key lists for runtime/build setup, configured `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_ENVIRONMENT`, and current `VERCEL_ENV`.

## Runtime entitlements and billing backend

- Added `src/lib/billing-access.ts` as the shared runtime access layer. It reads the latest `subscriptions`, explicit `entitlements`, and monthly `usage_counters`, then resolves per-feature access snapshots for `ai_chat`, `meal_plan`, `workout_plan`, and `meal_photo`.
- Monthly usage accounting is now real server behavior instead of future schema only: successful AI calls increment `usage_counters`, and blocked features return `FEATURE_ACCESS_DENIED` with structured reason and usage details.
- `POST /api/ai/chat`, `POST /api/ai/meal-plan`, `POST /api/ai/workout-plan`, `POST /api/ai/meal-photo`, plus proposal `approve/apply` routes now all enforce runtime billing access before mutating user state.
- `GET /api/settings/billing` and `POST /api/settings/billing` were added as a user-scoped billing surface. The POST route queues a self-service `billing_access_review` in `support_actions` and mirrors the request into `admin_audit_logs`.
- `loadSettingsDataSnapshot` now also aggregates billing-side data for the user settings surface: latest `billing_access_review`, safe billing timeline entries, and subscription/entitlement history derived from `subscription_events` plus audit logs.
- Admin entitlement mutations now also write into `subscription_events`, so billing history is complete for both subscription status changes and entitlement toggles.
- No new SQL migration was required for this slice. The work runs on the existing `subscriptions`, `entitlements`, `usage_counters`, `subscription_events`, `support_actions`, and `admin_audit_logs` tables.
- Production Sentry source-map/runtime rollout is still intentionally deferred until `SENTRY_PROJECT` and `NEXT_PUBLIC_SENTRY_DSN` are available, even though the backend diagnostics and smoke-test route are already in place.

## Stripe billing backend

- Added `src/lib/stripe-billing.ts` as the shared Stripe integration layer for customer provisioning, webhook idempotency, checkout-session reconciliation, and local `subscriptions` row upserts.
- Added `POST /api/billing/checkout` for authenticated subscription checkout session creation and `POST /api/billing/portal` for Stripe customer portal sessions.
- Added `POST /api/billing/webhook/stripe`, which verifies webhook signatures, de-duplicates provider events, reconciles checkout/subscription events into local state, and records invoice-side history into `subscription_events`.
- Added `POST /api/admin/users/[id]/billing/reconcile` so root admin operators can manually re-pull provider state into local billing records without touching SQL.
- Added migration `20260310121500_stripe_provider_customer.sql` to extend `subscriptions` with `provider_customer_id` and index Stripe provider keys. This migration has been applied to the remote project `nactzaxrjzsdkyfqwecf`.
- Stripe production rollout is still blocked on external env configuration rather than schema or code: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PREMIUM_MONTHLY_PRICE_ID` must exist in runtime before checkout/portal/webhook paths can be used in production.
- `GET /api/settings/billing` and `POST /api/settings/billing` now return a combined payload of `{ snapshot, access }`, so client refresh flows can update both lifecycle history and runtime entitlements/subscription access in one request.
- `POST /api/admin/users/[id]/billing/reconcile` now writes an `admin_reconcile_stripe_subscription` audit entry with provider refs and resulting status, preserving an operator-visible trail for manual billing corrections.
- The settings billing refresh route now also supports Stripe return UX indirectly: the client return handler uses the same combined payload endpoint to reconcile checkout / portal return state without a full page reload.
- Added `POST /api/billing/checkout/reconcile` as a user-scoped recovery path for checkout success returns. It validates ownership of the Stripe checkout session, reconciles the linked subscription immediately, writes an audit log, and returns the same combined `{ snapshot, access }` payload shape used by the settings billing center.
- The billing-center client now consumes the optional `checkoutReturn` payload from that route to expose Stripe session status, payment status, reconciliation state, and retry behavior in the UI.

## Primary super-admin enforcement backend

- Added migration `20260310164000_primary_super_admin_root_policy.sql` and applied it to the linked remote project `nactzaxrjzsdkyfqwecf`.
- The migration enforces a single-root policy in the database layer:
  - it resolves the `auth.users.id` for `corvetik1@yandex.ru`,
  - demotes any other `platform_admins.role = 'super_admin'` rows to `support_admin`,
  - upserts `corvetik1@yandex.ru` into `platform_admins` as `super_admin`,
  - writes a `primary_super_admin_enforced` audit record,
  - and creates a partial unique index so only one `super_admin` row can exist.
- This database constraint now matches the runtime policy already implemented in `src/lib/admin-permissions.ts` and the guarded admin routes, so `super_admin` is restricted both by application code and by remote data constraints.
