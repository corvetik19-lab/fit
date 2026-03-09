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
- admin bootstrap route для первого `super_admin`
- session-based admin access через `platform_admins`
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
- `POST /api/weekly-programs` создаёт draft weekly program вместе с `workout_days`, `workout_exercises` и `workout_sets`
- `POST /api/weekly-programs/[id]/clone` создаёт новый draft на основе предыдущей недели и копирует плановую структуру
- `POST /api/weekly-programs/[id]/lock` переводит draft-программу в `active` и блокирует её от дальнейших структурных изменений
- `PATCH /api/workout-days/[id]` меняет статус тренировочного дня только для locked week
- `PATCH /api/workout-sets/[id]` сохраняет `actual_reps` только для locked week
- `GET /api/workout-templates` отдаёт последние workout templates пользователя
- `POST /api/workout-templates` сохраняет выбранную weekly program как template с payload в `workout_templates`
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
- `POST /api/ai/proposals/[id]/apply` применяет workout proposal в draft weekly program, а meal proposal — в `meal_templates` как reference-only артефакты

## Что сейчас делает admin backend

- `POST /api/admin/bootstrap` назначает текущего авторизованного пользователя первым `super_admin` по `ADMIN_BOOTSTRAP_TOKEN`
- `GET /api/admin/users` отдаёт список последних профилей
- `GET /api/admin/users/[id]` отдаёт профиль, onboarding, goal snapshot и последние support actions по пользователю
- `POST /api/admin/users/[id]/suspend` и `POST /api/admin/users/[id]/restore` создают queued support actions и пишут audit log
- `POST /api/admin/users/[id]/support-action` создаёт произвольный queued support action и пишет audit log
- `GET /api/admin/ai-evals` отдаёт последние eval runs
- `POST /api/admin/ai-evals/run` ставит AI eval run в очередь
- `POST /api/ai/reindex` ставит reindex-задачу в очередь как privileged admin operation

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
