# Dark Utility Redesign Execution

Текущий прогресс подплана: `4 / 10` (`40%`).

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
- [ ] Переведены `/workouts` и `/workouts/day/[dayId]` с focus-mode.
- [ ] Переведён `/nutrition` вместе с camera/barcode/Open Food Facts flow.
- [ ] Переведён `/ai` как компактный coaching workspace.
- [ ] Переведены `/history`, `/settings`, `/billing/cloudpayments`, `/suspended`.
- [ ] Переведены `/admin`, `/admin/users`, `/admin/users/[id]`.
- [ ] Закрыт финальный visual/mobile regression tranche и handoff для разработчиков.

## Что уже закрыто

### 2026-04-15 — foundation tranche

- Создан отдельный execution-doc [DARK_UTILITY_REDESIGN_EXECUTION.md](/C:/fit/docs/DARK_UTILITY_REDESIGN_EXECUTION.md).
- Обновлены [FRONTEND.md](/C:/fit/docs/FRONTEND.md), [docs/README.md](/C:/fit/docs/README.md), [design-handoff/README.md](/C:/fit/docs/design-handoff/README.md) и новый [DARK_UTILITY_MOBILE_BRIEF.md](/C:/fit/docs/design-handoff/DARK_UTILITY_MOBILE_BRIEF.md).
- Глобальная тема переведена на тёмный utility-контракт в [globals.css](/C:/fit/src/app/globals.css).
- Обновлены shell и navigation entrypoint: [app-shell-frame.tsx](/C:/fit/src/components/app-shell-frame.tsx), [app-shell-nav.tsx](/C:/fit/src/components/app-shell-nav.tsx).
- Входной экран переведён в компактный mobile-first стиль: [page.tsx](/C:/fit/src/app/page.tsx), [auth-form.tsx](/C:/fit/src/components/auth-form.tsx).
- PWA metadata синхронизированы под тёмный baseline: [layout.tsx](/C:/fit/src/app/layout.tsx), [manifest.ts](/C:/fit/src/app/manifest.ts).

### 2026-04-15 — dashboard и workspace tranche

- Общий workspace-паттерн переведён в компактный dark-utility язык в [page-workspace.tsx](/C:/fit/src/components/page-workspace.tsx): теперь экран делится на настройку видимости, компактный обзор и плотное меню разделов без oversized блоков.
- [dashboard-workspace.tsx](/C:/fit/src/components/dashboard-workspace.tsx) полностью переведён в новый ритм: короткий hero, один next-action, компактные summary-карточки, чистый section switcher и AI-блок без визуального шума.
- Для пользовательских экранов, которые уже используют общий workspace, санирован visible copy и подтянут новый тон: [workouts/page.tsx](/C:/fit/src/app/workouts/page.tsx) и [nutrition/page.tsx](/C:/fit/src/app/nutrition/page.tsx).

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
