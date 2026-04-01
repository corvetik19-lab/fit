# План миграции billing со Stripe на российский платёжный провайдер

Текущий прогресс этого контура: `2 / 11` (`18%`).

## Что зафиксировано

- [x] Для российского production rollout `fit` больше не целится в `Stripe` как в финального live-провайдера.
- [x] Primary-кандидат для миграции выбран: `CloudPayments`.
- [ ] Подготовлен provider-neutral billing layer и завершён перенос runtime c `Stripe` на провайдера РФ.

## Почему выбран `CloudPayments`

`CloudPayments` лучше всего ложится на текущую архитектуру `fit`, потому что у него уже есть всё, что нам нужно для замены текущего Stripe-контура без полного переписывания billing-domain:

- платёжный виджет и мобильный виджет;
- SDK для Android;
- рекуррентные платежи и отдельные API-методы для подписок;
- webhook/notification модель;
- идемпотентность API;
- сценарии `token -> subscription -> recurrent charge`, которые близки к текущей модели `checkout -> subscription -> entitlements`.

Официальные источники:

- [CloudPayments docs](https://developers.cloudpayments.ru/)
- [CloudPayments: рекуррентные платежи](https://developers.cloudpayments.ru/)
- [CloudPayments: API и идемпотентность](https://developers.cloudpayments.ru/)

## Почему `ЮKassa` остаётся fallback, а не primary

`ЮKassa` подходит как запасной путь и точно пригодна для приёма платежей в РФ, но для текущего кода `fit` она чуть менее удобна как первая миграция:

- там есть API, webhooks и сценарии сохранения способа оплаты;
- но под нашу подписочную модель потребуется больше собственного orchestration-слоя вокруг recurring lifecycle;
- у нас уже есть billing center и subscription/admin surfaces, поэтому нам выгоднее провайдер, который ближе к текущему Stripe-паттерну.

Официальные источники:

- [ЮKassa API](https://yookassa.ru/developers/api)
- [ЮKassa: сохранение способа оплаты для рекуррентных платежей](https://yookassa.ru/developers/payment-acceptance/scenario-extensions/recurring-payments/save-payment-method/save-without-payment)

## Архитектурное решение

Ключевой принцип: **не переписывать billing domain под конкретный SDK**, а ввести provider-neutral adapter layer.

Целевая модель:

- `src/lib/billing-provider/types.ts`
  - общий контракт провайдера: checkout, return reconcile, webhook verify/process, subscription sync, billing-center action
- `src/lib/billing-provider/index.ts`
  - выбор активного провайдера по env/config
- `src/lib/billing-provider/cloudpayments.ts`
  - новая реализация для `CloudPayments`
- `src/lib/billing-provider/stripe-legacy.ts`
  - временный legacy adapter поверх текущего `src/lib/stripe-billing.ts`

Что остаётся стабильным для продукта:

- `GET/POST /api/billing/checkout`
- `POST /api/billing/checkout/reconcile`
- `/settings` billing center
- admin billing surfaces
- наши таблицы `subscriptions`, `subscription_events`, `entitlements`, `usage_counters`

Что меняется по смыслу:

- `portal` перестаёт быть “Stripe customer portal” и становится **provider-neutral billing center action**
- webhook route меняется с `stripe-only` на provider-specific или dispatcher-модель
- runtime env перестаёт быть Stripe-only

## Технический план внедрения

### Этап 1. Развязать код от Stripe

- [ ] Ввести provider-neutral типы и adapter-layer в `src/lib/billing-provider/*`.
- [ ] Перевести `src/lib/billing-self-service.ts` с прямых вызовов `stripe-billing.ts` на provider interface.
- [ ] Перевести `src/lib/billing-access.ts`, `src/lib/admin-billing.ts` и `src/lib/settings-self-service.ts` на provider-neutral поля и статусы там, где это сейчас завязано на `stripe`.
- [ ] Оставить текущий `src/lib/stripe-billing.ts` как `legacy adapter`, чтобы миграция шла поэтапно и без двойного переписывания.

### Этап 2. Заменить transport-слой

- [ ] Сохранить product routes `checkout` и `checkout/reconcile`, но отвязать их от Stripe-специфики.
- [ ] Заменить `src/app/api/billing/portal/route.ts` на provider-neutral billing-center action:
  - либо ссылка на внешний кабинет провайдера, если он реально есть;
  - либо наш внутренний self-service flow без отдельного внешнего portal.
- [ ] Добавить CloudPayments webhook route и нормальный dispatcher для событий подписки/платежа.
- [ ] Унифицировать transport/error copy: в user-facing и operator-facing слоях не должно остаться формулировок “Stripe ...”, если провайдер уже не Stripe.

### Этап 3. Реализовать CloudPayments adapter

- [ ] Реализовать checkout/create-payment flow через `CloudPayments`.
- [ ] Реализовать return/reconcile flow после успешной оплаты.
- [ ] Реализовать webhook verification и идемпотентный event processing.
- [ ] Реализовать sync подписки и обновление `subscriptions`, `subscription_events`, `entitlements`, `usage_counters`.

### Этап 4. Обновить env и release-gates

- [ ] Заменить Stripe-only env contract на provider-neutral + CloudPayments runtime env.
- [ ] Обновить `verify:runtime-env`, `verify:staging-runtime`, `test:billing-gate` и release-docs под нового провайдера.
- [ ] Зафиксировать список env для preview/production и handoff владельцу окружения.

### Этап 5. Обновить UI и тесты

- [ ] Убрать Stripe-specific wording из `/settings`, `/admin`, release docs и billing handoff docs.
- [ ] Добавить contract/e2e покрытие для сценария `checkout -> return reconcile -> webhook -> billing center`.
- [ ] Отдельно проверить mobile/PWA и Android/TWA flow оплаты, если платёж открывается через hosted page/widget.

## Карта текущих файлов, которые почти точно затронет миграция

- `src/lib/stripe-billing.ts`
- `src/lib/billing-self-service.ts`
- `src/lib/billing-access.ts`
- `src/lib/admin-billing.ts`
- `src/lib/settings-self-service.ts`
- `src/app/api/billing/checkout/route.ts`
- `src/app/api/billing/checkout/reconcile/route.ts`
- `src/app/api/billing/portal/route.ts`
- `src/app/api/billing/webhook/stripe/route.ts`
- `src/app/api/internal/jobs/billing-reconcile/route.ts`
- `src/components/settings-billing-center.tsx`
- `src/components/settings-billing-center-model.ts`
- `src/components/use-settings-billing-center-state.ts`
- `src/components/admin-user-detail-billing.tsx`
- `scripts/verify-runtime-env.mjs`
- `scripts/verify-staging-runtime.mjs`
- `tests/billing-gate/*`

## Предлагаемый env-контракт для новой интеграции

Точные имена можно утвердить в ходе реализации, но целевой набор разумно вести так:

- `NEXT_PUBLIC_BILLING_PROVIDER=cloudpayments`
- `CLOUDPAYMENTS_PUBLIC_ID`
- `CLOUDPAYMENTS_API_SECRET`
- `CLOUDPAYMENTS_WEBHOOK_SECRET`
- при необходимости отдельный `CLOUDPAYMENTS_TEST_MODE`

Важно: пользовательские и серверные ключи должны быть разделены. Секреты — только на сервере.

## Риски и решения заранее

- **Нет прямого аналога Stripe Portal.**
  Решение: делать provider-neutral billing center и не завязывать UX на существование внешнего портала.

- **Recurring lifecycle у разных провайдеров различается.**
  Решение: нормализовать события в нашем domain-layer, а не протаскивать provider statuses в UI.

- **Android/TWA + платежи могут требовать дополнительной проверки policy.**
  Решение: до live Android rollout отдельно проверить допустимость внешней оплаты для конкретного канала дистрибуции.

- **Миграция не должна ломать текущий admin/audit контур.**
  Решение: все privileged billing actions и reconcile должны сохранить audit logging.

## Критерий готовности

Этот migration-plan можно считать закрытым, когда:

- checkout больше не зависит от Stripe;
- webhook и reconcile работают через провайдера РФ;
- billing center остаётся рабочим для пользователя и admin;
- `subscriptions / entitlements / usage counters` остаются согласованными;
- docs, release gates и env readiness больше не считают Stripe обязательным контуром для РФ rollout.
