# Release checklist `fit`

## Перед merge в `main`

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run test:smoke`
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
