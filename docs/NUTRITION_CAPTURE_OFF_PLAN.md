# План внедрения камеры еды и Open Food Facts в `fit`

## Как вести этот файл

- `[x]` — tranche закрыт и подтверждён кодом или проверками.
- `[ ]` — tranche ещё открыт.
- После каждого существенного slice нужно:
  - перевести соответствующий чекбокс в `[x]`;
  - обновить краткий статус ниже;
  - синхронизировать `docs/MASTER_PLAN.md` и `docs/AI_WORKLOG.md`.

Текущий прогресс feature-plan: `7 / 7` (`100%`).

## Цель

Сделать питание заметно удобнее на мобильной PWA:

- пользователь может **сфотографировать еду прямо из приложения**;
- пользователь может **сканировать штрихкод** и получать продукт из **Open Food Facts**;
- приложение показывает **название, КБЖУ, состав и изображение** продукта;
- найденный продукт можно **сохранить в свою базу** и **сразу добавить в текущий приём пищи**.

## Execution checklist

### Data / schema

- [x] Расширить `foods` schema полями для внешнего источника, изображения и состава продукта.
- [x] Обновить nutrition type/contracts и server helpers под новый food metadata contract.

### Server / integrations

- [x] Добавить server-side integration с Open Food Facts: lookup по barcode и нормализация ответа.
- [x] Добавить import flow в локальную базу пользователя с защитой от дублей по barcode.

### UX / mobile PWA

- [x] Добавить в nutrition flow in-app photo capture для анализа еды через камеру телефона.
- [x] Добавить barcode scanner UX с mobile-first fallback: live scan, камера упаковки и ручной ввод.

### Verification / handoff

- [x] Добавить regression coverage, обновить документацию и зафиксировать handoff для разработчиков.

## Что внедрено

### База и контракты

- Миграция [20260331103000_foods_open_food_facts_metadata.sql](/C:/fit/supabase/migrations/20260331103000_foods_open_food_facts_metadata.sql) добавляет в `public.foods`:
  - `brand`
  - `image_url`
  - `ingredients_text`
  - `quantity`
  - `serving_size`
- Для быстрого поиска по локальной базе добавлен partial index по `user_id + barcode`.
- Контракты обновлены в:
  - [nutrition-self-service.ts](/C:/fit/src/lib/nutrition/nutrition-self-service.ts)
  - [meal-logging.ts](/C:/fit/src/lib/nutrition/meal-logging.ts)

### Интеграция Open Food Facts

- Новый integration helper: [open-food-facts.ts](/C:/fit/src/lib/nutrition/open-food-facts.ts)
- Новый lookup route: [foods/open-food-facts/[barcode]/route.ts](/C:/fit/src/app/api/foods/open-food-facts/%5Bbarcode%5D/route.ts)
- Новый import route: [foods/open-food-facts/import/route.ts](/C:/fit/src/app/api/foods/open-food-facts/import/route.ts)
- В app flow используются:
  - локальная проверка существующего продукта по `user_id + barcode`
  - повторный import/update для `source = open_food_facts`
  - явные transport errors `FOOD_LOOKUP_INVALID`, `FOOD_LOOKUP_NOT_FOUND`, `FOOD_IMPORT_INVALID`, `FOOD_IMPORT_NOT_FOUND`

### UI и мобильный сценарий

- Компонент сканера: [nutrition-barcode-scanner.tsx](/C:/fit/src/components/nutrition-barcode-scanner.tsx)
  - live scan через `BarcodeDetector`, если он доступен
  - fallback через фото упаковки и ручной ввод
- Карточка preview/import: [nutrition-open-food-facts-card.tsx](/C:/fit/src/components/nutrition-open-food-facts-card.tsx)
  - preview изображения
  - КБЖУ
  - состав
  - Open Food Facts ссылка
  - импорт в свою базу
  - добавление в текущий приём пищи
- Камера для фото еды: [nutrition-photo-analysis.tsx](/C:/fit/src/components/nutrition-photo-analysis.tsx)
  - `Снять фото`
  - `Из галереи`
- Основной nutrition flow обновлён в:
  - [nutrition-tracker.tsx](/C:/fit/src/components/nutrition-tracker.tsx)
  - [nutrition/page.tsx](/C:/fit/src/app/nutrition/page.tsx)
- Добавлен deep-link на нужный раздел питания:
  - `/nutrition?section=log&panel=foods`
  - `/nutrition?section=log&panel=log`

## Проверка

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run verify:migrations`
- `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test tests/e2e/nutrition-capture.spec.ts --workers=1`
- `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test tests/e2e/api-contracts.spec.ts --workers=1`

Итог:

- nutrition capture flow: `2 passed`
- api contracts: `13 passed`

## Handoff для разработчиков

- Если нужно менять OFF mapping, начинаем с [open-food-facts.ts](/C:/fit/src/lib/nutrition/open-food-facts.ts).
- Если нужно менять визуальный flow, точка входа — [nutrition-open-food-facts-card.tsx](/C:/fit/src/components/nutrition-open-food-facts-card.tsx).
- Если нужно менять import/update поведение локальной базы, точка входа — [nutrition-self-service.ts](/C:/fit/src/lib/nutrition/nutrition-self-service.ts).
- Если меняется schema `foods`, после DDL обязательно прогонять:
  - `npm run verify:migrations`
  - `npm run test:e2e:auth`
  - `npm run test:rls`

## Текущий статус

- Feature полностью закрыт.
- Следующий соседний tranche по nutrition UX можно брать уже отдельно от этого плана.
