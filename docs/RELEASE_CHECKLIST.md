# Release checklist `fit`

## Перед merge в `main`

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run test:smoke`
- [ ] если менялся auth/RLS/owner-only контур, пройти `npm run test:rls`
- [ ] если менялись пользовательские сценарии или route contracts, пройти `npm run test:e2e:auth`
- [ ] если менялись `supabase/migrations`, проходит `npm run verify:migrations`
- [ ] нет лишних локальных изменений в tracked-файлах после quality gates
- [ ] `docs/MASTER_PLAN.md` и `docs/AI_WORKLOG.md` обновлены, если менялся контракт

## Перед production deploy

- [ ] подтверждены `NEXT_PUBLIC_SUPABASE_URL` и publishable key
- [ ] подтверждён `SUPABASE_SERVICE_ROLE_KEY`
- [ ] подтверждены `CRON_SECRET` и admin bootstrap token
- [ ] подтверждены `OPENROUTER_API_KEY` и `VOYAGE_API_KEY`, если выкатывается AI runtime
- [ ] подтверждены `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`
- [ ] подтверждены `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PREMIUM_MONTHLY_PRICE_ID`, если затронут billing
- [ ] после DDL-изменений применены миграции и проверены advisors `security` и `performance`

## Для полного CI в GitHub Actions

- [ ] в secrets заданы `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] задан `SUPABASE_SERVICE_ROLE_KEY`
- [ ] заданы `PLAYWRIGHT_TEST_EMAIL` и `PLAYWRIGHT_TEST_PASSWORD`
- [ ] заданы `PLAYWRIGHT_ADMIN_EMAIL` и `PLAYWRIGHT_ADMIN_PASSWORD`
- [ ] `quality.yml` действительно запускает `test:rls` и `test:e2e:auth`, а не только `smoke`
- [ ] `quality.yml` действительно запускает `verify:migrations`, если в diff есть SQL migrations

## Smoke после deploy

- [ ] открывается `/`
- [ ] открывается `/smoke`
- [ ] отвечает `GET /api/health`
- [ ] доступны `manifest.webmanifest` и `offline.html`
- [ ] не видно hydration errors, render loops и бесконечного polling на базовых экранах
- [ ] PWA shell и burger drawer не перекрывают контент на телефоне

## Дополнительно перед billing/AI релизом

- [ ] Stripe flow проверен end-to-end: `checkout -> return reconcile -> webhook -> portal`
- [ ] AI runtime даёт корректный user-facing ответ при ошибке провайдера
- [ ] retrieval и history работают только в owner-scoped контуре
- [ ] минимальный eval gate закрыт для `assistant`, `retrieval`, `workout plan`, `meal plan`, `safety`
