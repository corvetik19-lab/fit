# Release checklist `fit`

## Перед merge в `main`

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run test:smoke`
- [ ] Если менялся auth/RLS/owner-only контур, пройти `npm run test:rls`
- [ ] Если менялись пользовательские сценарии или route contracts, пройти `npm run test:e2e:auth`
- [ ] Если менялись `supabase/migrations`, проходит `npm run verify:migrations`
- [ ] Нет лишних локальных изменений в tracked-файлах после quality gates
- [ ] `docs/MASTER_PLAN.md` и `docs/AI_WORKLOG.md` обновлены, если менялся контракт

## Перед production deploy

- [ ] Подтверждены `NEXT_PUBLIC_SUPABASE_URL` и publishable key
- [ ] Подтверждён `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Подтверждены `CRON_SECRET` и admin bootstrap token
- [ ] Подтверждены `OPENROUTER_API_KEY` и `VOYAGE_API_KEY`, если выкатывается AI runtime
- [ ] Подтверждены `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`
- [ ] Подтверждены `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PREMIUM_MONTHLY_PRICE_ID`, если затронут billing
- [ ] Если менялись AI runtime или billing runtime контуры, прогнан `npm run verify:staging-runtime`
- [ ] После DDL-изменений применены миграции и проверены advisors `security` и `performance`
- [ ] Для Supabase-проекта отдельно проверены platform-level пункты:
  - leaked password protection включён
  - принято осознанное решение по `vector` extension в `public` и это отражено в release notes

## Для полного CI в GitHub Actions

- [ ] В secrets заданы `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] Задан `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Заданы `PLAYWRIGHT_TEST_EMAIL` и `PLAYWRIGHT_TEST_PASSWORD`
- [ ] Заданы `PLAYWRIGHT_ADMIN_EMAIL` и `PLAYWRIGHT_ADMIN_PASSWORD`
- [ ] `quality.yml` действительно запускает `test:rls` и `test:e2e:auth`, а не только `smoke`
- [ ] `quality.yml` действительно запускает `verify:migrations`, если в diff есть SQL migrations

## Smoke после deploy

- [ ] Открывается `/`
- [ ] Открывается `/smoke`
- [ ] Отвечает `GET /api/health`
- [ ] Доступны `manifest.webmanifest` и `offline.html`
- [ ] Не видно hydration errors, render loops и бесконечного polling на базовых экранах
- [ ] PWA shell и burger drawer не перекрывают контент на телефоне

## Дополнительно перед billing/AI релизом

- [ ] Stripe flow проверен end-to-end: `checkout -> return reconcile -> webhook -> portal`
- [ ] AI runtime даёт корректный user-facing ответ при ошибке провайдера
- [ ] Retrieval и history работают только в owner-scoped контуре
- [ ] Минимальный eval gate закрыт для `assistant`, `retrieval`, `workout plan`, `meal plan`, `safety`
