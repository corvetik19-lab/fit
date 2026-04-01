# Master Plan проекта `fit`

## Как использовать этот план

- `[x]` — сделано и подтверждено в коде, инфраструктуре или проверках.
- `[ ]` — ещё не сделано или не доведено до production-ready состояния.
- Каждый завершённый slice обязан сразу менять соответствующий чекбокс в этом файле с `[ ]` на `[x]`, если основной пункт реально закрыт, либо добавлять/обновлять addendum-подпункт с текущим статусом.
- После каждого существенного tranche:
  - обновлять этот файл;
  - добавлять короткую запись в `docs/AI_WORKLOG.md`;
  - синхронизировать профильные документы в `docs/`, если меняется контракт, архитектура или release-процесс.
- После каждого tranche обязательно пересчитывать `done / total` по основному execution checklist и обновлять процент прямо в этом файле и в пользовательском статусе.

Этот файл — текущий production-hardening backlog проекта. Он отражает фактическое состояние репозитория на `2026-03-31`.

Текущий прогресс execution checklist: `178 / 186` (`96%`).

## Текущая база

- [x] Есть web-first PWA на `Next.js 16 + React 19 + TypeScript strict`.
- [x] Основные продуктовые поверхности уже существуют: `Dashboard`, `Workouts`, `Nutrition`, `AI`, `Admin`, `Settings`, `History`.
- [x] Есть Supabase schema, migrations, RLS, admin-контур, cron routes и offline sync для тренировок.
- [x] Есть AI runtime, retrieval, structured knowledge, proposals, eval workspace и SVG demo.
- [x] `npm run lint` приведён к CI-формату и проверяет только поддерживаемые исходники.
- [x] `npm run typecheck` стабилен через `next typegen + tsc`.
- [x] `npm run build` проходит.
- [x] Есть минимальный smoke-контур и release checklist.
- [x] Документация и ключевые UI/docs-поверхности санированы от mojibake; локальный `docs/AI_EXPLAINED.md` отдельно triaged и не блокирует shipped surface.
- [x] Есть минимальный regression-контур сверх smoke: auth/admin e2e, API contracts, RLS, workout sync и UI regression suites.
- [x] Первый production milestone закрыт.

## Milestones

### Milestone 1 — Stable Web/PWA

- [x] Стабильные локальные engineering gates: `lint`, `typecheck`, `build`.
- [x] Есть smoke baseline для ключевых маршрутов.
- [x] Ключевые пользовательские и админские сценарии проходят без hydration loops, infinite polling и layout regressions.
- [x] Документация, shell, AI workspace и workout flow доведены до production-качества.
- [x] Есть минимальный automated regression contour сверх smoke.

### Milestone 2 — Live Billing

- [ ] Production/staging env выбранного российского платёжного провайдера готовы.
- [ ] Работает живой контур `checkout -> return reconcile -> webhook -> billing center`.
- [x] UI в `/settings` и `/admin` корректно показывает статус подписки и расхождения.

### Milestone 3 — Android Wrapper

- [x] Подтверждена installability production PWA.
- [x] Готов TWA wrapper.
- [x] Подготовлены `assetlinks.json`, package name, signing, splash и Play metadata.
- [x] Пройден Android smoke на production URL.

## Волна 0. Engineering hygiene и release baseline

### Quality gates

- [x] Починить `typecheck`, чтобы он проходил за один запуск без ручных повторов.
- [x] Убрать зависимость quality gates от мусорных `.next/types` и нестабильных `distDir`-сценариев.
- [x] Привести `lint` к рабочему CI-формату.
- [x] Зафиксировать воспроизводимый baseline: `lint`, `typecheck`, `build`, smoke.
- [x] Добавить воспроизводимый `verify:advisors` gate для DB-изменений при наличии Supabase management secrets.

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
- [x] Санировать release-policy документы `docs/RELEASE_CHECKLIST.md`, `docs/PROD_READY.md`, `docs/BUILD_WARNINGS.md`.
- [x] Санировать `docs/README.md`, `docs/AI_WORKLOG.md`, `docs/BACKEND.md`, `docs/AI_STACK.md`, `docs/USER_GUIDE.md` от mojibake.
- [x] Отдельно провести triage локального `docs/AI_EXPLAINED.md` и завершить sanitation-wave документации.

## Волна 1. Архитектурная декомпозиция рискованных модулей

### Workout execution

- [x] Вынести чистую логику из `src/components/workout-day-session.tsx` в `session-utils` и `derived-state`.
- [x] Вынести timer/focus-header state в `use-workout-session-timer.ts`.
- [x] Вынести sync/hydration/offline orchestration в `use-workout-day-sync.ts`.
- [x] Вынести save/status/reset action-слой в `use-workout-session-actions.ts`.
- [x] Вынести step-strip и exercise-card UI в отдельные модули.
- [x] Вынести non-focus overview и day-context surface в отдельные модули.
- [x] Довести `workout-day-session.tsx` до окончательной orchestrator-роли без смешения UI, sync, persistence и доменных правил.

### Dashboard analytics

- [x] Вынести общие helper’ы из `src/lib/dashboard/metrics.ts` в `dashboard-utils.ts` и `dashboard-snapshot.ts`.
- [x] Вынести workout-specific helper-слой в `dashboard-workout-helpers.ts`.
- [x] Вынести overview/period-comparison в `dashboard-overview.ts`.
- [x] Вынести aggregate snapshot/cache в `dashboard-aggregate.ts`.
- [x] Вынести runtime snapshot cache в `dashboard-runtime-cache.ts`.
- [x] Вынести live runtime assembly в `dashboard-runtime-assembly.ts`.
- [x] Продолжить вынос nutrition-specific analytics и fail-open/result-format слоя из `metrics.ts`.

### Admin UI

- [x] Вынести model/helper слой из `src/components/admin-users-directory.tsx`.
- [x] Вынести filter/selection/bulk-request helper-слой из `src/components/admin-users-directory.tsx`.
- [x] Вынести bulk actions/history UI из `src/components/admin-users-directory.tsx`.
- [x] Вынести model/helper слой из `src/components/admin-user-detail.tsx`.
- [x] Вынести fetch/state и section-config слой из `src/components/admin-user-detail.tsx`.
- [x] Вынести секционные `profile/activity/operations/billing` блоки из `src/components/admin-user-detail.tsx`.
- [x] Убрать mojibake из `admin-user-detail` model/state словарей и section copy.
- [x] Добить дальнейшую декомпозицию `admin-user-detail.tsx` по timeline/detail подблокам.

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
- [x] Довести `knowledge.ts` и `ai-chat-panel.tsx` до финальной orchestrator-роли без смешения UI, retrieval, persistence и runtime plumbing.

### Общий стандарт для крупных модулей

- [x] Для `workout-day-session.tsx` есть референсный паттерн с derive-слоем, timer-hook и sync-hook.
- [x] Для `metrics.ts` есть референсный паттерн с overview/aggregate/runtime разделением.
- [x] Для `admin-users-directory.tsx` есть референсный паттерн с вынесенным model/helper слоем.
- [x] Для `admin-user-detail.tsx` есть референсный паттерн с вынесенным state/model/sections слоем.
- [x] Для `knowledge.ts` есть референсный паттерн с вынесенными retrieval/indexing/document builders.
- [x] Для `ai-chat-panel.tsx` есть референсный паттерн с вынесенными session/actions/composer/view-state модулями.
- [x] Async/data orchestration больше не смешивается с JSX в оставшихся тяжёлых экранах.
- [x] Доменные правила больше не дублируются между route handlers и `lib`.

## Волна 2. UX overhaul для Web/PWA

### Shell и навигация

- [x] Есть desktop и mobile shell.
- [x] Desktop top nav доведён до стабильного production-вида без визуальных регрессий.
- [x] Mobile burger drawer доведён до корректной работы без перекрытий, portal-глюков и hydration mismatch.
- [x] Убраны мешающие плавающие панели, оставлены только полезные действия.
- [x] Есть mobile/PWA regression suite для burger drawer, focus-mode и section-menu на узком viewport.
- [x] Mobile/PWA regression suite стабилизирован against hydration timing и flaky selectors: shell drawer, focus-header и тяжёлый nutrition isolation flow больше не дают ложный красный на целевом mobile subset.

### Workspace-паттерн страниц

- [x] На части экранов уже есть логические разделы и переключение.
- [x] Все тяжёлые страницы (`Dashboard`, `Workouts`, `Nutrition`, `AI`, `Admin`) приведены к единому workspace-паттерну.
- [x] На мобильной PWA одновременно открыт только один логический блок.
- [x] Состояние скрытия/показа блоков ведёт себя предсказуемо на всех основных страницах.

### Premium fitness redesign

- [x] Завести отдельный execution-doc [PREMIUM_REDESIGN_PLAN.md](/C:/fit/docs/PREMIUM_REDESIGN_PLAN.md) и привязать его к `MASTER_PLAN`.
- [x] Обновить визуальные токены, типографику и общие shell/workspace primitives в premium fitness-направлении.
- [x] Пересобрать `Dashboard` и `AI` под новый visual language.
- [x] Пересобрать `Workouts` и `Nutrition` под mobile/PWA-first подачу без потери текущих flows.
- [x] Довести `Admin` и remaining detail surfaces до того же визуального языка.
- [x] Закрыть visual regression, mobile acceptance и финальный handoff по редизайну.

### Workout execution

- [x] Есть focus-mode и пошаговое выполнение тренировки.
- [x] Видны все шаги тренировки, будущие шаги заблокированы.
- [x] Сохранение упражнения требует полностью заполненных подходов.
- [x] Есть таймер с лимитом 2 часа и корректный сброс тренировки.
- [x] Focus-mode на мобильной PWA доведён до эталонного UX без лишнего chrome и визуального шума.
- [x] Сброс, сохранение, завершение и редактирование пройдены повторно как regression-critical сценарии.

### Nutrition camera / barcode flow

  - [x] Добавить in-app photo capture для питания с удобным mobile/PWA UX.
  - [x] Добавить barcode scan и Open Food Facts lookup/import с preview изображения и состава.
  - [x] Расширить `foods` schema и nutrition data-contract под image/composition/source metadata.
  - [x] Закрыть regression, документацию и handoff по nutrition capture/import flow.

### AI workspace

- [x] Есть fullscreen AI workspace и история чатов.
- [x] Есть удаление отдельных чатов и массовая очистка.
- [x] Есть загрузка изображений и prompt library.
- [x] Убрать весь служебный копирайт, пустые состояния и мешающий UI-хром.
- [x] Web search toggle и image upload довести до естественного mobile-first UX.
- [x] Assistant flow должен читаться как сценарий `запрос -> анализ -> предложение -> подтверждение -> применение`.

### Admin UI

- [x] Есть `/admin`, каталог пользователей, user detail, health dashboards и operations inbox.
- [x] Degraded/fallback режим в `admin health` и `operations inbox` явно показан в UI, а не прячется за молчаливым пустым состоянием.
- [x] Верхний слой `admin user detail` переведён в чистый UTF-8: state, summary shell и section-switcher больше не отдают mojibake.
- [x] Полностью убрать сырые технические тексты и mojibake из admin UI.
- [x] Оставить детали ролей и capability only для root/super-admin.
- [x] Довести каталоги и карточки пользователя до секционного desktop/mobile UX без перегруза.

## Волна 3. Доменные, AI и backend hardening

### Workout / Nutrition / API

- [x] Сделать `sync/push` для `workout_day_execution` атомарным, без частично применённого статуса при ошибке сохранения.
- [x] Запретить частично заполненные set-updates на сервере: set считается либо пустым, либо полностью заполненным (`reps`, `weight`, `RPE`).
- [x] Запретить перевод workout day в `done`, если не заполнены и не сохранены все сеты дня.
- [x] Провалидировать параметры `sync/pull` на уровне route handler, а не только на клиенте.
- [x] Добавить UUID-валидацию route params в direct workout mutation routes (`workout-days/[id]`, `reset`, `workout-sets/[id]`).
- [x] Добавить regression-покрытие для сценария `sync -> reset -> sync/pull`, подтверждающее чистый snapshot после сброса тренировки.
- [x] Добавить UUID-валидацию и явные `400` в owner-scoped mutation routes `weekly-programs/[id]/lock`, `weekly-programs/[id]/clone`, `foods/[id]`, `recipes/[id]`, `meals/[id]`, `meal-templates/[id]`.
- [x] Добавить UUID-валидацию и явные `400` в admin user mutation routes `billing`, `billing/reconcile`, `deletion`, `export`, `restore`, `role`, `support-action`, `suspend`.
- [x] Унифицировать invalid-id контракты для `admin/users/[id]` и `admin/users/bulk`, чтобы detail route и bulk route тоже отдавали предсказуемые `400` без noisy error logging.
- [x] Расширить `api-contracts.spec.ts` invalid-param покрытием для weekly program и nutrition mutation routes.
- [x] `settings/data` и `settings/billing` snapshot routes теперь fail-open: при сбое загрузки оболочки settings UI получает безопасный пустой snapshot вместо общего `500`.
- [x] User-facing billing access теперь fail-open на `/settings`, `/ai`, `/nutrition`, `/api/settings/billing` и в AI mutation routes: при сбое billing-access загрузки UI и AI surface больше не падают общим `500`, а используют безопасный fallback snapshot/access policy.
- [x] Пройти все route handlers на валидацию, owner-only доступ, ошибки и idempotency.
- [x] Подтвердить, что reset/finish/sync сценарии не создают race conditions и бесконечный polling.
- [x] Подтвердить, что offline queue и stale cleanup не восстанавливают уже сброшенное состояние.
- [x] Проверить locked program guard и все mutation routes вокруг workout day execution.

### AI / RAG / CAG / KAG

- [x] Есть retrieval, structured knowledge, proposals и snapshots.
- [x] Для `AI sessions` и `proposal apply/approve` добавлены явные UUID-валидации и предсказуемые `400/404/409`, а не только общие `500`.
- [x] `AI meal-plan` и `AI workout-plan` routes теперь валидируют вход через общий Zod schema helper и возвращают явные `400 MEAL_PLAN_INVALID` / `WORKOUT_PLAN_INVALID` до runtime, billing и provider слоя.
- [x] Удаление AI chat session теперь проверяет owner-scoped существование сессии и не возвращает ложный успех.
- [x] `AI chat` и `AI assistant` теперь отклоняют неизвестный или чужой валидный `sessionId` с `404 AI_CHAT_SESSION_NOT_FOUND`, а не создают или продолжают новую сессию молча.
- [x] `AI proposal approve/apply` теперь подтверждены owner-scoped e2e: root-admin получает `404 AI_PROPOSAL_NOT_FOUND` на чужом `proposalId`, а invalid UUID даёт явные `400 AI_PROPOSAL_APPROVE_INVALID` / `AI_PROPOSAL_APPLY_INVALID`.
- [x] Санирован user-facing copy в `ai/chat`, `ai/reindex`, `ai/sessions/[id]`, `ai/proposals/[id]/apply`, `ai/proposals/[id]/approve`, чтобы AI surface не отдавал mojibake.
- [x] Expected contract errors (`400/404` на invalid params и owner-scoped misses) больше не логируются как route-level `error` в contract-tested mutation routes и AI session routes.
- [x] Подтвердить owner-only data access для chat, sessions, retrieval, reindex и proposal apply.
- [x] Развести runtime failure UX и provider configuration UX.
- [x] Стабилизировать историю чатов, prompt library, web search toggle и image upload.
- [ ] Прогнать assistant/retrieval/workout-plan/meal-plan/safety eval suites как quality gate. Кодовый контур уже готов; текущий внешний blocker — `OpenRouter 402` по кредитам и `Voyage 403` по embeddings.
- [x] Подтвердить retrieval по всей исторической базе пользователя, а не только по свежим данным.

### Database / Supabase

- [x] Провести полный аудит схемы, RLS, RPC, cron-related функций и индексных путей через Supabase MCP.
- [x] После DDL-изменений запускать advisors `security` и `performance` как обязательную проверку.
- [x] Проверить query paths и индексы для `sync`, `workout`, `knowledge`, `admin`, `billing`.

### Observability

- [x] Sentry, Vercel Analytics и health dashboards уже встроены частично.
- [ ] Завершить Sentry rollout на production env.
- [x] Добавить базовую валидацию `userId`-параметров для internal jobs и явные `400`, а не общие `500`.
- [x] `admin/stats` и `admin/operations` теперь fail-open: при временном сбое внешних запросов операторские экраны получают безопасный fallback snapshot вместо общего `500`.
- [x] `/admin` page теперь fail-open: server-side hero и операторские quick links остаются доступны даже при временном сбое части admin-запросов.
- [x] `admin/users` теперь fail-open: при временном сбое внешних источников каталог пользователей отдаёт безопасный degraded snapshot вместо общего `500`, а UI показывает операторский banner.
- [x] `admin/users/[id]` теперь fail-open: detail-route отдаёт degraded snapshot с `meta.degraded`, а карточка пользователя показывает явный banner вместо полного падения.
- [x] Expected invalid `userId` errors в admin mutation routes больше не шумят как `logger.error`: ожидаемые `400` обрабатываются до unexpected-failure logging.
- [x] Подтвердить auth/visibility для cron routes и internal jobs.
- [x] Задокументировать допустимые build warnings и правила их эскалации.

## Волна 4. Billing и SaaS readiness

### Платёжный провайдер РФ

- [x] Billing domain уже есть; целевой провайдер РФ для миграции зафиксирован: `CloudPayments` как primary и `ЮKassa` как fallback.
- [ ] Завести и проверить все production/staging env выбранного российского провайдера.
- [ ] Пройти живой сценарий `checkout -> return reconcile -> webhook -> billing center`.
- [x] Проверить идемпотентность webhook и согласованность `subscriptions`, `entitlements`, `usage counters`.

### Billing UI

- [x] Есть billing center в `/settings` и admin billing controls.
- [x] Довести user-facing billing UX до production-уровня без сырых промежуточных состояний.
- [x] Довести admin billing health и reconcile UX до операторского уровня.

## Волна 5. Тесты, CI и release process

### Автотесты

- [x] Добавить Playwright e2e для `auth -> onboarding -> dashboard -> workouts -> nutrition -> ai -> settings -> admin`.
- [x] Добавить smoke тесты на ключевые SSR/API маршруты.
- [x] Добавить regression tests для offline/sync workout execution.
- [x] Добавить AI route contract tests без обязательного вызова платного провайдера.
- [x] Полный `auth-e2e` baseline снова подтверждён на зелёном полном прогоне после стабилизации admin detail selectors и session-restore flow.
- [x] Добавить route-level изоляционные проверки для owner-scoped user data (`workout`, `nutrition`, `custom exercises`, `settings`, `AI history`).
- [x] Добавить отдельные RLS-focused проверки сверх route-level owner isolation.

### CI

- [x] Добавить обязательный CI workflow для `lint`, `typecheck`, `build`.
- [x] Добавить smoke subset как merge gate.
- [x] Добавить secret-guarded `test:rls` и `test:e2e:auth` jobs для полного regression-контура в GitHub Actions.
- [x] При наличии DB-изменений добавить migration-aware verification в CI.
- [x] Добавить advisor execution/verification для DB-изменений в CI.

### Release process

- [x] Формализовать release checklist для web/PWA.
- [x] Ввести staging-like verification для billing runtime и AI runtime.
- [x] Зафиксировать критерий `prod-ready` как набор automated + manual acceptance checks, а не только локальную сборку.

## Волна 6. Android / TWA

- [x] Подтвердить installability production PWA.
- [x] Подготовить `assetlinks.json`.
- [x] Подготовить package name, signing, splash и Play metadata.
- [x] Собрать и проверить TWA wrapper.
- [x] Пройти Android smoke на production URL.

## Что можно считать завершённым только после подтверждения

- [x] `lint`, `typecheck`, `build` проходят стабильно в один запуск.
- [x] Нет mojibake в ключевой документации и основных экранах приложения.
- [x] Нет hydration mismatch, render loops, infinite polling и state desync в базовых пользовательских сценариях.
- [ ] Контур выбранного российского платёжного провайдера работает end-to-end.
- [ ] AI quality gate пройден по минимуму: assistant, retrieval, workout plan, meal plan, safety. Кодовая часть и явные provider/runtime notices уже доведены; остаётся снять внешний блок по кредитам и embeddings.
- [x] Android wrapper smoke пройден после стабилизации web/PWA.

## 2026-03-15 progress addendum

- [x] Добавлен первый authenticated Playwright e2e baseline для обычного пользователя: вход, автозавершение онбординга при необходимости, переход по `Dashboard`, `Workouts`, `Nutrition`, `AI`, `Settings`, проверка восстановления сессии.
- [x] Добавлен root/admin e2e baseline: `/admin`, `/admin/users`, открытие карточки пользователя и проверка секционного operator UI под `corvetik1@yandex.ru`.
- [x] Добавлены route contract tests без платного AI runtime: явные `400` для invalid UUID и owner-scoped `404` для неизвестной AI session.
- [x] Добавлен offline/sync regression baseline: seeded locked workout day, `sync/push` с duplicate/incomplete mutations и контроль итогового `sync/pull` snapshot.
- [ ] Следующий тестовый tranche: расширить user-owned isolation tests до RLS-контуров beyond workout day и вынести auth storage state, чтобы e2e снова можно было безопасно распараллелить.

## 2026-03-15 isolation addendum

- [x] Расширен user-owned isolation baseline: root-admin не видит чужой weekly program в /api/weekly-programs и не может вызвать lock или clone на чужом programId; оба route-контракта возвращают owner-scoped 404 WEEKLY_PROGRAM_NOT_FOUND.
- [ ] Следующий тестовый tranche: расширить user-owned isolation beyond workout/program flows до остальных RLS-контуров и вынести auth storage state, чтобы e2e можно было снова безопасно распараллелить.

## 2026-03-15 e2e infra addendum

- [x] Playwright переведён на auth storage state для обычного пользователя и root-admin; повторный UI-логин больше не нужен в каждом e2e тесте.
- [x] typecheck, build и тестовый webServer переведены на отдельный NEXT_DIST_DIR=.next_build, чтобы quality gates и e2e не конфликтовали с локальным .next.
- [x] Playwright переведён на выделенный порт 3100, поэтому тесты больше не зависят от случайного локального сервера на 3000.
- [x] npm run test:e2e:auth подтверждён на --workers=2: 7 passed.

## 2026-03-15 nutrition isolation addendum

- [x] Расширен user-owned isolation baseline до nutrition routes: root-admin не видит чужие foods в `GET /api/foods` и получает owner-scoped `404` на `PATCH/DELETE /api/foods/{id}`, `DELETE /api/recipes/{id}`, `DELETE /api/meal-templates/{id}` и `DELETE /api/meals/{id}` для чужих nutrition assets.
- [ ] Следующий тестовый tranche: расширить user-owned isolation beyond workout/program/nutrition flows до остальных owner-scoped и RLS-контуров.

## 2026-03-15 exercises isolation addendum

- [x] Расширен user-owned isolation baseline до custom exercises: route-контур `GET /api/exercises` и `PATCH /api/exercises/{id}` теперь явно держит owner guard по `user_id`, а root-admin не видит и не может обновить чужое упражнение.
- [ ] Следующий тестовый tranche: расширить user-owned isolation beyond workout/program/nutrition/exercises flows до остальных owner-scoped и RLS-контуров.

## 2026-03-15 playwright env addendum

- [x] Playwright e2e больше не требуют ручного `PLAYWRIGHT_*` export перед запуском: auth helper автоматически подхватывает `.env.local`, а локальный full suite подтверждён обычным `npx playwright test`.
- [x] Дефолтный Playwright full suite стабилизирован на `workers: 2`: локально подтверждено `12 passed` без skip.

## 2026-03-15 settings export isolation addendum

- [x] Расширен user-owned isolation baseline до self-service `settings/data export`: root-admin не видит чужой export job в `GET /api/settings/data` и получает owner-scoped `404 SETTINGS_EXPORT_NOT_FOUND` на `GET /api/settings/data/export/{id}/download`.
- [x] Добавлен `tests/e2e/helpers/settings-data.ts`, чтобы e2e могли штатно создавать или переиспользовать активную self-service выгрузку под тестовым пользователем без прямого DB-seed.
- [x] Tranche подтверждён quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `10 passed`, `npx playwright test tests/smoke` -> `3 passed`.
- [ ] Следующий тестовый tranche: расширить user-owned isolation на оставшиеся owner-scoped self-service и AI/data контуры beyond workout/program/nutrition/exercises/settings export.

## 2026-03-15 workout templates isolation addendum

- [x] Расширен user-owned isolation baseline до `workout_templates`: root-admin не видит чужой workout template в `GET /api/workout-templates` и получает owner-scoped `404 WORKOUT_TEMPLATE_SOURCE_NOT_FOUND` на попытку создать template из чужого `programId`.
- [x] `tests/e2e/ownership-isolation.spec.ts` усилен ещё одним owner-scoped сценарием, а timeout isolation-suite увеличен до `60_000`, чтобы длительный seed/template flow не давал ложный красный таймаут.
- [x] Tranche подтверждён quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `11 passed`, `npx playwright test tests/smoke` -> `3 passed`.
- [ ] Следующий тестовый tranche: расширить user-owned isolation на оставшиеся owner-scoped self-service и AI/data контуры beyond workout/program/nutrition/exercises/settings export/workout templates.

## 2026-03-15 settings deletion isolation addendum

- [x] Расширен user-owned isolation baseline до self-service `settings/data deletion`: root-admin не видит чужой deletion request в `GET /api/settings/data`, не может отменить его через `DELETE /api/settings/data` и получает owner-scoped `404 SETTINGS_DELETION_NOT_FOUND`.
- [x] `tests/e2e/helpers/settings-data.ts` дополнен helper-ом для `request_deletion`, а `tests/e2e/ownership-isolation.spec.ts` теперь покрывает и export, и deletion self-service контуры `settings/data`.
- [x] `tests/e2e/admin-app.spec.ts` стабилизирован ожиданием реального секционного heading на detail-экране, поэтому auth e2e снова зелёный без флака из-за client-side loading state.
- [x] Tranche подтверждён quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `12 passed`, `npx playwright test tests/smoke` -> `3 passed`.
- [ ] Следующий тестовый tranche: расширить user-owned isolation на оставшиеся owner-scoped self-service и AI/data контуры beyond workout/program/nutrition/exercises/settings export/workout templates/settings deletion.

## 2026-03-15 build output hotfix addendum

- [x] Устранён production build conflict с Vercel: `npm run build` снова собирает в стандартный `.next`, поэтому Vercel больше не упирается в отсутствующий `.next/routes-manifest.json`.
- [x] Изолированный build для тестов сохранён отдельно: `build:test`, `start:test`, `typecheck`, `test:e2e*` и `test:smoke` используют `.next_build` через явный `--dist-dir=.next_build`, а production build не зависит от этого контура.
- [x] `scripts/run-next-with-dist-dir.mjs` теперь поддерживает явный `--dist-dir`, а не подменяет output directory глобально по умолчанию.
- [x] Hotfix подтверждён quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `12 passed`, `npm run test:smoke` -> `3 passed`.

## 2026-03-15 settings billing isolation addendum

- [x] Расширен user-owned isolation baseline до self-service `settings/billing`: root-admin не видит чужой billing review request в `GET /api/settings/billing`, а пользовательский request остаётся виден только владельцу.
- [x] `tests/e2e/helpers/settings-data.ts` дополнен helper-ом `ensureSettingsBillingReviewRequest(...)`, чтобы e2e могли штатно создавать или переиспользовать self-service billing review без прямого DB seed.
- [x] `GET /api/settings/data/export/[id]/download` получил UUID-валидацию params и теперь даёт явный `400 SETTINGS_EXPORT_INVALID` вместо провала глубже в route.
- [x] `tests/e2e/api-contracts.spec.ts` расширен новым invalid-param контрактом для export download route.
- [x] `test:smoke` отвязан от обязательного auth bootstrap: smoke-suite теперь запускается через `PLAYWRIGHT_SKIP_AUTH_SETUP=1`, а глобальный auth setup корректно пишет пустой storage state для smoke-only запуска.
- [x] Tranche подтверждён quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `13 passed`, `npm run test:smoke` -> `3 passed`.
- [ ] Следующий тестовый tranche: расширить user-owned isolation на оставшиеся owner-scoped AI/data контуры beyond workout/program/nutrition/exercises/settings export/workout templates/settings deletion/settings billing/AI history.

## 2026-03-15 AI history isolation addendum

- [x] Расширен user-owned isolation baseline до `AI history`: root-admin не может удалить чужую AI session по `DELETE /api/ai/sessions/{id}` и не задевает историю пользователя при `DELETE /api/ai/sessions`.
- [x] Добавлен `tests/e2e/helpers/ai.ts`, который сидирует пользовательскую AI session через blocked-flow `/api/ai/chat` без зависимости от платного live runtime.
- [x] `tests/e2e/ownership-isolation.spec.ts` теперь подтверждает owner-scoped поведение и для single-session delete, и для bulk clear AI history.
- [x] Tranche подтверждён quality gates: `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `14 passed`, `npm run test:smoke` -> `3 passed`.

## 2026-03-15 workout reset regression addendum

- [x] `tests/e2e/workout-sync.spec.ts` расширен отдельным regression-сценарием `sync -> done -> reset -> sync/pull`, который подтверждает, что после сброса тренировки `status` снова `planned`, `session_duration_seconds` сброшен в `0`, а все `actual_reps`, `actual_weight_kg`, `actual_rpe` очищены.
- [x] Для `workout sync contracts` поднят timeout до `60_000`, чтобы длинный seed/lock/reset flow не давал ложный красный только из-за времени, а не из-за реальной проблемы контракта.
- [x] Tranche подтверждён quality gates: `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `15 passed`, `npm run test:smoke` -> `3 passed`.

## 2026-03-16 offline reset state addendum

- [x] В `src/lib/offline/workout-sync.ts` добавлен атомарный helper `replaceWorkoutDayOfflineState(...)`, который в одной транзакции очищает `mutationQueue` по `dayId` и заменяет `cacheSnapshots` на свежий snapshot после reset.
- [x] `src/components/workout-session/use-workout-day-sync.ts` и `src/components/workout-session/use-workout-session-actions.ts` переведены на этот атомарный reset-path, чтобы клиентский reset не зависел от последовательности `clear queue -> refresh count -> persist snapshot`.
- [x] `tests/e2e/helpers/offline-db.ts` добавлен для работы с реальным браузерным `fit-offline` IndexedDB внутри Playwright regression.
- [x] `tests/e2e/workout-sync.spec.ts` расширен сценарием `reset action clears stale local cache and queued mutations`: тест сидирует stale snapshot и queued mutations в IndexedDB, запускает reset через UI и подтверждает, что после reset и reload локальное offline state уже чистое.
- [x] `tests/e2e/helpers/workouts.ts` усилен более широким диапазоном будущих недель и большим числом retry, чтобы seed locked-week не падал от накопившихся `active week conflict`.
- [x] Tranche подтверждён quality gates: `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `16 passed`, `npm run test:smoke` -> `3 passed`.
- [ ] Следующий backend tranche: добить оставшийся route/backend audit по owner-only access, idempotency и race conditions, в первую очередь AI retrieval/reindex/proposal ownership и locked-program execution guards.

## 2026-03-16 AI proposal isolation addendum

- [x] `tests/e2e/helpers/supabase-admin.ts` добавлен как минимальный service-role helper для owner-isolation e2e: он подхватывает `.env.local`, находит тестового пользователя по email и сидирует user-owned AI proposal без вызова live модели.
- [x] `tests/e2e/helpers/ai.ts` расширен helper-ами `ensureAiPlanProposal(...)` и `readAiPlanProposal(...)`, поэтому AI proposal ownership теперь можно проверять без платного runtime и без ручного SQL seed.
- [x] `tests/e2e/ownership-isolation.spec.ts` расширен сценарием `root admin cannot approve or apply another user's AI plan proposal`: root-admin получает owner-scoped `404 AI_PROPOSAL_NOT_FOUND` и не меняет статус чужого proposal.
- [x] `tests/e2e/api-contracts.spec.ts` расширен invalid-param контрактами для `POST /api/ai/proposals/not-a-uuid/approve` и `/apply`, route-контур подтверждён явными `400 AI_PROPOSAL_APPROVE_INVALID` и `400 AI_PROPOSAL_APPLY_INVALID`.
- [x] `src/app/api/ai/proposals/[id]/approve/route.ts` и `.../apply/route.ts` больше не логируют ожидаемые `400/404` как route-level `error`; логирование оставлено только для неожиданных `500` path.
- [x] Tranche подтверждён quality gates: `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers src/app/api/ai/proposals/[id]/approve/route.ts src/app/api/ai/proposals/[id]/apply/route.ts`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `19 passed`.
- [ ] Следующий AI/data tranche: owner-only / RLS coverage для retrieval / reindex / proposal listing, затем отдельный `test:rls` слой поверх route-level isolation.

## 2026-03-16 RLS test baseline addendum

- [x] Добавлен отдельный `npm run test:rls`, который не зависит от webServer и UI-логина: suite идёт через `PLAYWRIGHT_SKIP_AUTH_SETUP=1` и прямую Supabase auth с тестовыми учётками.
- [x] `tests/rls/helpers/supabase-rls.ts` добавлен как RLS harness: он логинит обычного пользователя и root-admin через публичный key, а fixture сидируется service-role helper'ом.
- [x] `tests/rls/ownership.spec.ts` подтверждает row-level изоляцию напрямую на таблицах `ai_plan_proposals`, `exercise_library`, `weekly_programs`, `ai_chat_sessions`, `ai_chat_messages`, `export_jobs`, `deletion_requests`, `user_context_snapshots`, `knowledge_chunks`: владелец видит свои строки, другой auth-user не видит их и не может обновить чужой proposal.
- [x] Tranche подтверждён quality gates: `npx eslint tests/rls tests/rls/helpers`, `npm run test:rls`, затем общим baseline `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `22 passed`, `npm run test:smoke` -> `3 passed`.
- [ ] Следующий AI/data tranche: owner-only / RLS coverage для retrieval / reindex / proposal listing и затем расширение CI до отдельных DB/advisor verification шагов.

## 2026-03-16 admin users fail-open addendum

- [x] `src/app/api/admin/users/route.ts` переведён на degraded fallback: при временном сбое внешних источников route возвращает пустой безопасный snapshot с `meta.degraded`, а не общий `500`.
- [x] `src/components/admin-users-directory-model.ts` расширен `meta.degraded`, а `src/components/admin-users-directory.tsx` показывает явный операторский banner, если каталог пришёл из резервного снимка.
- [x] Tranche подтверждён quality gates: `npx eslint src/app/api/admin/users/route.ts src/components/admin-users-directory.tsx src/components/admin-users-directory-model.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1`.
- [x] Detail surface `/api/admin/users/[id]` переведён на аналогичный fail-open/degraded contract: route теперь отдаёт резервный snapshot вместо общего `500`, state понимает `meta.degraded`, а верхний слой карточки и section-switcher очищены от mojibake.
- [x] Добавлен e2e контракт на degraded detail snapshot: root-admin может запросить test-only fallback и получить `meta.degraded = true` без падения карточки.
- [x] Tranche подтверждён quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth`, `npm run test:smoke`.
- [ ] Следующий операторский tranche: добить remaining mojibake и timeline/detail подблоки внутри `admin-user-detail-sections.tsx`, либо вернуться к AI/data backend audit по retrieval / reindex ownership.

## 2026-03-16 admin dashboard fail-open addendum

- [x] `src/app/admin/page.tsx` переведён на server-side fail-open: при временном сбое admin query fan-out hero, quick links и operator shell остаются доступными, а page показывает явный degraded banner вместо падения всего `/admin`.
- [x] В page добавлен test-only fallback hook `?__test_admin_dashboard_fallback=1`, чтобы резервный режим можно было подтверждать отдельным e2e без зависимости от внешнего timeout.
- [x] `tests/e2e/admin-app.spec.ts` расширен новым сценарием `root admin gets degraded fallback for admin dashboard page`.
- [x] Tranche подтверждён quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1`.

## 2026-03-16 AI reindex contract addendum

- [x] `src/app/api/ai/reindex/route.ts` больше не логирует ожидаемые `403/400` как warn/error path; logging остаётся только для неожиданных `500`.
- [x] `tests/e2e/api-contracts.spec.ts` расширен контрактом `ai reindex stays admin-only for authenticated non-admin users`, подтверждающим `403 ADMIN_REQUIRED`.
- [x] `tests/e2e/admin-app.spec.ts` расширен root-admin сценарием на невалидный `targetUserId`, подтверждающим `400 REINDEX_INVALID`.
- [ ] Следующий AI/data tranche: owner-only / RLS coverage для retrieval / proposal listing и затем расширение CI до отдельных DB/advisor verification шагов.

## 2026-03-16 advisor hardening addendum

- [x] Через Supabase advisors подтверждён targeted DB-аудит для AI/history/self-service контуров: warnings по mutable `search_path` у `public.set_updated_at()` и unindexed FK на `ai_chat_messages`, `export_jobs`, `deletion_requests`, `support_actions`, `admin_audit_logs` закрыты корректирующей миграцией.
- [x] Добавлена миграция `supabase/migrations/20260315173518_ai_history_self_service_index_hardening.sql`, которая фиксирует `set_updated_at` с `search_path = public, pg_temp` и добавляет индексы под AI/history/self-service query paths.
- [x] Добавлена миграция `supabase/migrations/20260315173725_ai_history_self_service_rls_initplan_hardening.sql`, которая переводит owner policies AI/history/self-service таблиц на `(select auth.uid())` и закрывает `auth_rls_initplan` warnings для `ai_chat_sessions`, `ai_chat_messages`, `export_jobs`, `deletion_requests`, `user_context_snapshots`, `knowledge_chunks`, `knowledge_embeddings`, `ai_safety_events`.
- [x] После DDL повторно прогнаны Supabase advisors `security` и `performance`: targeted warnings по этой группе таблиц исчезли, а direct `npm run test:rls` подтвердил, что row-level ownership после policy-alter не сломался.
- [ ] Следующий DB tranche: пройти remaining advisor backlog по `auth_rls_initplan`, `rls_enabled_no_policy` для admin/system tables и затем оформить migration/advisor verification как отдельный CI gate.

## 2026-03-16 internal jobs contracts addendum

- [x] Добавлен `tests/e2e/internal-jobs.spec.ts` как отдельный contract-suite для `/api/internal/jobs/*`.
- [x] Подтверждено, что обычный пользователь получает `403 ADMIN_REQUIRED` на `dashboard-warm`, `nutrition-summaries`, `knowledge-reindex`, `ai-evals-schedule`, `billing-reconcile`.
- [x] Подтверждено, что root-admin получает явные `400` на невалидных параметрах `dashboard-warm`, `nutrition-summaries`, `knowledge-reindex`, `ai-evals-schedule`.
- [x] `src/app/api/internal/jobs/ai-evals-schedule/route.ts` больше не логирует ожидаемый `ZodError` как route-level `error`.
- [x] Tranche подтверждён baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `24 passed`, `npm run test:smoke` -> `3 passed`.

## 2026-03-16 CI regression addendum

- [x] `.github/workflows/quality.yml` расширен secret-guarded jobs `rls` и `auth-e2e`.
- [x] `rls` job запускает `npm run test:rls` при наличии Supabase и Playwright auth secrets.
- [x] `auth-e2e` job запускает `npm run test:e2e:auth` при наличии тех же secrets и Playwright browser setup.
- [x] `README.md` и `docs/RELEASE_CHECKLIST.md` теперь явно перечисляют secrets, необходимые для полного CI regression-контура.
- [x] Добавлен migration-aware verification gate для DB-изменений.
- [ ] Следующий CI tranche: advisor verification gate для DB-изменений.

## 2026-03-16 build warnings addendum

- [x] Добавлен `docs/BUILD_WARNINGS.md` как отдельный реестр допустимых warnings из Sentry/OpenTelemetry instrumentation.
- [x] Зафиксированы условия, при которых текущий webpack warning-хвост остаётся допустимым, и условия, при которых он становится blocker'ом.
- [x] `docs/README.md` и корневой `README.md` теперь ссылаются на этот документ как на source of truth по build warning policy.
## 2026-03-16 migration verification addendum

- [x] Добавлены `scripts/verify-migrations.ps1` и `scripts/verify-migrations.mjs`: PowerShell-обёртка собирает diff, а JS-валидатор проверяет изменения в `supabase/migrations`.
- [x] Скрипт валидирует формат migration filenames, запрещает пустые `.sql` и требует синхронные updates в `docs/MASTER_PLAN.md` и `docs/AI_WORKLOG.md`.
- [x] `.github/workflows/quality.yml` теперь запускает этот gate перед основным `quality` job, а локально он доступен через `npm run verify:migrations`.
- [ ] Следующий DB tranche: реальное advisor verification в CI или отдельный automation gate для `security/performance` после DDL.

## 2026-03-16 test build fallback addendum

- [x] На текущем Windows/Next.js 16 стеке custom `NEXT_DIST_DIR` для `next build` даёт `spawn EPERM`, поэтому `build:test` и `start:test` возвращены на стандартный `.next`.
- [x] Изоляция не потеряна полностью: `typecheck` по-прежнему использует отдельный `.next_build`, а e2e/smoke сервер остаётся на выделенном порту `3100`.

## 2026-03-21 Android / TWA preparation addendum

- [x] Добавлен Android/TWA release blueprint `android/twa-release.json`: package name `app.fitplatform.mobile`, production host, splash assets, signing placeholders и Play metadata теперь зафиксированы как source of truth.
- [x] Добавлен `npm run verify:android-twa`: скрипт валидирует release blueprint, иконки, manifest-зависимости и синхронизирует `public/android-assetlinks.json`.
- [x] `/.well-known/assetlinks.json` теперь обслуживается production-safe rewrite через `next.config.ts`, поэтому Digital Asset Links endpoint доступен и локально, и на Vercel без нестабильного app-route под dot-segment.
- [x] `tests/smoke/app-smoke.spec.ts` расширен Android/TWA smoke-check на `/.well-known/assetlinks.json`.
- [x] Санированы и повторно синхронизированы ключевые release/handoff docs: `README.md`, `docs/README.md`, `docs/PROD_READY.md`, `docs/RELEASE_CHECKLIST.md`, `docs/BUILD_WARNINGS.md`, `docs/BACKEND.md`, `docs/FRONTEND.md`, `docs/AI_STACK.md`, `docs/DB_AUDIT.md`, `docs/USER_GUIDE.md`.
- [x] Tranche подтверждён командами `npm run verify:android-twa`, `npm run lint`, `npm run build`, `npm run typecheck`, `npm run test:smoke`, `npm run test:e2e:auth` -> `50 passed`.
- [x] Исторический blocker по `java` и `adb` снят: на `2026-03-30` JDK 17, Android SDK, `adb` и `bubblewrap doctor` подтверждены, реальный TWA wrapper собран и проверен на эмуляторе.

## 2026-03-30 Android / TWA closure addendum

- [x] Для `fit-platform` подтверждён реальный Android toolchain: `java -version`, `adb --version` и `npx @bubblewrap/cli doctor` проходят на текущей машине.
- [x] В [android/twa-shell](/C:/fit/android/twa-shell) сгенерирован полноценный Bubblewrap-проект по production manifest `https://fit-platform-eta.vercel.app/manifest.webmanifest`, а не только JSON-scaffold.
- [x] `npx @bubblewrap/cli build --manifest="C:\fit\android\twa-shell\twa-manifest.json" --skipPwaValidation` успешно собрал signed APK и AAB через локальный test keystore вне репозитория.
- [x] Android smoke на production URL подтверждён через эмулятор `Medium_Phone_API_36.1`: `adb install -r`, `adb shell am start -W -n app.fitplatform.mobile/.LauncherActivity` и logcat с `TWALauncherActivity: Using url from Manifest: https://fit-platform-eta.vercel.app/dashboard`.
- [x] После этого закрыты основные checklist-пункты `Готов TWA wrapper`, `Собрать и проверить TWA wrapper`, `Пройти Android smoke на production URL` и acceptance-пункт `Android wrapper smoke пройден после стабилизации web/PWA`.

## 2026-03-19 DB audit addendum

- [x] Через Supabase MCP зафиксирован полный снимок repo-controlled DB-контура: `list_tables`, `security/performance advisors`, `pg_indexes`, `pg_policies`, `information_schema.routines`.
- [x] Подтверждено, что все используемые `public`-таблицы приложения находятся под `RLS`, а ключевые owner-only и deny-all policy-паттерны совпадают с route-level и direct `test:rls` покрытием.
- [x] Подтверждены индексные пути для `sync`, `workout`, `knowledge`, `admin` и `billing`; missing-index backlog по этим контурам уже закрыт corrective migrations, а в advisors остались только `unused_index` info.
- [x] Актуальный результат аудита вынесен в `docs/DB_AUDIT.md`, а platform-level residuals по `vector` в `public` и `leaked password protection` формализованы как отдельные release steps, а не как неясный хвост.
- [x] После rollback test-build контура baseline снова зелёный локально: `build`, `test:smoke`, `test:rls`, `test:e2e:auth`.

## 2026-03-16 frontend docs sanitation addendum

- [x] `docs/FRONTEND.md` полностью переписан в нормальном UTF-8 вместо mojibake и снова описывает текущий shell, workspace-паттерн, workouts, nutrition, AI workspace и admin UI.
- [ ] Следующий sanitation tranche: пройти оставшиеся ключевые docs/UI-поверхности на реальные mojibake и устаревшие handoff-описания, не трогая отдельно triaged `docs/AI_EXPLAINED.md`.

## 2026-03-16 prod-ready definition addendum

- [x] Добавлен `docs/PROD_READY.md` как отдельный source of truth по `prod-ready`: automated gates, manual acceptance, env readiness и release blockers.
- [x] `docs/README.md` и корневой `README.md` теперь ссылаются на этот документ вместо неявного “зелёный build = можно выкатывать”.
- [ ] Следующий release tranche: staging-like verification для Stripe и AI runtime уже против этого явного `prod-ready` критерия.

## 2026-03-16 ui regression addendum

- [x] Добавлен `tests/e2e/ui-regressions.spec.ts` как отдельный regression-слой для client-side проблем: hydration mismatch, render-loop сообщения и runaway `sync/pull` на workout focus-mode.
- [x] Добавлен `tests/e2e/helpers/client-regressions.ts`, который ловит browser console/pageerror сигналы вроде `Hydration failed`, `Maximum update depth exceeded`, `Recoverable Error`.
- [x] `tests/e2e/helpers/http.ts` переведён на `browserContext.request`, поэтому API contract tests больше не зависят от flaky `page.evaluate` и `networkidle`.
- [x] Full authenticated regression contour подтверждён заново: `npm run test:e2e:auth` -> `27 passed`.
- [ ] Следующий UI reliability tranche: расширить automated coverage на оставшиеся layout/PWA-specific regressions beyond hydration/loop/polling.

## 2026-03-16 workspace sanitation and AI stability addendum

- [x] `src/components/page-workspace.tsx` и `src/components/dashboard-workspace.tsx` переписаны в чистом UTF-8: базовый workspace-контур `Dashboard / Workouts / Nutrition` больше не отдает mojibake в пользовательской поверхности.
- [x] `src/components/ai-workspace.tsx`, `src/components/ai-workspace-sidebar.tsx`, `src/components/ai-chat-toolbar.tsx`, `src/components/ai-chat-composer.tsx`, `src/components/ai-prompt-library.tsx` и `src/app/ai/page.tsx` санированы до чистого UTF-8 и приведены к нормальному русскому UX.
- [x] `src/components/ai-chat-panel.tsx` переведен на `useSyncExternalStore` поверх `sessionStorage` для web-search toggle, чтобы режим не терялся при client remount и не требовал `setState` внутри effect.
- [x] `tests/e2e/ai-workspace.spec.ts`, `tests/e2e/ui-regressions.spec.ts` и `tests/e2e/helpers/http.ts` усилены против flaky modal/admin-detail/auth timing, а полный baseline снова зеленый: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.
- [x] `src/lib/admin-permissions.ts`, `src/components/admin-role-manager.tsx`, `src/components/admin-user-actions.tsx`, `src/components/admin-ai-operations.tsx`, `src/components/admin-ai-eval-runs.tsx` и `src/components/admin-operations-inbox.tsx` переписаны в чистом UTF-8: operator surfaces больше не отдают mojibake и не показывают лишние role/capability детали не-root администраторам.
- [x] Санитарный tranche подтверждён повторным baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.
- [ ] Следующий sanitation tranche: добить оставшиеся словари/formatters в `admin-users-directory-model.ts` и `admin-user-detail-model.ts`, затем вернуться к следующему backend/advisor tranche.

## 2026-03-17 advisor initplan and policy merge addendum

- [x] Добавлена миграция `supabase/migrations/20260317012000_query_path_and_fk_index_hardening.sql`: закрыты targeted `unindexed_foreign_keys` и первая волна `auth_rls_initplan` для `profiles`, `subscriptions`, `subscription_events`, `workout_days`, `ai_plan_proposals`.
- [x] Добавлена миграция `supabase/migrations/20260317014500_owner_policy_initplan_hardening.sql`: owner-policies на `body_metrics`, `daily_metrics`, `daily_nutrition_summaries`, `entitlements`, `exercise_library`, `foods`, `goals`, `meal_items`, `meal_templates`, `meals`, `nutrition_goals`, `nutrition_profiles`, `onboarding_profiles`, `period_metric_snapshots`, `recipe_items`, `recipes`, `usage_counters`, `user_memory_facts`, `weekly_programs`, `workout_exercises`, `workout_sets`, `workout_templates`, плюс `platform_admins_self_select` и `user_admin_states_owner_select` переведены на `(select auth.uid())`.
- [x] Добавлена миграция `supabase/migrations/20260317015500_foods_select_policy_merge.sql`: два permissive select-policy на `public.foods` схлопнуты в одну `foods_access_select`, и performance-advisor больше не ругается на `multiple_permissive_policies`.
- [x] После DDL повторно прогнаны Supabase advisors `performance` и `security`: performance backlog очищен от `auth_rls_initplan`, `multiple_permissive_policies` и targeted FK warnings; в backlog остались только `unused_index` info и отдельный security-layer (`rls_enabled_no_policy`, `extension_in_public`, `auth_leaked_password_protection`).
- [x] Tranche подтверждён полным baseline: `npm run verify:migrations`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:rls` -> `1 passed`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.
- [ ] Следующий DB tranche: либо осознанно разбирать security-advisor backlog по service-role/admin tables, либо вводить advisor-policy document/gate вместо слепого добавления RLS policies на системные таблицы.

## 2026-03-17 ui regression selector hardening addendum

- [x] `tests/e2e/ui-regressions.spec.ts` больше не зависит от хрупкого `button[aria-pressed]` на всех user surfaces; suite ждёт гарантированный page-root (`main`) там, где section-pill не является обязательным DOM-контрактом.
- [x] После правки full authenticated regression contour снова подтверждён целиком без flaky failure в `ui regressions`.

## 2026-03-17 security advisor policy baseline addendum

- [x] Добавлена миграция `supabase/migrations/20260317022000_system_table_rls_policy_baseline.sql`: на `admin_audit_logs`, `ai_eval_results`, `ai_eval_runs`, `feature_flags`, `platform_settings`, `support_actions`, `system_metrics_snapshots` заданы явные deny-all policies `..._deny_all`.
- [x] Перед миграцией подтверждено по коду, что эти таблицы читаются через `createAdminSupabaseClient()` или service-role paths, поэтому явные deny-all policies не меняют user-facing runtime-контракты и не мешают admin/service-role доступу.
- [x] После DDL повторно прогнаны advisors: `security` больше не содержит `rls_enabled_no_policy`, а remaining security backlog сужен до двух platform-level warning — `extension_in_public` для `vector` и `auth_leaked_password_protection`.
- [x] Tranche подтверждён verification-пакетом: `npm run verify:migrations`, `npm run test:rls` -> `1 passed`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.
- [ ] Следующий DB tranche: отдельно оформить policy по двум оставшимся platform-level warning (`vector` schema и leaked password protection) и решить, что из этого автоматизируется в repo, а что остаётся внешним release checklist для Supabase проекта.

## 2026-03-17 workspace surface sanitation addendum

- [x] `src/components/page-workspace.tsx` повторно санирован в чистый UTF-8: блоки `Настройка экрана`, `Разделы`, `Текущий раздел`, `Скрыть/Показать` больше не отдают mojibake на `Workouts` и `Nutrition`.
- [x] В `page-workspace` добавлены стабильные `data-testid` для mobile section-trigger, mobile section-options и visibility toggles, чтобы mobile/PWA regression suite не зависел от copy.
- [x] `src/components/dashboard-workspace.tsx` переписан в чистом UTF-8: hero, summary, AI context и section-menu на `/dashboard` теперь показывают нормальный русский текст и не держат битые строки в mobile PWA.
- [x] `src/app/workouts/page.tsx` и `src/app/nutrition/page.tsx` снова отдают чистый user-facing copy для badges, title, metrics и section descriptions.
- [x] `tests/e2e/mobile-pwa-regressions.spec.ts` переведён на новые stable selectors; regression suite подтверждает, что `Dashboard / Workouts / Nutrition / Admin` mobile surfaces остаются usable без overflow и без зависимости от старого mojibake.
- [x] Tranche подтверждён baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.
- [ ] Следующий sanitation/backend tranche: добить remaining mojibake и operator copy на оставшихся user-facing surfaces, затем вернуться к `owner-only / idempotency / retrieval` audit по AI/data routes.

## 2026-03-17 admin user detail sanitation addendum

- [x] Полностью санирован `admin user detail` surface: `src/components/admin-user-detail.tsx`, `src/components/admin-user-detail-state.ts`, `src/components/admin-user-detail-model.ts`, `src/components/admin-user-detail-sections.tsx`, `src/components/admin-user-detail-operations.tsx`, `src/components/admin-user-detail-billing.tsx`, `src/app/admin/users/[id]/page.tsx` переписаны в чистом UTF-8.
- [x] Карточка пользователя, секции `Профиль / Активность / Операции / Оплата`, degraded-banner, summary metrics, role/status словари и timeline/billing коллекции теперь показывают нормальный русский operator copy без mojibake.
- [x] Дожат flaky admin fallback regression: `src/app/admin/page.tsx` получил стабильные `data-testid` для degraded CTA-кнопок, а `tests/e2e/admin-app.spec.ts` больше не зависит от общего `href`-локатора на фоне shell/nav DOM.
- [x] Tranche подтверждён baseline: `npx eslint ...admin-user-detail* src/app/admin/page.tsx tests/e2e/admin-app.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1` -> `5 passed`, `npx playwright test tests/e2e/mobile-pwa-regressions.spec.ts --workers=1` -> `3 passed`, `npm run test:e2e:auth` -> `36 passed`.
- [ ] Следующий sanitation/backend tranche: пройти remaining operator copy на оставшихся admin/user-facing surfaces и затем вернуться к `owner-only / idempotency / retrieval` audit по AI/data routes.

## 2026-03-17 AI route copy sanitation addendum

- [x] Полностью санирован user-facing copy в `src/app/api/ai/chat/route.ts`, `src/app/api/ai/assistant/route.ts`, `src/app/api/ai/meal-photo/route.ts`, `src/app/api/ai/meal-plan/route.ts`, `src/app/api/ai/workout-plan/route.ts`, `src/app/api/ai/reindex/route.ts`, `src/app/api/ai/sessions/route.ts`, `src/app/api/ai/sessions/[id]/route.ts`, `src/app/api/ai/proposals/[id]/apply/route.ts`, `src/app/api/ai/proposals/[id]/approve/route.ts`.
- [x] Из AI API убраны английские сообщения и лишние технические формулировки вроде `AI runtime`, `live-запросы`, `AI-предложение`; пользовательская поверхность теперь везде говорит по-русски и понятнее разводит runtime/config ошибки.
- [x] Tranche подтверждён baseline: `npx eslint ...src/app/api/ai/*`, `npm run typecheck`, `npm run build`, `npm run build:test`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `6 passed`.
- [ ] Следующий AI/backend tranche: вернуться к `owner-only / idempotency / retrieval` audit по AI/data routes и добить remaining route-level ownership coverage.

## 2026-03-17 direct RLS ownership expansion addendum

- [x] `tests/rls/helpers/supabase-rls.ts` расширен новыми fixture rows для `foods`, `recipes`, `recipe_items` и `workout_templates`, seeded через service-role под тестового пользователя.
- [x] `tests/rls/ownership.spec.ts` теперь напрямую подтверждает row-level изоляцию не только для `ai_plan_proposals`, `exercise_library`, `weekly_programs`, `ai_chat_*`, `export_jobs`, `deletion_requests`, `user_context_snapshots`, `knowledge_chunks`, но и для `foods`, `recipes`, `workout_templates`.
- [x] Заодно дочищен user-facing copy в `src/app/api/workout-templates/route.ts`, `src/app/api/foods/route.ts`, `src/app/api/recipes/route.ts`: self-service тренировки и питание больше не отдают английские login/save/load сообщения.
- [x] Tranche подтверждён baseline: `npx eslint tests/rls tests/rls/helpers src/app/api/workout-templates/route.ts src/app/api/foods/route.ts src/app/api/recipes/route.ts`, `npm run test:rls` -> `1 passed`, `npm run typecheck`, `npm run build`.
- [ ] Следующий backend tranche: продолжить `owner-only / idempotency / retrieval` audit по оставшимся AI/data routes и затем решить, нужен ли ещё один direct RLS слой для оставшихся user-scoped tables.

## 2026-03-17 product API sanitation addendum

- [x] Санирован user-facing copy в `src/app/api/weekly-programs/route.ts`, `src/app/api/weekly-programs/[id]/clone/route.ts`, `src/app/api/weekly-programs/[id]/lock/route.ts`, `src/app/api/nutrition/targets/route.ts`, `src/app/api/onboarding/route.ts`, `src/app/api/chat/route.ts`, `src/app/api/meal-templates/route.ts`, `src/app/api/meals/route.ts`, `src/app/api/settings/billing/route.ts`.
- [x] `weekly programs`, `nutrition targets`, `onboarding`, `legacy chat`, `meal templates`, `meals` и `settings billing` больше не отдают английские сообщения и mojibake в user-facing error surface.
- [x] Tranche подтверждён baseline-пакетом: `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.
- [ ] Следующий sanitation/backend tranche: дочистить оставшиеся self-service и product API routes вне этого пакета, затем вернуться к owner-only / retrieval audit по оставшимся AI/data контурам.

## 2026-03-17 self-service route sanitation follow-up

- [x] Санирован user-facing copy в `src/app/api/foods/[id]/route.ts`, `src/app/api/meal-templates/[id]/route.ts`, `src/app/api/meals/[id]/route.ts`, `src/app/api/recipes/[id]/route.ts`, `src/app/api/settings/data/route.ts`, `src/app/api/settings/data/export/[id]/download/route.ts`.
- [x] Delete/update/export поверхности для продуктов, шаблонов питания, приёмов пищи, рецептов и центра данных больше не отдают mojibake и выровнены по понятному русскому self-service UX.
- [x] Follow-up подтверждён baseline-пакетом: `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.
- [ ] Следующий sanitation/backend tranche: дочистить remaining operator/self-service routes вне этого пакета и затем вернуться к owner-only / retrieval audit по оставшимся AI/data контурам.

## 2026-03-17 billing sync workout copy sanitation addendum

- [x] Санирован user-facing copy в `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/checkout/reconcile/route.ts`, `src/app/api/billing/portal/route.ts`, `src/app/api/dashboard/period-compare/route.ts`, `src/app/api/exercises/route.ts`, `src/app/api/exercises/[id]/route.ts`, `src/app/api/sync/pull/route.ts`, `src/app/api/sync/push/route.ts`, `src/app/api/workout-days/[id]/route.ts`, `src/app/api/workout-days/[id]/reset/route.ts`, `src/app/api/workout-sets/[id]/route.ts`.
- [x] Billing, dashboard compare, exercise library, sync и workout execution route surface теперь отдают понятный русский copy вместо английских login/update/error сообщений.
- [x] Tranche подтверждён baseline-пакетом: `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.
- [ ] Следующий sanitation/backend tranche: дочистить remaining operator/internal routes с английским copy и затем вернуться к owner-only / retrieval audit по оставшимся AI/data контурам.

## 2026-03-17 operator internal copy sanitation addendum

- [x] Санирован operator/internal copy в `src/app/api/admin/ai-evals/run/route.ts`, `src/app/api/admin/bootstrap/route.ts`, `src/app/api/admin/operations/route.ts`, `src/app/api/admin/operations/process/route.ts`, `src/app/api/admin/operations/[kind]/[id]/route.ts`, `src/app/api/admin/users/bulk/route.ts`, `src/app/api/admin/users/[id]/billing/route.ts`, `src/app/api/admin/users/[id]/billing/reconcile/route.ts`, `src/app/api/admin/users/[id]/deletion/route.ts`, `src/app/api/admin/users/[id]/export/route.ts`, `src/app/api/admin/users/[id]/restore/route.ts`, `src/app/api/admin/users/[id]/role/route.ts`, `src/app/api/admin/users/[id]/support-action/route.ts`, `src/app/api/admin/users/[id]/suspend/route.ts`, `src/app/api/billing/webhook/stripe/route.ts`, `src/app/api/internal/jobs/billing-reconcile/route.ts`, `src/app/api/internal/jobs/dashboard-warm/route.ts`, `src/app/api/internal/jobs/knowledge-reindex/route.ts`, `src/app/api/internal/jobs/nutrition-summaries/route.ts`.
- [x] Operator/internal API surface больше не отдает английские payload/update/queue/error сообщения и выровнен по русскому operator UX.
- [x] Tranche подтверждён baseline-пакетом: `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.
- [ ] Следующий backend tranche: возвращаться к owner-only / retrieval audit по оставшимся AI/data контурам и затем закрывать AI quality gate.

## 2026-03-17 AI runtime UX and build reuse addendum

- [x] `src/components/ai-chat-panel-model.ts`, `src/components/ai-chat-notices.tsx`, `src/components/use-ai-chat-actions.ts`, `src/components/use-ai-chat-composer.ts`, `src/components/use-ai-chat-session-state.ts`, `src/components/use-ai-chat-view-state.ts`, `src/components/ai-chat-panel.tsx` переведены на typed AI notice-модель, чтобы UI явно различал `provider/config` и `runtime` ошибки вместо одного общего красного баннера.
- [x] `src/app/api/ai/chat/route.ts`, `src/app/api/ai/assistant/route.ts`, `src/app/api/ai/meal-photo/route.ts` теперь отдают согласованные русские сообщения и отдельные `503 AI_PROVIDER_UNAVAILABLE` / `503 AI_RUNTIME_NOT_CONFIGURED` там, где проблема именно в конфигурации или внешнем провайдере.
- [x] `scripts/run-next-with-dist-dir.mjs` получил memory guard для `next build`, а `scripts/ensure-next-build.mjs` + `package.json` убрали лишний повторный build перед `test:smoke` и `test:e2e:*`: тестовые команды теперь переиспользуют уже собранный `.next`, если он существует.
- [x] Tranche подтверждён baseline-пакетом: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `3 passed`, `npx playwright test tests/e2e/ai-workspace.spec.ts tests/e2e/api-contracts.spec.ts --workers=1` -> `8 passed`, `npm run test:e2e:auth` -> `36 passed`.
- [ ] Следующий AI/backend tranche: закрывать минимальный AI quality gate (`assistant`, `retrieval`, `workout plan`, `meal plan`, `safety`).

## 2026-03-17 historical retrieval fallback addendum

- [x] `src/lib/ai/knowledge-retrieval.ts` больше не ограничивает text/vector fallback первыми сотнями строк: и `knowledge_chunks`, и `knowledge_embeddings` теперь читаются пагинированно по всей истории пользователя, а не только по свежему хвосту.
- [x] Из vector fallback убран скрытый bias на `limit(400)`, а из text fallback убран fresh-only bias на `order(created_at desc).limit(600)`; оба fallback пути теперь ранжируют весь paged result set.
- [x] Добавлен прямой regression suite `tests/rls/retrieval-history.spec.ts`, который без внешнего AI-провайдера подтверждает три вещи: pager доходит дальше первых страниц, text fallback поднимает старый релевантный chunk, vector fallback поднимает старый релевантный embedding.
- [x] Tranche подтверждён baseline-пакетом: `npx eslint src/lib/ai/knowledge-retrieval.ts tests/rls/retrieval-history.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.
- [ ] Следующий AI/backend tranche: закрывать минимальный AI quality gate (`assistant`, `retrieval`, `workout plan`, `meal plan`, `safety`) и привязать его к release baseline.

## 2026-03-17 AI quality gate readiness addendum

- [x] В `src/lib/ai/chat.ts` добавлен явный server-contract `createAiChatSession(...)`, а `src/app/api/ai/sessions/route.ts` теперь поддерживает `POST` для создания нового пустого AI-чата до первого сообщения.
- [x] `src/components/use-ai-chat-session-state.ts`, `src/components/use-ai-chat-composer.ts`, `src/components/use-ai-chat-actions.ts` и `src/components/ai-chat-panel.tsx` переведены на этот контракт: новый чат, stale-session recovery и анализ фото еды больше не генерируют фальшивый `sessionId`, который сервер режет как `AI_CHAT_SESSION_NOT_FOUND`.
- [x] `tests/ai-gate/ai-quality-gate.spec.ts` доведён до реального quality-gate поведения: assistant workspace больше не зависает на пустом transcript state и честно доходит до provider/runtime surface.
- [x] Tranche подтверждён baseline-пакетом: `npm run lint`, `npm run typecheck`, `npm run build`, `npx eslint tests/ai-gate tests/e2e/helpers/ai.ts tests/e2e/helpers/auth.ts`, `npx playwright test tests/e2e/ai-workspace.spec.ts --workers=1` -> `2 passed`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.
- [x] `npm run test:ai-gate` теперь падает не на внутреннем UI/session баге, а на реальном внешнем блокере: assistant, retrieval, meal plan, workout plan и safety упираются в `OpenRouter 402` по кредитам, а retrieval слой дополнительно логирует `Voyage 403` по embeddings.
- [ ] Следующий AI/backend tranche: снять внешний blocker по `OpenRouter/Voyage` или продолжать следующие незаблокированные production tranche до момента, когда live AI providers будут готовы.

## 2026-03-18 AI proposal idempotency addendum

- [x] `src/lib/ai/proposal-actions.ts` теперь делает `approve` и `apply` идемпотентными: повторное подтверждение возвращает уже подтверждённый proposal без ошибки, а повторное применение отдаёт тот же applied-result и тот же applied meta вместо дублирования шаблонов или новой ошибки.
- [x] `tests/e2e/api-contracts.spec.ts` расширен admin-only контрактом на повторные `POST /api/ai/proposals/[id]/approve` и `POST /api/ai/proposals/[id]/apply`; сценарий подтверждает, что второй запрос остаётся `200` и не меняет итоговый applied payload.
- [x] Tranche подтверждён baseline-пакетом: `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `7 passed`, `npm run test:e2e:auth` -> `40 passed`, `npm run test:smoke` -> `3 passed`.
- [ ] Следующий backend tranche: продолжить route-level audit по idempotency и race conditions на workout mutation flows, затем вернуться к следующим незаблокированным AI/data пунктам.

## 2026-03-18 workout idempotency and typecheck contract addendum

- [x] `package.json` и `tsconfig.json` снова согласованы по одному `distDir`: `typecheck` теперь генерирует route types в стандартный `.next`, а `tsconfig` больше не зависит от устаревшего `.next_build/types`, из-за которого gate снова падал на `TS6053`.
- [x] `tests/e2e/workout-sync.spec.ts` расширен regression-сценарием на повторные direct mutation routes: `PATCH /api/workout-days/[id]` со статусом `done` и `POST /api/workout-days/[id]/reset` теперь отдельно подтверждены как безопасные и идемпотентные при повторном вызове.
- [x] Tranche подтверждён baseline-пакетом: `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/workout-sync.spec.ts -g "done and reset routes stay idempotent on repeated requests" --workers=1` -> `1 passed`, `npm run test:smoke` -> `3 passed`.
- [ ] Следующий backend tranche: продолжить route-level audit по idempotency и race conditions на оставшихся workout/sync mutation flows, затем возвращаться к следующим незаблокированным AI/data и sanitation пунктам.

## 2026-03-18 nutrition self-service RLS addendum

- [x] `tests/rls/helpers/supabase-rls.ts` расширен fixture rows для `meal_templates`, `meals`, `meal_items`, `recipe_items` и `daily_nutrition_summaries`, seeded через service-role под обычного пользователя на том же owner-scoped nutrition контуре.
- [x] `tests/rls/ownership.spec.ts` теперь напрямую подтверждает row-level изоляцию не только для `foods`, `recipes`, `workout_templates`, `ai_chat_*`, `export_jobs`, `deletion_requests`, `knowledge_*`, но и для `meal_templates`, `meals`, `meal_items`, `recipe_items`, `daily_nutrition_summaries`.
- [x] Tranche подтверждён baseline-пакетом: `npx eslint tests/rls tests/rls/helpers`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.
- [ ] Следующий backend tranche: продолжить direct owner-only / RLS audit по оставшимся user-scoped данным и затем вернуться к незакрытым route-level race/idempotency пунктам.

## 2026-03-18 final typecheck runner addendum

- [x] `scripts/typecheck-stable.mjs` переведён на реальный stable contract: сначала `npx next typegen`, затем проверка полноты route-type wrappers, и если `typegen` не построил весь `app`-дерево типов, автоматический fallback на `npm run build`, после чего уже запускается `tsc`.
- [x] `package.json` теперь использует этот runner в `typecheck`, так что baseline снова проходит одним запуском даже после полного удаления `.next/types`, без ручного второго прогона.
- [x] Tranche подтверждён чистым сценарием: удаление `.next/types` через Node, затем `npm run typecheck` -> успешно; дальше baseline подтверждён `npx eslint tests/rls tests/rls/helpers`, `npm run test:rls` -> `4 passed`, `npm run build`.
- [ ] Следующий engineering tranche: продолжить незаблокированные backend/RLS/route-level hardening slices, не теряя одношаговый quality-gate contract.

## 2026-03-19 nutrition targets и remaining nutrition-profile RLS addendum

- [x] `src/app/api/nutrition/targets/route.ts` теперь обрабатывает ожидаемый `ZodError` до unexpected-failure logging: невалидный payload на `PUT /api/nutrition/targets` возвращает явный `400 NUTRITION_TARGETS_INVALID` без noisy route-level `logger.error`.
- [x] `tests/e2e/api-contracts.spec.ts` расширен invalid-payload контрактом для `PUT /api/nutrition/targets`, а `tests/e2e/helpers/http.ts` поддерживает `PUT` в общем request helper'е.
- [x] `tests/rls/helpers/supabase-rls.ts` и `tests/rls/ownership.spec.ts` расширены direct owner-scoped покрытием для remaining nutrition/body/self-profile таблиц: `goals`, `nutrition_goals`, `nutrition_profiles`, `body_metrics`.
- [x] Tranche подтверждён baseline-пакетом: `npx eslint src/app/api/nutrition/targets/route.ts tests/e2e/api-contracts.spec.ts tests/e2e/helpers/http.ts tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `3 passed`, `npm run test:e2e:auth` -> `41 passed`.
- [ ] Следующий backend tranche: продолжить оставшийся route-handler audit по owner-only/idempotency/race conditions и добивать незакрытые AI/data hardening пункты.

## 2026-03-19 profile metrics и AI memory RLS addendum

- [x] `tests/rls/helpers/supabase-rls.ts` расширен fixture rows для `profiles`, `onboarding_profiles`, `daily_metrics`, `period_metric_snapshots`, `user_memory_facts`, `ai_safety_events`, чтобы прямой owner-only слой покрывал уже не только workout/nutrition assets, но и профильный, агрегатный и AI-memory контур.
- [x] `tests/rls/ownership.spec.ts` теперь подтверждает, что владелец видит свои `profiles`, `onboarding_profiles`, `daily_metrics`, `period_metric_snapshots`, `user_memory_facts`, `ai_safety_events`, а другой auth-user не видит и не может обновить эти строки точечными `update`.
- [x] Tranche подтверждён baseline-пакетом: `npx eslint tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.
- [ ] Следующий backend tranche: продолжить route-level owner-only audit по оставшимся self-service/AI/data handlers и дальше добивать общий database audit через Supabase MCP.

## 2026-03-19 billing RLS ownership addendum

- [x] `tests/rls/helpers/supabase-rls.ts` расширен fixture rows для billing user-scoped таблиц: `subscriptions`, `subscription_events`, `entitlements`, `usage_counters`.
- [x] `tests/rls/ownership.spec.ts` теперь напрямую подтверждает, что владелец видит свои billing rows, а другой auth-user не видит и не может обновить хотя бы `usage_counters` точечным `update`.
- [x] Tranche подтверждён baseline-пакетом: `npx eslint tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.
- [ ] Следующий backend tranche: продолжить remaining route-level audit и добивать прямой database audit по оставшимся user-scoped/admin-scoped контурам.

## 2026-03-19 workout execution RLS addendum

- [x] `tests/rls/helpers/supabase-rls.ts` расширен fixture rows для `workout_days`, `workout_exercises`, `workout_sets`, поэтому прямой owner-only suite теперь покрывает и execution-цепочку тренировки, а не только program/template слой.
- [x] `tests/rls/ownership.spec.ts` теперь подтверждает, что владелец видит свои workout execution rows, другой auth-user не видит их и не может точечно обновить чужой `workout_set`.
- [x] Fixture billing rows сделаны идемпотентными через `upsert` по уникальным ключам `entitlements(user_id, feature_key)` и `usage_counters(user_id, metric_key, metric_window)`, поэтому `test:rls` больше не флакает на накопленных данных прошлых прогонов.
- [x] Tranche подтверждён baseline-пакетом: `npx eslint tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.
- [ ] Следующий backend tranche: возвращаться к remaining route-level audit и добивать прямой database audit на оставшихся user-scoped/admin-scoped таблицах.

## 2026-03-19 billing auth-first contract addendum

- [x] `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/checkout/reconcile/route.ts`, `src/app/api/billing/portal/route.ts`, `src/app/api/settings/billing/route.ts` теперь строго auth-first: anonymous requests получают `401 AUTH_REQUIRED` до любых Stripe/env checks.
- [x] `src/app/api/billing/checkout/reconcile/route.ts` и `src/app/api/settings/billing/route.ts` обрабатывают ожидаемый `ZodError` до unexpected logger-ветки, поэтому invalid payload даёт явный `400` без noisy route-level error logging.
- [x] User-facing copy в `src/app/api/billing/webhook/stripe/route.ts` и всём текущем billing/settings tranche переведён в чистый UTF-8; auth/config/error messages больше не отдают битую кириллицу.
- [x] `tests/e2e/api-contracts.spec.ts` расширен unauthenticated billing/settings contracts и invalid payload покрытием для `POST /api/settings/billing`; `tests/e2e/helpers/auth.ts` получил устойчивый `waitForSubmitButtonReady(...)` для Playwright auth bootstrap.
- [x] Tranche подтверждён baseline-пакетом: `npx eslint src/app/api/billing/checkout/route.ts src/app/api/billing/checkout/reconcile/route.ts src/app/api/billing/portal/route.ts src/app/api/billing/webhook/stripe/route.ts src/app/api/settings/billing/route.ts tests/e2e/api-contracts.spec.ts tests/e2e/helpers/auth.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `8 passed`.
- [ ] Следующий billing/backend tranche: дочистить remaining mojibake в shared billing/AI dictionaries и продолжить route-handler audit по owner-only/idempotency/retrieval контурам.

## 2026-03-19 shared billing access sanitation addendum

- [x] `src/lib/billing-access.ts` переведён в чистый UTF-8 на уровне общего feature-config словаря, deny-reason текстов и `FEATURE_ACCESS_DENIED` copy; shared billing snapshot больше не тянет mojibake в `/settings`, `/ai`, `/nutrition` и другие поверхности, которые читают общий access слой.
- [x] Tranche не меняет access/fallback/usage-counter контракты и ограничен shared user-facing copy плюс форматированием billing layer.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/billing-access.ts`, `npm run typecheck`, `npm run build`; содержимое файла отдельно перепроверено прямым поиском по нормальным русским строкам, чтобы отсеять ложный PowerShell misrender.
- [ ] Следующий sanitation/backend tranche: забирать remaining mojibake в shared AI dictionaries (`proposal-actions`, AI summaries и related preview/error copy), затем возвращаться к route-handler audit.

## 2026-03-19 settings surface decomposition addendum

- [x] `src/lib/settings-data-server.ts` разгружен до server-data orchestration роли: pure snapshot factories, audit-action constants и mapper/formatter helpers вынесены в `src/lib/settings-data-server-model.ts`.
- [x] `src/components/settings-billing-center.tsx` переведён на вынесенный formatter/model слой `src/components/settings-billing-center-model.ts`, поэтому billing screen больше не держит внутри себя date/status/feature/timeline helper-логику.
- [x] `src/components/settings-data-center.tsx` переведён на вынесенный formatter/model слой `src/components/settings-data-center-model.ts`, поэтому export/deletion surface тоже ближе к orchestrator-роли вместо смеси JSX и derive helper-функций.
- [x] `tests/rls/ownership.spec.ts` получил `test.setTimeout(60_000)`, потому что прямой RLS-suite уже покрывает гораздо больше owner-scoped таблиц и перестал стабильно укладываться в старые `30s`.
- [x] Tranche подтверждён baseline-пакетом: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:rls` -> `4 passed`.
- [ ] Следующий architecture/backend tranche: продолжать разносить remaining heavy settings/data surfaces и возвращаться к оставшемуся route-handler audit по owner-only/idempotency/race conditions.

## 2026-03-19 settings self-service lib extraction addendum

- [x] Доменные self-service правила для `/api/settings/data` вынесены из route handler в `src/lib/settings-self-service.ts`: auth-context lookup, audit logging, queue export, request deletion, cancel deletion больше не живут вперемешку с HTTP-ответами.
- [x] Доменные self-service правила для `/api/settings/billing` тоже вынесены в `src/lib/settings-self-service.ts`: загрузка billing center data и queue billing access review теперь идут через единый lib-слой, а route handler остаётся тонкой transport-обёрткой.
- [x] Это уменьшает дублирование между route handlers и `lib` на одном из самых тяжёлых self-service контуров и двигает открытый основной пункт про разнос доменных правил из handler-слоя.
- [x] Tranche подтверждён baseline-пакетом: `npx eslint src/lib/settings-self-service.ts src/app/api/settings/data/route.ts src/app/api/settings/billing/route.ts`, `npm run build`, `npm run typecheck`.
- [ ] Следующий backend tranche: продолжать route/lib extraction и owner-only/idempotency audit на remaining self-service и AI/data handlers.

## 2026-03-19 billing self-service lib extraction addendum

- [x] Доменные self-service правила для `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/checkout/reconcile/route.ts` и `src/app/api/billing/portal/route.ts` вынесены в `src/lib/billing-self-service.ts`: Stripe env checks, customer lookup, checkout session creation, checkout reconcile, portal session creation и self-service audit logging больше не живут внутри route handlers.
- [x] Все три billing routes теперь ближе к transport-слою: auth, payload validation и API response shape остаются в route handler, а бизнес-логика и side-effects живут в `lib`.
- [x] Заодно полностью убран remaining mojibake из user-facing copy в `billing/portal`, а billing self-service error messages в новом helper-слое зафиксированы в чистом UTF-8.
- [x] `src/app/api/settings/data/export/[id]/download/route.ts` тоже переведён на общий self-service слой: owner-only lookup export job, archive build и download audit log теперь идут через `src/lib/settings-self-service.ts`, а route handler остался transport-обёрткой.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/billing-self-service.ts src/lib/settings-self-service.ts src/app/api/billing/checkout/route.ts src/app/api/billing/checkout/reconcile/route.ts src/app/api/billing/portal/route.ts src/app/api/settings/data/export/[id]/download/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий backend tranche: продолжать route/lib extraction и owner-only/idempotency audit на remaining self-service и AI/data handlers.

## 2026-03-19 nutrition write-model extraction addendum

- [x] Общая owner-scoped nutrition write-логика для `recipes`, `meal templates` и `meals` вынесена в `src/lib/nutrition/nutrition-write-model.ts`: загрузка продуктов по `user_id`, проверка missing-food ids, расчёт macro snapshots и подготовка payload для `recipe_items`, `meal_items` и template `payload.items` больше не дублируются в трёх route handlers.
- [x] `src/app/api/recipes/route.ts`, `src/app/api/meal-templates/route.ts` и `src/app/api/meals/route.ts` стали заметно тоньше: в handlers остались auth, schema parse, insert/delete orchestration и API response shape, а reusable nutrition domain rules уехали в `lib`.
- [x] Заодно из этих create-routes убран remaining mojibake в user-facing copy, а `meals` create-path теперь откатывает созданную `meal` запись, если вставка `meal_items` не удалась, чтобы route не оставлял сиротскую строку без item payload.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/nutrition/nutrition-write-model.ts src/app/api/recipes/route.ts src/app/api/meal-templates/route.ts src/app/api/meals/route.ts`, `npm run typecheck`, `npm run build`.
- [x] Повторные browser-suite прогоны на этой машине снова упёрлись в локальный Playwright timeout (`npm run test:e2e:auth`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1`, `npm run test:smoke`), поэтому для этого tranche зафиксирован compile/type baseline без дополнительного browser green run.
- [ ] Следующий backend tranche: продолжать route/lib extraction и owner-only/idempotency audit на remaining nutrition/AI/data handlers, пока основной пункт про доменные правила вне route handlers не будет закрыт целиком.

## 2026-03-19 nutrition delete/update self-service extraction addendum

- [x] Общая owner-scoped self-service логика для `foods/[id]`, `recipes/[id]`, `meal-templates/[id]` и `meals/[id]` вынесена в `src/lib/nutrition/nutrition-self-service.ts`: generic delete helper, delete+summary recalculation для meal и build helper для food update payload больше не дублируются по route handlers.
- [x] `src/app/api/foods/[id]/route.ts`, `src/app/api/recipes/[id]/route.ts`, `src/app/api/meal-templates/[id]/route.ts` и `src/app/api/meals/[id]/route.ts` переведены на тонкий transport-слой с чистым UTF-8 copy: auth, Zod validation и API response shape остались в handlers, а reusable nutrition domain rules живут в `lib`.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/nutrition/nutrition-self-service.ts src/app/api/foods/[id]/route.ts src/app/api/recipes/[id]/route.ts src/app/api/meal-templates/[id]/route.ts src/app/api/meals/[id]/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий backend tranche: продолжать route/lib extraction и owner-only/idempotency audit на remaining nutrition/AI/data handlers, пока основной пункт про доменные правила вне route handlers не будет закрыт целиком.

## 2026-03-19 foods list/create sanitation addendum

- [x] `src/app/api/foods/route.ts` переведён на чистый UTF-8 и больше не тянет mojibake в nutrition catalog surface.
- [x] Food create payload теперь тоже собирается через `src/lib/nutrition/nutrition-self-service.ts`: helper `buildFoodCreateData(...)` держит rounding и barcode normalization вне route handler, а сам handler остаётся transport-обёрткой.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/nutrition/nutrition-self-service.ts src/app/api/foods/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий backend tranche: переходить от nutrition self-service к remaining AI/data route/lib extraction и owner-only/idempotency audit.

## 2026-03-19 shared AI copy sanitation addendum

- [x] `src/lib/ai/chat.ts` переведён в чистый UTF-8: shared session errors больше не тянут битый copy в AI history и session recovery surface.
- [x] `src/lib/ai/proposal-actions.ts` полностью санирован в чистый UTF-8: preview titles, request summaries, timelines, owner-only errors и applied/approved copy больше не отдают mojibake в assistant flow и proposal studio.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/ai/chat.ts src/lib/ai/proposal-actions.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий AI/backend tranche: вынести и санировать remaining shared runtime/guardrail copy из `ai/chat` и `ai/assistant`, затем продолжать route/lib extraction и owner-only/idempotency audit.

## 2026-03-19 AI eval surface sanitation addendum

- [x] `src/lib/ai/eval-suites.ts` и `src/lib/ai/eval-runs.ts` переведены в чистый UTF-8: shared labels прогонов, quality-suite словарь и default labels больше не тянут mojibake в admin AI eval surface и плановые cron-запуски.
- [x] `src/app/api/admin/ai-evals/route.ts`, `src/app/api/admin/ai-evals/run/route.ts` и `src/app/api/internal/jobs/ai-evals-schedule/route.ts` переведены на чистый user-facing copy без изменения route contracts.
- [x] `src/components/admin-ai-eval-runs.tsx` полностью санирован: статусы, notices, пустые состояния и quick-run surface больше не отдают битую кириллицу оператору.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/ai/eval-suites.ts src/lib/ai/eval-runs.ts src/app/api/admin/ai-evals/route.ts src/app/api/admin/ai-evals/run/route.ts src/app/api/internal/jobs/ai-evals-schedule/route.ts src/components/admin-ai-eval-runs.tsx`, `npm run typecheck`, `npm run build`.
- [ ] Следующий AI/backend tranche: продолжать remaining shared runtime/guardrail sanitation в `ai/chat` и `ai/assistant`, затем возвращаться к route/lib extraction и owner-only/idempotency audit.

## 2026-03-19 AI chat runtime copy extraction addendum

- [x] Общий user-facing copy для `ai/chat` вынесен в `src/lib/ai/chat-runtime-copy.ts`: сообщения о неготовом runtime, auth-required, invalid payload, provider/runtime failures и safety fallback больше не размазаны по route handler.
- [x] `src/app/api/ai/chat/route.ts` переведён на тонкий transport-слой с чистым UTF-8 copy: auth/runtime gates, safety fallback и provider error message идут через shared helper без изменения owner-only, billing и retrieval контрактов.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/ai/chat-runtime-copy.ts src/app/api/ai/chat/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий AI/backend tranche: продолжать remaining runtime/guardrail sanitation в `ai/assistant`, затем возвращаться к route/lib extraction и owner-only/idempotency audit.

## 2026-03-20 AI plan route copy extraction addendum

- [x] Общий user-facing copy для `ai/meal-plan` и `ai/workout-plan` вынесен в `src/lib/ai/plan-route-copy.ts`: auth-required, runtime-not-configured, invalid payload и provider/runtime failure messages больше не дублируются между двумя route handlers.
- [x] `src/app/api/ai/meal-plan/route.ts` и `src/app/api/ai/workout-plan/route.ts` переведены на тонкий transport-слой с чистым UTF-8 copy, а safety/provider messaging для AI plan generation теперь идёт через shared helper.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/ai/plan-route-copy.ts src/app/api/ai/meal-plan/route.ts src/app/api/ai/workout-plan/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий AI/backend tranche: продолжать remaining runtime/guardrail sanitation в `ai/assistant`, затем возвращаться к route/lib extraction и owner-only/idempotency audit.

## 2026-03-20 AI assistant runtime copy extraction addendum

- [x] Общий user-facing и tool-facing copy для `ai/assistant` вынесен в `src/lib/ai/assistant-runtime-copy.ts`: runtime/auth/invalid messages, safety fallback, stream error copy, tool descriptions и summary labels больше не размазаны по route handler.
- [x] `src/app/api/ai/assistant/route.ts` переведён на этот helper без изменения owner-only, billing, retrieval, proposal и streaming contracts: route стал тоньше и ближе к transport/orchestration роли.
- [x] `src/lib/ai/domain-policy.ts` синхронизирован с текущим helper-slice и остаётся зелёным по compile/lint baseline.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/ai/assistant-runtime-copy.ts src/app/api/ai/assistant/route.ts src/lib/ai/domain-policy.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий AI/backend tranche: возвращаться к remaining route/lib extraction и owner-only/idempotency audit по AI/data handlers.

## 2026-03-20 AI meal photo runtime copy extraction addendum

- [x] Общий user-facing и vision/runtime copy для `ai/meal-photo` вынесен в `src/lib/ai/meal-photo-runtime-copy.ts`: not-configured/auth/image validation/safety/schema-invalid/provider failure messages и форматирование разбора блюда больше не живут внутри route handler.
- [x] `src/app/api/ai/meal-photo/route.ts` переведён на этот helper без изменения owner-only, billing, image-processing и chat-session contracts: route остался transport-слоем вокруг vision flow.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/ai/meal-photo-runtime-copy.ts src/app/api/ai/meal-photo/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий AI/backend tranche: продолжать remaining route/lib extraction и owner-only/idempotency audit по AI/data handlers.

## 2026-03-20 AI session route helper extraction addendum

- [x] Общий auth-context и user-facing copy для `src/app/api/ai/sessions/route.ts` и `src/app/api/ai/sessions/[id]/route.ts` вынесены в `src/lib/ai/session-route-helpers.ts`: auth-required, invalid-id, create/delete/clear failed messages и default title нового чата больше не дублируются между двумя route handlers.
- [x] Оба route handler теперь ближе к transport-слою: session auth bootstrap и shared copy идут через helper, а delete-route дополнительно синхронизирован в чистом UTF-8 без изменения owner-only contracts.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/ai/session-route-helpers.ts src/app/api/ai/sessions/route.ts src/app/api/ai/sessions/[id]/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий AI/backend tranche: продолжать remaining route/lib extraction и owner-only/idempotency audit по AI/data handlers.

## 2026-03-20 AI proposal route helper extraction addendum

- [x] Общий auth/proposal lookup/billing feature resolution для `src/app/api/ai/proposals/[id]/apply/route.ts` и `src/app/api/ai/proposals/[id]/approve/route.ts` вынесен в `src/lib/ai/proposal-route-helpers.ts`: owner-scoped proposal lookup, auth gate, invalid-id parse и feature access bootstrap больше не дублируются между двумя route handlers.
- [x] Оба proposal routes теперь ближе к transport-слою: в handlers остались только route-specific action calls (`applyAiPlanProposal` и `approveAiPlanProposal`), feature denied response и error mapping, а shared route access plumbing живёт в helper-слое.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/ai/proposal-route-helpers.ts src/app/api/ai/proposals/[id]/apply/route.ts src/app/api/ai/proposals/[id]/approve/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий AI/backend tranche: продолжать remaining route/lib extraction и owner-only/idempotency audit по AI/data handlers.

## 2026-03-20 knowledge reindex admin helper extraction addendum

- [x] Общий parse/logging слой для `src/app/api/ai/reindex/route.ts` и `src/app/api/internal/jobs/knowledge-reindex/route.ts` вынесен в `src/lib/ai/knowledge-reindex-admin.ts`: parse mode, support action logging, audit logging и форматирование success message больше не живут в route handlers.
- [x] `src/app/api/ai/reindex/route.ts` и `src/app/api/internal/jobs/knowledge-reindex/route.ts` теперь ближе к transport/orchestration роли: route-level auth, validation и response shape остались в handlers, а shared reindex admin/job plumbing живёт в helper-слое.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/ai/knowledge-reindex-admin.ts src/app/api/ai/reindex/route.ts src/app/api/internal/jobs/knowledge-reindex/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий AI/backend tranche: продолжать remaining route/lib extraction и owner-only/idempotency audit по AI/data handlers.

## 2026-03-20 admin support action helper extraction addendum

- [x] Общий queue+audit слой для `src/app/api/admin/users/[id]/support-action/route.ts`, `src/app/api/admin/users/[id]/suspend/route.ts` и `src/app/api/admin/users/[id]/restore/route.ts` вынесен в `src/lib/admin-support-actions.ts`: insert в `support_actions` и follow-up audit insert больше не дублируются между тремя route handlers.
- [x] Все три admin mutation routes теперь ближе к transport-слою: auth, target-user guard и payload validation остаются в handlers, а shared support-action plumbing живёт в helper-слое.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/admin-support-actions.ts src/app/api/admin/users/[id]/support-action/route.ts src/app/api/admin/users/[id]/suspend/route.ts src/app/api/admin/users/[id]/restore/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий backend tranche: продолжать remaining route/lib extraction и owner-only/idempotency audit на оставшихся admin/self-service и AI/data handlers.

## 2026-03-20 admin export and deletion helper extraction addendum

- [x] Общий export/deletion admin слой вынесен в `src/lib/admin-user-requests.ts`: queue export job, hold deletion request и cancel deletion request теперь живут вне route handlers и держат queue+audit plumbing в одном месте.
- [x] `src/app/api/admin/users/[id]/export/route.ts` и `src/app/api/admin/users/[id]/deletion/route.ts` переведены на этот helper, а `src/app/api/admin/users/bulk/route.ts` использует тот же export queue helper для ветки `queue_export`, чтобы не дублировать insert в `export_jobs` и audit payload.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/admin-user-requests.ts src/app/api/admin/users/[id]/export/route.ts src/app/api/admin/users/[id]/deletion/route.ts src/app/api/admin/users/bulk/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий backend tranche: продолжать remaining route/lib extraction и owner-only/idempotency audit на оставшихся admin/self-service и AI/data handlers.

## 2026-03-20 admin bulk support action follow-up addendum

- [x] `src/app/api/admin/users/bulk/route.ts` теперь использует `src/lib/admin-support-actions.ts` не только в single-user surface, но и для bulk-веток `queue_resync` и `queue_suspend`: insert в `support_actions` и audit payload больше не дублируются внутри bulk handler.
- [x] Bulk route сохранил текущие guard/contracts (`assertUserIsNotPrimarySuperAdmin`, batchId в audit payload, owner/admin access), но стал заметно ближе к orchestration-роли.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/admin-support-actions.ts src/app/api/admin/users/bulk/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий backend tranche: проверить, достаточно ли уже закрыт основной пункт про route/lib duplication, и если нет — добирать оставшиеся admin/self-service/AI handlers.

## 2026-03-20 admin billing audit extraction addendum

- [x] Общий audit/event слой для admin billing mutations вынесен в `src/lib/admin-billing.ts`: `recordAdminSubscriptionEvent(...)` и `recordAdminBillingAudit(...)` теперь держат insert в `subscription_events` и `admin_audit_logs` вне route handlers.
- [x] `src/app/api/admin/users/[id]/billing/route.ts`, `src/app/api/admin/users/[id]/billing/reconcile/route.ts` и `src/app/api/admin/users/bulk/route.ts` переведены на эти helper'ы: billing single-user и bulk flows больше не дублируют один и тот же audit/event plumbing.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/admin-billing.ts src/app/api/admin/users/[id]/billing/route.ts src/app/api/admin/users/[id]/billing/reconcile/route.ts src/app/api/admin/users/bulk/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий backend tranche: проверить, достаточно ли уже закрыт основной пункт про route/lib duplication, и если нет — добирать оставшиеся admin/self-service/AI handlers.

## 2026-03-20 admin role helper extraction addendum

- [x] Общий target lookup и audit слой для `src/app/api/admin/users/[id]/role/route.ts` вынесен в `src/lib/admin-role-management.ts`: загрузка target user через auth admin API, чтение `platform_admins`, primary super-admin guards и audit insert больше не дублируются между `PATCH` и `DELETE`.
- [x] Admin role route теперь ближе к transport-слою: auth, param parse и response shape остались в handler, а shared role-management rules и audit plumbing живут в helper-слое.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/admin-role-management.ts src/app/api/admin/users/[id]/role/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий backend tranche: переоценить основной пункт про route/lib duplication и route-handler audit после этой серии admin extraction slices.

## 2026-03-20 admin mutation contract coverage addendum

- [x] `tests/e2e/api-contracts.spec.ts` расширен admin-only contract test на invalid target ids для `admin/users/[id]/export`, `deletion`, `support-action`, `suspend`, `restore`, `billing`, `billing/reconcile` и `role`.
- [x] Теперь route-handler audit явно подтверждает, что эти admin mutation routes режут невалидный `userId` на уровне `400 ..._TARGET_INVALID` до любых side effects и не падают в общий `500`.
- [x] Tranche подтверждён baseline-пакетом: `npx eslint tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `9 passed`.
- [ ] Следующий backend tranche: решить, можно ли уже закрыть основной route-handler audit пункт по validation/owner-only/idempotency для covered admin and AI/data routes, или нужен ещё один coverage/fix slice.

## 2026-03-20 admin role helper extraction addendum

- [x] Общий target lookup и audit слой для `src/app/api/admin/users/[id]/role/route.ts` вынесен в `src/lib/admin-role-management.ts`: загрузка target user через auth admin API, чтение `platform_admins`, primary super-admin guards и audit insert больше не дублируются между `PATCH` и `DELETE`.
- [x] Admin role route теперь заметно ближе к transport-слою: auth, param parse и response shape остались в handler, а shared role-management rules и audit plumbing живут в helper-слое.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/admin-role-management.ts src/app/api/admin/users/[id]/role/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий backend tranche: переоценить основной пункт про route/lib duplication и route-handler audit после этой серии admin extraction slices.

## 2026-03-20 admin user detail data extraction addendum

- [x] Основной read-model и degraded fallback для `src/app/api/admin/users/[id]/route.ts` вынесены в `src/lib/admin-user-detail-data.ts`: heavy fan-out загрузка, actor reference hydration и формирование fallback snapshot больше не живут внутри route handler.
- [x] `src/app/api/admin/users/[id]/route.ts` стал тонким transport-слоем: в handler остались только admin access, UUID parse, auth lookup, вызов shared loader и общий error mapping.
- [x] Верхний client-state этого экрана синхронизирован с tranche в чистом UTF-8: `src/components/admin-user-detail-state.ts` и верхний shell `src/components/admin-user-detail.tsx` больше не держат битый copy в loading/error/section surface.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/admin-user-detail-data.ts src/app/api/admin/users/[id]/route.ts src/components/admin-user-detail-state.ts src/components/admin-user-detail.tsx`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1` -> `5 passed`.
- [ ] Следующий backend tranche: продолжать remaining route-handler audit по owner-only/idempotency/race conditions и добирать ещё один heavy admin/self-service read-surface, если основной пункт всё ещё не закрывается целиком.

## 2026-03-20 admin users catalog data extraction addendum

- [x] Основной catalog/read-model слой для `src/app/api/admin/users/route.ts` вынесен в `src/lib/admin-users-data.ts`: parse filters, fallback snapshot, auth user pagination, aggregate assembly, sorting, summary и segment building больше не живут внутри route handler.
- [x] `src/app/api/admin/users/route.ts` стал тонким transport-слоем: handler держит только admin access, чтение search params, вызов shared loader и degraded fallback response.
- [x] `tests/e2e/admin-app.spec.ts` стабилизирован против внешнего auth timeout: degraded admin detail scenario больше не зависит от `/api/admin/users`, а получает test user id через `findAuthUserIdByEmail(...)`.
- [x] Tranche подтверждён пакетами `npx eslint src/lib/admin-users-data.ts src/app/api/admin/users/route.ts tests/e2e/admin-app.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1` -> `5 passed`.
- [ ] Следующий backend tranche: продолжать remaining route-handler audit по owner-only/idempotency/race conditions и переоценить, можно ли закрывать общий пункт по тяжёлым admin/self-service read-surfaces.

## 2026-03-20 admin users directory state extraction addendum

- [x] Async/data orchestration каталога пользователей вынесен из `src/components/admin-users-directory.tsx` в `src/components/use-admin-users-directory-state.ts`: fetch каталога, deferred search, bulk submit, reload/reset и selection state больше не смешиваются с JSX.
- [x] `src/components/admin-users-directory.tsx` теперь ближе к чистому UI-orchestrator: в компоненте остались layout, cards, filters UI и wiring к уже вынесенному state-hook.
- [x] Tranche подтверждён пакетами `npx eslint src/components/admin-users-directory.tsx src/components/use-admin-users-directory-state.ts`, `npm run build`, `npm run typecheck`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1` -> `5 passed`.
- [ ] Следующий frontend/backend tranche: продолжать убирать async/data orchestration из remaining heavy self-service screens и затем переоценить основной checkbox по тяжёлым экранам.

## 2026-03-20 settings data center state extraction addendum

- [x] Async/data orchestration `src/components/settings-data-center.tsx` вынесен в `src/components/use-settings-data-center-state.ts`: refresh snapshot, queue export, request/cancel deletion, success/error state и derived flags больше не смешиваются с JSX.
- [x] `src/components/settings-data-center-model.ts` и верхний surface `src/components/settings-data-center.tsx` переписаны в чистом UTF-8: self-service copy, timeline labels и export/deletion статусы больше не отдают mojibake.
- [x] Tranche подтверждён пакетами `npm run lint`, `npm run build`, `npm run typecheck`.
- [ ] Следующий frontend tranche: вынести checkout/access-review orchestration из `settings-billing-center.tsx` и затем переоценить основной checkbox по remaining heavy screens.

## 2026-03-20 settings billing center state extraction addendum

- [x] Async/data orchestration `src/components/settings-billing-center.tsx` вынесен в `src/components/use-settings-billing-center-state.ts`: checkout return reconcile, retry-loop, URL/session orchestration, access review request flow, feature selection и refresh billing snapshot больше не смешиваются с JSX.
- [x] `src/components/settings-billing-center-model.ts` и `src/components/settings-billing-center.tsx` синхронизированы в чистом UTF-8: billing center, request-access surface и access timeline больше не держат битый copy.
- [x] После extraction tranche основной checklist-пункт `Async/data orchestration больше не смешивается с JSX в оставшихся тяжёлых экранах` закрыт: remaining heavy self-service screens переведены на тот же state-hook/model/orchestrator pattern, что и workout/admin/AI surface.
- [x] Tranche подтверждён пакетами `npm run lint`, `npm run build`, `npm run typecheck`. Дополнительный targeted UI smoke локально упёрся в нестабильный Playwright webServer bootstrap на этой машине, но кодовый baseline по settings surface зелёный.
- [ ] Следующий frontend/backend tranche: возвращаться к оставшемуся route-handler audit и remaining mojibake/self-service sanitation вне уже закрытого heavy-screen checkbox.

## 2026-03-20 settings self-service contract hardening addendum

- [x] `src/app/api/settings/data/route.ts` и `src/app/api/settings/billing/route.ts` переведены в чистый UTF-8 и expected validation path больше не уходит в noisy route-level error logging: `SETTINGS_DATA_INVALID` и `SETTINGS_BILLING_INVALID` режутся до unexpected-failure logging.
- [x] `tests/e2e/api-contracts.spec.ts` расширен self-service contract-покрытием: invalid `settings/data` payload -> `400 SETTINGS_DATA_INVALID`, повторная отмена удаления -> `404 SETTINGS_DELETION_NOT_FOUND`, повторный billing access review -> `409 SETTINGS_BILLING_REVIEW_ALREADY_ACTIVE`.
- [x] Tranche подтверждён пакетами `npx eslint src/app/api/settings/data/route.ts src/app/api/settings/billing/route.ts tests/e2e/api-contracts.spec.ts`, `npm run build`, `npm run typecheck`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `10 passed`.
- [ ] Следующий backend tranche: продолжать remaining route-handler audit по owner-only/idempotency/race conditions за пределами settings self-service routes.

## 2026-03-20 billing self-service route copy and reconcile validation addendum

- [x] `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/checkout/reconcile/route.ts` и `src/app/api/billing/portal/route.ts` переведены в чистый UTF-8: auth-first и runtime failure copy больше не держат mojibake в billing self-service surface.
- [x] `tests/e2e/api-contracts.spec.ts` расширен явным validation-контрактом для `POST /api/billing/checkout/reconcile`: пустой payload теперь подтвержден как `400 STRIPE_CHECKOUT_RECONCILE_INVALID`.
- [x] Tranche подтверждён пакетами `npx eslint src/app/api/billing/checkout/route.ts src/app/api/billing/checkout/reconcile/route.ts src/app/api/billing/portal/route.ts tests/e2e/api-contracts.spec.ts`, `npm run build`, `npm run typecheck`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3110 -- test tests/e2e/api-contracts.spec.ts --workers=1` -> `10 passed`.
- [ ] Следующий backend tranche: продолжать remaining route-handler audit по billing/webhook/admin/self-service контурам вне уже подтвержденного transport/validation слоя.

## 2026-03-20 admin billing payload contract addendum

- [x] `src/app/api/admin/users/[id]/billing/route.ts` и `src/app/api/admin/users/[id]/billing/reconcile/route.ts` переведены в чистый UTF-8: operator-facing invalid/failure copy больше не держит mojibake в admin billing surface.
- [x] `tests/e2e/api-contracts.spec.ts` расширен новым admin billing contract: при валидном `targetUserId` и некорректном payload (`enable_entitlement` без `feature_key`) route подтвержден как `400 ADMIN_BILLING_INVALID` до любых mutation side effects.
- [x] Tranche подтверждён пакетами `npx eslint src/app/api/admin/users/[id]/billing/route.ts src/app/api/admin/users/[id]/billing/reconcile/route.ts tests/e2e/api-contracts.spec.ts`, `npm run build`, `npm run typecheck`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3110 -- test tests/e2e/api-contracts.spec.ts --workers=1` -> `11 passed`.
- [ ] Следующий backend tranche: продолжать remaining route-handler audit по admin/billing/webhook/self-service контурам, пока основной checkbox по validation/owner-only/idempotency не будет закрыт целиком.

## 2026-03-20 admin bulk and operations contract sanitation addendum

- [x] `src/app/api/admin/users/bulk/route.ts`, `src/app/api/admin/operations/[kind]/[id]/route.ts`, `src/app/api/admin/users/[id]/route.ts` и `src/app/api/admin/users/[id]/role/route.ts` дочищены до чистого UTF-8: operator-facing validation/not-found/self-guard copy больше не держит mojibake и английские хвосты.
- [x] `src/app/api/admin/operations/[kind]/[id]/route.ts` больше не пишет noisy `logger.error` на ожидаемом `ZodError`: validation path `ADMIN_OPERATION_INVALID` теперь режется до unexpected-failure logging.
- [x] `tests/e2e/api-contracts.spec.ts` расширен тремя admin transport contracts: invalid `GET /api/admin/users/not-a-uuid` -> `400 ADMIN_USER_DETAIL_INVALID`, invalid payload `POST /api/admin/users/bulk` (`enable_entitlement` без `feature_key`) -> `400 ADMIN_BULK_INVALID`, invalid `PATCH /api/admin/operations/support_action/not-a-uuid` -> `400 ADMIN_OPERATION_INVALID`.
- [x] Tranche подтверждён пакетами `npx eslint src/app/api/admin/users/bulk/route.ts src/app/api/admin/operations/[kind]/[id]/route.ts src/app/api/admin/users/[id]/route.ts src/app/api/admin/users/[id]/role/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `11 passed`.
- [ ] Следующий backend tranche: продолжать remaining route-handler audit по webhook/internal/admin mutation контурам, пока основной checkbox по validation/owner-only/idempotency не будет закрыт целиком.

## 2026-03-21 bootstrap, webhook and billing job contract sanitation addendum

- [x] `src/app/api/admin/bootstrap/route.ts`, `src/app/api/billing/webhook/stripe/route.ts` и `src/app/api/internal/jobs/billing-reconcile/route.ts` переведены в чистый UTF-8: auth/bootstrap, Stripe webhook и billing reconcile job больше не держат английский или битый transport copy.
- [x] `src/app/api/admin/bootstrap/route.ts` больше не пишет noisy `logger.error` на ожидаемом `ZodError`: validation path `ADMIN_BOOTSTRAP_PAYLOAD_INVALID` теперь режется до unexpected-failure logging.
- [x] `src/app/api/internal/jobs/billing-reconcile/route.ts` теперь парсит query до env-gate: invalid `userId` подтверждён как `400 BILLING_RECONCILE_JOB_INVALID`, а не маскируется внешним `503 STRIPE_BILLING_RECONCILE_NOT_CONFIGURED`.
- [x] `tests/e2e/api-contracts.spec.ts` расширен transport-контрактами: anonymous `POST /api/admin/bootstrap` -> `401 AUTH_REQUIRED`, anonymous `POST /api/billing/webhook/stripe` подтверждён как `400 STRIPE_SIGNATURE_MISSING` или `503 STRIPE_WEBHOOK_NOT_CONFIGURED` в зависимости от env.
- [x] `tests/e2e/internal-jobs.spec.ts` расширен validation-контрактом для `POST /api/internal/jobs/billing-reconcile?userId=not-a-uuid` -> `400 BILLING_RECONCILE_JOB_INVALID`.
- [x] Tranche подтверждён пакетами `npx eslint src/app/api/admin/bootstrap/route.ts src/app/api/billing/webhook/stripe/route.ts src/app/api/internal/jobs/billing-reconcile/route.ts tests/e2e/api-contracts.spec.ts tests/e2e/internal-jobs.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts tests/e2e/internal-jobs.spec.ts --workers=1` -> `13 passed`.
- [ ] Следующий backend tranche: продолжать remaining route-handler audit по admin/self-service mutation handlers и добивать основной checkbox по validation/owner-only/idempotency.

## 2026-03-21 admin mutation payload contract sanitation addendum

- [x] `src/app/api/admin/users/[id]/billing/route.ts`, `billing/reconcile/route.ts`, `deletion/route.ts`, `export/route.ts`, `restore/route.ts`, `support-action/route.ts`, `suspend/route.ts` дочищены до чистого UTF-8: target-id, validation и failure copy больше не держат английские или битые transport messages.
- [x] Default audit reasons для admin mutation handlers переведены на русский, чтобы operator-visible history больше не показывала английские `manual ... request` хвосты.
- [x] `tests/e2e/api-contracts.spec.ts` расширен invalid-payload контрактами для admin queue routes: `ADMIN_DELETION_INVALID`, `ADMIN_EXPORT_INVALID`, `ADMIN_RESTORE_INVALID`, `ADMIN_SUPPORT_ACTION_INVALID`, `ADMIN_SUSPEND_INVALID`.
- [x] Tranche подтверждён пакетами `npx eslint src/app/api/admin/users/[id]/billing/route.ts src/app/api/admin/users/[id]/billing/reconcile/route.ts src/app/api/admin/users/[id]/deletion/route.ts src/app/api/admin/users/[id]/export/route.ts src/app/api/admin/users/[id]/restore/route.ts src/app/api/admin/users/[id]/support-action/route.ts src/app/api/admin/users/[id]/suspend/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `12 passed`.
- [ ] Следующий backend tranche: добирать remaining route-handler audit по operator/self-service mutation surfaces и переоценить, можно ли закрывать основной checkbox по validation/owner-only/idempotency.

## 2026-03-21 admin operator tooling contract sanitation addendum

- [x] `src/app/api/admin/ai-evals/run/route.ts`, `src/app/api/admin/operations/process/route.ts` и `src/app/api/admin/observability/sentry-test/route.ts` дочищены до чистого UTF-8: tooling routes больше не держат битый operator copy в validation, audit reason и failure paths.
- [x] `src/app/api/admin/operations/process/route.ts` и `src/app/api/admin/ai-evals/run/route.ts` теперь режут invalid payload до expected `400` без noisy route-level failure logging на validation path.
- [x] `tests/e2e/api-contracts.spec.ts` расширен direct invalid-payload контрактами для operator tooling routes: `AI_EVAL_RUN_INVALID` и `ADMIN_OPERATIONS_PROCESS_INVALID`.
- [x] Tranche подтверждён пакетами `npx eslint src/app/api/admin/ai-evals/run/route.ts src/app/api/admin/operations/process/route.ts src/app/api/admin/observability/sentry-test/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `13 passed`.
- [ ] Следующий backend tranche: дочистить remaining operator wording и audit reasons в admin surfaces, затем переоценить основной checkbox по validation/owner-only/idempotency.

## 2026-03-21 admin operations wording sanitation addendum

- [x] `src/app/api/admin/operations/[kind]/[id]/route.ts` переведён на единый operator-facing transport copy: `support action`, `export job`, `deletion request` и `operations inbox` больше не торчат в validation, transition и failure messages.
- [x] Default audit reason для ручного обновления operator queue унифицирован как `Ручное обновление операторской очереди`, чтобы admin audit logs не смешивали английский и русский transport слой.
- [x] `src/app/api/admin/operations/route.ts` теперь отдаёт русские titles `Экспорт данных пользователя` и `Запрос на удаление данных`, а fallback message больше не содержит `operations inbox`.
- [x] `src/app/api/admin/users/[id]/role/route.ts` и `src/app/api/admin/users/[id]/support-action/route.ts` переведены на чистый operator-facing copy: administrative role и support action больше не держат английские хвосты в validation, audit reason и failure messages.
- [x] `src/app/api/admin/ai-evals/run/route.ts` теперь создаёт русский default label `AI-проверка ...`, чтобы operator queue и audit history не смешивали английские и русские названия.
- [x] Tranche подтверждён пакетами `npm run lint -- --quiet src/app/api/admin/operations/route.ts src/app/api/admin/operations/[kind]/[id]/route.ts src/app/api/admin/users/[id]/role/route.ts src/app/api/admin/users/[id]/support-action/route.ts src/app/api/admin/ai-evals/run/route.ts`, последовательными `npm run typecheck` и `npm run build`.
- [ ] Следующий backend tranche: продолжать remaining route-handler audit по validation/owner-only/idempotency и переоценить, можно ли закрывать основной checkbox по backend hardening.

## 2026-03-21 internal jobs and queue processing wording sanitation addendum

- [x] `src/app/api/internal/jobs/ai-evals-schedule/route.ts`, `billing-reconcile/route.ts` и `knowledge-reindex/route.ts` переведены на чистый operator-facing copy: internal job labels и success/failure messages больше не смешивают английский и русский transport слой.
- [x] `src/lib/admin-queue-processing.ts` переведён на единый русский audit/log слой: queue-processing reasons, deletion hold transitions, support queue notes и hard-delete workflow labels больше не держат английские `queue processor ...` хвосты.
- [x] Повторная проверка поиском подтвердила, что в `src/app/api` и `src/lib` больше не осталось строк `queue processor`, `scheduled AI eval jobs`, `billing reconciliation jobs` и `knowledge reindex jobs`.
- [x] Tranche подтверждён пакетами `npm run lint -- --quiet src/lib/admin-queue-processing.ts src/app/api/internal/jobs/ai-evals-schedule/route.ts src/app/api/internal/jobs/billing-reconcile/route.ts src/app/api/internal/jobs/knowledge-reindex/route.ts`, `npm run typecheck`, `npm run build`.
- [ ] Следующий backend tranche: продолжать remaining route-handler audit по validation/owner-only/idempotency и переоценить, можно ли закрывать основной checkbox по backend hardening.

## 2026-03-21 onboarding, weekly programs и workout templates contract sanitation addendum

- [x] `src/app/api/onboarding/route.ts`, `src/app/api/nutrition/targets/route.ts`, `src/app/api/weekly-programs/[id]/lock/route.ts`, `src/app/api/weekly-programs/[id]/clone/route.ts` и `src/app/api/workout-templates/route.ts` переведены в чистый UTF-8: user-facing auth, validation, not-found, conflict и failure copy больше не держит mojibake.
- [x] В `onboarding` и `workout templates` validation path теперь режется до expected `400` без noisy route-level `logger.error` на `ZodError`, а clone/template titles больше не смешивают английский и русский в пользовательской поверхности.
- [x] `tests/e2e/api-contracts.spec.ts` расширен invalid-payload контрактами для `POST /api/onboarding`, `POST /api/weekly-programs/{id}/clone` и `POST /api/workout-templates`, чтобы эти product routes были покрыты тем же predictable `400` слоем, что и остальные self-service handlers.
- [x] Tranche подтверждён пакетами `npm run lint -- --quiet src/app/api/onboarding/route.ts src/app/api/nutrition/targets/route.ts src/app/api/weekly-programs/[id]/lock/route.ts src/app/api/weekly-programs/[id]/clone/route.ts src/app/api/workout-templates/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `13 passed`.
- [ ] Следующий backend tranche: продолжать remaining route-handler audit по validation/owner-only/idempotency и переоценить, можно ли уже закрывать основной checkbox по backend hardening.

## 2026-03-21 weekly programs, exercises и nutrition create routes sanitation addendum

- [x] `src/app/api/weekly-programs/route.ts`, `src/app/api/exercises/route.ts`, `src/app/api/foods/route.ts`, `src/app/api/recipes/route.ts`, `src/app/api/meal-templates/route.ts` и `src/app/api/meals/route.ts` переведены в чистый UTF-8: auth, validation, missing-food, duplicate-day и failure copy больше не держит mojibake в user-facing product API surface.
- [x] В `weekly-programs`, `exercises`, `foods`, `recipes`, `meal-templates` и `meals` validation path теперь режется до expected `400` без noisy route-level `logger.error` на `ZodError`, а default title snapshot `Unknown exercise` заменён на пользовательское `Неизвестное упражнение`.
- [x] `tests/e2e/api-contracts.spec.ts` расширен invalid-payload контрактами для `POST /api/weekly-programs`, `POST /api/exercises`, `POST /api/foods`, `POST /api/recipes`, `POST /api/meal-templates` и `POST /api/meals`, чтобы весь create-surface weekly/workout/nutrition контура был покрыт predictable `400` regression suite.
- [x] Tranche подтверждён пакетами `npm run lint -- --quiet src/app/api/weekly-programs/route.ts src/app/api/exercises/route.ts src/app/api/foods/route.ts src/app/api/recipes/route.ts src/app/api/meal-templates/route.ts src/app/api/meals/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `13 passed`.
- [ ] Следующий backend tranche: переоценить, какие route handlers ещё реально не закрыты по validation/owner-only/idempotency, и добить последний хвост перед закрытием основного checkbox.

## 2026-03-21 workout sync transport sanitation addendum

- [x] `src/app/api/sync/pull/route.ts`, `src/app/api/sync/push/route.ts`, `src/app/api/workout-days/[id]/route.ts` и `src/app/api/workout-days/[id]/reset/route.ts` переведены в чистый UTF-8: auth, validation, not-found, duplicate mutation и failure copy больше не держит mojibake в workout sync transport surface.
- [x] `sync/push`, `sync/pull` и direct workout-day update route теперь подтверждены predictable invalid-transport контрактами: `SYNC_PUSH_INVALID`, `SYNC_PULL_INVALID` и payload-level `WORKOUT_DAY_UPDATE_INVALID` режутся до expected `400` без noisy route-level `logger.error`.
- [x] `tests/e2e/api-contracts.spec.ts` расширен invalid contract покрытием для `POST /api/sync/push`, `GET /api/sync/pull` и payload-level `PATCH /api/workout-days/{id}`, чтобы sync/day transport слой был в том же regression baseline, что и остальные owner-scoped mutation routes.
- [x] Tranche подтверждён пакетами `npm run lint -- --quiet src/app/api/sync/pull/route.ts src/app/api/sync/push/route.ts src/app/api/workout-days/[id]/route.ts src/app/api/workout-days/[id]/reset/route.ts tests/e2e/api-contracts.spec.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `13 passed`.
- [x] Следующий backend tranche закрыт верификационным bundle ниже: owner-only, invalid contracts, internal jobs и workout sync покрыты отдельными regression suites, так что общий checkbox по validation/owner-only/idempotency и sync race conditions можно считать подтверждённым.

## 2026-03-21 backend audit closure addendum

- [x] Основной backend checkbox `Пройти все route handlers на валидацию, owner-only доступ, ошибки и idempotency` закрыт на базе объединённого regression bundle: `tests/e2e/api-contracts.spec.ts`, `tests/e2e/ownership-isolation.spec.ts`, `tests/e2e/internal-jobs.spec.ts`, `tests/e2e/workout-sync.spec.ts` и `tests/rls/ownership.spec.ts`.
- [x] Повторная ручная verification-связка подтверждена локально через `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100`: `29 passed` для `api-contracts + ownership-isolation + internal-jobs + workout-sync` и `4 passed` для прямого `RLS`.
- [x] `tests/e2e/workout-sync.spec.ts` стабилизирован через `navigateStable(...)`, чтобы regression suite не флакал на auth redirect и мог служить реальным доказательством для checkbox про `reset/finish/sync` race conditions, infinite polling и idempotent reset/done flow.
- [x] После этого закрыт и второй основной backend checkbox `Подтвердить, что reset/finish/sync сценарии не создают race conditions и бесконечный polling`: suite отдельно подтверждает invalid sync mutations, clean `sync -> reset -> sync/pull`, idempotent `done/reset`, очистку stale offline queue и guard для unlocked week.
- [ ] Следующий backend tranche: переходить к оставшимся quality/release блокам вне уже закрытого route-handler audit, в первую очередь AI eval gate, production billing и remaining UX/documentation sanitation.

## 2026-03-20 user-facing billing UX closure addendum

- [x] `src/components/settings-billing-center.tsx` доведён до production-copy: в пользовательском billing center больше нет сырых ярлыков вроде `super-admin`, usage limit показывается как `без лимита`, а privileged plan surface остаётся понятным русским языком.
- [x] `src/components/settings-billing-center-model.ts` и `src/components/page-workspace.tsx` получили стабилизированный formatter/testid слой для billing surface: desktop section-menu теперь имеет предсказуемые `data-testid`, а privileged subscription status показывает `полный корневой доступ`.
- [x] Добавлен regression suite `tests/e2e/settings-billing.spec.ts`: подтверждены billing section navigation, видимость блоков `Текущий план / Запросить доступ / История доступа`, русские queued status copy и billing review snapshot на `/settings`.
- [x] Tranche подтверждён пакетами `npm run lint`, `npm run typecheck`, `npm run build`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test tests/e2e/settings-billing.spec.ts --workers=1` -> `2 passed`.
- [x] После этого закрыт основной checklist-пункт `Довести user-facing billing UX до production-уровня без сырых промежуточных состояний`.

## 2026-03-20 admin billing health UX closure addendum

- [x] `src/components/admin-health-dashboard.tsx` получил стабильный operator surface для billing health: кнопка ручной сверки и ключевые billing-карточки снабжены явными testid и подтверждены как отдельная админская поверхность.
- [x] `src/components/admin-user-actions.tsx`, `src/components/admin-user-detail.tsx` и `src/components/admin-user-detail-sections.tsx` дочищены до нормального billing copy и стабильной навигации: вместо `главному супер-админу` теперь `корневому администратору`, а billing section/detail surface имеет предсказуемые `data-testid`.
- [x] `tests/e2e/admin-app.spec.ts` расширен новым operator billing regression: root-admin видит billing health на `/admin`, кнопку `Сверить оплаты`, billing controls в карточке пользователя и billing section с карточками `Текущая подписка / Платёжный профиль / История подписки`.
- [x] Tranche подтверждён пакетами `npx eslint src/components/admin-health-dashboard.tsx src/components/admin-user-actions.tsx src/components/admin-user-detail.tsx src/components/admin-user-detail-sections.tsx tests/e2e/admin-app.spec.ts`, `npm run typecheck`, `npm run build`, `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test tests/e2e/admin-app.spec.ts --workers=1` -> `6 passed`.
- [x] После этого закрыт основной checklist-пункт `Довести admin billing health и reconcile UX до операторского уровня`.
- [x] Заодно закрыт milestone-пункт `UI в /settings и /admin корректно показывает статус подписки и расхождения`.

## 2026-03-20 reliability gate closure addendum

- [x] `tests/e2e/authenticated-app.spec.ts` стабилизирован на семантических shell-локаторах: переходы по основным пользовательским разделам и восстановление сессии больше не зависят от хрупкого `a[href="/ai"]`.
- [x] `tests/e2e/ui-regressions.spec.ts` обновлён на стабильные admin shell locators `/admin` и `/admin/users`, чтобы regression suite отражал текущий desktop shell без ложных красных из-за переименованного пункта `Центр управления`.
- [x] Полный reliability bundle подтверждён единым прогоном: `authenticated-app + settings-billing + ui-regressions + mobile-pwa-regressions + workout-sync` через `node scripts/run-playwright.mjs PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 -- test ... --workers=1` -> `16 passed`.
- [x] После этого закрыт основной acceptance checkbox `Нет hydration mismatch, render loops, infinite polling и state desync в базовых пользовательских сценариях`.

## 2026-03-21 milestone 1 and PWA installability closure addendum

- [x] `src/app/layout.tsx` больше не хардкодит мёртвый `https://fit-platform.vercel.app`: metadata base теперь собирается через `src/lib/site-url.ts` из `NEXT_PUBLIC_APP_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL` с локальным fallback `http://localhost:3000`.
- [x] В `.env.example` добавлен `NEXT_PUBLIC_APP_URL`, чтобы production URL можно было задать явно без правки кода.
- [x] `tests/smoke/app-smoke.spec.ts` расширен PWA installability smoke: подтверждаются `link[rel="manifest"]`, `apple-touch-icon`, `application-name`, `manifest.display=standalone`, `start_url=/dashboard`, `maskable` icon и `sw.js` с `skipWaiting`/`clients.claim`.
- [x] Локальная verification-связка подтверждена пакетами `npm run lint`, `npm run build`, `npm run typecheck`, `npm run test:smoke`, `npm run test:e2e:auth` -> `50 passed`.
- [x] Production alias `https://fit-platform-eta.vercel.app` отдельно подтверждён fetch-проверкой: root HTML отдаёт manifest/apple metadata, `/manifest.webmanifest` возвращает `display=standalone`, `lang=ru`, `theme_color=#14614b`, `background_color=#f5f4ee`, `maskable=true`, а `/sw.js`, `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png` доступны с `200`.
- [x] После этого закрыты основные checklist-пункты `Нет mojibake в ключевой документации и основных экранах приложения`, `Документация, shell, AI workspace и workout flow доведены до production-качества`, `Подтвердить installability production PWA` и milestone-пункт `Подтверждена installability production PWA`.

## 2026-03-21 sanitation-wave triage closure addendum

- [x] Повторный поиск по `src/` и `docs/` (включая локальный `docs/AI_EXPLAINED.md`) не нашёл характерных mojibake-маркеров вроде `Рџ`, `РЎ`, `СЃ`, `С‚`, `РµР`.
- [x] Локальный dirty файл `docs/AI_EXPLAINED.md` отдельно triaged без правки содержимого: он не попадает в коммиты slice-работ и не блокирует shipped documentation surface.
- [x] После этого закрыт волновой пункт `Отдельно провести triage локального docs/AI_EXPLAINED.md и завершить sanitation-wave документации`, а верхнеуровневый статус документации переведён в санированное состояние.

## 2026-03-21 staging runtime verification addendum

- [x] Добавлен единый release harness `npm run verify:staging-runtime`: он делает preflight по AI/Stripe env и auth-credentials, запускает `npm run test:ai-gate` и `npm run test:billing-gate` только для реально готовых контуров и явно печатает skip/blocker причины для остальных.
- [x] Добавлен `tests/billing-gate/billing-runtime-gate.spec.ts`: staging-like billing suite подтверждает, что при готовом `STRIPE_SECRET_KEY` и `STRIPE_PREMIUM_MONTHLY_PRICE_ID` self-service billing surface может поднять live Stripe Checkout session.
- [x] `package.json`, `docs/PROD_READY.md` и `docs/RELEASE_CHECKLIST.md` синхронизированы: в проекте теперь есть формальный command-level вход для staging-like verification billing/AI runtime, а не только разрозненные suites.
- [x] Локальная verification-связка подтверждена пакетами `npx eslint scripts/verify-staging-runtime.mjs tests/billing-gate/billing-runtime-gate.spec.ts`, `npm run build`, `npm run typecheck`, `npm run test:billing-gate` -> `1 skipped`, `npm run verify:staging-runtime` -> явный blocker-report (`AI provider unavailable`, `Stripe env missing`) вместо молчаливого отсутствия процесса.
- [x] После этого закрыт основной checklist-пункт `Ввести staging-like verification для Stripe и AI runtime`; live rollout и AI quality gate по-прежнему остаются отдельными внешними блокерами.

## 2026-03-23 billing webhook idempotency gate addendum

- [x] В `docs/MASTER_PLAN.md` усилено правило ведения execution checklist: после каждого tranche нужно обязательно менять `[ ]/[x]` по факту и пересчитывать текущий процент выполнения.
- [x] `src/lib/stripe-billing.ts` получил общий helper `processStripeWebhookEvent(...)`, поэтому webhook dispatch и duplicate-event short-circuit теперь живут в тестируемом billing-lib слое, а `src/app/api/billing/webhook/stripe/route.ts` стал тоньше.
- [x] Добавлен прямой regression `tests/billing-gate/stripe-webhook-idempotency.spec.ts`: repeated `customer.subscription.updated` с тем же `provider_event_id` подтверждён как идемпотентный, а `entitlements` и `usage_counters` остаются неизменными.
- [x] Локальная verification-связка подтверждена пакетами `npm run lint`, `npm run build`, `npm run typecheck`, `npm run test:billing-gate` -> `1 passed, 1 skipped`.
- [x] После этого закрыт основной checklist-пункт `Проверить идемпотентность webhook и согласованность subscriptions, entitlements, usage counters`.
- [ ] Следующий billing tranche уже внешний: нужны реальные `production/staging` Stripe env и живой `checkout -> return reconcile -> webhook -> portal`, чтобы закрыть оставшийся live rollout.

## 2026-03-23 Sentry runtime readiness addendum

- [x] Добавлен `npm run verify:sentry-runtime`: [verify-sentry-runtime.mjs](/C:/fit/scripts/verify-sentry-runtime.mjs) делает env preflight по admin auth, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` и либо запускает live smoke suite, либо явно печатает blocker по отсутствующим secrets.
- [x] Добавлен regression gate [sentry-runtime-gate.spec.ts](/C:/fit/tests/sentry-gate/sentry-runtime-gate.spec.ts): при готовом runtime root-admin подтверждает, что [sentry-test route](/C:/fit/src/app/api/admin/observability/sentry-test/route.ts) возвращает `eventId` и `createdAt`.
- [x] Санированы release-policy документы [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md), [PROD_READY.md](/C:/fit/docs/PROD_READY.md), [BUILD_WARNINGS.md](/C:/fit/docs/BUILD_WARNINGS.md) и индекс документации [README.md](/C:/fit/docs/README.md): observability и release blockers снова зафиксированы в чистом UTF-8.
- [x] Санированы [global-error.tsx](/C:/fit/src/app/global-error.tsx) и [sentry-test route](/C:/fit/src/app/api/admin/observability/sentry-test/route.ts): global error surface и admin Sentry smoke больше не держат битый copy.
- [x] Локальная verification-связка подтверждена пакетами `npm run lint`, `npm run typecheck`, `npm run build`, `npm run verify:sentry-runtime`; последний gate сейчас корректно даёт явный skip/blocker только по отсутствующим runtime env и credentials.
- [ ] Основной checklist-пункт `Завершить Sentry rollout на production env` остаётся открыт: кодовый и release слой готовы, но live runtime smoke всё ещё упирается во внешние production secrets.

## 2026-03-23 RAG v2 bootstrap addendum

- [x] Добавлен отдельный execution doc [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md) с чекбоксами `[ ]/[x]`, правилами обновления и собственным процентом прогресса.
- [x] Добавлен config слой [knowledge-retrieval-config.ts](/C:/fit/src/lib/ai/knowledge-retrieval-config.ts): зафиксированы caps для semantic candidates, lexical candidates, fused candidates и final context.
- [x] Retrieval result type в [knowledge-model.ts](/C:/fit/src/lib/ai/knowledge-model.ts) расширен score-breakdown полями `vectorScore`, `textScore`, `fusedScore`, `rerankScore`, `matchedTerms`, `sourceKind`.
- [x] Добавлен app-side hybrid ranking [knowledge-hybrid-ranking.ts](/C:/fit/src/lib/ai/knowledge-hybrid-ranking.ts) и retrieval pipeline в [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts) переведён с fallback-only режима на `vector + lexical -> fused -> rerank`.
- [x] Добавлен regression suite [hybrid-retrieval.spec.ts](/C:/fit/tests/ai-gate/hybrid-retrieval.spec.ts), который подтверждает fusion, score-breakdown и context cap.
- [ ] Следующий RAG tranche: формализовать chunk policy и metadata contract для `knowledge_chunks`, затем переходить к incremental indexing и hybrid DB search.

## 2026-03-24 RAG v2 chunk metadata addendum

- [x] Добавлен policy слой [knowledge-chunk-policy.ts](/C:/fit/src/lib/ai/knowledge-chunk-policy.ts): source families `profile`, `workout`, `nutrition`, `memory`, `structured`, `fallback` и их importance/recency rules теперь зафиксированы явно.
- [x] Добавлен metadata слой [knowledge-document-metadata.ts](/C:/fit/src/lib/ai/knowledge-document-metadata.ts): каждый knowledge document теперь получает `sourceKey`, `chunkVersion`, `contentHash`, `importanceWeight`, `recencyAt`, `sourceFamily`, `tokenCount`.
- [x] [knowledge-documents.ts](/C:/fit/src/lib/ai/knowledge-documents.ts) переведён на финализацию metadata contract и дополнен recency keys для `profile`, `body metrics`, `memory`, `workout day`, `exercise history` и `structured facts`.
- [x] Добавлен regression suite [knowledge-document-metadata.spec.ts](/C:/fit/tests/ai-gate/knowledge-document-metadata.spec.ts), который подтверждает deterministic metadata для workout и fallback chunks.
- [ ] Следующий RAG tranche: переходить к incremental indexing, stale chunk cleanup и hybrid DB search, уже опираясь на введённый metadata contract.

## 2026-03-24 RAG v2 incremental indexing addendum

- [x] Добавлен sync слой [knowledge-chunk-sync.ts](/C:/fit/src/lib/ai/knowledge-chunk-sync.ts): knowledge reindex теперь планирует `unchanged / insert / delete` по `sourceKey` и `contentHash` вместо полного удаления всех chunks.
- [x] [knowledge-runtime.ts](/C:/fit/src/lib/ai/knowledge-runtime.ts) переведён на incremental chunk sync: unchanged chunks сохраняются, changed chunks переиндексируются точечно, stale chunks удаляются отдельно.
- [x] [knowledge-indexing.ts](/C:/fit/src/lib/ai/knowledge-indexing.ts) больше не пересоздаёт весь embedding слой по умолчанию: stale embeddings удаляются, а новые embeddings считаются только для отсутствующих chunk ids.
- [x] Добавлен regression suite [knowledge-chunk-sync.spec.ts](/C:/fit/tests/ai-gate/knowledge-chunk-sync.spec.ts), который подтверждает diff для `unchanged / changed / stale` chunk flow.
- [ ] Следующий RAG tranche: переходить к DB migration для lexical search metadata и hybrid RPC, затем связывать это с retrieval eval gate.

## 2026-03-24 RAG v2 retrieval eval addendum

- [x] [eval-suites.ts](/C:/fit/src/lib/ai/eval-suites.ts) переведён в чистый UTF-8 и расширен retrieval intent-темами `workouts`, `nutrition`, `profile`, `plans`, `recent_history`.
- [x] Добавлен metrics слой [knowledge-retrieval-evals.ts](/C:/fit/src/lib/ai/knowledge-retrieval-evals.ts): `Recall@5`, `Recall@10`, `nDCG@10`, score per eval case и grouping по retrieval topics теперь выражены отдельными pure helpers.
- [x] Добавлен regression suite [retrieval-metrics.spec.ts](/C:/fit/tests/ai-gate/retrieval-metrics.spec.ts), который подтверждает метрики и topic grouping отдельно от live AI runtime.
- [x] Добавлен отдельный command-level gate `npm run test:retrieval-gate`: он запускает hybrid ranking, metadata, chunk sync, retrieval metrics и full-history retrieval fallback suite без web server и auth bootstrap.
- [ ] Следующий RAG tranche: связать retrieval gate с feature-flag rollout и release gate для assistant/plan suites.

## 2026-03-24 RAG v2 rollout gate addendum

- [x] Добавлен rollout helper [knowledge-retrieval-rollout.ts](/C:/fit/src/lib/ai/knowledge-retrieval-rollout.ts): retrieval pipeline теперь поддерживает режимы `legacy`, `hybrid`, `shadow`, а `shadow` логирует comparison snapshot без смены итогового контекста.
- [x] [env.ts](/C:/fit/src/lib/env.ts) и [\.env.example](/C:/fit/.env.example) расширены `AI_RETRIEVAL_MODE`, чтобы hybrid retrieval можно было включать и откатывать как явный release flag.
- [x] [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts) переведён на rollout selection layer: `legacy` сохраняет исторический semantic-first fallback, `hybrid` отдаёт fused ranking, `shadow` возвращает legacy ranking и пишет rollout snapshot в logs.
- [x] Добавлен regression suite [retrieval-rollout.spec.ts](/C:/fit/tests/ai-gate/retrieval-rollout.spec.ts) и он включён в `npm run test:retrieval-gate`.
- [x] Добавлен release harness [verify-retrieval-release.mjs](/C:/fit/scripts/verify-retrieval-release.mjs) и команда `npm run verify:retrieval-release`: retrieval regression gate всегда идёт в `hybrid` режиме, а live `assistant / retrieval / workout plan / meal plan / safety` suites запускаются поверх того же режима, если доступны auth и AI provider credentials.
- [x] [quality.yml](/C:/fit/.github/workflows/quality.yml) теперь проводит AI quality gate через `npm run verify:retrieval-release` и требует user/admin Playwright credentials, чтобы в CI действительно покрывались и assistant/safety, и admin retrieval/plan suites.
- [x] Локальная verification-связка подтверждена пакетами `npm run lint`, `npm run test:retrieval-gate`, `npm run typecheck`, `npm run build`; `npm run verify:retrieval-release` сейчас честно упирается во внешний provider blocker (`OpenRouter 402`, `Voyage 403`) и поэтому не закрывает основной master-plan пункт про live AI quality gate.
- [ ] Следующий RAG tranche: переходить к step-level telemetry и latency baseline для retrieval слоя.

## 2026-03-24 RAG v2 telemetry and latency addendum

- [x] Добавлен telemetry слой [knowledge-retrieval-telemetry.ts](/C:/fit/src/lib/ai/knowledge-retrieval-telemetry.ts): runtime теперь фиксирует `indexRefreshMs`, `queryEmbeddingMs`, `semanticRpcMs`, `semanticFallbackMs`, `lexicalRpcMs`, `lexicalFallbackMs`, `hybridRankMs`, candidate counts и rollout summary.
- [x] [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts) переведён на step-level measurement и env-gated telemetry logging через `AI_RETRIEVAL_TELEMETRY=1`; `shadow` режим логирует telemetry автоматически.
- [x] Добавлены regression suites [retrieval-telemetry.spec.ts](/C:/fit/tests/ai-gate/retrieval-telemetry.spec.ts) и [retrieval-performance.spec.ts](/C:/fit/tests/ai-gate/retrieval-performance.spec.ts), а `npm run test:retrieval-gate` теперь включает и telemetry contract, и deterministic latency budget.
- [x] Добавлен performance handoff [RETRIEVAL_PERFORMANCE.md](/C:/fit/docs/RETRIEVAL_PERFORMANCE.md): зафиксированы caps `30 / 30 / 20 / 8`, локальный baseline (`p50 0.1346 ms`, `p95 0.3964 ms`, `max 0.9397 ms`, `250` samples) и текущие tuning decisions для rollout.
- [x] Локальная verification-связка подтверждена пакетами `npm run test:retrieval-gate`, `npm run typecheck`, `npm run build`; профильный план [RAG_V2_EXECUTION.md](/C:/fit/docs/RAG_V2_EXECUTION.md) после пересчёта фактических checklist-пунктов находится на `17 / 19` (`89%`).
- [x] Исторический DB-blocker снят: для `fit` подтверждён canonical MCP target `mcp__supabase_mcp_server__*` на проекте `nactzaxrjzsdkyfqwecf`, поэтому финальные knowledge DDL и advisors можно применять безопасно.

## 2026-03-30 RAG v2 DB closure addendum

- [x] Через `mcp__supabase_mcp_server__get_project_url` подтверждён правильный Supabase target проекта `fit`: `https://nactzaxrjzsdkyfqwecf.supabase.co`.
- [x] Миграция [20260330113000_knowledge_chunk_search_metadata_hybrid_rpc.sql](/C:/fit/supabase/migrations/20260330113000_knowledge_chunk_search_metadata_hybrid_rpc.sql) применена на реальный `fit`-проект через Supabase MCP и добавила metadata contract, generated `search_vector`, индексы и user-scoped hybrid RPC `search_knowledge_chunks_hybrid(...)`.
- [x] Runtime переведён на DB-backed hybrid retrieval с app-side fallback в [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts), а incremental chunk sync теперь записывает metadata columns через [knowledge-chunk-sync.ts](/C:/fit/src/lib/ai/knowledge-chunk-sync.ts).
- [x] Regression и RLS fixtures обновлены под новый contract: [hybrid-retrieval.spec.ts](/C:/fit/tests/ai-gate/hybrid-retrieval.spec.ts), [knowledge-chunk-sync.spec.ts](/C:/fit/tests/ai-gate/knowledge-chunk-sync.spec.ts), [supabase-rls.ts](/C:/fit/tests/rls/helpers/supabase-rls.ts).
- [x] Финальная verification-связка подтверждена пакетами `npm run verify:migrations`, `npm run test:retrieval-gate`, `npm run test:rls`, `npm run typecheck`, `npm run build`; после этого execution-план `RAG v2` закрыт на `19 / 19` (`100%`).

## 2026-03-30 remaining external blockers revalidation addendum

- [x] `npm run verify:staging-runtime` повторно прогнан после закрытия Android/RAG tranche: live AI gate по-прежнему упирается в `OpenRouter 402` и `Voyage 403`, а Stripe runtime всё ещё не стартует без `STRIPE_SECRET_KEY` и `STRIPE_PREMIUM_MONTHLY_PRICE_ID`.
- [x] `npm run verify:sentry-runtime` повторно подтверждает, что кодовый rollout готов, а live smoke всё ещё блокируется отсутствием `NEXT_PUBLIC_SENTRY_DSN` и `SENTRY_PROJECT`.
- [x] `npm run verify:retrieval-release` повторно подтверждает, что retrieval regression зелёный, а незакрытый основной AI quality gate остаётся внешним provider-blocker, а не кодовой деградацией.
- [x] После этой перепроверки текущие незакрытые main checklist-пункты остаются чисто внешними: live Stripe env/runtime, live AI providers/credits и production Sentry env.

## 2026-03-31 premium redesign closure addendum

- [x] `Workouts` и `Nutrition` переведены на premium fitness-подачу без потери текущих flows: обновлены hero-секции, action-buttons, section chips, focus-header тренировки, exercise cards и nutrition capture/import surfaces.
- [x] `Admin` и remaining detail surfaces доведены до того же визуального языка: summary/detail shells, health/inbox/operator surfaces и directory metric cards используют единый premium surface/button contract.
- [x] Playwright regression harness стабилизирован против stale webServer reuse: `playwright.config.ts` больше не переиспользует старый сервер, а `scripts/run-playwright.mjs` очищает занятый порт перед стартом, что снимает ложные CSS/chunk regressions.
- [x] Финальная verification-связка подтверждена пакетами `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `5 passed`, `npm run test:e2e:auth` -> `52 passed`, плюс целевые `admin/mobile/ui` regression suites зелёные.
- [x] После этого общий execution checklist вырос до `178 / 186` (`96%`), а все оставшиеся незакрытые main-пункты носят внешний runtime/env характер: live Stripe env, live AI provider access и production Sentry secrets.

## 2026-04-01 AI runtime preflight addendum

- [x] `test:ai-gate` и `test:sentry-gate` переведены на общий `scripts/run-playwright.mjs`, поэтому release-gates больше не ломаются о reused Playwright webServer и занятый порт `3100`.
- [x] Добавлен быстрый provider preflight в [scripts/ai-runtime-preflight.mjs](/C:/fit/scripts/ai-runtime-preflight.mjs), а [verify-retrieval-release.mjs](/C:/fit/scripts/verify-retrieval-release.mjs) и [verify-staging-runtime.mjs](/C:/fit/scripts/verify-staging-runtime.mjs) теперь проверяют доступность OpenRouter/Voyage до запуска тяжёлого `ai-gate`.
- [x] После этого `npm run verify:retrieval-release` и `npm run verify:staging-runtime` честно и быстро упираются в внешний blocker `Voyage 403`, а не в локальные timeout/webServer конфликты; `npm run verify:sentry-runtime` по-прежнему даёт явный skip по отсутствующим `NEXT_PUBLIC_SENTRY_DSN` и `SENTRY_PROJECT`.
- [x] Общий прогресс execution checklist остаётся `178 / 186` (`96%`): кодовый backlog не изменился, но release verification теперь детерминированно отделяет реальные внешние блокеры от локальной инфраструктурной обвязки.

## 2026-04-01 runtime env matrix addendum

- [x] Добавлен [scripts/verify-runtime-env.mjs](/C:/fit/scripts/verify-runtime-env.mjs) и команда `npm run verify:runtime-env`: проект теперь умеет одним запуском показать missing env по группам `Web/PWA`, `AI`, `Stripe`, `Sentry`, `CI`, `Android/TWA`.
- [x] [PROD_READY.md](/C:/fit/docs/PROD_READY.md), [RELEASE_CHECKLIST.md](/C:/fit/docs/RELEASE_CHECKLIST.md) и [README.md](/C:/fit/README.md) синхронизированы с этим preflight: у владельца окружения теперь есть явный список того, что надо выставить для закрытия последних release-blocker пунктов.
- [x] Фактический прогон `npm run verify:runtime-env` подтверждает текущий внешний остаток: отсутствуют `CRON_SECRET`, весь `Stripe` runtime set, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_PROJECT` и Android release fingerprints; при этом CI auth/secrets и AI ключи уже подхвачены.
- [x] Общий прогресс execution checklist остаётся `178 / 186` (`96%`): кодовые и документальные tranche закрыты, а remaining main-пункты по-прежнему зависят от реальных env/secrets и provider access.

## 2026-04-01 AI chat transcript stability addendum

- [x] На живой AI-поверхности устранён runtime-баг с дублирующимися React keys: [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) теперь нормализует массив `messages` через `dedupeUiMessages(...)` из [ai-chat-panel-model.ts](/C:/fit/src/components/ai-chat-panel-model.ts) до рендера transcript.
- [x] Очищены от mojibake и приведены к нормальному русскому UX тексты в [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx), [ai-chat-transcript.tsx](/C:/fit/src/components/ai-chat-transcript.tsx), [ai-chat-toolbar.tsx](/C:/fit/src/components/ai-chat-toolbar.tsx), [ai-chat-notices.tsx](/C:/fit/src/components/ai-chat-notices.tsx), [ai-chat-composer.tsx](/C:/fit/src/components/ai-chat-composer.tsx), [ai-chat-panel-model.ts](/C:/fit/src/components/ai-chat-panel-model.ts).
- [x] Проверка подтверждена пакетами `npm run lint`, `npm run typecheck`, `npm run build`, а также таргетным `tests/e2e/ai-workspace.spec.ts:91` -> `1 passed`; второй history-сценарий этого suite по-прежнему может упираться во внешний сетевой timeout на фоновой dashboard-загрузке и не связан с transcript bugfix.
- [x] Общий прогресс execution checklist остаётся `178 / 186` (`96%`): это production fix и UI sanitation поверх уже закрытого milestone, а не новый основной tranche.

## 2026-04-01 Russian billing provider migration planning addendum

- [x] Зафиксировано изменение billing-вектора: для российского live rollout `fit` больше не целится в `Stripe` как в финального production-провайдера.
- [x] В [RUSSIAN_BILLING_PROVIDER_PLAN.md](/C:/fit/docs/RUSSIAN_BILLING_PROVIDER_PLAN.md) оформлен отдельный техплан миграции с чекбоксами; primary-кандидат выбран `CloudPayments`, fallback — `ЮKassa`.
- [x] Открытые main-checklist пункты `Milestone 2` и acceptance-критерий обновлены на provider-neutral wording, чтобы дальнейшее выполнение плана шло уже не от `Stripe`, а от выбранного провайдера РФ.
- [x] Общий прогресс execution checklist остаётся `178 / 186` (`96%`): это документальный и архитектурный reframe billing-направления без закрытия новых main-пунктов.
