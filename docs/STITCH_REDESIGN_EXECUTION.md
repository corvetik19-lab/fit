# Stitch Redesign Execution

Текущий прогресс подплана: `9 / 10` (`90%`).

## Цель

Перевести `fit` на цельный visual language по референсу `stitch_`:

- светлый editorial canvas;
- `Lexend + Manrope`;
- electric blue как главный акцент;
- mobile-first shell;
- меньше рамок и больше tonal surface layers;
- без потери текущих `workout`, `nutrition`, `AI`, `settings` и `admin` flows.

## Checklist

- [x] Создан отдельный execution-doc и добавлен в общий handoff-пакет.
- [x] Глобальный visual foundation переведён на новый язык: [layout.tsx](/C:/fit/src/app/layout.tsx), [globals.css](/C:/fit/src/app/globals.css).
- [x] Shell, top bar, drawer и mobile bottom nav переведены на тот же visual contract: [app-shell-frame.tsx](/C:/fit/src/components/app-shell-frame.tsx), [app-shell-nav.tsx](/C:/fit/src/components/app-shell-nav.tsx), [sign-out-button.tsx](/C:/fit/src/components/sign-out-button.tsx).
- [x] Закрыт anchor-screen tranche для `Dashboard`: [dashboard-workspace.tsx](/C:/fit/src/components/dashboard-workspace.tsx).
- [x] Закрыт anchor-screen tranche для `Workout day` и focus-mode: [workouts/day/[dayId]/page.tsx](/C:/fit/src/app/workouts/day/[dayId]/page.tsx), [workout-focus-header.tsx](/C:/fit/src/components/workout-session/workout-focus-header.tsx), [workout-step-strip.tsx](/C:/fit/src/components/workout-session/workout-step-strip.tsx), [workout-exercise-card.tsx](/C:/fit/src/components/workout-session/workout-exercise-card.tsx), [workout-status-actions.tsx](/C:/fit/src/components/workout-session/workout-status-actions.tsx), [workout-day-overview-card.tsx](/C:/fit/src/components/workout-session/workout-day-overview-card.tsx), [workout-day-context-card.tsx](/C:/fit/src/components/workout-session/workout-day-context-card.tsx).
- [x] Закрыт anchor-screen tranche для `Nutrition` и `AI`: [nutrition/page.tsx](/C:/fit/src/app/nutrition/page.tsx), [nutrition-photo-analysis.tsx](/C:/fit/src/components/nutrition-photo-analysis.tsx), [nutrition-barcode-scanner.tsx](/C:/fit/src/components/nutrition-barcode-scanner.tsx), [nutrition-open-food-facts-card.tsx](/C:/fit/src/components/nutrition-open-food-facts-card.tsx), [ai/page.tsx](/C:/fit/src/app/ai/page.tsx), [ai-workspace.tsx](/C:/fit/src/components/ai-workspace.tsx) и связанные chat-surface компоненты.
- [x] Закрыт tranche по remaining user screens: [page.tsx](/C:/fit/src/app/page.tsx), [onboarding/page.tsx](/C:/fit/src/app/onboarding/page.tsx), [onboarding-form.tsx](/C:/fit/src/components/onboarding-form.tsx), [workouts/page.tsx](/C:/fit/src/app/workouts/page.tsx), [history/page.tsx](/C:/fit/src/app/history/page.tsx), [settings/page.tsx](/C:/fit/src/app/settings/page.tsx), [billing/cloudpayments/page.tsx](/C:/fit/src/app/billing/cloudpayments/page.tsx), [cloudpayments-checkout.tsx](/C:/fit/src/components/cloudpayments-checkout.tsx), [suspended/page.tsx](/C:/fit/src/app/suspended/page.tsx), [page-workspace.tsx](/C:/fit/src/components/page-workspace.tsx).
- [x] Закрыт tranche по admin surfaces: [admin/page.tsx](/C:/fit/src/app/admin/page.tsx), [admin-dashboard-workspace.tsx](/C:/fit/src/components/admin-dashboard-workspace.tsx), [admin-health-dashboard.tsx](/C:/fit/src/components/admin-health-dashboard.tsx), [admin-operations-inbox.tsx](/C:/fit/src/components/admin-operations-inbox.tsx), [admin/users/page.tsx](/C:/fit/src/app/admin/users/page.tsx), [admin-users-directory.tsx](/C:/fit/src/components/admin-users-directory.tsx), [admin-users-bulk-actions.tsx](/C:/fit/src/components/admin-users-bulk-actions.tsx), [admin/users/[id]/page.tsx](/C:/fit/src/app/admin/users/[id]/page.tsx), [admin-user-detail.tsx](/C:/fit/src/components/admin-user-detail.tsx), [admin-ai-eval-runs.tsx](/C:/fit/src/components/admin-ai-eval-runs.tsx).
- [x] Закрыт tranche по visible-copy sanitation и developer handoff: [FRONTEND.md](/C:/fit/docs/FRONTEND.md) и [design-handoff/FIT_SCREEN_DESIGN_BRIEF.md](/C:/fit/docs/design-handoff/FIT_SCREEN_DESIGN_BRIEF.md) синхронизированы с реально внедрённым stitch-style baseline.
- [ ] Открыт только финальный auth-based visual regression tranche: нужно повторно прогнать [ui-regressions.spec.ts](/C:/fit/tests/e2e/ui-regressions.spec.ts) и [mobile-pwa-regressions.spec.ts](/C:/fit/tests/e2e/mobile-pwa-regressions.spec.ts), как только внешний Supabase Auth runtime станет доступен в локальной среде.

## Что проверено

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:smoke`

Дополнительно redesign-поток поддерживается auth-based suites:

- [ui-regressions.spec.ts](/C:/fit/tests/e2e/ui-regressions.spec.ts)
- [mobile-pwa-regressions.spec.ts](/C:/fit/tests/e2e/mobile-pwa-regressions.spec.ts)
- [authenticated-app.spec.ts](/C:/fit/tests/e2e/authenticated-app.spec.ts)

## Текущий блокер

Финальный visual regression по `auth/admin` сейчас упирается не в UI, а во внешний auth-runtime:

- в этой среде серверный и браузерный sign-in не завершаются из-за `getaddrinfo ENOTFOUND nactzaxrjzsdkyfqwecf.supabase.co`;
- из-за этого `global-auth-setup` и auth-based Playwright suites не могут завершить bootstrap сессии даже при корректном stitch UI;
- compile, build, smoke и локальная структурная проверка redesign при этом остаются зелёными.

Итого: редизайн функционально и визуально внедрён, а незакрытым остаётся только внешний regression pass на живом auth-runtime.

## 2026-04-13 auth form only + server auth follow-up

- [x] Стартовый экран [page.tsx](/C:/fit/src/app/page.tsx) упрощён до single-column stitch-layout: на маршруте `/` теперь остаются только brand chip и auth-card без левой промо-колонки.
- [x] В [auth-form.tsx](/C:/fit/src/components/auth-form.tsx) удалены социальные кнопки `Google` и `Apple`; остались только режимы `Вход / Регистрация`, email, пароль, имя для sign-up и понятные русские notice/error состояния.
- [x] Для снижения зависимости от прямого браузерного auth-запроса добавлены серверные routes [api/auth/sign-in/route.ts](/C:/fit/src/app/api/auth/sign-in/route.ts) и [api/auth/sign-up/route.ts](/C:/fit/src/app/api/auth/sign-up/route.ts); форма теперь работает через `/api/auth/*`.
- [x] Auth transport доведён до предсказуемого API-контракта: при внешнем DNS/runtime-сбое routes теперь возвращают `503 AUTH_PROVIDER_UNAVAILABLE`, а анонимный invalid-payload сценарий покрыт в [api-contracts.spec.ts](/C:/fit/tests/e2e/api-contracts.spec.ts).
- [x] В auth UX добавлен явный fallback на внешний runtime-сбой: если auth backend недоступен, пользователь видит понятное сообщение о временной недоступности сервиса вместо молчаливого зависания на `/`.
- [x] После смены branding-токенов обновлён smoke-контракт в [app-smoke.spec.ts](/C:/fit/tests/smoke/app-smoke.spec.ts): PWA metadata теперь ожидает `theme_color=#0040e0` и `background_color=#fcf9f8`.
- [x] Проверка по этому slice зелёная: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `5 passed`.
- [x] Дополнительно таргетированный contract-test подтверждает transport-предвалидацию auth routes: `tests/e2e/api-contracts.spec.ts` сценарий `auth routes reject invalid payloads before provider runtime` проходит зелёно.
- [x] Подплан stitch redesign остаётся `9 / 10` (`90%`): последний открытый пункт всё ещё блокируется внешним DNS/runtime фактором, а не проблемой текущего UI.
