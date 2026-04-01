# План миграции billing со Stripe на российского провайдера

Текущий прогресс этого контура: `21 / 21` (`100%`).

## Что зафиксировано

- [x] Для российского production rollout `fit` больше не целится в `Stripe` как в финального live-провайдера.
- [x] Primary-кандидат для миграции выбран: `CloudPayments`.
- [x] Подготовлен provider-neutral billing layer и завершён перенос runtime c `Stripe` на провайдера РФ.

## Почему выбран `CloudPayments`

`CloudPayments` лучше всего ложится на текущую архитектуру `fit`, потому что у него уже есть всё, что нужно для замены текущего Stripe-контура без полного переписывания billing-domain:

- платёжный виджет и мобильный hosted/widget flow;
- Android-friendly сценарий поверх TWA/PWA;
- рекуррентные платежи и API для подписок;
- webhook/notification модель;
- идемпотентность API;
- сценарии `token -> subscription -> recurrent charge`, которые близки к нашей модели `checkout -> subscription -> entitlements`.

Официальные источники:

- [CloudPayments docs](https://developers.cloudpayments.ru/)
- [CloudPayments: рекуррентные платежи](https://developers.cloudpayments.ru/)
- [CloudPayments: API и идемпотентность](https://developers.cloudpayments.ru/)

## Почему `ЮKassa` остаётся fallback, а не primary

`ЮKassa` подходит как запасной путь и пригодна для приёма платежей в РФ, но для текущего кода `fit` она чуть менее удобна как первая миграция:

- там есть API, webhooks и сценарии сохранения способа оплаты;
- но под нашу подписочную модель потребуется больше собственного orchestration-слоя вокруг recurring lifecycle;
- у нас уже есть billing center и subscription/admin surfaces, поэтому выгоднее провайдер, который ближе к текущему Stripe-паттерну.

Официальные источники:

- [ЮKassa API](https://yookassa.ru/developers/api)
- [ЮKassa: сохранение способа оплаты для рекуррентных платежей](https://yookassa.ru/developers/payment-acceptance/scenario-extensions/recurring-payments/save-payment-method/save-without-payment)

## Архитектурное решение

Ключевой принцип: **не переписывать billing domain под конкретный SDK**, а держать provider-neutral adapter layer.

Целевая модель:

- `src/lib/billing-provider.ts`
  - активный провайдер, env readiness, provider label, provider-specific missing env;
- `src/lib/billing-self-service.ts`
  - единый self-service runtime для checkout, return reconcile и billing center;
- `src/lib/cloudpayments-billing.ts`
  - CloudPayments adapter, webhook verify/process, reconcile и checkout intent;
- `src/lib/stripe-billing.ts`
  - legacy adapter для безопасного переходного периода.

Что остаётся стабильным для продукта:

- `POST /api/billing/checkout`
- `POST /api/billing/checkout/reconcile`
- `POST /api/billing/portal`
- `/settings` billing center
- admin billing surfaces
- таблицы `subscriptions`, `subscription_events`, `entitlements`, `usage_counters`

Что меняется по смыслу:

- `portal` перестаёт быть исключительно “Stripe customer portal” и становится **provider-neutral billing center action**;
- webhook route переходит с `stripe-only` на provider-specific model;
- runtime env перестаёт быть Stripe-only.

## Технический план внедрения

### Этап 1. Развязать код от Stripe

- [x] Ввести provider-neutral типы и adapter-layer для billing runtime.
- [x] Перевести `src/lib/billing-self-service.ts` с прямых вызовов `stripe-billing.ts` на provider interface.
- [x] Перевести `src/lib/billing-access.ts`, `src/lib/settings-self-service.ts`, admin billing surfaces и readiness matrix на provider-neutral поля и статусы.
- [x] Оставить `src/lib/stripe-billing.ts` как legacy adapter для безопасного переходного периода.

### Этап 2. Заменить transport-слой

- [x] Сохранить product routes `checkout` и `checkout/reconcile`, но отвязать их от Stripe-специфики.
- [x] Заменить `src/app/api/billing/portal/route.ts` на provider-neutral billing-center action.
- [x] Добавить CloudPayments webhook route и нормальный dispatcher для событий подписки/платежа.
- [x] Унифицировать transport/error copy: в user-facing и operator-facing слоях не осталось старых формулировок, предполагающих только Stripe.

### Этап 3. Реализовать CloudPayments adapter

- [x] Реализовать checkout/create-payment flow через `CloudPayments`.
- [x] Реализовать return/reconcile flow после успешной оплаты.
- [x] Реализовать webhook verification и идемпотентный event processing.
- [x] Реализовать sync подписки и обновление `subscriptions`, `subscription_events`, `entitlements`, `usage_counters`.

### Этап 4. Обновить env и release-gates

- [x] Заменить Stripe-only env contract на provider-neutral + CloudPayments runtime env.
- [x] Обновить `verify:runtime-env`, `verify:staging-runtime`, `test:billing-gate` и release docs под нового провайдера.
- [x] Зафиксировать список env для preview/production и handoff владельцу окружения.

### Этап 5. Обновить UI и тесты

- [x] Убрать Stripe-specific wording из `/settings`, `/admin`, release docs и billing handoff docs.
- [x] Добавить contract/e2e покрытие для сценария `checkout -> return reconcile -> webhook -> billing center`.
- [x] Отдельно проверить mobile/PWA и Android/TWA flow оплаты, если платёж открывается через hosted page/widget.

## Что именно подтверждено последним tranche

- [x] Введён `CLOUDPAYMENTS_TEST_MODE=mock` для локального детерминированного billing gate без живого платёжного кабинета.
- [x] В [billing-runtime-gate.spec.ts](/C:/fit/tests/billing-gate/billing-runtime-gate.spec.ts) добавлен полный mock-flow:
  - checkout
  - intent
  - webhook
  - return reconcile
  - billing center
- [x] Для hosted page добавлен mobile/PWA regression guard на billing surface в мобильном viewport.
- [x] В [cloudpayments-checkout.tsx](/C:/fit/src/components/cloudpayments-checkout.tsx) и [billing/cloudpayments/page.tsx](/C:/fit/src/app/billing/cloudpayments/page.tsx) убран mojibake и добавлены стабильные `data-testid` для regression suite.
- [x] Android/TWA billing deep-link smoke подтверждён через `adb` на эмуляторе:
  - `am start -W -a android.intent.action.VIEW -d "https://fit-platform-eta.vercel.app/billing/cloudpayments?reference=android-billing-smoke" app.fitplatform.mobile`
  - `logcat` подтвердил `TWALauncherActivity` и `capturedLink=https://fit-platform-eta.vercel.app/billing/cloudpayments?...`

## Карта текущих файлов, которые затронула миграция

- `src/lib/billing-provider.ts`
- `src/lib/billing-self-service.ts`
- `src/lib/billing-access.ts`
- `src/lib/cloudpayments-billing.ts`
- `src/app/api/billing/checkout/route.ts`
- `src/app/api/billing/checkout/reconcile/route.ts`
- `src/app/api/billing/cloudpayments/intent/route.ts`
- `src/app/api/billing/portal/route.ts`
- `src/app/api/billing/webhook/cloudpayments/[kind]/route.ts`
- `src/app/api/internal/jobs/billing-reconcile/route.ts`
- `src/app/billing/cloudpayments/page.tsx`
- `src/components/cloudpayments-checkout.tsx`
- `src/components/settings-billing-center.tsx`
- `src/components/settings-billing-center-model.ts`
- `src/components/use-settings-billing-center-state.ts`
- `src/components/admin-health-dashboard.tsx`
- `src/components/admin-user-detail-billing.tsx`
- `tests/billing-gate/billing-runtime-gate.spec.ts`
- `scripts/verify-runtime-env.mjs`
- `scripts/verify-staging-runtime.mjs`

## Env-контракт для новой интеграции

- `NEXT_PUBLIC_BILLING_PROVIDER=cloudpayments`
- `NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID`
- `CLOUDPAYMENTS_API_SECRET`
- `CLOUDPAYMENTS_PREMIUM_MONTHLY_AMOUNT_RUB`
- `CLOUDPAYMENTS_PREMIUM_MONTHLY_DESCRIPTION`
- `CLOUDPAYMENTS_WEBHOOK_SECRET`
- `CLOUDPAYMENTS_TEST_MODE` — только для локального mock billing gate

Важно: пользовательские и серверные ключи разделены. Секреты — только на сервере.

## Риски и решения

- **Нет прямого аналога Stripe Portal.**
  Решение: provider-neutral billing center и self-service flow без жёсткой привязки к внешнему кабинету.

- **Recurring lifecycle у разных провайдеров различается.**
  Решение: нормализовать события в нашем domain-layer, а не протаскивать provider statuses напрямую в UI.

- **Android/TWA + hosted payment flow требует отдельной проверки deep link и policy.**
  Решение: держать отдельный Android handoff и фиксировать deep-link smoke отдельно от web regression suite.

- **Миграция не должна ломать admin/audit контур.**
  Решение: все privileged billing actions и reconcile сохраняют audit logging.

## Критерий готовности

Этот migration-plan можно считать закрытым, потому что:

- checkout больше не зависит от Stripe;
- webhook и reconcile работают через провайдера РФ;
- billing center остаётся рабочим для пользователя и admin;
- `subscriptions / entitlements / usage counters` остаются согласованными;
- docs, release gates и env readiness больше не считают Stripe обязательным контуром для РФ rollout;
- локальный contract/e2e и mobile/TWA verification для CloudPayments уже закреплены отдельными regression-проверками.
