# Frontend `fit`

## Стек

- Next.js 16 + App Router
- React 19
- TypeScript strict
- Tailwind CSS v4
- PWA shell + service worker
- AI UI на `@ai-sdk/react`

## Текущая визуальная стратегия

С апреля 2026 фронтенд переводится в направление **stitch-style editorial fitness / mobile-first**. Это следующий слой поверх уже закрытого premium redesign и он меняет не только токены, но и композицию ключевых экранов.

Базовые правила:

- основная тема — светлая, на базе `#fcf9f8`;
- display-типографика — `Lexend`, body/UI — `Manrope`;
- главный акцент — electric blue `#0040e0 / #2e5bff`;
- иерархия строится через tonal layers, а не через тяжёлые бордеры;
- на mobile/PWA главный приоритет — один доминирующий блок, ясный hero и отсутствие горизонтального overflow;
- shell должен ощущаться как лёгкая editorial-навигация с чистым top bar и bottom nav.

Актуальные execution-doc по этому направлению:

- [PREMIUM_REDESIGN_PLAN.md](/C:/fit/docs/PREMIUM_REDESIGN_PLAN.md)
- [STITCH_REDESIGN_EXECUTION.md](/C:/fit/docs/STITCH_REDESIGN_EXECUTION.md)

Уже закрытые tranche в новом языке:

- `Dashboard` — stitch-style hero, stat plates, AI quote и section rail;
- `Workout day` — focus-first экран с progress bars, крупной timer-plate и новым set-grid;
- `Shell` — editorial header, light drawer, mobile bottom nav и очищенный utility layer.

## Базовая архитектура

Frontend делится на три уровня:

1. `src/app/**` — server pages и route-level orchestration
2. `src/components/**` — UI-компоненты, shell, формы, workspace и screen surfaces
3. `src/lib/**` — helpers, derive-слой, форматтеры, runtime plumbing и доменные правила

Текущее правило production hardening:

- страницы должны быть тонкими orchestrator-компонентами;
- async/data orchestration не должна жить прямо в JSX;
- hydration-sensitive и sync-sensitive logic нужно выносить в hooks и helper-модули;
- пользовательский UI не должен показывать служебные или битые технические тексты.

## Shell и навигация

Ключевые файлы:

- `src/components/app-shell.tsx`
- `src/components/app-shell-frame.tsx`
- `src/components/app-shell-nav.tsx`

Текущий контракт shell:

- на desktop используется стабильный top nav без обрезанных пунктов;
- на mobile/PWA используется burger drawer без hydration mismatch и portal-глюков;
- AI widget остаётся вторичным действием и не мешает основному контенту;
- shell не должен ломать workout focus-mode и fullscreen AI workspace;
- общие visual primitives shell управляются через `src/app/globals.css`.

## Workspace-паттерн

Общий workspace-паттерн применяется к:

- `Dashboard`
- `Workouts`
- `Nutrition`
- `AI`
- `Admin`

Ожидаемое поведение:

- пользователь открывает только нужный раздел, а не длинную ленту одинаковых блоков;
- на mobile одновременно открыт один основной логический блок;
- обзор, меню и активный раздел можно скрывать независимо;
- section switchers и mobile triggers должны быть одинаково читаемы на desktop и mobile.

Ключевой shared-файл:

- `src/components/page-workspace.tsx`

## Тренировки

Ключевые файлы:

- `src/app/workouts/page.tsx`
- `src/app/workouts/day/[dayId]/page.tsx`
- `src/components/workout-day-session.tsx`
- `src/components/workout-session/**`

Продуктовый контракт:

- шаги тренировки видны заранее;
- будущие упражнения закрыты до сохранения текущего;
- сохранение упражнения требует полностью заполненных `повторов`, `веса`, `RPE`;
- после сохранения шаг становится read-only до явного `Редактировать`;
- есть mobile focus-mode;
- таймер умеет старт, паузу, завершение и сохранение времени;
- `Обнулить тренировку` сбрасывает и UI, и server-side execution state.

## Питание

Ключевые файлы:

- `src/app/nutrition/page.tsx`
- `src/components/nutrition-tracker.tsx`
- `src/components/nutrition-photo-analysis.tsx`
- `src/components/nutrition-open-food-facts-card.tsx`
- `src/components/nutrition-barcode-scanner.tsx`
- `src/lib/nutrition/**`

Продуктовый контракт:

- есть секционный интерфейс вместо одной длинной страницы;
- есть in-app photo capture;
- есть barcode scan и lookup/import через Open Food Facts;
- найденный продукт можно сохранить в базу или сразу добавить в текущий приём пищи;
- карточки продуктов не должны ломаться на узких экранах и не должны иметь случайных переносов бейджей.

Подробный execution-doc по camera/barcode flow:

- [NUTRITION_CAPTURE_OFF_PLAN.md](/C:/fit/docs/NUTRITION_CAPTURE_OFF_PLAN.md)

## AI и Admin

`AI` и `Admin` используют тот же визуальный язык, но с разной плотностью:

- `AI` — consumer-first fullscreen workspace;
- `Admin` — плотнее и операторнее, но без сырых технических fallback-текстов;
- degraded states должны быть явно показаны в UI, а не прятаться за пустыми блоками.

## Regression expectations

После заметных frontend-tranche обязательно проверять:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:smoke`

Для mobile/shell изменений дополнительно:

- `tests/e2e/mobile-pwa-regressions.spec.ts`

Для nutrition UI и barcode/photo flow дополнительно:

- `tests/e2e/nutrition-capture.spec.ts`

Если меняется workspace/navigation UX, нужно синхронизировать:

- [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md)
- [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md)
- [PREMIUM_REDESIGN_PLAN.md](/C:/fit/docs/PREMIUM_REDESIGN_PLAN.md)

## Premium redesign status

- Premium redesign закрыт для `Dashboard`, `AI`, `Workouts`, `Nutrition` и `Admin`.
- Consumer surfaces используют единый visual contract через shared primitives:
  - `card card--hero`
  - `surface-panel`
  - `action-button`
- Workout focus-mode, nutrition capture/import и admin operator surfaces подтверждены как regression-critical части нового visual language.

## Playwright regression contract

- Для regression suites нельзя переиспользовать случайный старый dev/test server с устаревшими чанками.
- `playwright.config.ts` работает с `reuseExistingServer: false`, а `scripts/run-playwright.mjs` перед запуском чистит занятый Playwright-порт.
- Это часть frontend reliability contract: иначе возможны ложные падения с сырым HTML, `500 text/plain` на `_next/static/*` и отсутствующими mobile/admin селекторами при фактически исправном UI.

## Stitch redesign addendum

- В новом tracked-workstream [STITCH_REDESIGN_EXECUTION.md](/C:/fit/docs/STITCH_REDESIGN_EXECUTION.md) source of truth по visual refactor теперь ведётся отдельно от legacy premium-plan.
- На текущем этапе уже переведены на новый язык:
  - `Dashboard`
  - `Workout day` и mobile focus-mode
  - `Nutrition`
  - `AI`
  - remaining user screens: `/`, `/onboarding`, `/workouts`, `/history`, `/settings`, `/billing/cloudpayments`, `/suspended`
- Общий пользовательский workspace-контракт теперь держится на:
  - [page-workspace.tsx](/C:/fit/src/components/page-workspace.tsx)
  - `card card--hero`
  - `metric-tile`
  - `section-chip`
  - `toggle-chip`
- Для пользовательских экранов действуют три обязательных правила:
  - mobile-first и один доминирующий контентный блок на экране
  - чистый русский visible copy без mojibake
  - athletic editorial hierarchy вместо utility-style сетки одинаковых карточек
- Следующий frontend tranche по этому потоку — admin surfaces и финальная visual sanitation по всему приложению.


## Stitch admin addendum

- `Admin` больше не строится как generic workspace с одинаковыми utility-карточками. Операторский dashboard использует тот же stitch-язык, что и consumer surfaces: крупный hero, KPI-блоки, spotlight-карточки и отдельные health/AI/operator-панели.
- Для `/admin/users` и `/admin/users/[id]` закреплён тот же visual contract: stitch-style hero, секционный detail-shell, dark action-блоки и понятные operator states без сырого fallback copy.
- Для frontend-команды это означает новый baseline: visible copy на основных stitch-экранах должен оставаться чистым, а visual regression и mobile acceptance проверяются отдельным redesign execution-doc и связанными Playwright suites.
## Content imagery addendum

- РџРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРёРµ Р±РёР±Р»РёРѕС‚РµРєРё СѓРїСЂР°Р¶РЅРµРЅРёР№ Рё РїСЂРѕРґСѓРєС‚РѕРІ С‚РµРїРµСЂСЊ РїРѕРґРґРµСЂР¶РёРІР°СЋС‚ `image_url` РєР°Рє С‡Р°СЃС‚СЊ РѕСЃРЅРѕРІРЅРѕРіРѕ frontend-РєРѕРЅС‚СЂР°РєС‚Р°: С„РѕСЂРјС‹ РїСЂРёРЅРёРјР°СЋС‚ С‚РѕР»СЊРєРѕ Р°Р±СЃРѕР»СЋС‚РЅС‹Рµ `http/https` СЃСЃС‹Р»РєРё Рё СЃСЂР°Р·Сѓ РїРѕРєР°Р·С‹РІР°СЋС‚ preview РґРѕ СЃРѕС…СЂР°РЅРµРЅРёСЏ.
- Р”Р»СЏ СѓРїСЂР°Р¶РЅРµРЅРёР№ РёСЃС‚РѕС‡РЅРёРє РёСЃС‚РёРЅС‹ РїРѕ РєР°СЂС‚РёРЅРєРµ вЂ” `exercise_library.image_url`, РґР»СЏ РїСЂРѕРґСѓРєС‚РѕРІ вЂ” `foods.image_url`; UI РґРѕР»Р¶РµРЅ СЂР°Р±РѕС‚Р°С‚СЊ РѕРґРёРЅР°РєРѕРІРѕ РІ СЃС†РµРЅР°СЂРёСЏС… `СЃРІРѕСЏ РєР°СЂС‚РѕС‡РєР°`, `Open Food Facts import` Рё `СЂСѓС‡РЅРѕРµ СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ`.
- Р•СЃР»Рё `image_url` РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ РёР»Рё РЅРµРІР°Р»РёРґРµРЅ, РёРЅС‚РµСЂС„РµР№СЃ РѕР±СЏР·Р°РЅ РїРѕРєР°Р·С‹РІР°С‚СЊ Р°РєРєСѓСЂР°С‚РЅС‹Р№ fallback, Р° РЅРµ Р±РёС‚С‹Р№ `next/image`.
- Р’ operator-РєРѕРЅС‚СѓСЂРµ РїРѕСЏРІРёР»СЃСЏ РѕС‚РґРµР»СЊРЅС‹Р№ СЂР°Р·РґРµР» СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЏ РєРѕРЅС‚РµРЅС‚РЅС‹С… РёР·РѕР±СЂР°Р¶РµРЅРёР№ РІ `/admin/users/[id]`: super-admin РјРѕР¶РµС‚ РїСЂР°РІРёС‚СЊ РєР°СЂС‚РёРЅРєРё РїРѕСЃР»РµРґРЅРёС… СѓРїСЂР°Р¶РЅРµРЅРёР№ Рё РїСЂРѕРґСѓРєС‚РѕРІ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ, Р° РѕР±С‹С‡РЅС‹Р№ admin РІРёРґРёС‚ СЌС‚РѕС‚ СЂР°Р·РґРµР» С‚РѕР»СЊРєРѕ РІ read-only РІРёРґРµ.
- Р›СЋР±С‹Рµ Р±СѓРґСѓС‰РёРµ redesign-tranche РїРѕ `Workouts`, `Nutrition` Рё `Admin user detail` РґРѕР»Р¶РЅС‹ СЃРѕС…СЂР°РЅСЏС‚СЊ СЌС‚РѕС‚ РєРѕРЅС‚СЂР°РєС‚: РёР·РѕР±СЂР°Р¶РµРЅРёСЏ РєРѕРЅС‚РµРЅС‚Р° вЂ” С‡Р°СЃС‚СЊ UX, Р° РЅРµ С„Р°РєСѓР»СЊС‚Р°С‚РёРІРЅС‹Р№ РґРµРєРѕСЂ.
## 2026-04-14 camera/import runtime addendum

- После восстановления Supabase frontend runtime снова подтверждён на живом проекте `fit`: `npm run verify:supabase-runtime` зелёный, а auth-based e2e больше не блокируются старым DNS-ошибкой.
- Для nutrition camera surface закреплён новый UX-контракт: видимая кнопка-триггер загрузки, скрытый file input только как transport layer, стабильный `nutrition-photo-analyze`, превью локального фото и сохранение в базу/дневник через `/api/nutrition/photo-import`.
- Auth-based regression теперь обязан учитывать post-restore путь через онбординг: если тестовый пользователь попадает на `/onboarding`, helper завершает профиль и только потом продолжает проверки `Dashboard`, `AI` и `Nutrition`.
