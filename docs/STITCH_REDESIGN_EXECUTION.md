# Stitch Redesign Execution

Текущий прогресс подплана: `10 / 10` (`100%`).

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
- [x] Финальный auth/mobile visual regression tranche закрыт: [authenticated-app.spec.ts](/C:/fit/tests/e2e/authenticated-app.spec.ts), [ui-regressions.spec.ts](/C:/fit/tests/e2e/ui-regressions.spec.ts) и [mobile-pwa-regressions.spec.ts](/C:/fit/tests/e2e/mobile-pwa-regressions.spec.ts) повторно пройдены на живом локальном auth runtime.

## Что проверено

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `tests/e2e/authenticated-app.spec.ts`
- `tests/e2e/ui-regressions.spec.ts`
- `tests/e2e/mobile-pwa-regressions.spec.ts`
- `tests/smoke/app-smoke.spec.ts`

## Текущий blocker

Внутри stitch-redesign workstream открытых блокеров больше нет. Подплан закрыт полностью; остаются только внешние runtime/env задачи из общего master plan, которые не относятся к визуальному рефакторингу.

## 2026-04-13 auth form only + server auth follow-up

- [x] Стартовый экран [page.tsx](/C:/fit/src/app/page.tsx) упрощён до single-column stitch-layout: на маршруте `/` остаются только brand block и auth flow без левой промо-колонки.
- [x] В [auth-form.tsx](/C:/fit/src/components/auth-form.tsx) удалены социальные кнопки `Google` и `Apple`; остались только режимы `Вход / Регистрация`, email, пароль, имя для sign-up и понятные notice/error состояния.
- [x] Для снижения зависимости от прямого браузерного auth-запроса добавлены серверные routes [api/auth/sign-in/route.ts](/C:/fit/src/app/api/auth/sign-in/route.ts) и [api/auth/sign-up/route.ts](/C:/fit/src/app/api/auth/sign-up/route.ts); форма работает через `/api/auth/*`.
- [x] Auth transport доведён до предсказуемого API-контракта: при внешнем DNS/runtime-сбое routes возвращают `503 AUTH_PROVIDER_UNAVAILABLE`, а invalid-payload сценарий покрыт в [api-contracts.spec.ts](/C:/fit/tests/e2e/api-contracts.spec.ts).
- [x] После смены branding-токенов синхронизирован smoke-контракт в [app-smoke.spec.ts](/C:/fit/tests/smoke/app-smoke.spec.ts): PWA metadata ждёт `theme_color=#0040e0` и `background_color=#fcf9f8`.

## 2026-04-13 mobile-first auth/admin final pass

- [x] Входной экран дополнительно дожат под Android/PWA-first подачу: [page.tsx](/C:/fit/src/app/page.tsx) и [auth-form.tsx](/C:/fit/src/components/auth-form.tsx) теперь держат только логотип, `fit`, короткий слоган и саму форму без тяжёлой карточной рамки и без лишнего маркетингового шума.
- [x] На операторских маршрутах `/admin`, `/admin/users`, `/admin/users/[id]` отключён floating AI widget через [admin/page.tsx](/C:/fit/src/app/admin/page.tsx), [admin/users/page.tsx](/C:/fit/src/app/admin/users/page.tsx) и [admin/users/[id]/page.tsx](/C:/fit/src/app/admin/users/[id]/page.tsx), чтобы мобильная админка не теряла полезную площадь экрана.
- [x] Mobile regression suite приведён к реальному текущему контракту operator UI: [mobile-pwa-regressions.spec.ts](/C:/fit/tests/e2e/mobile-pwa-regressions.spec.ts) валидирует drawer, CTA и отсутствие overflow, а не старый `page-workspace` переключатель, которого на `/admin` больше нет.
- [x] Stitch redesign после этого закрыт полностью: `10 / 10` (`100%`).
