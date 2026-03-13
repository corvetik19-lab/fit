# fit

`fit` - это web-first фитнес-платформа на базе Vercel, которая сейчас находится в активной стадии bootstrap и локальной разработки.

## Текущий срез репозитория

- Next.js 16 App Router foundation
- responsive PWA shell
- offline queue contract на Dexie
- Supabase client contracts и migrations
- Vercel AI Gateway route scaffolding
- admin route scaffolding + bootstrap первого `super_admin`
- Ragas evaluation workspace bootstrap
- локальный auth и onboarding flow
- рабочий exercise library CRUD в `/workouts`
- draft weekly program builder в `/workouts`
- lock flow и `My Week` в `/workouts`
- Workout Day execution и `actual_reps` в `/workouts/day/[dayId]`
- history cloning через клонирование недели на `+7` дней в `/workouts`
- workout templates через сохранение шаблона и секцию шаблонов тренировок
- dashboard с реальными summary-метриками и period comparison UI
- workout charts на dashboard по завершённым дням и логам подходов
- nutrition charts на dashboard по дневным калориям и средним КБЖУ
- рабочий nutrition tracker в `/nutrition` с ручным вводом приёмов пищи
- CRUD пользовательской базы продуктов в `/nutrition`
- recipes и recipe items UI в `/nutrition`
- meal templates UI в `/nutrition`
- быстрый barcode flow в `/nutrition` по собственной базе продуктов
- AI-анализ фото блюда в `/nutrition` с proposal-оценкой калорий и КБЖУ
- автоматический пересчёт дневной КБЖУ-сводки после логирования питания
- цели по КБЖУ и прогресс по ним в nutrition-срезе
- nutrition goal adherence block с 7-дневным трендом выполнения целей
- русскоязычная пользовательская поверхность для основных экранов
- базовый admin user management UI в `/admin/users`
- рабочий AI proposal-центр в `/ai` с meal/workout plan generation
- сохранение AI-предложений в `ai_plan_proposals`
- controlled confirmation/apply flow для AI-предложений
- AI-чат с базовым RAG по пользовательским данным и ручным reindex базы знаний

## Скрипты

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

Сейчас `npm run typecheck` сначала вызывает `next typegen`, а `npm run build` использует webpack-сборщик для более стабильной локальной верификации.

## Переменные окружения

Скопируй `.env.example` в `.env.local` и заполни:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` или `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_GATEWAY_API_KEY`
- `ADMIN_BOOTSTRAP_TOKEN`
- `SENTRY_AUTH_TOKEN`

## Основные директории

- `src/app` - routes и API handlers
- `src/lib` - env, logging, safety, Supabase, AI и offline contracts
- `src/components` - UI-компоненты
- `supabase/migrations` - SQL schema и RLS
- `ai-evals` - workspace для внутренних AI-оценок
- `docs` - worklog, plan tracker и документация по frontend/backend/AI

## Документация

Основная проектная документация лежит в `docs/`:

- `docs/README.md`
- `docs/USER_GUIDE.md`
- `docs/AI_WORKLOG.md`
- `docs/MASTER_PLAN.md`
- `docs/FRONTEND.md`
- `docs/BACKEND.md`
- `docs/AI_STACK.md`
