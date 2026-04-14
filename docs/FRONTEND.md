# Frontend `fit`

## Стек

- Next.js 16 + App Router
- React 19
- TypeScript strict
- Tailwind CSS v4
- PWA shell + service worker
- AI UI на `@ai-sdk/react`

## Текущий визуальный source of truth

С апреля 2026 фронтенд `fit` переводится в направление **Dark Utility Fitness / mobile-first**.

Это новый основной визуальный контракт поверх уже существующего продукта. Он заменяет прежний
`stitch-style editorial` baseline как активное направление для разработки.

Новый дизайн должен быть:

- тёмным, но не cyberpunk и не pure black;
- компактным и удобным на телефоне;
- ближе к usability сильных fitness products, чем к маркетинговому лендингу;
- единым на всех пользовательских и admin-поверхностях;
- совместимым с текущими route map, workout flow, nutrition capture/barcode/import,
  AI chat/proposals, settings и admin-операциями.

Активные execution-docs по этому направлению:

- [DARK_UTILITY_REDESIGN_EXECUTION.md](/C:/fit/docs/DARK_UTILITY_REDESIGN_EXECUTION.md)
- [design-handoff/DARK_UTILITY_MOBILE_BRIEF.md](/C:/fit/docs/design-handoff/DARK_UTILITY_MOBILE_BRIEF.md)

Исторические документы сохраняются как reference/handoff:

- [STITCH_REDESIGN_EXECUTION.md](/C:/fit/docs/STITCH_REDESIGN_EXECUTION.md)
- [PREMIUM_REDESIGN_PLAN.md](/C:/fit/docs/PREMIUM_REDESIGN_PLAN.md)

## Новый визуальный контракт

### Основные принципы

- Mobile/PWA first.
- Один главный сценарий на экран.
- Нормальные рабочие размеры кнопок, без oversized CTA.
- Плотная, но читаемая иерархия.
- Секции важнее декоративных hero-блоков.
- Один акцентный брендовый язык на основе сине-бирюзовой палитры логотипа.

### Цвета и поверхности

- базовый фон: тёмный графит, не чёрный;
- `surface`: 2-3 уровня глубины без тяжёлых рамок;
- текст: высокий контраст, вторичный текст чуть приглушён;
- акцент: сине-бирюзовый язык логотипа;
- статусные цвета использовать экономно.

### Типографика

- рабочий UI-шрифт: `Manrope`;
- display-акценты возможны только точечно;
- заголовки короткие;
- объясняющий текст минимальный.

### Компоновка

- основной паттерн: `top app bar -> content -> bottom nav`;
- drawer только как secondary-navigation;
- sticky lower action bar только там, где она помогает действию;
- длинные страницы разбиваются на секции, а не на россыпь одинаковых карт.

## Базовая архитектура frontend-слоя

Frontend делится на три уровня:

1. `src/app/**` — server pages и route-level orchestration
2. `src/components/**` — UI-компоненты, shell, формы, workspace и screen surfaces
3. `src/lib/**` — derive-слой, helper'ы, форматтеры, runtime plumbing и доменные правила

Правила production hardening:

- страницы должны быть тонкими orchestrator-компонентами;
- async/data orchestration не должна жить прямо в JSX;
- hydration-sensitive и sync-sensitive logic выносится в hooks и helper-модули;
- visible copy на ключевых поверхностях должен быть на чистом русском без mojibake;
- любые заметные UI-срезы должны синхронизировать `MASTER_PLAN`, `AI_WORKLOG` и профильные docs.

## Shell и навигация

Ключевые файлы:

- `src/components/app-shell.tsx`
- `src/components/app-shell-frame.tsx`
- `src/components/app-shell-nav.tsx`

Текущий контракт shell:

- на mobile/PWA главный navigation слой — compact top bar + bottom nav;
- drawer не должен перекрывать critical CTA и не должен ломать safe areas;
- AI widget и вторичные floating-элементы не должны мешать основному контенту;
- shell обязан работать одинаково аккуратно на `360 / 390 / 430px`;
- desktop остаётся вторичным представлением той же дизайн-системы, а не отдельным продуктом.

## Workspace-паттерн

Общий workspace-паттерн применяется к:

- `Dashboard`
- `Workouts`
- `Nutrition`
- `AI`
- `Admin`

Ожидаемое поведение:

- пользователь быстро понимает, что сейчас главное;
- на mobile одновременно доминирует один основной блок;
- secondary content либо ниже, либо за section switcher / bottom sheet;
- overview, menu и текущий раздел можно скрывать предсказуемо, если это предусмотрено экраном.

Ключевой shared-файл:

- `src/components/page-workspace.tsx`

## Ключевые продуктовые инварианты

### Тренировки

- workout flow остаётся пошаговым;
- `focus-mode` — критический mobile surface;
- таймер, сохранение, reset и read-only состояния сохраняются.

### Питание

- сохраняются `photo capture`, `barcode scan` и `Open Food Facts import`;
- дневной лог остаётся primary surface;
- продуктовые карточки и импорт не должны ломаться на узком экране.

### AI

- AI остаётся chat-first workspace;
- transcript, composer, history и proposal actions остаются частью одного сценария.

### Settings и billing

- settings сохраняют секции `profile / billing / data`;
- billing остаётся на `CloudPayments`;
- self-service состояния должны проектироваться как часть интерфейса, а не как post-fix.

### Admin

- admin остаётся operator-first, а не consumer-dashboard;
- degraded и warning states должны быть визуально оформлены как нормальный operator UI.

## Regression expectations

После заметных frontend-tranche обязательно проверять:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:smoke`

Для shell/mobile изменений дополнительно:

- `tests/e2e/mobile-pwa-regressions.spec.ts`
- `tests/e2e/ui-regressions.spec.ts`

Для auth/workspace flow дополнительно:

- `tests/e2e/authenticated-app.spec.ts`

Для nutrition camera/barcode/import дополнительно:

- `tests/e2e/nutrition-capture.spec.ts`

Если меняется shell, visual contract или screen hierarchy, нужно синхронизировать:

- [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md)
- [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md)
- [DARK_UTILITY_REDESIGN_EXECUTION.md](/C:/fit/docs/DARK_UTILITY_REDESIGN_EXECUTION.md)
- [design-handoff/DARK_UTILITY_MOBILE_BRIEF.md](/C:/fit/docs/design-handoff/DARK_UTILITY_MOBILE_BRIEF.md)

## 2026-04-15 Dark Utility workouts contract

- `/workouts` и `/workouts/day/[dayId]` теперь считаются частью закрытого dark-utility foundation и должны поддерживать компактный mobile-first ритм без oversized CTA.
- Workout execution screen обязан оставаться главным рабочим экраном продукта: короткий sticky header, быстрый доступ к таймеру, компактные шаги и одна понятная нижняя группа действий.
- Focus-mode не должен превращаться в декоративный hero-screen: приоритет у скорости логирования, читаемости на `390px` и безопасного one-hand сценария.
- Любые следующие правки workout UI должны сохранять совместимость с:
  - `tests/e2e/workout-focus-flow.spec.ts`
  - `tests/e2e/workout-sync.spec.ts`
  - `tests/e2e/mobile-pwa-regressions.spec.ts`

## 2026-04-15 Dark Utility settings/history contract

- `/history` должен читаться как рабочий архив: timeline, AI proposals, программы и data actions собираются в один плотный экран без галереи равнозначных карточек.
- `/settings` остаётся mobile-first control center с тремя обязательными слоями `profile / billing / data`; secondary copy должен быть коротким и прикладным, без explainers ради explainers.
- `SettingsBillingCenter` и `SettingsDataCenter` считаются частью общего dark utility self-service контракта: compact cards, ясные статусы, одна главная кнопка на секцию, без oversized CTA и без светлых legacy-input surfaces.
- `/billing/cloudpayments` и `/suspended` должны выглядеть как нормальные рабочие states продукта, а не как технические заглушки: один основной статус, понятное следующее действие и безопасный возврат в пользовательский контур.
- Shared `PageWorkspace` остаётся каноническим слоем для heavy workspace-страниц; любые правки в его copy/structure нужно проверять через `tests/e2e/authenticated-app.spec.ts`, потому что этот suite теперь использует реальные hero/workspace surfaces как контракт навигации.

## 2026-04-15 Dark Utility nutrition contract

- `/nutrition` считается закрытым dark utility surface и должен оставаться главным дневным рабочим экраном, а не витриной функций: сначала баланс и быстрые actions, затем лог дня и только потом библиотечные сущности.
- Camera capture, barcode scan и Open Food Facts import обязательны как first-class flows; их нельзя прятать глубоко, выносить в отдельный визуальный язык или возвращать к белым form-surface.
- `NutritionPhotoAnalysis`, `NutritionOpenFoodFactsCard`, `NutritionBarcodeScanner`, `NutritionRecipesManager` и `NutritionMealTemplatesManager` теперь входят в единый mobile-first контракт: тёмные elevated surfaces, компактные input, короткие status/notices и один явный action-path на сценарий.
- Любые следующие правки nutrition UI нужно проверять как минимум через `tests/e2e/nutrition-capture.spec.ts`, чтобы не потерять рабочие flows `photo -> preview -> import` и `barcode -> lookup -> import`.
