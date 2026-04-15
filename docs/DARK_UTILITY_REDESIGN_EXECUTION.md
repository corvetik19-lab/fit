# Dark Utility Redesign Execution

Текущий прогресс подплана: `10 / 10` (`100%`).

## Цель

Перевести `fit` в единый **dark utility fitness**-язык:

- тёмный графитовый интерфейс вместо светлого editorial baseline;
- компактные рабочие кнопки вместо oversized CTA;
- mobile-first shell, удобный для Android/PWA;
- единый прикладной стиль для `Dashboard`, `Workouts`, `Nutrition`, `AI`, `Settings`, `History` и `Admin`;
- без потери текущих workout, nutrition, AI, settings и admin flows.

## Как вести этот файл

- `[x]` — tranche закрыт кодом и подтверждён проверками.
- `[ ]` — tranche ещё открыт.
- После каждого заметного slice нужно:
  - перевести соответствующий пункт в `[x]`;
  - пересчитать прогресс в шапке;
  - синхронизировать [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md),
    [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md),
    [FRONTEND.md](/C:/fit/docs/FRONTEND.md)
    и [design-handoff/DARK_UTILITY_MOBILE_BRIEF.md](/C:/fit/docs/design-handoff/DARK_UTILITY_MOBILE_BRIEF.md).

## Checklist

- [x] Создан execution-doc и добавлен в `docs/README.md` и `design-handoff`.
- [x] Обновлён frontend source of truth и дизайнерский handoff под `Dark Utility Fitness`.
- [x] Переведены глобальные токены, базовые surface-primitives, shell и входной экран.
- [x] Переведены `/dashboard` и общие workspace-паттерны под compact dark utility.
- [x] Переведены `/workouts` и `/workouts/day/[dayId]` с focus-mode.
- [x] Переведён `/nutrition` вместе с camera/barcode/Open Food Facts flow.
- [x] Переведён `/ai` как компактный coaching workspace.
- [x] Переведены `/history`, `/settings`, `/billing/cloudpayments`, `/suspended`.
- [x] Переведены `/admin`, `/admin/users`, `/admin/users/[id]`.
- [x] Закрыт финальный visual/mobile regression tranche и handoff для разработчиков.

## Что уже закрыто

### 2026-04-15 — foundation tranche

- Создан execution-doc [DARK_UTILITY_REDESIGN_EXECUTION.md](/C:/fit/docs/DARK_UTILITY_REDESIGN_EXECUTION.md).
- Обновлены [FRONTEND.md](/C:/fit/docs/FRONTEND.md), [docs/README.md](/C:/fit/docs/README.md), [design-handoff/README.md](/C:/fit/docs/design-handoff/README.md) и [DARK_UTILITY_MOBILE_BRIEF.md](/C:/fit/docs/design-handoff/DARK_UTILITY_MOBILE_BRIEF.md).
- Глобальная тема переведена на тёмный utility-контракт в [globals.css](/C:/fit/src/app/globals.css).
- Обновлены shell и navigation entrypoints: [app-shell-frame.tsx](/C:/fit/src/components/app-shell-frame.tsx), [app-shell-nav.tsx](/C:/fit/src/components/app-shell-nav.tsx).
- Входной экран переведён в компактный mobile-first стиль: [page.tsx](/C:/fit/src/app/page.tsx), [auth-form.tsx](/C:/fit/src/components/auth-form.tsx).
- PWA metadata синхронизированы под тёмный baseline: [layout.tsx](/C:/fit/src/app/layout.tsx), [manifest.ts](/C:/fit/src/app/manifest.ts).

### 2026-04-15 — dashboard и workspace tranche

- Общий workspace-паттерн переведён в компактный dark utility язык в [page-workspace.tsx](/C:/fit/src/components/page-workspace.tsx).
- [dashboard-workspace.tsx](/C:/fit/src/components/dashboard-workspace.tsx) полностью переведён в новый ритм: короткий hero, next-action, компактные summary-карточки и чистый AI-блок.
- Для пользовательских экранов, которые уже используют общий workspace, санирован visible copy и подтянут новый тон: [workouts/page.tsx](/C:/fit/src/app/workouts/page.tsx), [nutrition/page.tsx](/C:/fit/src/app/nutrition/page.tsx).

### 2026-04-15 — workouts и focus-mode tranche

- Список недель и конструктор доведены до компактного mobile-first ритма в [weekly-program-builder.tsx](/C:/fit/src/components/weekly-program-builder.tsx).
- Экран выполнения дня тренировки полностью переведён в новый язык в [page.tsx](/C:/fit/src/app/workouts/day/[dayId]/page.tsx) и [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx).
- Focus-mode перестроен как главный мобильный surface через [workout-focus-header.tsx](/C:/fit/src/components/workout-session/workout-focus-header.tsx): компактный sticky header, короткие метрики, таймер и action-bar без oversized блоков.
- Overview и action surfaces переведены в тот же стиль через [workout-day-overview-card.tsx](/C:/fit/src/components/workout-session/workout-day-overview-card.tsx), [workout-status-actions.tsx](/C:/fit/src/components/workout-session/workout-status-actions.tsx), [workout-step-strip.tsx](/C:/fit/src/components/workout-session/workout-step-strip.tsx) и [workout-exercise-card.tsx](/C:/fit/src/components/workout-session/workout-exercise-card.tsx).

### 2026-04-15 — history, settings и self-service tranche

- История и архивные user flows переведены в новый dark utility ритм через [history/page.tsx](/C:/fit/src/app/history/page.tsx): timeline, архив программ, AI-предложения и data actions теперь собраны как единый рабочий экран без визуального шума.
- Экран настроек перестроен вокруг компактного profile/billing/data control center в [settings/page.tsx](/C:/fit/src/app/settings/page.tsx), а встроенные центры самообслуживания приведены к тому же стилю в [settings-billing-center.tsx](/C:/fit/src/components/settings-billing-center.tsx) и [settings-data-center.tsx](/C:/fit/src/components/settings-data-center.tsx).
- Billing handoff и restricted-state surfaces переведены в единый стиль через [billing/cloudpayments/page.tsx](/C:/fit/src/app/billing/cloudpayments/page.tsx), [cloudpayments-checkout.tsx](/C:/fit/src/components/cloudpayments-checkout.tsx) и [suspended/page.tsx](/C:/fit/src/app/suspended/page.tsx).

### 2026-04-15 — nutrition tranche

- `/nutrition` доведён до единого dark utility вида без светлых legacy-surface в ключевых потоках: [nutrition-tracker.tsx](/C:/fit/src/components/nutrition-tracker.tsx), [nutrition-photo-analysis.tsx](/C:/fit/src/components/nutrition-photo-analysis.tsx), [nutrition-open-food-facts-card.tsx](/C:/fit/src/components/nutrition-open-food-facts-card.tsx), [nutrition-barcode-scanner.tsx](/C:/fit/src/components/nutrition-barcode-scanner.tsx), [nutrition-recipes-manager.tsx](/C:/fit/src/components/nutrition-recipes-manager.tsx), [nutrition-meal-templates-manager.tsx](/C:/fit/src/components/nutrition-meal-templates-manager.tsx).
- Camera capture, barcode scan и Open Food Facts preview/import теперь используют те же тёмные input, notice и preview surfaces, что и остальной mobile shell.
- Отдельно закрыт runtime hardening для camera import: [nutrition-photo-analysis.tsx](/C:/fit/src/components/nutrition-photo-analysis.tsx), [photo-import route](/C:/fit/src/app/api/nutrition/photo-import/route.ts), [nutrition capture storage migration](/C:/fit/supabase/migrations/20260414120000_nutrition_capture_storage_bucket.sql).

### 2026-04-15 — AI workspace tranche

- AI surface переведён в компактный coaching workspace через [ai-workspace.tsx](/C:/fit/src/components/ai-workspace.tsx), [ai-workspace-sidebar.tsx](/C:/fit/src/components/ai-workspace-sidebar.tsx), [ai-chat-composer.tsx](/C:/fit/src/components/ai-chat-composer.tsx), [ai-chat-notices.tsx](/C:/fit/src/components/ai-chat-notices.tsx), [ai-chat-panel-cards.tsx](/C:/fit/src/components/ai-chat-panel-cards.tsx), [ai-chat-transcript.tsx](/C:/fit/src/components/ai-chat-transcript.tsx) и [ai-prompt-library.tsx](/C:/fit/src/components/ai-prompt-library.tsx).
- Web-search toggle доведён до устойчивого mobile поведения в [use-ai-chat-web-search.ts](/C:/fit/src/components/use-ai-chat-web-search.ts).
- История AI-чата переведена на optimistic delete/clear и перестала ломаться из-за stale SSR rehydrate: [ai-workspace.tsx](/C:/fit/src/components/ai-workspace.tsx), [chat.ts](/C:/fit/src/lib/ai/chat.ts).
- AI regression suite синхронизирован с новым UX в [ai-workspace.spec.ts](/C:/fit/tests/e2e/ai-workspace.spec.ts).

### 2026-04-15 — admin tranche

- Админские рабочие поверхности переведены в тот же dark utility язык через [admin-dashboard-workspace.tsx](/C:/fit/src/components/admin-dashboard-workspace.tsx), [admin-users-directory.tsx](/C:/fit/src/components/admin-users-directory.tsx), [admin-user-detail.tsx](/C:/fit/src/components/admin-user-detail.tsx), [admin-user-detail-primitives.tsx](/C:/fit/src/components/admin-user-detail-primitives.tsx), [admin-user-detail-billing.tsx](/C:/fit/src/components/admin-user-detail-billing.tsx), [admin-user-detail-content-assets.tsx](/C:/fit/src/components/admin-user-detail-content-assets.tsx), [admin-user-detail-operations.tsx](/C:/fit/src/components/admin-user-detail-operations.tsx), [admin-user-actions.tsx](/C:/fit/src/components/admin-user-actions.tsx), [admin-health-dashboard.tsx](/C:/fit/src/components/admin-health-dashboard.tsx), [admin-operations-inbox.tsx](/C:/fit/src/components/admin-operations-inbox.tsx), [admin-ai-eval-runs.tsx](/C:/fit/src/components/admin-ai-eval-runs.tsx), [admin-ai-operations.tsx](/C:/fit/src/components/admin-ai-operations.tsx), [admin-role-manager.tsx](/C:/fit/src/components/admin-role-manager.tsx) и [admin-bootstrap-form.tsx](/C:/fit/src/components/admin-bootstrap-form.tsx).
- Для admin detail добавлен server-first initial payload и retry/fallback слой: [admin/users/[id]/page.tsx](/C:/fit/src/app/admin/users/[id]/page.tsx), [admin-user-detail-state.ts](/C:/fit/src/components/admin-user-detail-state.ts), [admin-auth.ts](/C:/fit/src/lib/admin-auth.ts), [admin user detail route](/C:/fit/src/app/api/admin/users/[id]/route.ts).
- Admin e2e переведены на более устойчивые сценарии без лишних `networkidle` и без зависимости от первого элемента в каталоге: [admin-app.spec.ts](/C:/fit/tests/e2e/admin-app.spec.ts).

## Рабочие правила редизайна

- Базовый фон — тёмный графит, а не pure black.
- Один брендовый акцент — сине-бирюзовый язык логотипа.
- Основной шрифт — рабочий и компактный; display-акценты только точечно.
- Кнопки должны быть удобны на телефоне, а не выглядеть как лендинговые.
- Главный экран каждого маршрута должен отвечать на вопрос: «что пользователю делать сейчас».
- Списки, логирование, статусы и вторичные действия должны быть компактнее hero-слоя.
- Визуальный слой не должен ломать product invariants:
  - workout step flow;
  - AI chat-first;
  - nutrition camera/barcode/import;
  - settings `profile / billing / data`;
  - admin operator-first.

## Что остаётся открытым

- Подплан закрыт: базовый visual/mobile regression пакет для нового стиля подтверждён зелёными `authenticated-app`, `admin-app` и `mobile-pwa-regressions`.
- Оставшиеся runtime-сбои `Supabase/Auth` теперь считаются внешним общеплатформенным риском master-plan, а не blocker именно для `Dark Utility` редизайна.

### 2026-04-15 — финальный regression и handoff tranche

- Финальный regression-пакет по новому стилю закрыт зелёно:
  - `node scripts/run-playwright.mjs -- test tests/e2e/authenticated-app.spec.ts --workers=1` → `2 passed`
  - `node scripts/run-playwright.mjs -- test tests/e2e/admin-app.spec.ts --workers=1` → `7 passed`
  - `node scripts/run-playwright.mjs -- test tests/e2e/mobile-pwa-regressions.spec.ts --workers=1` → `3 passed`
- `authenticated-app.spec.ts` переведён на кросс-layout селекторы по реальным заголовкам экранов, поэтому suite больше не зависит от скрытых mobile-триггеров на desktop shell.
- `mobile-pwa-regressions.spec.ts` теперь проверяет workout focus-mode через `data-testid="workout-regular-mode-button"`, а не через устаревший текстовый label.
- Developer-facing handoff синхронизирован с фактом закрытия подплана в [FRONTEND.md](/C:/fit/docs/FRONTEND.md) и [DARK_UTILITY_MOBILE_BRIEF.md](/C:/fit/docs/design-handoff/DARK_UTILITY_MOBILE_BRIEF.md).
