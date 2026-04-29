# Mobile UI Polish Execution

Текущий прогресс подплана: `4 / 5` (`80%`).

## Цель

Дожать мобильную консистентность ключевых экранов `fit` после большого light-compact redesign:

- убрать переполнение текста и некорректные sticky-блоки;
- выровнять section chips и общий ритм экранов;
- упростить `/ai`, оставив только полезные поверхности;
- поправить контраст, overflow и расстояния под fixed header;
- подтвердить изменения целевой мобильной проверкой.

## Чеклист

- [x] Исправить переполнение в `/onboarding`: readiness-block, sticky action bar и CTA `Сохранить и продолжить`.
- [x] Довести shared mobile shell: отступ контента от верхнего header, секционные меню, global AI widget и light compact tokens.
- [x] Починить контраст и overflow на `/dashboard`, `/history`, `/suspended`, `/admin/users` и связанных shared surfaces.
- [x] Упростить `/ai`: убрать лишние explanatory-блоки, нормализовать toolbar и сохранить рабочий chat/history/plans flow.
- [ ] Закрыть полный mobile regression contour без нестабильного navigation-flake на user suite `430x932`.

## Изменённые поверхности

- `/onboarding`
- `/dashboard`
- `/workouts`
- `/nutrition`
- `/ai`
- `/history`
- `/suspended`
- `/admin/users`
- shared shell / section controls / AI widget

## Проверка

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:smoke`
- `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3164 -- test tests/e2e/authenticated-app.spec.ts -g "user can open main product sections after sign-in" --workers=1 --reporter=line` -> `1 passed`
- `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3164 -- test tests/e2e/ai-workspace.spec.ts --workers=1 --reporter=line` -> `2 passed`
- `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3164 -- test tests/e2e/mobile-pwa-regressions.spec.ts --workers=1 --reporter=line` -> `8 passed / 1 failed`

## Открытый хвост

Остался один честный regression-хвост: `mobile-pwa-regressions` на viewport `430x932` один раз ловит `Page closed while navigating to /nutrition`. По текущему логу это похоже на runtime/navigation flake, а не на layout regression, поэтому подплан пока не закрыт до `100%`.
