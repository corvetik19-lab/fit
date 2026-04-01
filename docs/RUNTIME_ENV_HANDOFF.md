# Handoff по runtime env и live rollout `fit`

## Как использовать этот документ

- `[x]` — пункт уже подготовлен в коде или документации.
- `[ ]` — пункт ещё нужно реально выполнить в окружении.
- Этот документ предназначен для разработчика или владельца инфраструктуры, который настраивает `fit-platform` в Vercel и внешних сервисах.

Текущий статус handoff:

- кодовый контур для `CloudPayments`, `Sentry`, `AI runtime` и `Android/TWA` уже готов;
- оставшиеся production-блокеры находятся в окружении и внешних кабинетах;
- основной прогресс проекта в [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) сейчас `178 / 186` (`96%`).

## 1. Где именно это настраивать

### Vercel

- [ ] Открыть проект `fit-platform` в Vercel.
- [ ] Перейти в `Settings -> Environment Variables`.
- [ ] Заполнить env отдельно для `Preview`.
- [ ] Заполнить env отдельно для `Production`.

### CloudPayments

- [ ] Открыть кабинет `CloudPayments`.
- [ ] Найти `Public ID` терминала.
- [ ] Найти `API Secret`.
- [ ] Завести webhook-уведомления на production host `fit`.

### Sentry

- [ ] Открыть проект `fit` в Sentry.
- [ ] Найти `DSN`.
- [ ] Подготовить `Auth Token`.
- [ ] Проверить `Org slug` и `Project slug`.

## 2. Обязательные env для Vercel

### Web/PWA baseline

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `CRON_SECRET`
- [ ] `ADMIN_BOOTSTRAP_TOKEN`

### Billing: CloudPayments

- [ ] `NEXT_PUBLIC_BILLING_PROVIDER=cloudpayments`
- [ ] `NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID`
- [ ] `CLOUDPAYMENTS_API_SECRET`
- [ ] `CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB`
- [ ] `CLOUDPAYMENTS_PREMIUM_MONTHLY_DESCRIPTION`
- [ ] `CLOUDPAYMENTS_WEBHOOK_SECRET`

Рекомендуемое значение:

```env
NEXT_PUBLIC_BILLING_PROVIDER=cloudpayments
CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB=1490
CLOUDPAYMENTS_PREMIUM_MONTHLY_DESCRIPTION=fit Premium — 1 месяц
```

Важно:

- `CLOUDPAYMENTS_TEST_MODE` нужен только локально и не должен включаться в production.
- Если отдельного webhook secret нет, код умеет fallback на `CLOUDPAYMENTS_API_SECRET`, но для production лучше держать отдельный секрет.

### Sentry

- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `SENTRY_ORG`
- [ ] `SENTRY_PROJECT`
- [ ] `SENTRY_AUTH_TOKEN`
- [ ] `SENTRY_ENVIRONMENT=production`

### AI runtime

- [ ] `OPENROUTER_API_KEY`
- [ ] `VOYAGE_API_KEY`
- [ ] При необходимости `OPENROUTER_CHAT_MODEL`
- [ ] При необходимости `OPENROUTER_VISION_MODEL`
- [ ] При необходимости `VOYAGE_EMBEDDING_MODEL`

### Android/TWA release

- [ ] `ANDROID_TWA_SHA256_FINGERPRINTS`
- [ ] Если нужен override: `ANDROID_TWA_PACKAGE_NAME`

## 3. Что именно делает каждая переменная

### Billing

- `NEXT_PUBLIC_BILLING_PROVIDER` — активирует provider-neutral billing runtime и должен быть `cloudpayments`.
- `NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID` — публичный terminal id для hosted/widget checkout flow.
- `CLOUDPAYMENTS_API_SECRET` — серверный API secret для reconcile и management API.
- `CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB` — сумма monthly подписки в рублях.
- `CLOUDPAYMENTS_PREMIUM_MONTHLY_DESCRIPTION` — описание тарифа, которое увидит пользователь.
- `CLOUDPAYMENTS_WEBHOOK_SECRET` — подпись входящих webhook-запросов.

### Sentry

- `NEXT_PUBLIC_SENTRY_DSN` — клиентский DSN для runtime ошибок.
- `SENTRY_ORG` и `SENTRY_PROJECT` — нужны для release-интеграции и server-side smoke.
- `SENTRY_AUTH_TOKEN` — нужен для build/release integration и runtime verification.

### AI

- `OPENROUTER_API_KEY` — generation/runtime provider.
- `VOYAGE_API_KEY` — embeddings и retrieval quality gate.

## 4. Что настроить в CloudPayments

### 4.1. Hosted checkout

- [ ] Проверить, что hosted flow открывается на `/billing/cloudpayments`.
- [ ] Проверить, что production host совпадает с реальным доменом `fit`.

Пользовательская billing-страница:

```text
https://<production-host>/billing/cloudpayments
```

### 4.2. Webhook URL

Минимально обязательный webhook:

- [ ] `https://<production-host>/api/billing/webhook/cloudpayments/pay`

Рекомендуемые дополнительные webhook endpoints:

- [ ] `https://<production-host>/api/billing/webhook/cloudpayments/fail`
- [ ] `https://<production-host>/api/billing/webhook/cloudpayments/confirm`
- [ ] `https://<production-host>/api/billing/webhook/cloudpayments/cancel`
- [ ] `https://<production-host>/api/billing/webhook/cloudpayments/recurrent`

Что делает код:

- route принимает `kind` из URL;
- подпись проверяется через `Content-HMAC` и `CLOUDPAYMENTS_WEBHOOK_SECRET`;
- повторные события обрабатываются идемпотентно через `subscription_events.provider_event_id`.

## 5. Порядок настройки без лишнего риска

### Шаг 1. Preview

- [ ] Заполнить все billing env в `Preview`.
- [ ] Заполнить все Sentry env в `Preview`.
- [ ] Заполнить `OPENROUTER_API_KEY` и `VOYAGE_API_KEY` в `Preview`.
- [ ] Заполнить `CRON_SECRET` и `ADMIN_BOOTSTRAP_TOKEN`.
- [ ] Сделать redeploy preview.

### Шаг 2. Production

- [ ] Перенести рабочие значения в `Production`.
- [ ] Перепроверить, что billing provider установлен в `cloudpayments`.
- [ ] Сделать production redeploy.

### Шаг 3. CloudPayments кабинет

- [ ] Завести production webhook URL.
- [ ] Проверить `pay` событие.
- [ ] Проверить, что кабинет отдаёт корректную подпись.

## 6. Что запускать после настройки

### Локально или в CI

- [ ] `npm run verify:runtime-env`
- [ ] `npm run verify:staging-runtime`
- [ ] `npm run verify:sentry-runtime`
- [ ] `npm run verify:retrieval-release`

### Обязательный live billing smoke

- [ ] Открыть `/settings?section=billing`
- [ ] Запустить `checkout`
- [ ] Вернуться через `return reconcile`
- [ ] Убедиться, что webhook прилетел
- [ ] Убедиться, что `billing center` показывает активную подписку
- [ ] Проверить это же в `/admin`

## 7. Как понять, что всё настроено правильно

### Billing

- [ ] `checkout -> return reconcile -> webhook -> billing center` проходит end-to-end.
- [ ] В `subscriptions` появляется `provider=cloudpayments`.
- [ ] `entitlements` и `usage_counters` согласованы.
- [ ] `/settings` и `/admin` показывают одинаковое состояние подписки.

### Sentry

- [ ] `npm run verify:sentry-runtime` зелёный.
- [ ] `/api/admin/observability/sentry-test` создаёт событие.
- [ ] runtime ошибки попадают в Sentry.

### AI

- [ ] `npm run verify:retrieval-release` больше не упирается в `OpenRouter 402`.
- [ ] `npm run verify:staging-runtime` больше не упирается в `Voyage 403`.
- [ ] AI quality gate проходит полностью.

## 8. Если что-то пошло не так

### CloudPayments

- проверить `NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID`;
- проверить `CLOUDPAYMENTS_API_SECRET`;
- проверить `CLOUDPAYMENTS_WEBHOOK_SECRET`;
- проверить production webhook URL и `Content-HMAC`.

### Sentry

- проверить `NEXT_PUBLIC_SENTRY_DSN`;
- проверить `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`;
- перепроверить, что env стоят именно в том окружении, где идёт deploy.

### AI

- если снова `OpenRouter 402`, проблема в кредитах или тарифе провайдера;
- если снова `Voyage 403`, проблема в ключе или доступе к embeddings API.

## 9. Связанные документы

- [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md)
- [PROD_READY.md](/C:/fit/docs/PROD_READY.md)
- [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md)
- [RUSSIAN_BILLING_PROVIDER_PLAN.md](/C:/fit/docs/RUSSIAN_BILLING_PROVIDER_PLAN.md)
- [ANDROID_TWA.md](/C:/fit/docs/ANDROID_TWA.md)
