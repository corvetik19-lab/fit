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
- AI plane: Vercel AI Gateway
- Основная generation model: `google/gemini-3.1-pro-preview`
- Основная embedding model: `voyage/voyage-4-large`
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
- [ ] Реализованы optimistic updates
- [ ] Реализован полноценный mutation queue sync flow

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
- [ ] Реализован structured knowledge layer в продуктовой логике
- [x] Реализовано сохранение и применение AI proposals

### Admin / SaaS / Android

- [x] Заложена отдельная admin-поверхность
- [x] В схеме заложены admin, SaaS и eval таблицы
- [x] Реализован bootstrap flow для первого `super_admin`
- [ ] Настроен первый реальный `super_admin`
- [ ] Реализован product-level feature gating
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
- [x] Реализовать history cloning flow
- [ ] Реализовать offline logging и sync для workout domain

## Фаза 3. Admin panel v1 + observability

- [x] Подготовить `/admin` route
- [x] Подготовить admin API route scaffolds
- [x] Добавить проверку `platform_admins` на admin page
- [x] Перевести privileged admin routes на проверку `platform_admins`
- [ ] Назначить первого admin user
- [x] Реализовать user directory UI
- [x] Реализовать user detail UI
- [x] Реализовать suspend/reactivate flow
- [x] Реализовать support actions UI
- [ ] Реализовать audit log views
- [ ] Реализовать system health dashboard
- [ ] Реализовать sync health dashboard
- [ ] Реализовать AI usage monitoring для admin
- [ ] Подключить Sentry
- [ ] Подключить Vercel Analytics / Speed Insights

## Фаза 4. Analytics dashboard

- [x] Подготовить dashboard route scaffold
- [x] Подготовить analytics API stub
- [x] Реализовать реальные metrics queries
- [x] Реализовать period comparison UI
- [x] Реализовать workout charts
- [x] Реализовать nutrition charts
- [ ] Реализовать precomputed aggregates
- [ ] Реализовать snapshot strategy для быстрых графиков

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
- [ ] Реализовать CAG snapshots в runtime-логике
- [ ] Реализовать KAG knowledge layer в приложении
- [ ] Реализовать embeddings ingestion и refresh
- [ ] Реализовать admin knowledge base management

## Фаза 7. AI evals and quality gate

- [x] Создать `ai-evals/` workspace
- [x] Добавить README для eval workspace
- [x] Добавить README для datasets
- [x] Подготовить admin AI eval route scaffolds
- [ ] Подключить Ragas как реальный eval layer
- [ ] Собрать evaluation datasets
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
- [ ] Реализовать entitlements model в runtime
- [ ] Реализовать usage accounting для AI
- [ ] Реализовать feature gating по user plan
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

- [ ] Настроить Vercel Cron
- [ ] Реализовать nightly recompute dashboard aggregates
- [ ] Реализовать daily nutrition summaries job
- [ ] Реализовать stale mutation queue retry/cleanup
- [ ] Реализовать embeddings refresh / reindex job
- [ ] Реализовать export job processing
- [ ] Реализовать deletion request purge
- [ ] Реализовать subscription state reconciliation
- [ ] Реализовать scheduled AI eval runs

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

### Nutrition

- [ ] Проверить расчёт КБЖУ
- [ ] Проверить recipes и templates
- [ ] Проверить meal summaries
- [ ] Проверить barcode/photo flows

### Dashboard

- [ ] Проверить агрегаты на desktop
- [ ] Проверить агрегаты на mobile
- [ ] Проверить сравнение периодов

### AI

- [ ] Проверить, что chat использует только user context
- [ ] Проверить, что proposals не auto-commitятся
- [ ] Проверить корректную недоступность AI offline
- [ ] Проверить safety layer на risky prompts

### AI evals

- [ ] Проверить regression benchmarks
- [ ] Проверить отсутствие деградации retrieval quality
- [ ] Проверить safety thresholds
- [ ] Проверить baseline после смены модели

### Admin

- [ ] Проверить доступ в `/admin` только для `super_admin`
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
