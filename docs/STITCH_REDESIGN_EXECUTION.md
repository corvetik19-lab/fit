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
- [x] Закрыт tranche по visible-copy sanitation и regression harness: stitch-документация очищена от mojibake, regression suites используют нормальный русский copy, а user-facing stitch surfaces зафиксированы как clean Russian baseline.
- [ ] Открыт только финальный visual regression tranche: нужно повторно прогнать auth-based visual/mobile suites, как только внешний Supabase Auth runtime перестанет падать по `ERR_CONNECTION`.

## Что проверено

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:smoke`

Дополнительно redesign-поток поддерживается отдельными auth-based suites:

- [ui-regressions.spec.ts](/C:/fit/tests/e2e/ui-regressions.spec.ts)
- [mobile-pwa-regressions.spec.ts](/C:/fit/tests/e2e/mobile-pwa-regressions.spec.ts)

## Текущий блокер

Полный финальный visual regression по `admin/auth` сейчас упирается не в UI, а во внешний auth-runtime:

- в этой среде воспроизводился `ERR_CONNECTION` на `https://nactzaxrjzsdkyfqwecf.supabase.co/auth/v1/token`;
- из-за этого `global-auth-setup` и auth-based Playwright suites могут не пройти даже при корректном stitch UI; текущий failure теперь диагностируется явно как `Auth redirect did not reach /dashboard` с застреванием на `/`;
- compile, build, smoke и локальная структурная проверка redesign при этом остаются зелёными.

Итого: редизайн функционально и визуально внедрён, а незакрытым остаётся только внешний regression pass на живом auth-runtime.
