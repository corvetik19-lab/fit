# Dark Utility Redesign Execution

Текущий прогресс подплана: `6 / 10` (`60%`).

## Цель

Перевести `fit` в единый **dark utility fitness**-язык:

- тёмный графитовый интерфейс вместо светлого editorial baseline;
- компактные рабочие кнопки вместо oversized CTA;
- mobile-first shell, удобный для Android/PWA;
- спокойная, единая и коммерчески понятная подача всех экранов;
- без потери текущих workout, nutrition, AI, settings и admin flows.

## Как вести этот файл

- `[x]` — tranche закрыт кодом и проверками.
- `[ ]` — tranche ещё открыт.
- После каждого заметного slice нужно:
  - перевести соответствующий пункт в `[x]`;
  - обновить прогресс в шапке;
  - синхронизировать [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md),
    [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md),
    [FRONTEND.md](/C:/fit/docs/FRONTEND.md)
    и [design-handoff/DARK_UTILITY_MOBILE_BRIEF.md](/C:/fit/docs/design-handoff/DARK_UTILITY_MOBILE_BRIEF.md).

## Checklist

- [x] Создан новый execution-doc и добавлен в `docs/README.md` и `design-handoff`.
- [x] Обновлён frontend source of truth и дизайнерский handoff под `Dark Utility Fitness`.
- [x] Переведены глобальные токены, базовые surface-primitives, shell и входной экран.
- [x] Переведены `/dashboard` и общие workspace-паттерны под compact dark utility.
- [x] Переведены `/workouts` и `/workouts/day/[dayId]` с focus-mode.
- [ ] Переведён `/nutrition` вместе с camera/barcode/Open Food Facts flow.
- [ ] Переведён `/ai` как компактный coaching workspace.
- [x] Переведены `/history`, `/settings`, `/billing/cloudpayments`, `/suspended`.
- [ ] Переведены `/admin`, `/admin/users`, `/admin/users/[id]`.
- [ ] Закрыт финальный visual/mobile regression tranche и handoff для разработчиков.

## Что уже закрыто

### 2026-04-15 — foundation tranche

- Создан execution-doc [DARK_UTILITY_REDESIGN_EXECUTION.md](/C:/fit/docs/DARK_UTILITY_REDESIGN_EXECUTION.md).
- Обновлены [FRONTEND.md](/C:/fit/docs/FRONTEND.md), [docs/README.md](/C:/fit/docs/README.md), [design-handoff/README.md](/C:/fit/docs/design-handoff/README.md) и [DARK_UTILITY_MOBILE_BRIEF.md](/C:/fit/docs/design-handoff/DARK_UTILITY_MOBILE_BRIEF.md).
- Глобальная тема переведена на тёмный utility-контракт в [globals.css](/C:/fit/src/app/globals.css).
- Обновлены shell и navigation entrypoint: [app-shell-frame.tsx](/C:/fit/src/components/app-shell-frame.tsx), [app-shell-nav.tsx](/C:/fit/src/components/app-shell-nav.tsx).
- Входной экран переведён в компактный mobile-first стиль: [page.tsx](/C:/fit/src/app/page.tsx), [auth-form.tsx](/C:/fit/src/components/auth-form.tsx).
- PWA metadata синхронизированы под тёмный baseline: [layout.tsx](/C:/fit/src/app/layout.tsx), [manifest.ts](/C:/fit/src/app/manifest.ts).

### 2026-04-15 — dashboard и workspace tranche

- Общий workspace-паттерн переведён в компактный dark-utility язык в [page-workspace.tsx](/C:/fit/src/components/page-workspace.tsx).
- [dashboard-workspace.tsx](/C:/fit/src/components/dashboard-workspace.tsx) полностью переведён в новый ритм: короткий hero, next-action, компактные summary-карточки и чистый AI-блок.
- Для пользовательских экранов, которые уже используют общий workspace, санирован visible copy и подтянут новый тон: [workouts/page.tsx](/C:/fit/src/app/workouts/page.tsx) и [nutrition/page.tsx](/C:/fit/src/app/nutrition/page.tsx).

### 2026-04-15 — workouts и focus-mode tranche

- Список недель и конструктор доведены до нового compact mobile-first ритма в [weekly-program-builder.tsx](/C:/fit/src/components/weekly-program-builder.tsx).
- Экран выполнения дня тренировки полностью переведён в новый визуальный язык в [page.tsx](/C:/fit/src/app/workouts/day/[dayId]/page.tsx) и [workout-day-session.tsx](/C:/fit/src/components/workout-day-session.tsx).
- Focus-mode перестроен как главный мобильный surface через [workout-focus-header.tsx](/C:/fit/src/components/workout-session/workout-focus-header.tsx): компактный sticky header, короткие метрики, таймер и action-bar без oversized блоков.
- Overview и action surfaces переведены в тот же стиль через [workout-day-overview-card.tsx](/C:/fit/src/components/workout-session/workout-day-overview-card.tsx), [workout-status-actions.tsx](/C:/fit/src/components/workout-session/workout-status-actions.tsx), [workout-step-strip.tsx](/C:/fit/src/components/workout-session/workout-step-strip.tsx) и [workout-exercise-card.tsx](/C:/fit/src/components/workout-session/workout-exercise-card.tsx).
- Инженерная проверка по tranche зелёная для baseline: `npm run lint`, `npm run typecheck`, `npm run build`.

### 2026-04-15 — history, settings и self-service tranche

- История и архивные user flows переведены в новый dark utility ритм через [history/page.tsx](/C:/fit/src/app/history/page.tsx): timeline, архив программ, AI-предложения и data actions теперь собраны как единый рабочий экран без визуального шума.
- Экран настроек перестроен вокруг компактного profile/billing/data control center в [settings/page.tsx](/C:/fit/src/app/settings/page.tsx), а встроенные центры самообслуживания приведены к тому же стилю в [settings-billing-center.tsx](/C:/fit/src/components/settings-billing-center.tsx) и [settings-data-center.tsx](/C:/fit/src/components/settings-data-center.tsx).
- Transport и formatter-слой для self-service copy санирован и подтянут под новый visual contract в [settings-billing-center-model.ts](/C:/fit/src/components/settings-billing-center-model.ts), [settings-data-center-model.ts](/C:/fit/src/components/settings-data-center-model.ts), [sign-out-button.tsx](/C:/fit/src/components/sign-out-button.tsx) и [app-shell-frame.tsx](/C:/fit/src/components/app-shell-frame.tsx).
- Billing handoff и restricted-state surfaces переведены в единый стиль через [billing/cloudpayments/page.tsx](/C:/fit/src/app/billing/cloudpayments/page.tsx), [cloudpayments-checkout.tsx](/C:/fit/src/components/cloudpayments-checkout.tsx) и [suspended/page.tsx](/C:/fit/src/app/suspended/page.tsx).
- Auth-based regression suite адаптирована под новый layout: [authenticated-app.spec.ts](/C:/fit/tests/e2e/authenticated-app.spec.ts) больше не ждёт скрытые mobile-триггеры на desktop и подтверждает переходы через реальные hero/workspace surfaces.
- Проверка tranche зелёная: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test tests/e2e/authenticated-app.spec.ts --workers=1`.

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
