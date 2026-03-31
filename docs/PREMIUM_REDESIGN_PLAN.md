# План premium-редизайна `fit`

## Как вести этот файл

- `[x]` — tranche закрыт и подтверждён кодом или проверками.
- `[ ]` — tranche ещё открыт.
- После каждого заметного slice нужно:
  - перевести соответствующий чекбокс в `[x]`;
  - обновить краткий статус ниже;
  - синхронизировать [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).

Текущий прогресс feature-plan: `3 / 6` (`50%`).

## Цель

Перевести `fit` в более профессиональный, цельный и mobile-first визуальный язык:

- светлый premium fitness-стиль вместо нейтрального “базового” UI;
- более сильная типографика и иерархия экранов;
- удобные mobile/PWA-поверхности без тяжёлого визуального шума;
- единый shell/workspace-паттерн для `Dashboard`, `Workouts`, `Nutrition`, `AI`, `Admin`.

## Execution checklist

- [x] Завести отдельный execution-doc для редизайна и привязать его к `MASTER_PLAN`.
- [x] Обновить визуальные токены, типографику и общие shell/workspace primitives.
- [x] Пересобрать `Dashboard` и `AI` в новом premium fitness-направлении.
- [ ] Пересобрать `Workouts` и `Nutrition` под mobile/PWA-first подачу.
- [ ] Довести `Admin` и remaining detail surfaces до того же визуального языка.
- [ ] Закрыть visual regression, mobile acceptance и финальный handoff по редизайну.

## Что уже закрыто

### 1. Визуальный фундамент

- Добавлен display-шрифт `Sora` для hero и section-заголовков.
- Обновлены ключевые дизайн-токены:
  - фон;
  - surface layers;
  - accent / energy palette;
  - border / shadow contract.
- Обновлены shared CSS-примитивы для:
  - shell;
  - drawer;
  - bottom nav;
  - section chips;
  - toggle chips;
  - hero / metric cards.

### 2. Общие поверхности

- `AppShellFrame` получил более цельный premium header для desktop и mobile.
- `AppShellNav` переведён на единый section-chip стиль.
- `PageWorkspace` и `DashboardWorkspace` переведены на новый hero/menu/metric visual contract.

### 3. Первые consumer screens

- `Dashboard` получил более сильный hero-блок, AI-сводку и слой «что важно сейчас» без визуального шума.
- `AI workspace` переведён в полноценный premium chat-workspace:
  - hero с быстрыми статусами;
  - mobile-trigger для разделов;
  - более цельный transcript / composer / history / context слой;
  - чистые, короткие русские тексты без служебного шума.
- Browser regression подтверждён на `AI workspace`, `mobile PWA regressions` и `smoke`.

## Следующий tranche

- Тем же языком довести `Workouts` и `Nutrition`, не ломая уже существующую логику focus-mode, barcode и meal-photo flows.
- После этого добрать `Admin` и финальный visual/mobile handoff.

## Текущий статус

- Execution-doc создан.
- Визуальный фундамент и общие shell/workspace primitives уже закрыты.
- `Dashboard` и `AI` переведены на новый premium fitness visual language.
- Следующий приоритет — `Workouts` и `Nutrition`.
