# fit

`fit` — web-first fitness platform в формате PWA. Приложение объединяет
тренировки, питание, аналитику, AI-коучинг и операторскую админ-панель в одном
продукте.

## Текущее состояние

Репозиторий находится в фазе production hardening:

- уже есть пользовательские поверхности `Dashboard`, `Workouts`, `Nutrition`,
  `AI`, `History`, `Settings`;
- уже есть `Admin`-контур с пользователями, операциями и health/dashboard
  сценариями;
- уже есть Supabase schema, migrations, RLS, offline sync для тренировок и AI
  retrieval stack;
- уже есть billing/Sentry/Vercel foundation;
- проект всё ещё доводится до production-ready baseline по quality gates, UX,
  release process и внешним runtime/env блокерам.

Источник правды по текущему статусу:
[docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md).

## Стек

- Next.js 16 + App Router
- React 19
- TypeScript strict
- Supabase Auth + Postgres + pgvector + RLS
- Vercel AI Gateway / OpenRouter + Voyage embeddings
- Stripe / CloudPayments runtime foundation
- Sentry
- Vercel

## Основные команды

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

### Baseline quality gate

- `npm run verify:codex` — проверка Codex operating system
- `npm run verify:agent-governance` — проверка orchestration/governance/autonomy слоя агента
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:smoke`
- `npm run verify:migrations` при изменениях в `supabase/migrations`
- `npm run verify:advisors` при DB-изменениях и наличии management secrets
- `npm run verify:android-twa` при Android/TWA изменениях
- `npm run verify:runtime-env` для быстрой проверки env readiness
- `npm run verify:supabase-runtime` для диагностики Supabase runtime
- `npm run agent:inventory` для снимка agent layer
- `npm run agent:sync-registry` для синхронизации [docs/CODEX_AGENT_REGISTRY.md](/C:/fit/docs/CODEX_AGENT_REGISTRY.md)
- `npm run agent:evaluate` для dry-run governance sweep
- `npm run agent:evolve` для локального write-run внутри allowlist
- `npm run report:master-progress` для текущего процента выполнения [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md)
- `npm run wait:vercel-deploy -- <deployment-url-or-id>` для ожидания завершения Vercel deploy без ошибок

### Что нужно для полного CI regression-контура

Чтобы в GitHub Actions включались `test:rls`, `test:e2e:auth` и профильные
quality gates, в secrets репозитория должны быть:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN`
- `PLAYWRIGHT_TEST_EMAIL`
- `PLAYWRIGHT_TEST_PASSWORD`
- `PLAYWRIGHT_ADMIN_EMAIL`
- `PLAYWRIGHT_ADMIN_PASSWORD`

Если этих secrets нет, workflow всё равно прогоняет `verify:codex`, `lint`,
`typecheck`, `build` и `test:smoke`, а полные auth/RLS/AI jobs просто
пропускаются.

## Production readiness

Source of truth по production-ready состоянию вынесен в
[docs/PROD_READY.md](/C:/fit/docs/PROD_READY.md). Там зафиксированы:

- обязательные automated gates;
- обязательные manual acceptance сценарии;
- env readiness;
- release blockers для web/PWA, AI, billing и Android.

Подробный Android/TWA handoff лежит в
[docs/ANDROID_TWA.md](/C:/fit/docs/ANDROID_TWA.md).

## Переменные окружения

Скопируй `.env.example` в `.env.local` и заполни нужные значения.

Основные env:

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
- `public` — PWA assets и SVG
- `ai-evals` — AI eval workspace и датасеты
- `docs` — пользовательская и техническая документация

## Документация

Вся проектная документация лежит в
[docs/README.md](/C:/fit/docs/README.md).

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

## Codex operating system

- execution-doc:
  [docs/CODEX_ROLLOUT_PLAN.md](/C:/fit/docs/CODEX_ROLLOUT_PLAN.md)
- agent hardening:
  [docs/CODEX_AGENT_HARDENING_PLAN.md](/C:/fit/docs/CODEX_AGENT_HARDENING_PLAN.md)
- agent autonomy:
  [docs/CODEX_AGENT_AUTONOMY_PLAN.md](/C:/fit/docs/CODEX_AGENT_AUTONOMY_PLAN.md)
- agent governance:
  [docs/CODEX_AGENT_GOVERNANCE.md](/C:/fit/docs/CODEX_AGENT_GOVERNANCE.md)
- agent registry:
  [docs/CODEX_AGENT_REGISTRY.md](/C:/fit/docs/CODEX_AGENT_REGISTRY.md)
- playbook:
  [docs/CODEX_PLAYBOOK.md](/C:/fit/docs/CODEX_PLAYBOOK.md)
- onboarding:
  [docs/CODEX_ONBOARDING.md](/C:/fit/docs/CODEX_ONBOARDING.md)
- review contract:
  [code_review.md](/C:/fit/code_review.md)
- локальные роли агентов живут в `.codex/config.toml` и `agents/*.toml`
- repo-specific skills живут в `.agents/skills/`
- GitHub review использует advisory-first contract из PR template и `@codex review`
- для проверки этого контура используется `npm run verify:codex`
- для orchestration/governance/autonomy контура используется `npm run verify:agent-governance`

## Правила разработки

- Все существенные изменения фиксируются в `docs/AI_WORKLOG.md`.
- Прогресс по production hardening отмечается в `docs/MASTER_PLAN.md`.
- Изменения схемы БД вносятся только через migrations.
- Для Supabase-задач по этому репозиторию основным инструментом считается MCP
  проекта `fit`.
- Если меняются `AGENTS.md`, `.codex`, `agents/`, `.agents/skills/` или Codex
  workflow docs, `code_review.md` или `.github/PULL_REQUEST_TEMPLATE.md`, нужно
  синхронно обновлять
  [docs/CODEX_ROLLOUT_PLAN.md](/C:/fit/docs/CODEX_ROLLOUT_PLAN.md),
  [docs/MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и
  [docs/AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).
