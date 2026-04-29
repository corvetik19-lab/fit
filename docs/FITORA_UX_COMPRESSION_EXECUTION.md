# Fitora UX compression execution

Дата старта: 2026-04-28

Цель: довести уже внедренный стиль `fitora` до коммерчески удобного мобильного UX: меньше длинных полотен, больше управляемых раскрываемых секций, компактные действия, понятная админка и настройки без потери рабочих функций.

Текущий прогресс подплана: `8 / 8` (`100%`).

## Чеклист

- [x] Зафиксировать активный UX compression-план отдельно от закрытого `FITORA_COMPACT_REFERENCE_EXECUTION.md`.
- [x] Добавить общий компактный disclosure-паттерн для длинных мобильных секций.
- [x] Уплотнить `/settings`: быстрый верх, профиль, оплата, данные и сессия через короткие управляемые секции.
- [x] Уплотнить `/admin`: оставить быстрый operator summary сверху, а операции, AI, здоровье и аудит вынести в раскрываемые группы.
- [x] Уплотнить `/admin/users`: фильтры, bulk actions, cohorts, priority lists и карточки пользователей привести к компактному mobile-first ритму.
- [x] Уплотнить `/admin/users/[id]`: карточка пользователя должна быстро открывать нужный раздел и не превращаться в длинную простыню.
- [x] Обновить developer-документацию: `FRONTEND.md`, `MASTER_PLAN.md`, `AI_WORKLOG.md`.
- [x] Подтвердить результат проверками и мобильными скриншотами против Fitora reference.

## UX-решения

- Используем disclosure/accordion как основной паттерн для вторичных сценариев, а не еще одно уменьшение шрифтов.
- Первый viewport должен показывать статус, 1-2 главных действия и короткую сводку.
- Все раскрываемые секции остаются доступными с клавиатуры через `button` + `aria-expanded`.
- Админские экраны остаются operator-first: данные не прячутся навсегда, но не занимают весь экран сразу.
- AI floating widget не должен перекрывать нижнюю навигацию и основные CTA.

## Реализовано

- Добавлен общий компонент [compact-disclosure.tsx](/C:/fit/src/components/compact-disclosure.tsx) и CSS-контракт `.compact-disclosure`.
- `/settings` теперь показывает короткий верхний профиль и раскрываемые блоки `profile / billing / data / session`; `/settings?section=billing` раскрывает billing сразу для существующего сценария.
- `/admin` сжат до operator summary сверху и двух крупных раскрываемых групп: рабочий центр и AI/audit/team.
- `/admin/users` сохраняет поиск и фильтры на виду, но массовые действия, cohorts, priority lists и детализация пользователя больше не растягивают первый viewport.
- `/admin/users/[id]` получил компактную двухколоночную мобильную сводку и горизонтальный переключатель разделов карточки.

## Verification

- `npm run lint` -> passed, остались 2 старых warning в `src/lib/ai/plan-generation.ts`.
- `npm run typecheck` -> passed.
- `npm run build` -> passed, остались известные Sentry/OpenTelemetry critical dependency warnings.
- `npm run test:smoke` -> `5 passed`.
- `node scripts/run-playwright.mjs PLAYWRIGHT_SKIP_AUTH_SETUP=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3170 -- test tests/e2e/settings-billing.spec.ts tests/e2e/admin-app.spec.ts tests/e2e/mobile-pwa-regressions.spec.ts --workers=1 --reporter=list` -> `17 passed / 1 skipped`.
- Мобильные скриншоты `390x844`: [fitora-ux-compression-contact-sheet.png](/C:/fit/output/fitora-ux-compression-contact-sheet.png), отдельные PNG в [fitora-ux-compression-screens](/C:/fit/output/fitora-ux-compression-screens).
