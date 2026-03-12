# Master plan проекта fit

Источник: план перенесён из [План фит.docx](C:/Users/User/Desktop/План%20фит.docx) и синхронизирован с текущим состоянием репозитория.

## Как отмечать прогресс

- `[x]` выполнено
- `[ ]` ещё не выполнено

Это основной план разработки проекта. Агент должен поддерживать его в актуальном состоянии и после каждого существенного изменения отмечать выполненные пункты прямо в этом файле.

## Зафиксированные решения

- Базовая платформа: web-first PWA
- Основной runtime-стек: Next.js 16, App Router, React 19, TypeScript strict
- Data plane: Supabase Auth + Postgres + pgvector + RLS + SQL migrations
- AI plane: provider abstraction with OpenRouter or Vercel AI Gateway for chat/runtime, direct Voyage or AI Gateway for embeddings
- Основная generation model: `google/gemini-3.1-pro-preview`
- Основная embedding model: `voyage-3-large`
- AI quality layer: Ragas как отдельный eval-контур, не runtime dependency
- Основные поверхности: `App`, `Admin`, `AI Evals`, будущий `Android Wrapper`
- Продукт развивается как B2C SaaS-ready, без tenant/workspace слоя на старте
- AI-действия должны оставаться proposal-first, без silent writes в пользовательские планы

## Архитектурные контракты

### Frontend и offline-first

- [x] Выбран responsive PWA-подход с mobile-first UX
- [x] Подготовлен manifest для installable PWA
- [x] Подготовлен Dexie-контракт для IndexedDB
- [x] Реализован service worker для app shell и critical caches
- [x] Реализованы optimistic updates
- [x] Реализован полноценный mutation queue sync flow

### Supabase и backend

- [x] Выбран Supabase как auth/data/vector plane
- [x] Схема заведена через SQL migrations
- [x] Бизнес-таблицы заведены с `user_id`
- [x] Базовые RLS-политики заведены
- [x] Lock-guard логика weekly programs заведена в БД
- [ ] Добавлены все нужные RPC/use-case server flows поверх схемы

### AI / RAG / CAG / KAG

- [x] Зафиксированы модели для generation и embeddings
- [x] Подготовлены AI route scaffolds
- [x] Подготовлен отдельный eval workspace
- [x] Реализован retrieval pipeline
- [x] Реализован context assembly из пользовательских данных
- [x] Реализован structured knowledge layer в продуктовой логике
- [x] Реализовано сохранение и применение AI proposals

### Admin / SaaS / Android

- [x] Заложена отдельная admin-поверхность
- [x] В схеме заложены admin, SaaS и eval таблицы
- [x] Реализован bootstrap flow для первого `super_admin`
- [x] Настроен первый реальный `super_admin`
- [x] Реализован product-level feature gating
- [ ] Подготовлен Android wrapper контур

## Чек-лист по фазам

## Фаза 0. Platform setup

- [x] Подключить локальный repo к GitHub remote
- [x] Создать новый Vercel project
- [x] Создать новый Supabase project
- [x] Настроить локальные env для Supabase
- [x] Настроить локальный `AI_GATEWAY_API_KEY`
- [x] Настроить локальный `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Полностью завершить remote env setup для всех сред
- [ ] Поднять CI с `lint`, `typecheck`, `build`, smoke tests`
- [ ] Вернуться к деплою позже, когда локальные срезы стабилизируются

## Фаза 1. Foundation + Auth + Offline shell

- [x] Поднять Next.js scaffold
- [x] Добавить responsive PWA shell
- [x] Добавить PWA manifest
- [x] Настроить Supabase browser/server clients
- [x] Реализовать `/auth`
- [x] Реализовать регистрацию и вход через Supabase Auth
- [x] Реализовать `/onboarding`
- [x] Сохранять baseline profile в Supabase
- [x] Сохранять goals в Supabase
- [x] Сохранять `user_context_snapshots`
- [x] Защитить продуктовые маршруты через signed-in и onboarding checks
- [x] Добавить sign-out flow
- [x] Подготовить Dexie offline contract
- [x] Реализовать service worker
- [ ] Реализовать sync queue до рабочего состояния
- [ ] Добавить richer session UX и auth error states

## Фаза 2. Workout core

- [x] Реализовать exercise library CRUD
- [x] Реализовать workout templates
- [x] Реализовать weekly program builder
- [x] Реализовать immutable lock UI
- [x] Реализовать `My Week`
- [x] Реализовать `Workout Day`
- [x] Реализовать workout logging с `actual_reps`
- [x] Добавить workout logging с `actual_weight_kg`, `actual_rpe`, `body_weight_kg` и `session_note`
- [x] Реализовать history cloning flow
- [x] Реализовать offline logging и sync для workout domain
- [x] Реализовать `sync/pull + cacheSnapshots` для workout day execution

## Фаза 3. Admin panel v1 + observability

- [x] Подготовить `/admin` route
- [x] Подготовить admin API route scaffolds
- [x] Добавить проверку `platform_admins` на admin page
- [x] Перевести privileged admin routes на проверку `platform_admins`
- [ ] Назначить первого admin user
- [x] Реализовать user directory UI
- [x] Реализовать user detail UI
- [x] Закрепить primary super-admin policy для `corvetik1@yandex.ru`
- [x] Реализовать назначение `super_admin` / `support_admin` / `analyst` из UI
- [x] Реализовать role-based capability gating для admin routes и UI
- [x] Расширить user detail до подробной analytics-карточки
- [x] Реализовать admin operations для export/deletion lifecycle
- [x] Реализовать suspend/reactivate flow
- [x] Реализовать support actions UI
- [x] Реализовать audit log views
- [x] Реализовать system health dashboard
- [x] Реализовать sync health dashboard
- [x] Добавить billing health dashboard для super-admin
- [x] Реализовать AI usage monitoring для admin
- [x] Подключить Sentry
- [x] Подключить Vercel Analytics / Speed Insights

## Фаза 4. Analytics dashboard

- [x] Подготовить dashboard route scaffold
- [x] Подготовить analytics API stub
- [x] Реализовать реальные metrics queries
- [x] Реализовать period comparison UI
- [x] Реализовать workout charts
- [x] Добавить силовой drilldown по тоннажу, весу, RPE и последним сессиям
- [x] Реализовать nutrition charts
- [x] Добавить meal-level nutrition pattern analytics для тайминга, распределения белка и повторяющихся продуктов
- [x] Добавить приоритетные nutrition strategy recommendations в dashboard
- [x] Реализовать precomputed aggregates
- [x] Реализовать snapshot strategy для быстрых графиков

## Фаза 5. Nutrition

- [x] Подготовить nutrition route scaffold
- [x] Завести nutrition schema tables
- [x] Реализовать manual meal logging UI
- [x] Реализовать foods CRUD
- [x] Реализовать recipes и recipe items UI
- [x] Реализовать meal templates UI
- [x] Реализовать КБЖУ calculations в продуктовом UI
- [x] Реализовать daily summaries UI
- [x] Реализовать barcode flow
- [x] Реализовать photo meal analysis flow
- [x] Реализовать nutrition dashboard и goal adherence
- [x] Добавить nutrition coaching signals и meal-level привычки в dashboard и AI context
- [x] Превратить meal-level паттерны в явные приоритетные шаги по рациону

## Фаза 6. AI coach + retrieval

- [x] Подготовить AI Gateway helper
- [x] Подготовить AI routes для chat, workout plan, meal plan, meal photo, reindex
- [x] Завести локальный `AI_GATEWAY_API_KEY`
- [x] Подготовить safety helper scaffold
- [x] Подключить AI routes к полному user context
- [x] Реализовать workout plan proposals
- [x] Реализовать meal plan proposals
- [x] Реализовать proposal confirmation flow
- [x] Реализовать RAG pipeline
- [x] Превратить `/ai` в полноценный workspace с recent sessions и structured context
- [x] Подключить meal-level nutrition patterns в AI context и retrieval
- [x] Подключить nutrition strategy recommendations в AI prompts и retrieval
- [x] Реализовать KAG knowledge layer в приложении
- [x] Добавить assistant tools для списка, подтверждения и применения AI-предложений
- [x] Реализовать CAG snapshots в runtime-логике
- [x] Реализовать embeddings ingestion и refresh
- [x] Реализовать admin knowledge base management

## Фаза 7. AI evals and quality gate

- [x] Создать `ai-evals/` workspace
- [x] Добавить README для eval workspace
- [x] Добавить README для datasets
- [x] Подготовить admin AI eval route scaffolds
- [x] Собрать live admin UI для queue/list AI eval runs
- [x] Подключить Ragas как реальный eval layer
- [x] Собрать evaluation datasets
- [ ] Настроить benchmark runs для chat
- [ ] Настроить benchmark runs для workout planning
- [ ] Настроить benchmark runs для meal planning
- [ ] Настроить benchmark runs для safety и retrieval
- [ ] Реализовать result ingestion
- [ ] Реализовать admin dashboard для AI eval trends
- [ ] Ввести quality gate перед релизом AI-изменений

## Фаза 8. SaaS readiness

- [x] Завести schema tables для subscriptions
- [x] Завести schema tables для entitlements
- [x] Завести schema tables для usage counters
- [x] Завести schema tables для subscription events
- [x] Реализовать entitlements model в runtime
- [x] Реализовать usage accounting для AI
- [x] Реализовать feature gating по user plan
- [x] Улучшить post-checkout return reconcile flow в `/settings`
- [ ] Подготовить Stripe billing integration
- [ ] Подготовить webhook integration

## Фаза 9. Android wrapper for Google Play

- [ ] Проверить PWA installability на production-ready сборке
- [ ] Подготовить TWA readiness
- [ ] Настроить `assetlinks.json`
- [ ] Настроить package name
- [ ] Настроить signing
- [ ] Настроить splash и Play metadata
- [ ] Собрать wrapper через TWA/Bubblewrap
- [ ] Подготовить релиз в Google Play

## Background jobs и автоматизация

- [x] Настроить Vercel Cron
- [x] Реализовать nightly recompute dashboard aggregates
- [x] Реализовать daily nutrition summaries job
- [x] Реализовать stale mutation queue retry/cleanup
- [x] Реализовать embeddings refresh / reindex job
- [x] Реализовать export job processing
- [x] Реализовать deletion request purge
- [ ] Реализовать subscription state reconciliation
- [x] Реализовать scheduled AI eval runs

## Test plan

### Auth

- [x] Проверить локально, что `lint` проходит
- [x] Проверить локально, что `typecheck` проходит
- [x] Проверить локально, что `build` проходит
- [ ] Пройти sign up end-to-end руками
- [ ] Пройти sign in end-to-end руками
- [ ] Проверить session restore
- [ ] Проверить protected routes

### Onboarding

- [ ] Проверить создание baseline profile
- [ ] Проверить обновление goals
- [ ] Проверить корректное обновление `user_context_snapshot`

### Workout

- [ ] Проверить запрет структурных изменений locked program
- [ ] Проверить ввод `actual_reps`
- [ ] Проверить clone/template flow
- [ ] Проверить выбор диапазона повторов в builder (`1-6`, `6-10`, `6-12`, `10-15`, `15-20`, `20-25`)
- [ ] Проверить, что список `actual_reps` ограничен диапазоном подхода
- [ ] Проверить fallback `1..25` для legacy-сетов без сохранённого диапазона
- [ ] Проверить backward-compatible поведение workout API до применения remote SQL-миграции
- [ ] Проверить локальное сохранение `actual_reps` offline и последующую синхронизацию
- [ ] Проверить локальное обновление статуса workout day offline и последующую синхронизацию

### Nutrition

- [ ] Проверить расчёт КБЖУ
- [ ] Проверить recipes и templates
- [ ] Проверить meal summaries
- [ ] Проверить barcode/photo flows

### Dashboard

- [ ] Проверить агрегаты на desktop
- [ ] Проверить агрегаты на mobile
- [ ] Проверить burger drawer и нижний tab bar на mobile PWA
- [ ] Проверить сравнение периодов
- [ ] Проверить workout drilldown: recovery signal, progression и детали последних сессий

### AI

- [ ] Проверить, что chat использует только user context
- [ ] Проверить, что proposals не auto-commitятся
- [ ] Проверить proposal history: approve/apply timeline и product-level apply result
- [ ] Проверить корректную недоступность AI offline
- [ ] Проверить safety layer на risky prompts

### AI evals

- [ ] Проверить regression benchmarks
- [ ] Проверить отсутствие деградации retrieval quality
- [ ] Проверить safety thresholds
- [ ] Проверить baseline после смены модели

### Admin

- [ ] Проверить доступ в `/admin` только для назначенных `platform_admin`
- [ ] Проверить поиск, activity/backlog filters и сортировки пользователей в `/admin/users`
- [ ] Проверить cohort analytics и priority segments в `/admin/users`
- [ ] Проверить bulk user actions в `/admin/users`
- [ ] Проверить выдачу, смену и отзыв admin role из `/admin/users/[id]`
- [ ] Проверить root-only billing controls и entitlement updates из `/admin/users/[id]`
- [ ] Проверить bulk wave history и subscription timeline в admin UI
- [ ] Проверить role matrix: `super_admin` / `support_admin` / `analyst` на read-write и read-only сценариях
- [ ] Проверить запись admin actions в audit log
- [ ] Проверить suspend/reactivate
- [ ] Проверить support actions
- [ ] Проверить export/deletion/eval runs

### SaaS readiness

- [ ] Проверить entitlements
- [ ] Проверить usage counters против AI Gateway usage

### Security и distribution

- [ ] Проверить RLS на всех user tables
- [ ] Проверить admin bypass только через server-side verified routes
- [ ] Проверить, что secrets не уходят в клиент
- [ ] Проверить PWA installability
- [ ] Проверить TWA wrapper перед релизом в Google Play

## Допущения

- Базовая платформа остаётся web-first PWA
- Desktop support входит в продукт с первого дня
- Android app для Google Play идёт как wrapper-фаза, а не как второй основной кодbase
- SaaS-модель на ближайшее будущее: user-level B2C, не tenant/workspace B2B
- Billing provider по умолчанию - Stripe
- Barcode source по умолчанию - OpenFoodFacts
- Export format по умолчанию - zip с JSON + CSV
- Deletion flow по умолчанию - soft-delete hold с последующим hard purge job
- `support_admin` и `analyst` закладываются заранее, но в первой поставке активен только `super_admin`
- `Ragas` используется только как internal eval framework, не как runtime dependency приложения
## Дополнение по admin очередям

- [ ] Проверить operations inbox на `/admin` и вручную пройти status transitions для support/export/deletion queues
- [ ] Проверить user detail на `/admin/users/[id]`: export history, support resolution notes, operations timeline и actor refs по администраторам
- [ ] Проверить server queue processor на `/admin`: wave button, auto-complete export jobs, normalize queued deletion requests и release overdue holds в `purge_user_data`
- [ ] Применить миграцию `user_admin_states` в remote Supabase и вручную проверить suspended flow: `suspend_user` -> `/suspended` -> `restore_user`
## Settings data center

- [x] Build self-service export/deletion center in `/settings`
- [x] Add user-scoped export status refresh and deletion hold cancel flow
- [x] Add completed export JSON download endpoint
- [x] Upgrade export delivery from JSON response to true zip bundle with JSON + CSV artifacts
- [x] Add user-facing privacy timeline and next-step status guidance in `/settings`
- [x] Finalize user-facing deletion timeline before hard purge; no post-purge screen is expected because the auth account is removed

## Hard-delete purge and primary admin protection

- [x] Execute `purge_user_data` as a real hard-delete worker via Supabase admin auth deletion
- [x] Persist purge manifest details in surviving audit/support payloads instead of only in user-scoped snapshots
- [x] Protect primary super admin `corvetik1@yandex.ru` from self-service deletion, admin deletion queueing, destructive support actions, and bulk suspend

## Runtime observability

- [x] Add Sentry App Router instrumentation for client, server, and edge runtimes
- [x] Add branded global error fallback with Sentry capture
- [x] Mount Vercel Analytics and Speed Insights in the root PWA shell
- [x] Surface Sentry and Vercel readiness in the admin health dashboard
- [x] Add root-only Sentry smoke test and detailed env diagnostics in `/admin`
- [ ] Finish production Sentry env rollout after `SENTRY_PROJECT` and `NEXT_PUBLIC_SENTRY_DSN` are provided

## Runtime billing and settings access center

- [x] Surface runtime subscription, entitlement, and usage state in `/ai`, `/nutrition`, and `/settings`
- [x] Add self-service billing access review flow in `/settings` and route it into admin operations
- [x] Mirror admin entitlement changes into `subscription_events` so user-facing billing history is complete
- [x] Add Stripe checkout, customer portal, and webhook reconciliation foundation
- [x] Apply Stripe provider migration `20260310121500_stripe_provider_customer.sql` to remote Supabase
- [x] Add super-admin Stripe reconcile UX and expose Stripe refs in `/admin/users/[id]`
- [x] Fix `/settings` billing refresh so runtime access state updates without full page reload
- [x] Add Stripe return-state handling in `/settings` and deep-link billing CTA from blocked AI product surfaces
- [x] Add direct checkout return reconcile by Stripe `session_id` to reduce dependence on webhook latency
- [x] Add checkout return status banner and retry flow in `/settings`
- [x] Add scheduled Stripe billing reconciliation job and root-only admin trigger
- [ ] Roll out production Stripe env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PREMIUM_MONTHLY_PRICE_ID`
- [ ] Verify end-to-end Stripe lifecycle: checkout -> webhook sync -> portal update -> admin reconcile fallback

## Applied remote migrations note

- [x] `20260309173000_user_admin_states.sql` is already applied on remote Supabase; the old checklist entry about applying it is now stale and only the manual suspended-flow E2E check remains.
- [x] `20260310121500_stripe_provider_customer.sql` is already applied on remote Supabase `nactzaxrjzsdkyfqwecf`.
- [x] `20260310164000_primary_super_admin_root_policy.sql` is already applied on remote Supabase `nactzaxrjzsdkyfqwecf`.

## Root admin and shell refresh

- [x] Enforce `corvetik1@yandex.ru` as the only `super_admin` in the remote database, not only in runtime guards
- [x] Add an audit trail entry and single-super-admin database constraint for the root-admin policy
- [x] Rework the public landing page into a cleaner mobile-first professional PWA entry screen
- [x] Rebuild `/admin` into a wider, less compressed control center for the single-root workflow
- [x] Consolidate sign-in into a single login-first root screen on `/` and redirect `/auth` into the same flow
- [x] Keep signed-out protected-route redirects pointing back to `/` so session restore feels app-like in the PWA
- [x] Add a fixed collapsible top shell with persisted local state for better mobile vertical space
- [x] Replace broken SVG-only manifest icon usage with generated PNG app icons plus Apple touch icon metadata
- [x] Browser-check the anonymous root/login flow and route redirects on local `localhost`
- [x] Continue product-language cleanup for `/admin/users` and `/admin/users/[id]` so the super-admin flow no longer exposes enum-like or mixed-language UI copy
- [x] Continue product-language cleanup for `/ai`, `/settings#billing-center`, and the workout day execution flow so core user surfaces no longer expose billing/sync internals
- [x] Keep `corvetik1@yandex.ru` in privileged runtime access mode so AI and premium features remain open even without a paid subscription record
- [x] Add a floating AI widget with streaming chat, optional internet lookup, and one-click proposal apply flow inside the shell
- [x] Expand dashboard from static charts into drilldown analytics for workouts, nutrition, body metrics, and AI-readiness signals
- [x] Add `actual_weight_kg` logging to workout execution, sync payloads, and locked-program-safe set updates
- [x] Expand workout analytics with tonnage, average working weight, best set weight, estimated 1RM, and recent session drilldown
- [x] Feed historical load signals into AI context and knowledge retrieval so workout advice can use weight, tonnage, and best sets instead of reps-only summaries
- [x] Tighten the collapsed shell so the fixed top area shrinks to a minimal control row instead of keeping a tall header
- [x] Fix the public auth form semantics and local runtime console noise on `/` so login remains clean outside Vercel too
- [x] Rebuild `/dashboard` into a section-based workspace so mobile PWA users switch between summary, workouts, nutrition, and AI instead of scrolling a single long analytics page
- [x] Rebuild `/workouts`, `/nutrition`, and `/settings` into compact section-based workspaces so mobile PWA users open only the active product block instead of stacked long pages
- [x] Rebuild `/ai` into the same section-based mobile workspace pattern with `Чат / Предложения / Контекст / Доступ`
- [x] Rework `/admin/users` and `/admin/users/[id]` into sectioned mobile admin flows so user management opens as logical menus instead of one long admin wall
- [x] Compress the admin users entry pages so mobile PWA screens start with navigation and the active section instead of duplicated hero blocks
- [x] Fix the `SettingsBillingCenter` section-state loop so opening `/settings -> Данные` no longer triggers `Maximum update depth exceeded`
- [x] Browser-check the new mobile section menus on `/dashboard`, `/workouts`, `/nutrition`, `/settings`, and `/ai`

## AI assistant hardening

- [x] Add hybrid personal retrieval for the AI assistant: vector search -> DB text search -> app-side text fallback
- [x] Index the full historical workout and nutrition profile into personal knowledge chunks instead of only recent slices
- [x] Apply remote migration `20260310200000_ai_text_search_and_force_rls.sql` on Supabase project `nactzaxrjzsdkyfqwecf`
- [x] Force RLS on AI chat, proposal, safety, and knowledge tables and remove shared knowledge select policies
- [x] Verify in a live authenticated browser session that `/api/ai/assistant` no longer crashes when embeddings are unavailable
- [x] Add OpenRouter chat runtime support with AI Gateway fallback for assistant/chat/proposal routes
- [x] Add direct Voyage embeddings support with AI Gateway fallback for retrieval and reindex
- [x] Move `meal-photo` onto the shared provider runtime instead of a dedicated AI Gateway-only fetch
- [x] Unify the legacy `/api/ai/chat` route with the same sports-only guardrails and owner-scoped historical context used by `/api/ai/assistant`
- [x] Add a structured knowledge layer over profile, workout load, recovery, nutrition, meal patterns, and strategy signals, and feed it into prompts plus retrieval documents
- [x] Turn `/ai` into a real workspace with recent chat sessions, structured AI context, and direct flow from chat into proposal studio
- [ ] Finish live provider rollout after real `OPENROUTER_API_KEY` and `VOYAGE_API_KEY` are configured

## AI evals and regression control

- [x] Add a dedicated `ai-evals` Ragas workspace with OpenRouter/Voyage adapters, dataset loader, local output artifacts, and a CLI runner
- [x] Seed first regression datasets for assistant QA, retrieval history, meal/workout plans, safety red-team prompts, and tool-call accuracy
- [x] Add typed `suite` selection for `/api/admin/ai-evals/run` and show suite metadata in the admin AI-eval history
- [x] Allow queue processing via `ai-evals/run_ragas_eval.py --queue` and write metric rows into `ai_eval_results`
- [ ] Run first paid LLM-backed benchmark suites (`assistant`, `retrieval`, `meal_plan`, `workout_plan`, `safety`) after provider credits are available
- [ ] Expand benchmark coverage with live proposal-apply flows and web-search enabled agent cases

## Workout execution depth and coaching context

- [x] Add `actual_weight_kg` logging to workout sets and feed it into dashboard load analytics plus AI retrieval/context
- [x] Add day-level `body_weight_kg` and `session_note` plus set-level `actual_rpe` to workout execution, sync, and locked-program-safe updates
- [x] Add set-level `rest_seconds` and `set_note` to workout execution, sync payloads, and locked-program-safe updates
- [x] Show recent-session drilldowns with weight, RPE, rest, and execution notes in the dashboard analytics surface
- [x] Feed body weight, RPE, rest behavior, and set/day notes into AI context and knowledge retrieval so coaching advice can use the full personal training archive
- [x] Add explicit coaching signals for progression, recovery, consistency, and key exercise focus in dashboard analytics and AI context
- [x] Apply remote migrations `20260311103000_workout_set_actual_weight.sql`, `20260311121500_workout_day_context_and_set_rpe.sql`, and `20260311134500_workout_set_rest_and_notes.sql`
- [ ] Add set-level `velocity`, `tempo`, or `exercise_variation_note` only if later coaching quality proves they are worth the extra logging burden

## Nutrition coaching layer

- [x] Add explicit nutrition coaching signals for log discipline, calorie alignment, protein adequacy, and body-weight trend
- [x] Surface nutrition coaching signals inside dashboard analytics as actionable recommendation cards instead of only raw macro numbers
- [x] Feed nutrition coaching signals into AI user context and plan-generation prompts so meal/workout proposals can reason over adherence, not only averages
- [x] Extend nutrition coaching with meal-level pattern detection and retrieval-backed strategy summaries
