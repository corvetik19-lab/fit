# План premium-редизайна `fit`

## Как вести этот файл

- `[x]` — tranche закрыт и подтверждён кодом или проверками.
- `[ ]` — tranche ещё открыт.
- После каждого заметного slice нужно:
  - перевести соответствующий чекбокс в `[x]`;
  - обновить краткий статус ниже;
  - синхронизировать [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).

Текущий прогресс feature-plan: `2 / 6` (`33%`).

## Цель

Перевести `fit` в более профессиональный, цельный и mobile-first визуальный язык:

- светлый premium fitness-стиль вместо нейтрального “базового” UI;
- более сильная типографика и иерархия экранов;
- удобные mobile/PWA-поверхности без тяжёлого визуального шума;
- единый shell/workspace-паттерн для `Dashboard`, `Workouts`, `Nutrition`, `AI`, `Admin`.

## Execution checklist

- [x] Завести отдельный execution-doc для редизайна и привязать его к `MASTER_PLAN`.
- [x] Обновить визуальные токены, типографику и общие shell/workspace primitives.
- [ ] Пересобрать `Dashboard` и `AI` в новом premium fitness-направлении.
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

## Следующий tranche

- Взять `Dashboard` и `AI` как первые показательные consumer screens.
- Затем тем же языком довести `Workouts` и `Nutrition`, не ломая уже существующую логику focus-mode, barcode и meal-photo flows.

## Текущий статус

- Execution-doc создан.
- Первый tranche по визуальному фундаменту и общим shell/workspace примитивам закрыт.
- Следующий приоритет — consumer screens, начиная с `Dashboard` и `AI`.
