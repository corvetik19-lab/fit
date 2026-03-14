# Master plan проекта `fit`

## Как использовать этот план

- `[x]` — уже сделано и подтверждено в коде или инфраструктуре.
- `[ ]` — ещё не сделано или не доведено до production-ready состояния.
- После каждого существенного изменения нужно:
  - обновить этот файл;
  - добавить короткую запись в `docs/AI_WORKLOG.md`;
  - синхронизировать профильные документы в `docs/`, если изменился контракт или архитектура.

Этот файл — текущий production-hardening backlog проекта. Он заменяет старый bootstrap-план и отражает реальное состояние репозитория на 2026-03-13.

## Текущая фактическая база

- [x] Web-first PWA уже существует и работает на Next.js 16 + React 19 + TypeScript strict.
- [x] Основные продуктовые поверхности уже есть: `Dashboard`, `Workouts`, `Nutrition`, `AI`, `Admin`, `Settings`, `History`.
- [x] Есть Supabase schema, migrations, RLS, admin-модель, cron routes и offline workout sync.
- [x] Есть AI runtime слой, retrieval, structured knowledge, proposals и eval workspace.
- [x] `npm run build` проходит.
- [x] `npm run typecheck` проходит как стабильный gate через `next typegen + tsc`.
- [x] `npm run lint` приведён к воспроизводимому CI-формату и линкует только поддерживаемые исходники.
- [ ] В репозитории почти нет реального автотестового покрытия.
- [ ] Ключевая документация и часть UI/docs-поверхности содержат mojibake и требуют санации.
- [ ] Первый production milestone ещё не достигнут.

## Целевые milestones

### Milestone 1 — Stable Web/PWA

- [ ] Все engineering gates стабильны: `lint`, `typecheck`, `build`.
- [ ] Ключевые пользовательские и админские сценарии проходят без hydration loops, infinite polling и layout regressions.
- [ ] Документация, shell, AI workspace и workout flow доведены до production-качества.
- [ ] Есть минимальный автоматизированный regression контур.

### Milestone 2 — Live Billing

- [ ] Stripe env полностью готовы на production/staging.
- [ ] Работает живой контур `checkout -> return reconcile -> webhook -> portal`.
- [ ] UI в `/settings` и `/admin` корректно показывает расхождения и статус подписки.

### Milestone 3 — Android Wrapper

- [ ] Production PWA installability подтверждена.
- [ ] Готов TWA wrapper.
- [ ] Собраны `assetlinks.json`, package name, signing, splash, Play metadata.
- [ ] Пройден Android smoke на production URL.

## Волна 0. Engineering hygiene и release baseline

### Quality gates

- [x] Починить `typecheck` так, чтобы он проходил за один запуск без ручных повторов.
- [x] Убрать зависимость quality gates от мусорных `.next/types` и нестабильных `distDir`-сценариев.
- [x] Привести `lint` к рабочему CI-формату: линтить только поддерживаемые исходники.
- [x] Зафиксировать один воспроизводимый локальный baseline: `lint`, `typecheck`, `build`, smoke browser check.

### Workspace cleanup

- [x] Убрать из активного dev-потока `.next_codex_*`, `.next_stale_*` и другие временные build-папки.
- [x] Расширить `.gitignore`, чтобы build-мусор и generated artifacts не попадали в рабочий цикл.
- [x] Зафиксировать line-ending policy через `.gitattributes`, чтобы уменьшить ложный workspace шум на Windows.
- [x] Убедиться, что quality gates не оставляют repo-tracked шум вроде изменений в `tsconfig.json`.

### Docs и entrypoints

- [x] Переписать `README.md` в нормальном UTF-8 и синхронизировать его с реальным состоянием проекта.
- [x] Переписать `docs/MASTER_PLAN.md` как production-hardening backlog.
- [x] Переписать `docs/FRONTEND.md` в чистом UTF-8 и синхронизировать его с текущим frontend-контуром.
- [ ] Санировать `docs/README.md`, `docs/AI_WORKLOG.md`, `docs/FRONTEND.md`, `docs/BACKEND.md`, `docs/AI_STACK.md`, `docs/USER_GUIDE.md`, `docs/AI_EXPLAINED.md` от mojibake.
- [x] Зафиксировать release checklist для production web/PWA.

## Волна 1. Архитектурная декомпозиция рискованных модулей

### Крупные монолиты

- [x] Вынести из `src/components/workout-day-session.tsx` первый tranche чистой логики в отдельные `session-utils` и `derived-state` модули.
- [x] Вынести из `src/components/workout-day-session.tsx` второй tranche timer/focus-header state в отдельный hook-модуль.
- [x] Вынести из `src/components/workout-day-session.tsx` третий tranche sync/hydration/offline orchestration в отдельный hook-модуль.
- [x] Вынести из `src/lib/dashboard/metrics.ts` первый tranche независимых helper’ов в `dashboard-utils` и `dashboard-snapshot`.
- [x] Вынести из `src/components/admin-users-directory.tsx` первый tranche model/helper слоя в отдельный модуль.
- [x] Вынести из `src/components/admin-users-directory.tsx` второй tranche filter/selection/bulk request helper-слоя в общий model-модуль.
- [x] Вынести из `src/components/admin-users-directory.tsx` третий tranche bulk actions/history UI в отдельный модуль.
- [x] Вынести из `src/components/admin-user-detail.tsx` первый tranche model/helper слоя в отдельный модуль.
- [x] Вынести из `src/components/admin-user-detail.tsx` второй tranche fetch/state и section-config слоя в отдельный hook-модуль.
- [x] Вынести из `src/components/admin-user-detail.tsx` третий tranche секционных `profile/activity/operations/billing` блоков в отдельный UI-модуль.
- [x] Убрать mojibake из `admin-user-detail` model/state словарей и section copy.
- [x] Вынести из `src/lib/ai/knowledge.ts` первый tranche model/search helper слоя в отдельный модуль.
- [x] Вынести из `src/lib/ai/knowledge.ts` второй tranche retrieval RPC/vector/text fallback слоя в отдельный модуль.
- [x] Вынести из `src/components/ai-chat-panel.tsx` первый tranche model/helper и tool-card слоя в отдельные модули.
- [x] Вынести из `src/components/ai-chat-panel.tsx` второй tranche `chat surface + composer` UI в отдельные модули.
- [x] Убрать mojibake из `ai-chat-panel` и `ai-chat-panel-model` user-facing copy.
- [ ] Разбить `src/components/workout-day-session.tsx` на UI-композицию, timer/focus hooks, step/save logic и sync helpers.
- [ ] Разбить `src/lib/dashboard/metrics.ts` на агрегаты, coaching signals, nutrition analytics и snapshot helpers.
- [ ] Разбить `src/components/admin-users-directory.tsx` на каталог, сегменты, bulk actions и selection state.
- [ ] Разбить `src/components/admin-user-detail.tsx` на профиль, активность, операции, биллинг и timeline-блоки.
- [ ] Разбить `src/lib/ai/knowledge.ts` на retrieval, indexing, structured summaries и embeddings refresh.
- [ ] Разбить `src/components/ai-chat-panel.tsx` на chat surface, composer, history controls, prompt library и tool/proposal UI.

### Общий стандарт для крупных модулей

- [ ] Derived state вынесен из JSX в отдельные helpers/hooks.
- [x] Для `workout-day-session.tsx` уже есть референсный паттерн: derive-логика и локальные workout helpers вынесены из основного client-компонента.
- [x] Для `workout-day-session.tsx` уже есть второй референсный паттерн: timer state и offline sync orchestration вынесены из основного execution-экрана в отдельные hooks.
- [x] Для `metrics.ts` уже есть референсный паттерн: общие analytics/snapshot helper’ы вынесены из главного server-side orchestrator модуля.
- [x] Для `admin-users-directory.tsx` уже есть референсный паттерн: data model, formatters и summary/filter helpers вынесены из основного client-компонента.
- [x] Для `admin-user-detail.tsx` уже есть референсный паттерн: типы карточки, словари ролей/статусов и payload/format helpers вынесены из основного client-компонента.
- [x] Для `knowledge.ts` уже есть референсный паттерн: row/document types и pure retrieval/search helpers вынесены из основного AI knowledge orchestrator модуля.
- [x] Для `ai-chat-panel.tsx` уже есть референсный паттерн: типы, форматтеры, markdown helpers и tool-card UI вынесены из основного chat-orchestrator компонента.
- [ ] Async/data orchestration не смешана с визуальной разметкой.
- [ ] Доменные правила не дублируются между route handlers и `lib`.
- [ ] Новые модули пригодны для unit/integration тестов без браузера.

## Волна 2. UX overhaul для Web/PWA

### Shell и навигация

- [x] Есть desktop и mobile shell.
- [ ] Desktop top nav доведён до стабильного production-вида без потери разделов и без визуальных регрессий.
- [ ] Mobile burger drawer работает без перекрытий, portal-глюков и hydration mismatch.
- [ ] Убраны мешающие плавающие панели, сохранены только полезные действия.

### Workspace-паттерн страниц

- [x] На части экранов уже есть логические разделы и переключение.
- [ ] Все тяжёлые страницы (`Dashboard`, `Workouts`, `Nutrition`, `AI`, `Admin`) приведены к единому workspace-паттерну.
- [ ] На мобильной PWA одновременно открыт только один логический блок.
- [ ] Состояние скрытия/показа блоков сохраняется локально и ведёт себя предсказуемо.

### Workout execution

- [x] Есть focus-mode и пошаговое выполнение тренировки.
- [x] Видны все шаги тренировки, будущие шаги заблокированы.
- [x] Сохранение упражнения требует полностью заполненных подходов.
- [x] Есть таймер с лимитом 2 часа и сбросом тренировки.
- [ ] Focus-mode на мобильной PWA доведён до эталонного UX без лишнего chrome и визуального шума.
- [ ] Сброс, сохранение, завершение и редактирование пройдены повторно как regression-critical сценарии.

### AI workspace

- [x] Есть fullscreen AI workspace и история чатов.
- [x] Есть удаление отдельных чатов и массовая очистка.
- [x] Есть загрузка изображений и prompt library.
- [ ] Убран весь служебный копирайт, пустые состояния и мешающий UI-хром.
- [ ] Web search toggle и image upload доведены до естественного mobile-first UX.
- [ ] Assistant flow полностью читается как сценарий `запрос -> анализ -> предложение -> подтверждение -> применение`.

### Admin UI

- [x] Есть `/admin`, каталог пользователей, user detail, health dashboards и operations inbox.
- [ ] Полностью убрать сырые технические тексты и mojibake из admin UI.
- [ ] Оставить детали ролей и capability only для root/super-admin.
- [ ] Довести каталоги и карточки пользователя до секционного, читабельного desktop/mobile UX.

## Волна 3. Доменные и backend hardening

### Workout / Nutrition / API

- [ ] Пройти все route handlers на валидацию, owner-only доступ, ошибки и idempotency.
- [ ] Подтвердить, что reset/finish/sync сценарии не создают race conditions и бесконечный polling.
- [ ] Подтвердить, что offline queue и stale cleanup не могут восстановить уже сброшенное состояние.
- [ ] Проверить locked program guard и все mutation routes вокруг workout day execution.

### AI / RAG / CAG / KAG

- [x] Есть retrieval, structured knowledge, proposals и snapshots.
- [ ] Подтвердить owner-only data access для chat, sessions, retrieval, reindex и proposal apply.
- [ ] Развести runtime failure UX и provider configuration UX.
- [ ] Стабилизировать историю чатов, prompt library, web search toggle и image upload.
- [ ] Прогнать assistant/retrieval/workout-plan/meal-plan/safety eval suites как quality gate.
- [ ] Подтвердить retrieval по всей исторической базе пользователя, а не только по свежим данным.

### Database / Supabase

- [ ] Провести полный аудит схемы, RLS, RPC, cron-related функций и индексных путей через Supabase MCP.
- [ ] После DDL-изменений запускать advisors `security` и `performance` как обязательную проверку.
- [ ] Проверить query paths и индексы для `sync`, `workout`, `knowledge`, `admin`, `billing`.

### Observability

- [x] Sentry, Vercel Analytics и health dashboards уже встроены частично.
- [ ] Завершить Sentry rollout на production env.
- [ ] Подтвердить auth/visibility для cron routes и internal jobs.
- [ ] Задокументировать или устранить текущие warnings, которые считаются допустимыми в build.

## Волна 4. Billing и SaaS readiness

### Stripe foundation

- [x] Billing domain и Stripe route scaffolding уже есть.
- [ ] Завести и проверить все production/staging env для Stripe.
- [ ] Пройти живой сценарий `checkout -> return reconcile -> webhook -> portal`.
- [ ] Проверить идемпотентность webhook и согласованность `subscriptions`, `entitlements`, `usage counters`.

### Billing UI

- [x] Есть billing center в `/settings` и admin billing controls.
- [ ] Довести user-facing billing UX до production-уровня без сырого статуса и промежуточных артефактов.
- [ ] Довести admin billing health и reconcile UX до операторского уровня.

## Волна 5. Тесты, CI и release process

### Автотесты

- [ ] Добавить Playwright e2e для `auth -> onboarding -> dashboard -> workouts -> nutrition -> ai -> settings -> admin`.
- [ ] Добавить smoke тесты на ключевые SSR/API маршруты.
- [ ] Добавить regression tests для offline/sync workout execution.
- [ ] Добавить AI route contract tests без обязательного вызова платного провайдера.
- [ ] Добавить изоляционные проверки для user-owned данных и RLS-контуров.

### CI

- [x] Добавить обязательный CI workflow для `lint`, `typecheck`, `build`.
- [x] Добавить smoke/e2e subset как merge gate.
- [ ] При наличии DB-изменений добавить migration/advisor verification.

### Release process

- [x] Формализовать release checklist для web/PWA.
- [ ] Ввести staging-like verification для Stripe и AI runtime.
- [ ] Зафиксировать критерий `prod-ready`: не локальная сборка, а полный automated + manual acceptance набор.

## Волна 6. Android / TWA

- [ ] Подтвердить installability production PWA.
- [ ] Подготовить `assetlinks.json`.
- [ ] Подготовить package name, signing, splash и Play metadata.
- [ ] Собрать и проверить TWA wrapper.
- [ ] Пройти Android smoke на production URL.

## Что можно считать завершённым только после подтверждения

- [x] `lint`, `typecheck`, `build` проходят стабильно в один запуск.
- [ ] Нет mojibake в ключевой документации и основных экранах приложения.
- [ ] Нет hydration mismatch, render loops, infinite polling и state desync в базовых пользовательских сценариях.
- [ ] Stripe-контур работает end-to-end.
- [ ] AI quality gate пройден по минимуму: assistant, retrieval, workout plan, meal plan, safety.
- [ ] Android wrapper smoke пройден после стабилизации web/PWA.
