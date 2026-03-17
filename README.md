# fit

`fit` — это web-first fitness platform в формате PWA. Приложение объединяет тренировки, питание, аналитику, AI-коучинг и операторскую админ-панель в одном продукте.

## Текущее состояние

Сейчас репозиторий находится в фазе production hardening:

- уже есть рабочие пользовательские поверхности `Dashboard`, `Workouts`, `Nutrition`, `AI`, `History`, `Settings`;
- уже есть `Admin`-контур с управлением пользователями, операциями и health dashboard;
- уже есть Supabase schema, migrations, RLS, offline sync для тренировок и AI retrieval stack;
- уже есть Stripe foundation, Sentry foundation и Vercel cron jobs;
- при этом проект ещё доводится до production-ready baseline по quality gates, UX, тестам и release process.

Источник правды по текущему статусу: [docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md)

## Стек

- Next.js 16 + App Router
- React 19
- TypeScript strict
- Supabase Auth + Postgres + pgvector + RLS
- OpenRouter / AI Gateway + Voyage embeddings
- Stripe
- Sentry
- Vercel

## Основные команды

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

### Что считается baseline quality gate

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:smoke`
- `npm run verify:migrations` при изменениях в `supabase/migrations`
- `npm run verify:advisors` при изменениях в `supabase/migrations`, если доступны Supabase management secrets

Цель проекта — чтобы все три команды проходили стабильно за один запуск и были готовы для CI.

### Что нужно для полного CI regression-контура

Чтобы в GitHub Actions включались `test:rls` и `test:e2e:auth`, в secrets репозитория должны быть:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN`
- `PLAYWRIGHT_TEST_EMAIL`
- `PLAYWRIGHT_TEST_PASSWORD`
- `PLAYWRIGHT_ADMIN_EMAIL`
- `PLAYWRIGHT_ADMIN_PASSWORD`

### Что считается `prod-ready`

Source of truth по production-ready состоянию теперь вынесен в [docs/PROD_READY.md](./docs/PROD_READY.md). Там зафиксированы:

- обязательные automated gates;
- обязательные manual acceptance сценарии;
- env readiness;
- release blockers для web/PWA, AI, billing и Android.

Если этих secrets нет, workflow всё равно прогоняет `lint`, `typecheck`, `build` и `test:smoke`, а полные auth/RLS regression jobs просто пропускаются.

Если в diff есть файлы из `supabase/migrations`, CI дополнительно запускает `npm run verify:migrations`, а при наличии `SUPABASE_PROJECT_REF` и `SUPABASE_ACCESS_TOKEN` ещё и `npm run verify:advisors`. Для миграций по-прежнему требуются синхронные обновления `docs/MASTER_PLAN.md` и `docs/AI_WORKLOG.md`.

## Переменные окружения

Скопируй `.env.example` в `.env.local` и заполни нужные значения.

Основные переменные:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` или `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `VOYAGE_API_KEY`
- `ADMIN_BOOTSTRAP_TOKEN`
- `CRON_SECRET`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PREMIUM_MONTHLY_PRICE_ID`

Полный шаблон лежит в [`.env.example`](/C:/fit/.env.example).

## Ключевые директории

- `src/app` — страницы и route handlers
- `src/components` — UI-компоненты
- `src/lib` — доменная логика, Supabase, AI, offline, billing, observability
- `supabase/migrations` — SQL migrations и schema evolution
- `public` — PWA assets, SVG demos, offline page
- `ai-evals` — AI eval workspace и датасеты
- `docs` — пользовательская и техническая документация

## Документация

Вся проектная документация лежит в [docs/README.md](/C:/fit/docs/README.md).

Главные документы:

- [docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md)
- [docs/AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md)
- [docs/USER_GUIDE.md](/C:/fit/docs/USER_GUIDE.md)
- [docs/AI_EXPLAINED.md](/C:/fit/docs/AI_EXPLAINED.md)
- [docs/FRONTEND.md](/C:/fit/docs/FRONTEND.md)
- [docs/BACKEND.md](/C:/fit/docs/BACKEND.md)
- [docs/AI_STACK.md](/C:/fit/docs/AI_STACK.md)
- [docs/RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md)
- [docs/BUILD_WARNINGS.md](/C:/fit/docs/BUILD_WARNINGS.md)

## Правила разработки

- Все существенные изменения фиксируются в `docs/AI_WORKLOG.md`.
- Прогресс по production hardening отмечается в `docs/MASTER_PLAN.md`.
- Изменения схемы БД вносятся только через migrations.
- Для Supabase-задач по этому репозиторию основным инструментом считается MCP для проекта `fit`.
