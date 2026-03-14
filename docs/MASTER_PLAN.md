# Master Plan проекта `fit`

## Как использовать этот план

- `[x]` — сделано и подтверждено в коде, инфраструктуре или проверках.
- `[ ]` — ещё не сделано или не доведено до production-ready состояния.
- После каждого существенного tranche:
  - обновлять этот файл;
  - добавлять короткую запись в `docs/AI_WORKLOG.md`;
  - синхронизировать профильные документы в `docs/`, если меняется контракт, архитектура или release-процесс.

Этот файл — текущий production-hardening backlog проекта. Он отражает фактическое состояние репозитория на `2026-03-14`.

## Текущая база

- [x] Есть web-first PWA на `Next.js 16 + React 19 + TypeScript strict`.
- [x] Основные продуктовые поверхности уже существуют: `Dashboard`, `Workouts`, `Nutrition`, `AI`, `Admin`, `Settings`, `History`.
- [x] Есть Supabase schema, migrations, RLS, admin-контур, cron routes и offline sync для тренировок.
- [x] Есть AI runtime, retrieval, structured knowledge, proposals, eval workspace и SVG demo.
- [x] `npm run lint` приведён к CI-формату и проверяет только поддерживаемые исходники.
- [x] `npm run typecheck` стабилен через `next typegen + tsc`.
- [x] `npm run build` проходит.
- [x] Есть минимальный smoke-контур и release checklist.
- [ ] Документация и часть UI/docs-поверхности всё ещё содержат mojibake и требуют санации.
- [ ] Полноценного regression-покрытия пока нет.
- [ ] Первый production milestone ещё не закрыт.

## Milestones

### Milestone 1 — Stable Web/PWA

- [x] Стабильные локальные engineering gates: `lint`, `typecheck`, `build`.
- [x] Есть smoke baseline для ключевых маршрутов.
- [ ] Ключевые пользовательские и админские сценарии проходят без hydration loops, infinite polling и layout regressions.
- [ ] Документация, shell, AI workspace и workout flow доведены до production-качества.
- [ ] Есть минимальный automated regression contour сверх smoke.

### Milestone 2 — Live Billing

- [ ] Stripe env полностью готовы на production/staging.
- [ ] Работает живой контур `checkout -> return reconcile -> webhook -> portal`.
- [ ] UI в `/settings` и `/admin` корректно показывает статус подписки и расхождения.

### Milestone 3 — Android Wrapper

- [ ] Подтверждена installability production PWA.
- [ ] Готов TWA wrapper.
- [ ] Подготовлены `assetlinks.json`, package name, signing, splash и Play metadata.
- [ ] Пройден Android smoke на production URL.

## Волна 0. Engineering hygiene и release baseline

### Quality gates

- [x] Починить `typecheck`, чтобы он проходил за один запуск без ручных повторов.
- [x] Убрать зависимость quality gates от мусорных `.next/types` и нестабильных `distDir`-сценариев.
- [x] Привести `lint` к рабочему CI-формату.
- [x] Зафиксировать воспроизводимый baseline: `lint`, `typecheck`, `build`, smoke.

### Workspace cleanup

- [x] Убрать из активного dev-потока `.next_codex_*`, `.next_stale_*` и временные build-папки.
- [x] Расширить `.gitignore` для build-мусора и generated artifacts.
- [x] Зафиксировать line-ending policy через `.gitattributes`.
- [x] Убедиться, что quality gates не оставляют repo-tracked шум вроде изменений в `tsconfig.json`.

### Docs и entrypoints

- [x] Переписать корневой `README.md` в нормальном UTF-8 и синхронизировать его с текущим состоянием проекта.
- [x] Переписать `docs/MASTER_PLAN.md` как production-hardening backlog.
- [x] Переписать `docs/FRONTEND.md` в чистом UTF-8 и синхронизировать с текущим frontend-контуром.
- [x] Добавить release checklist для production web/PWA.
- [x] Санировать `docs/README.md`, `docs/AI_WORKLOG.md`, `docs/BACKEND.md`, `docs/AI_STACK.md`, `docs/USER_GUIDE.md` от mojibake.
- [ ] Отдельно провести triage локального `docs/AI_EXPLAINED.md` и завершить sanitation-wave документации.

## Волна 1. Архитектурная декомпозиция рискованных модулей

### Workout execution

- [x] Вынести чистую логику из `src/components/workout-day-session.tsx` в `session-utils` и `derived-state`.
- [x] Вынести timer/focus-header state в `use-workout-session-timer.ts`.
- [x] Вынести sync/hydration/offline orchestration в `use-workout-day-sync.ts`.
- [x] Вынести save/status/reset action-слой в `use-workout-session-actions.ts`.
- [x] Вынести step-strip и exercise-card UI в отдельные модули.
- [x] Вынести non-focus overview и day-context surface в отдельные модули.
- [ ] Довести `workout-day-session.tsx` до окончательной orchestrator-роли без смешения UI, sync, persistence и доменных правил.

### Dashboard analytics

- [x] Вынести общие helper’ы из `src/lib/dashboard/metrics.ts` в `dashboard-utils.ts` и `dashboard-snapshot.ts`.
- [x] Вынести workout-specific helper-слой в `dashboard-workout-helpers.ts`.
- [x] Вынести overview/period-comparison в `dashboard-overview.ts`.
- [x] Вынести aggregate snapshot/cache в `dashboard-aggregate.ts`.
- [x] Вынести runtime snapshot cache в `dashboard-runtime-cache.ts`.
- [x] Вынести live runtime assembly в `dashboard-runtime-assembly.ts`.
- [ ] Продолжить вынос nutrition-specific analytics и fail-open/result-format слоя из `metrics.ts`.

### Admin UI

- [x] Вынести model/helper слой из `src/components/admin-users-directory.tsx`.
- [x] Вынести filter/selection/bulk-request helper-слой из `src/components/admin-users-directory.tsx`.
- [x] Вынести bulk actions/history UI из `src/components/admin-users-directory.tsx`.
- [x] Вынести model/helper слой из `src/components/admin-user-detail.tsx`.
- [x] Вынести fetch/state и section-config слой из `src/components/admin-user-detail.tsx`.
- [x] Вынести секционные `profile/activity/operations/billing` блоки из `src/components/admin-user-detail.tsx`.
- [x] Убрать mojibake из `admin-user-detail` model/state словарей и section copy.
- [ ] Добить дальнейшую декомпозицию `admin-user-detail.tsx` по timeline/detail подблокам.

### AI knowledge и chat

- [x] Вынести model/search helper слой из `src/lib/ai/knowledge.ts`.
- [x] Вынести retrieval RPC/vector/text fallback слой из `src/lib/ai/knowledge.ts`.
- [x] Вынести data-loading/fetch preparation слой в `knowledge-source-data.ts`.
- [x] Вынести indexing/embeddings refresh слой в `knowledge-indexing.ts`.
- [x] Вынести document builders и knowledge corpus assembly в `knowledge-documents.ts`.
- [x] Вынести model/helper и tool-card слой из `src/components/ai-chat-panel.tsx`.
- [x] Вынести `chat surface + composer` UI из `src/components/ai-chat-panel.tsx`.
- [x] Вынести toolbar / prompt-library trigger / search toggle UI из `src/components/ai-chat-panel.tsx`.
- [x] Вынести access/error/notice panels из `src/components/ai-chat-panel.tsx`.
- [x] Вынести local session / prompt-state / URL orchestration из `src/components/ai-chat-panel.tsx`.
- [x] Вынести proposal-action / meal-photo runtime helper слой из `src/components/ai-chat-panel.tsx`.
- [x] Вынести submit / composer helper слой из `src/components/ai-chat-panel.tsx`.
- [x] Вынести view/media state из `src/components/ai-chat-panel.tsx`.
- [x] Убрать mojibake из `src/lib/ai/plan-generation.ts` и `src/lib/ai/domain-policy.ts`.
- [ ] Довести `knowledge.ts` и `ai-chat-panel.tsx` до финальной orchestrator-роли без смешения UI, retrieval, persistence и runtime plumbing.

### Общий стандарт для крупных модулей

- [x] Для `workout-day-session.tsx` есть референсный паттерн с derive-слоем, timer-hook и sync-hook.
- [x] Для `metrics.ts` есть референсный паттерн с overview/aggregate/runtime разделением.
- [x] Для `admin-users-directory.tsx` есть референсный паттерн с вынесенным model/helper слоем.
- [x] Для `admin-user-detail.tsx` есть референсный паттерн с вынесенным state/model/sections слоем.
- [x] Для `knowledge.ts` есть референсный паттерн с вынесенными retrieval/indexing/document builders.
- [x] Для `ai-chat-panel.tsx` есть референсный паттерн с вынесенными session/actions/composer/view-state модулями.
- [ ] Async/data orchestration больше не смешивается с JSX в оставшихся тяжёлых экранах.
- [ ] Доменные правила больше не дублируются между route handlers и `lib`.

## Волна 2. UX overhaul для Web/PWA

### Shell и навигация

- [x] Есть desktop и mobile shell.
- [ ] Desktop top nav доведён до стабильного production-вида без визуальных регрессий.
- [ ] Mobile burger drawer доведён до корректной работы без перекрытий, portal-глюков и hydration mismatch.
- [ ] Убраны мешающие плавающие панели, оставлены только полезные действия.

### Workspace-паттерн страниц

- [x] На части экранов уже есть логические разделы и переключение.
- [ ] Все тяжёлые страницы (`Dashboard`, `Workouts`, `Nutrition`, `AI`, `Admin`) приведены к единому workspace-паттерну.
- [ ] На мобильной PWA одновременно открыт только один логический блок.
- [ ] Состояние скрытия/показа блоков ведёт себя предсказуемо на всех основных страницах.

### Workout execution

- [x] Есть focus-mode и пошаговое выполнение тренировки.
- [x] Видны все шаги тренировки, будущие шаги заблокированы.
- [x] Сохранение упражнения требует полностью заполненных подходов.
- [x] Есть таймер с лимитом 2 часа и корректный сброс тренировки.
- [ ] Focus-mode на мобильной PWA доведён до эталонного UX без лишнего chrome и визуального шума.
- [ ] Сброс, сохранение, завершение и редактирование пройдены повторно как regression-critical сценарии.

### AI workspace

- [x] Есть fullscreen AI workspace и история чатов.
- [x] Есть удаление отдельных чатов и массовая очистка.
- [x] Есть загрузка изображений и prompt library.
- [ ] Убрать весь служебный копирайт, пустые состояния и мешающий UI-хром.
- [ ] Web search toggle и image upload довести до естественного mobile-first UX.
- [ ] Assistant flow должен читаться как сценарий `запрос -> анализ -> предложение -> подтверждение -> применение`.

### Admin UI

- [x] Есть `/admin`, каталог пользователей, user detail, health dashboards и operations inbox.
- [ ] Полностью убрать сырые технические тексты и mojibake из admin UI.
- [ ] Оставить детали ролей и capability only для root/super-admin.
- [ ] Довести каталоги и карточки пользователя до секционного desktop/mobile UX без перегруза.

## Волна 3. Доменные, AI и backend hardening

### Workout / Nutrition / API

- [ ] Пройти все route handlers на валидацию, owner-only доступ, ошибки и idempotency.
- [ ] Подтвердить, что reset/finish/sync сценарии не создают race conditions и бесконечный polling.
- [ ] Подтвердить, что offline queue и stale cleanup не восстанавливают уже сброшенное состояние.
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
- [ ] Задокументировать или устранить допустимые build warnings.

## Волна 4. Billing и SaaS readiness

### Stripe foundation

- [x] Billing domain и Stripe route scaffolding уже есть.
- [ ] Завести и проверить все production/staging env для Stripe.
- [ ] Пройти живой сценарий `checkout -> return reconcile -> webhook -> portal`.
- [ ] Проверить идемпотентность webhook и согласованность `subscriptions`, `entitlements`, `usage counters`.

### Billing UI

- [x] Есть billing center в `/settings` и admin billing controls.
- [ ] Довести user-facing billing UX до production-уровня без сырых промежуточных состояний.
- [ ] Довести admin billing health и reconcile UX до операторского уровня.

## Волна 5. Тесты, CI и release process

### Автотесты

- [ ] Добавить Playwright e2e для `auth -> onboarding -> dashboard -> workouts -> nutrition -> ai -> settings -> admin`.
- [x] Добавить smoke тесты на ключевые SSR/API маршруты.
- [ ] Добавить regression tests для offline/sync workout execution.
- [ ] Добавить AI route contract tests без обязательного вызова платного провайдера.
- [ ] Добавить изоляционные проверки для user-owned данных и RLS-контуров.

### CI

- [x] Добавить обязательный CI workflow для `lint`, `typecheck`, `build`.
- [x] Добавить smoke subset как merge gate.
- [ ] При наличии DB-изменений добавить migration/advisor verification.

### Release process

- [x] Формализовать release checklist для web/PWA.
- [ ] Ввести staging-like verification для Stripe и AI runtime.
- [ ] Зафиксировать критерий `prod-ready` как набор automated + manual acceptance checks, а не только локальную сборку.

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
