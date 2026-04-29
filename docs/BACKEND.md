# Документация по бэкенду

## Стек

- Supabase Auth
- Supabase Postgres
- pgvector
- Row Level Security
- SQL migrations в `supabase/migrations`
- Next.js App Router route handlers для server-side API

## Текущий Supabase project

- Имя проекта: `fit-dev`
- Project ref: `nactzaxrjzsdkyfqwecf`

Подробный актуальный аудит схемы, RLS, RPC и индексных путей вынесен в `docs/DB_AUDIT.md`.

Секреты, service-role ключи и приватные токены в эту документацию не записывать.

## Базовые правила сервера

- Все бизнес-данные пользователя изолированы по `user_id`.
- Все бизнес-таблицы работают с RLS.
- `weekly_programs`, `workout_days`, `workout_exercises` и `workout_sets` защищены lock-guard логикой.
- Админский контур отделён от обычного пользовательского контура.
- Все schema changes делаются только через Supabase migrations.

## Основные домены

- `profiles`, `goals`, `onboarding_profiles`
- `exercise_library`, `workout_templates`
- `weekly_programs`, `workout_days`, `workout_exercises`, `workout_sets`
- `body_metrics`
- `foods`, `meals`, `meal_items`, `nutrition_goals`, `recipes`, `meal_templates`, `daily_nutrition_summaries`
- `ai_chat_sessions`, `ai_chat_messages`
- `ai_plan_proposals`
- `knowledge_chunks`, `knowledge_embeddings`
- `user_context_snapshots`, `structured facts`
- `subscriptions`, `entitlements`, `usage_counters`, `subscription_events`
- `platform_admins`, `admin_audit_logs`, `support_actions`
- `export_jobs`, `deletion_requests`, `ai_eval_runs`, `ai_eval_results`

## Основные API-контуры

### Workout / execution

- `GET/POST /api/exercises`
- `PATCH /api/exercises/[id]`
- `GET/POST /api/weekly-programs`
- `POST /api/weekly-programs/[id]/clone`
- `POST /api/weekly-programs/[id]/lock`
- `PATCH /api/workout-days/[id]`
- `POST /api/workout-days/[id]/reset`
- `PATCH /api/workout-sets/[id]`
- `GET/POST /api/workout-templates`
- `POST /api/sync/push`
- `GET /api/sync/pull`

Что уже реализовано:
- draft/clone/lock lifecycle недельных программ;
- locked execution flow;
- offline push/pull для workout day;
- reset/finish/status update сценарии;
- workout template reuse;
- guard against stale local sync state.

### Nutrition

- `GET/POST /api/foods`
- `PATCH /api/foods/[id]`
- `GET/POST /api/meals`
- `PATCH /api/meals/[id]`
- `GET/POST /api/recipes`
- `DELETE /api/recipes/[id]`
- `GET/POST /api/meal-templates`
- `DELETE /api/meal-templates/[id]`
- `GET/POST /api/nutrition/targets`

Что уже реализовано:
- user-scoped food and meal logging;
- recipes и meal templates;
- nutrition targets;
- daily summary recalculation;
- nutrition trend data для dashboard и AI.

### Dashboard

- `GET /api/dashboard/period-compare`
- server-side snapshot/runtime assembly через `src/lib/dashboard/*`

Что уже реализовано:
- aggregate snapshots;
- runtime snapshots;
- period comparison;
- workout/nutrition charts;
- warm job для precompute.

### AI

- `POST /api/ai/assistant`
- `POST /api/ai/chat`
- `POST /api/ai/meal-photo`
- `POST /api/ai/meal-plan`
- `POST /api/ai/workout-plan`
- `POST /api/ai/proposals/[id]/approve`
- `POST /api/ai/proposals/[id]/apply`
- `GET/POST /api/ai/sessions`
- `DELETE /api/ai/sessions/[id]`
- `POST /api/ai/reindex`
- `POST /api/chat`

Что уже реализовано:
- owner-scoped AI sessions/history;
- retrieval по персональной истории;
- structured knowledge и runtime snapshots;
- proposal lifecycle: draft -> approve -> apply;
- image analysis flow для еды;
- prompt library, web-search toggle и fullscreen AI workspace;
- sports-only guardrails и запрет на раскрытие внутренней архитектуры;
- чистый UTF-8 prompt/guardrail слой в `src/lib/ai/plan-generation.ts` и `src/lib/ai/domain-policy.ts`.

### Billing

- `POST /api/billing/checkout`
- `POST /api/billing/checkout/reconcile`
- `POST /api/billing/portal`
- `GET /api/billing/cloudpayments/intent`
- `POST /api/billing/webhook/cloudpayments/[kind]`
- `POST /api/billing/webhook/stripe`
- `GET/POST /api/settings/billing`
- `POST /api/admin/users/[id]/billing/reconcile`

Что уже реализовано:
- provider-neutral billing layer;
- CloudPayments checkout/widget integration layer;
- checkout return reconciliation;
- webhook idempotency;
- admin manual reconcile;
- runtime entitlements и usage counters;
- billing center в settings и admin health slice.

### Admin

- `POST /api/admin/bootstrap`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/users/[id]`
- `PATCH/DELETE /api/admin/users/[id]/role`
- `POST /api/admin/users/[id]/suspend`
- `POST /api/admin/users/[id]/restore`
- `POST /api/admin/users/[id]/support-action`
- `GET /api/admin/operations`
- `PATCH /api/admin/operations/[kind]/[id]`
- `POST /api/admin/operations/process`
- `GET/POST /api/admin/ai-evals*`
- `POST /api/admin/observability/sentry-test`

Что уже реализовано:
- capability-based admin access;
- primary root policy для `corvetik1@yandex.ru`;
- admin operations inbox;
- export/deletion/support queue processing;
- admin observability dashboard;
- AI eval queueing;
- user detail operational history.

## Внутренние jobs

- `POST /api/internal/jobs/dashboard-warm`
- `POST /api/internal/jobs/knowledge-reindex`
- `POST /api/internal/jobs/nutrition-summaries`
- `POST /api/internal/jobs/billing-reconcile`
- `POST /api/internal/jobs/ai-evals-schedule`

Jobs должны принимать только авторизованный cron/admin вызов. Это отдельный production-hardening пункт, который ещё нужно финально подтвердить.

## AI backend

### Контекст

`src/lib/ai/user-context.ts` собирает:
- профиль;
- цели;
- onboarding;
- body metrics;
- workout insights;
- nutrition insights;
- structured knowledge;
- cached snapshots.

### Knowledge layer

`src/lib/ai/knowledge.ts` и вынесенные модули:
- `knowledge-retrieval.ts`
- `knowledge-source-data.ts`
- `knowledge-indexing.ts`
- `knowledge-documents.ts`

Что делает слой:
- собирает user-scoped corpus;
- поддерживает retrieval через vector/text fallback;
- обновляет embeddings и knowledge documents;
- работает поверх snapshots и structured facts.

### Guardrails

`src/lib/ai/domain-policy.ts`:
- жёстко держит sports-only domain;
- запрещает model/system disclosure;
- запрещает off-topic общение;
- строит system prompt на русском языке.

## Billing backend

`src/lib/billing-self-service.ts`, `src/lib/cloudpayments-billing.ts`, `src/lib/stripe-billing.ts` и `src/lib/billing-access.ts` обеспечивают:
- provider-neutral checkout / billing-center action / webhook sync;
- local subscription reconciliation;
- usage and entitlement access control;
- provider-state recovery через return reconcile и admin reconcile.

Текущий production rollout для РФ целится в `CloudPayments`; legacy `Stripe` остаётся как совместимый fallback-адаптер до полного выведения из runtime.

Production rollout CloudPayments зависит от реальных env:
- `NEXT_PUBLIC_BILLING_PROVIDER`
- `NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID`
- `CLOUDPAYMENTS_API_SECRET`
- `CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB`
- `CLOUDPAYMENTS_WEBHOOK_SECRET`

## Observability backend

Уже есть:
- Sentry server/client wiring;
- readiness диагностика в `/api/admin/stats`;
- root-only sentry smoke route;
- health slices для billing, sync и knowledge.

Ещё не закрыто:
- полный production rollout Sentry env;
- финальная документация по допустимым build warnings;
- явное подтверждение cron/internal jobs auth.

## Env-контракт

Минимально значимые переменные:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` или `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `VOYAGE_API_KEY`
- `NEXT_PUBLIC_BILLING_PROVIDER`
- `NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID`
- `CLOUDPAYMENTS_API_SECRET`
- `CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB`
- `CLOUDPAYMENTS_WEBHOOK_SECRET`
- `SENTRY_AUTH_TOKEN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_PROJECT`
- `ADMIN_BOOTSTRAP_TOKEN`
- `CRON_SECRET`

## Operational notes

- Все schema changes делать только через migrations.
- Service-role использовать только server-side.
- Лучше расширять текущие route handlers и `lib`-слои, чем плодить параллельный API-контур.
- При rollout schema changes учитывать, что Vercel может задеплоить код раньше, чем remote Supabase получит миграцию.
- Для user-facing workout flow уже есть часть backward-compatible fallback-логики, но это не замена своевременному применению миграций.
- Sync push/pull сейчас реально реализованы только для workout execution slice; остальные домены на полноценный incremental sync ещё не переведены.

## 2026-04-29 Admin test access contract

- Тестовый доступ хранится в существующей таблице `subscriptions`: `status = 'trial'`, срок в `current_period_end`, provider по умолчанию `admin_trial`.
- Ручная подписка без live-provider хранится как `status = 'active'`, provider по умолчанию `admin_console`.
- `applyAdminSubscriptionAction(...)` продлевает `grant_trial` и ручную активацию от `max(now, current_period_end)`, чтобы повторная выдача добавляла дни к будущему сроку, а не обнуляла период.
- Admin payload для `subscription_events` и `admin_audit_logs` включает `durationDays`, `periodBase`, `previousPeriodEnd`, `currentPeriodEnd`, `provider`, `status`.
- Billing mutations и audit/event inserts в `src/lib/admin-billing.ts` используют transient retry для кратких Supabase runtime-сбоев (`fetch failed`, `ECONNRESET`, `terminated`).
- Схема БД не менялась; новых migrations для этого среза нет.
