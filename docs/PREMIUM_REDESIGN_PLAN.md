# План premium-редизайна `fit`

## Как вести этот файл

- `[x]` — tranche закрыт и подтверждён кодом или проверками.
- `[ ]` — tranche ещё открыт.
- После каждого заметного slice нужно:
  - перевести соответствующий чекбокс в `[x]`;
  - обновить краткий статус ниже;
  - синхронизировать [MASTER_PLAN.md](/C:/fit/docs/MASTER_PLAN.md) и [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).

Текущий прогресс feature-plan: `6 / 6` (`100%`).

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
- [x] Пересобрать `Workouts` и `Nutrition` под mobile/PWA-first подачу.
- [x] Довести `Admin` и remaining detail surfaces до того же визуального языка.
- [x] Закрыть visual regression, mobile acceptance и финальный handoff по редизайну.

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

## Что дополнительно закрыто

### 4. Workouts и Nutrition

- `Workouts` переведён на более собранный premium fitness-язык:
  - новый focus-header;
  - мягкие, но читаемые step chips;
  - более сильная active-card подача упражнения;
  - единый action-button contract для edit/save/reset CTA.
- `Nutrition` переведён на mobile/PWA-first подачу:
  - premium hero и summary;
  - более чистые section chips;
  - единые soft/premium surfaces для photo capture, barcode lookup и Open Food Facts import;
  - карточки продуктов и import-preview больше не выглядят как отдельный визуальный стек.

### 5. Admin и detail surfaces

- `Admin` переведён в тот же визуальный язык без потери операторской плотности:
  - hero/state surface каталога пользователей;
  - summary/detail cards в карточке пользователя;
  - health dashboard и operations inbox на общих `surface-panel` и `action-button` primitives.
- Remaining detail surfaces выровнены по shared premium contract и чистому русскому copy.

### 6. Финальный visual/mobile handoff

- Playwright regression harness стабилизирован против stale server reuse и битых chunk/css ссылок.
- Финальный verification bundle зелёный:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:smoke` -> `5 passed`
  - `npm run test:e2e:auth` -> `52 passed`
  - целевые suites `admin-app`, `mobile-pwa-regressions`, `ui-regressions` подтверждены отдельно

## Текущий статус

- Premium redesign execution-doc полностью закрыт.
- `Dashboard`, `AI`, `Workouts`, `Nutrition` и `Admin` приведены к одному visual language.
- Mobile/PWA acceptance и regression handoff подтверждены кодом и проверками.
