# Frontend `fit`

## 2026-04-28 Fitora redesign source of truth

- Активный визуальный поток теперь [FITORA_REDESIGN_EXECUTION.md](/C:/fit/docs/FITORA_REDESIGN_EXECUTION.md), а дизайнерский handoff - [FITORA_MOBILE_BRIEF.md](/C:/fit/docs/design-handoff/FITORA_MOBILE_BRIEF.md).
- Пользовательский бренд: `fitora`; техническое имя репозитория и внутренних сервисов остается `fit`.
- Визуальный контракт: светлый mobile-first интерфейс, Manrope, палитра `#2563EB / #0891FF / #06B6D4 / #2DD4BF / #0F172A / #64748B / #E2E8F0`, compact app bar, bottom nav, floating AI widget справа снизу.
- Запрещено возвращать oversized CTA, декоративные hero-блоки, темные legacy-surfaces и видимый mojibake в изменяемых пользовательских областях.
- При каждом существенном UI-срезе обновлять `FITORA_REDESIGN_EXECUTION.md`, `MASTER_PLAN.md`, `AI_WORKLOG.md` и запускать минимум `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke`.

## Стек

- Next.js 16 + App Router
- React 19
- TypeScript strict
- Tailwind CSS v4
- PWA shell + service worker
- AI UI на `@ai-sdk/react`

## Текущий визуальный source of truth

С апреля 2026 фронтенд `fit` переводится в направление **Light Compact Mobile / utility-first**.

Это новый основной визуальный контракт поверх уже существующего продукта. Он заменяет прежний
`Dark Utility Fitness` как активное направление для разработки.

Новый дизайн должен быть:

- светлым, спокойным и мобильным;
- компактным и удобным на телефоне одной рукой;
- ближе к usability сильных fitness products, чем к декоративному лендингу;
- единым на всех пользовательских и admin-поверхностях;
- совместимым с текущими route map, workout flow, nutrition capture/barcode/import,
  AI chat/proposals, settings и admin-операциями.

Активные execution-docs по этому направлению:

- [LIGHT_COMPACT_REDESIGN_EXECUTION.md](/C:/fit/docs/LIGHT_COMPACT_REDESIGN_EXECUTION.md)
- [design-handoff/LIGHT_COMPACT_MOBILE_BRIEF.md](/C:/fit/docs/design-handoff/LIGHT_COMPACT_MOBILE_BRIEF.md)

Исторические документы сохраняются как reference/handoff:

- [DARK_UTILITY_REDESIGN_EXECUTION.md](/C:/fit/docs/DARK_UTILITY_REDESIGN_EXECUTION.md)
- [STITCH_REDESIGN_EXECUTION.md](/C:/fit/docs/STITCH_REDESIGN_EXECUTION.md)
- [PREMIUM_REDESIGN_PLAN.md](/C:/fit/docs/PREMIUM_REDESIGN_PLAN.md)

## Новый визуальный контракт

### Основные принципы

- Mobile/PWA first.
- Один главный сценарий на экран.
- Рабочие размеры кнопок `40-44px`, без oversized CTA.
- Плотная, но читаемая иерархия.
- Секции важнее декоративных hero-блоков.
- Один акцентный брендовый язык на основе сине-бирюзовой палитры логотипа.

### Цвета и поверхности

- базовый фон: светлый тёплый нейтрал, не pure white;
- `surface`: 2-3 уровня глубины без тяжёлых рамок;
- текст: тёмный графит, вторичный текст чуть приглушён;
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
- длинные страницы разбиваются на секции, а не на россыпь одинаковых карт;
- hero-блоки допустимы только как короткий status-summary, а не как первый гигантский экран.

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
- С 2026-04-28 `/ai` считается полноценным AI Agent Center, а floating AI widget - только launcher/action sheet.
- Виджет не должен импортировать `useChat`, хранить отдельный transcript или дублировать composer; все длинные диалоги идут через `AiChatPanel`.
- Контекстный запуск AI идет через `/ai?intent=...&from=...`; composer получает prefill, но пользователь сам отправляет запрос.
- Быстрые сценарии агента: план питания, план тренировок, фото еды, штрихкод/Open Food Facts, анализ прогресса, текущий экран и память AI.
- Proposal-first invariant сохраняется: AI предлагает план, но не применяет его без явного подтверждения.

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

## 2026-04-15 Light Compact redesign reset

- `Light Compact Mobile` теперь считается активным redesign-потоком. Закрытый `Dark Utility` остаётся историческим baseline, но больше не является текущим visual source of truth.
- Главный целевой UX-критерий: на телефоне интерфейс не должен разваливаться в длинные растянутые hero/card-блоки. Приоритет у компактного daily-use rhythm, особенно на `/nutrition`, `/workouts` и `focus-mode`.
- Для активного light compact направления текущий execution-doc: [LIGHT_COMPACT_REDESIGN_EXECUTION.md](/C:/fit/docs/LIGHT_COMPACT_REDESIGN_EXECUTION.md).
- Для auth/workspace-контракта теперь опираемся на реальные заголовки экранов и shell-title, а не на скрытые mobile toggles. Это зафиксировано в [authenticated-app.spec.ts](/C:/fit/tests/e2e/authenticated-app.spec.ts).
- Для workout focus-mode regression базовым контрактом считается `data-testid="workout-regular-mode-button"` из [workout-focus-header.tsx](/C:/fit/src/components/workout-session/workout-focus-header.tsx); test не должен зависеть от текстового label кнопки.
- При следующих визуальных правках в активном `Light Compact`-слое minimum regression package:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:smoke`
  - `node scripts/run-playwright.mjs -- test tests/e2e/authenticated-app.spec.ts --workers=1`
  - `node scripts/run-playwright.mjs -- test tests/e2e/admin-app.spec.ts --workers=1`
  - `node scripts/run-playwright.mjs -- test tests/e2e/mobile-pwa-regressions.spec.ts --workers=1`

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

## 2026-04-15 Dark Utility AI и admin contract

- `/ai` теперь считается закрытым compact coaching workspace: transcript, composer, prompt library, history и proposal-actions живут в одном плотном мобильном сценарии без декоративных secondary-panels.
- История AI-чата обязана оставаться отзывчивой на телефоне даже при нестабильном runtime: `delete` и `clear all` проектируются как optimistic flows, а не как долгие блокирующие спиннеры. Базовый regression-контракт закреплён в `tests/e2e/ai-workspace.spec.ts`.
- `/admin`, `/admin/users`, `/admin/users/[id]` считаются частью того же dark utility языка, но с operator-first плотностью: тёмные рабочие surfaces, короткие статусы, ясные action-points, без consumer-style hero-блоков.
- Для admin detail обязательны server-first fallback states: если Supabase/Auth деградирует, экран должен показать пригодный degraded snapshot, а не бесконечный loading-state. Этот контракт держат [admin-user-detail-state.ts](/C:/fit/src/components/admin-user-detail-state.ts), [admin/users/[id]/page.tsx](/C:/fit/src/app/admin/users/[id]/page.tsx) и [admin user detail route](/C:/fit/src/app/api/admin/users/[id]/route.ts).
- Полный admin e2e-пакет пока нельзя считать окончательным visual gate из-за внешнего `Supabase/Auth` runtime; при точечных UI-правках опираемся на таргетированные admin-сценарии и отдельно фиксируем внешний blocker, если снова появляются `ECONNRESET`, `ConnectTimeout` или `502`.

## 2026-04-15 Light compact workouts/day + AI/history/settings contract

- /workouts/day/[dayId] и focus-mode теперь считаются частью активного light compact mobile контракта: плотный header, более короткие metrics, компактные exercise cards и уменьшенные input/action sizes важнее визуальной декоративности.
- /ai должен читаться как рабочий coaching console, а не как промо-сцена: краткий верхний summary, компактные flow cards, плотные section-controls и минимум вторичных больших блоков.
- /history и /settings теперь проектируются как короткие utility-first экраны. Метрики, списки, billing/data actions и timeline-события должны занимать меньше вертикального пространства и быстрее сканироваться на 390px.

## 2026-04-15 Light compact admin contract

- `/admin`, `/admin/users` и `/admin/users/[id]` теперь считаются частью активного light compact mobile контракта: светлые operator surfaces, компактные KPI и короткие status banners важнее прежних крупных dark-hero блоков.
- Admin health, operations inbox, bulk actions, AI eval и карточка пользователя должны использовать светлую палитру с тёмным текстом и умеренными отступами. Возврат к `text-*-100`, тёмным панелям и раздутым warning-карточкам считается регрессией.
- Минимальный verification package для admin UI:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:smoke`
  - auth-based `admin-app` и `mobile-pwa-regressions` запускаются только если bootstrap `/dashboard` проходит. Если [global-auth-setup.ts](/C:/fit/tests/e2e/global-auth-setup.ts) снова падает на `page.goto("/dashboard")`, это фиксируется как внешний runtime blocker, а не как визуальный провал tranche.

## 2026-04-15 Light compact mobile regression baseline

- Активный mobile regression contract для light compact UI теперь закрыт и фиксирован на трёх viewport: `360x780`, `390x844`, `430x932`.
- Базовый multi-viewport suite: [mobile-pwa-regressions.spec.ts](/C:/fit/tests/e2e/mobile-pwa-regressions.spec.ts). Он покрывает user shell, admin shell, section switching, drawer, отсутствие horizontal overflow и workout focus-mode.
- Auth bootstrap для этих проверок теперь подготавливает storage state и onboarding данные заранее через [global-auth-setup.ts](/C:/fit/tests/e2e/global-auth-setup.ts) и [supabase-admin.ts](/C:/fit/tests/e2e/helpers/supabase-admin.ts), поэтому regression больше не зависит от старого SSR-перехода в `/dashboard`.
- Для platform admin assistant FAB на мобильном shell считается запрещённым overlay-сценарием; контракт закреплён в [app-shell-frame.tsx](/C:/fit/src/components/app-shell-frame.tsx) и проверяется в admin mobile regression.

## 2026-04-16 Mobile style refinement follow-up

- После закрытия базового `UI consistency` tranche активным visual follow-up считается [MOBILE_STYLE_REFINEMENT_EXECUTION.md](/C:/fit/docs/MOBILE_STYLE_REFINEMENT_EXECUTION.md).
- Цель этого слоя: сделать интерфейс не просто "без багов", а реально компактным и предсказуемым на телефоне. Приоритеты: меньшая высота shell, более короткие CTA, более плотные карточки и меньше второстепенных вводных блоков.
- В этой волне пересобраны: [page.tsx](/C:/fit/src/app/page.tsx), [auth-form.tsx](/C:/fit/src/components/auth-form.tsx), [app-shell-frame.tsx](/C:/fit/src/components/app-shell-frame.tsx), [page-workspace.tsx](/C:/fit/src/components/page-workspace.tsx), [nutrition-goal-adherence.tsx](/C:/fit/src/components/nutrition-goal-adherence.tsx), [nutrition-tracker.tsx](/C:/fit/src/components/nutrition-tracker.tsx), [nutrition/page.tsx](/C:/fit/src/app/nutrition/page.tsx), [dashboard-workspace.tsx](/C:/fit/src/components/dashboard-workspace.tsx), [globals.css](/C:/fit/src/app/globals.css).
- Новые базовые visual-артефакты production-build: `output/mobile-login-refined.png`, `output/mobile-dashboard-refined.png`, `output/mobile-nutrition-refined.png`, `output/mobile-ai-refined.png`, `output/mobile-settings-refined.png`.
- Минимальный regression package этого tranche: `npm run lint`, `npm run typecheck`, `npm run build`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3152 -- test tests/e2e/mobile-pwa-regressions.spec.ts --workers=1`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3152 -- test tests/e2e/authenticated-app.spec.ts -g "user can open main product sections after sign-in" --workers=1`, `npm run test:smoke`.

## 2026-04-28 Fitora mobile redesign verification

- Активный Fitora-подплан закрыт: [FITORA_REDESIGN_EXECUTION.md](/C:/fit/docs/FITORA_REDESIGN_EXECUTION.md) -> `12 / 12 (100%)`.
- Визуальный source of truth для следующего UI-цикла: [fitora-mobile-screens-contact-sheet.png](/C:/fit/output/fitora-mobile-screens-contact-sheet.png), отдельные `390x844` скриншоты лежат в [fitora-mobile-screens](/C:/fit/output/fitora-mobile-screens).
- Обязательный regression package после правок Fitora UI: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke`, затем `node scripts/run-playwright.mjs PLAYWRIGHT_SKIP_AUTH_SETUP=1 -- test tests/e2e/authenticated-app.spec.ts tests/e2e/nutrition-capture.spec.ts tests/e2e/ai-workspace.spec.ts tests/e2e/workout-focus-flow.spec.ts tests/e2e/settings-billing.spec.ts tests/e2e/admin-app.spec.ts tests/e2e/mobile-pwa-regressions.spec.ts --workers=1 --reporter=list`.
- `/history` теперь обязан деградировать в fallback-архив, а не в global error, если Supabase/Auth временно отдаёт `PGRST301`, `ECONNRESET` или timeout. `/suspended` имеет только Playwright-only visual hook `?__test_suspended=1`; production-пользователь по-прежнему видит этот экран только при реальном `adminState.is_suspended`.

## 2026-04-28 Fitora UX compression

- Активный подплан закрыт: [FITORA_UX_COMPRESSION_EXECUTION.md](/C:/fit/docs/FITORA_UX_COMPRESSION_EXECUTION.md) -> `8 / 8 (100%)`.
- Новый стандарт для длинных utility/admin-экранов: вторичные сценарии группируются через [compact-disclosure.tsx](/C:/fit/src/components/compact-disclosure.tsx), а не через бесконечную ленту одинаковых карточек.
- `/settings` обязан сохранять быстрый первый viewport: личная сводка, `fitora access`, затем раскрываемые `profile / billing / data / session`. Query `?section=billing` должен открывать billing сразу.
- `/admin`, `/admin/users`, `/admin/users/[id]` должны оставаться operator-first: основные действия и статус сверху, bulk/cohorts/audit/deep metrics в disclosure-группах.
- Свежий visual proof: [fitora-ux-compression-contact-sheet.png](/C:/fit/output/fitora-ux-compression-contact-sheet.png), отдельные PNG в [fitora-ux-compression-screens](/C:/fit/output/fitora-ux-compression-screens).

## 2026-04-28 Compact reference alignment

- Активный повторный подплан закрыт: [FITORA_COMPACT_REFERENCE_EXECUTION.md](/C:/fit/docs/FITORA_COMPACT_REFERENCE_EXECUTION.md) -> `10 / 10 (100%)`.
- Визуальный источник для бренда теперь `C:\Users\User\Desktop\Фит\Стиль.png`: точные PNG-ассеты лежат в `public/fitora-logo-clean.png`, `public/fitora-mark-clean.png`, `public/fitora-brand-clean.png`, `public/fitora-app-icon-clean.png`, `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`.
- Login, metadata, manifest, header, bottom nav, drawer, AI FAB, `PageWorkspace`, dashboard и AI workspace уплотнены под mobile-first стиль `fitora`: меньше hero-тяжести, меньше вертикальных отступов, больше первого полезного действия в первом viewport.
- Свежая визуальная проверка: [fitora-compact-viewport-contact-sheet.png](/C:/fit/output/fitora-compact-viewport-contact-sheet.png), [fitora-compact-full-contact-sheet.png](/C:/fit/output/fitora-compact-full-contact-sheet.png), отдельные PNG в [fitora-compact-screens](/C:/fit/output/fitora-compact-screens).
- Проверки: `npm run lint`, `npm run typecheck`, `npm run build`, smoke `5 passed`, `mobile-pwa-regressions` `9 passed`, `authenticated-app + ai-workspace + nutrition-capture` `7 passed`, `workout-focus-flow + settings-billing + admin-app` `10 passed / 1 skipped`.
- Следующий UX-срез для `/settings` и admin full-page должен быть collapsible/accordion-группировкой сценариев, а не очередным уменьшением цветов/радиусов: эти экраны длинные из-за количества рабочих controls, но их первый viewport и shell уже приведены к единому compact-reference стилю.

## 2026-04-29 Trial access UI contract

- `/admin/users/[id]` должен показывать billing-доступ в единой секции `AdminUserBillingSection`: отдельная карточка "Доступ пользователя", текущая подписка, платёжный профиль, лимиты и история подписки.
- Admin action panel по умолчанию предлагает "Выдать / продлить тестовый доступ", provider `admin_trial`, поле "Дней добавить" ограничено `1..365`.
- Bulk action для тестового доступа нормализует количество дней и не должен позволять нулевые/отрицательные периоды.
- `/settings?section=billing` показывает trial как тестовый доступ с понятным остатком дней, датой окончания и provider label, а не как сырой billing status.
- E2E для неидемпотентного admin billing POST не должен делать автоматические повторы одного и того же POST; используем один запрос с длинным timeout.
