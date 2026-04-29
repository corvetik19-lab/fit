# Тестовый доступ и статус подписки

Дата старта: 2026-04-28
Дата закрытия: 2026-04-29

Цель: сделать управляемый тестовый доступ для пользователя без отдельной параллельной billing-системы. Администратор должен указывать количество дней, повторно добавлять тестовые периоды, видеть историю изменений, а пользовательский профиль и админ-карточка должны явно показывать: тестовый период, активная подписка, просрочка или отсутствие доступа.

## Прогресс

Текущий подплан: `7 / 7` (`100%`).
Общий `MASTER_PLAN` на старте: `238 / 240` (`99%`).
Общий `MASTER_PLAN` после закрытия: `245 / 247` (`99%`).

## Чеклист

- [x] Описать контракт тестового доступа для разработчиков и не создавать отдельную таблицу поверх `subscriptions`.
- [x] Доработать domain helper `applyAdminSubscriptionAction(...)`: `grant_trial` продлевает доступ от текущей будущей даты окончания, а не перезаписывает срок от сегодняшнего дня.
- [x] Записывать в `subscription_events` и `admin_audit_logs` количество добавленных дней, старую дату окончания, новую дату окончания и provider.
- [x] Обновить админскую карточку пользователя: явно показывать тип доступа, остаток дней, дату окончания и источник.
- [x] Обновить action UI для одного пользователя и bulk-выдачи: формулировки про "выдать / продлить тестовый доступ", поле дней ограничено диапазоном `1..365`.
- [x] Обновить пользовательский billing center в `/settings`, чтобы trial показывался как тестовый доступ с понятной датой окончания.
- [x] Добавить/обновить regression-проверки и закрыть релевантный verification package.

## Контракт реализации

- Тестовый доступ хранится в `subscriptions.status = 'trial'`.
- Срок доступа хранится в `subscriptions.current_period_end`.
- Повторная выдача тестового доступа добавляет дни к `max(now, current_period_end)`.
- Для ручной активной подписки используется `subscriptions.status = 'active'`.
- Provider для тестового доступа по умолчанию: `admin_trial`.
- Provider для ручной подписки по умолчанию: `admin_console`.
- Максимальный срок, который админ может добавить за одно действие: `365` дней.
- История выдачи фиксируется в `subscription_events` с `event_type = 'admin_grant_trial'` или `admin_bulk_grant_trial`.
- Privileged actions остаются server-only и выполняются через admin route handlers с `requireAdminRouteAccess("manage_billing")` или root bulk controls.
- Supabase billing mutations обёрнуты в transient retry для `fetch failed`, `ECONNRESET`, `terminated` и похожих кратких runtime-сбоев.

## Developer Notes

- Основная бизнес-логика находится в `src/lib/admin-billing.ts`.
- Single-user admin UI находится в `src/components/admin-user-actions.tsx`.
- Bulk UI нормализует дни через `src/components/admin-users-directory-model.ts` и `src/components/admin-users-bulk-actions.tsx`.
- Admin billing readout использует `src/components/admin-user-detail-billing.tsx`; старая локальная копия billing-секции в `admin-user-detail-sections.tsx` заменена на единую секцию.
- User-facing readout в `/settings` использует `src/components/settings-billing-center.tsx` и `src/components/settings-billing-center-model.ts`.
- API route payload для admin billing пишет `durationDays`, `periodBase`, `previousPeriodEnd`, `currentPeriodEnd`, `provider`, `status`.
- E2E helper `tests/e2e/helpers/http.ts` поддерживает `timeoutMs` и `maxAttempts`; для неидемпотентного billing POST используется один запрос с длинным timeout.

## Verification

- [x] `npm run lint` — passed; остаются 2 прежних warning в `src/lib/ai/plan-generation.ts` по unused deterministic helpers.
- [x] `npm run typecheck` — passed.
- [x] `npm run build` — passed; остаются прежние Sentry/OpenTelemetry dynamic dependency warnings.
- [x] `node scripts/run-playwright.mjs -- test tests/e2e/settings-billing.spec.ts --workers=1 --reporter=list` — `2 passed`.
- [x] `node scripts/run-playwright.mjs -- test tests/e2e/admin-app.spec.ts -g billing --workers=1 --reporter=list` — `1 passed`.
- [x] `node scripts/run-playwright.mjs -- test tests/e2e/api-contracts.spec.ts -g extends --workers=1 --reporter=list` — `1 passed`.
