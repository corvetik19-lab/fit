# Master Plan проекта `fit`

## Как использовать этот план

- `[x]` — сделано и подтверждено в коде, инфраструктуре или проверках.
- `[ ]` — ещё не сделано или не доведено до production-ready состояния.
- После каждого существенного tranche:
  - обновлять этот файл;
  - добавлять короткую запись в `docs/AI_WORKLOG.md`;
  - синхронизировать профильные документы в `docs/`, если меняется контракт, архитектура или release-процесс.

Этот файл — текущий production-hardening backlog проекта. Он отражает фактическое состояние репозитория на `2026-03-14`.

Текущий прогресс execution checklist: `142 / 176` (`81%`).

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
- [x] Есть минимальный regression-контур сверх smoke: auth/admin e2e, API contracts, RLS, workout sync и UI regression suites.
- [ ] Первый production milestone ещё не закрыт.

## Milestones

### Milestone 1 — Stable Web/PWA

- [x] Стабильные локальные engineering gates: `lint`, `typecheck`, `build`.
- [x] Есть smoke baseline для ключевых маршрутов.
- [x] Ключевые пользовательские и админские сценарии проходят без hydration loops, infinite polling и layout regressions.
- [ ] Документация, shell, AI workspace и workout flow доведены до production-качества.
- [x] Есть минимальный automated regression contour сверх smoke.

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
- [ ] Отдельно провести triage локального `docs/AI_EXPLAINED.md` и завершить sanitation-wave документации.

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
- [ ] Async/data orchestration больше не смешивается с JSX в оставшихся тяжёлых экранах.
- [ ] Доменные правила больше не дублируются между route handlers и `lib`.

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

### Workout execution

- [x] Есть focus-mode и пошаговое выполнение тренировки.
- [x] Видны все шаги тренировки, будущие шаги заблокированы.
- [x] Сохранение упражнения требует полностью заполненных подходов.
- [x] Есть таймер с лимитом 2 часа и корректный сброс тренировки.
- [ ] Focus-mode на мобильной PWA доведён до эталонного UX без лишнего chrome и визуального шума.
- [x] Сброс, сохранение, завершение и редактирование пройдены повторно как regression-critical сценарии.

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
- [ ] Пройти все route handlers на валидацию, owner-only доступ, ошибки и idempotency.
- [ ] Подтвердить, что reset/finish/sync сценарии не создают race conditions и бесконечный polling.
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

- [ ] Провести полный аудит схемы, RLS, RPC, cron-related функций и индексных путей через Supabase MCP.
- [x] После DDL-изменений запускать advisors `security` и `performance` как обязательную проверку.
- [ ] Проверить query paths и индексы для `sync`, `workout`, `knowledge`, `admin`, `billing`.

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
- [ ] Ввести staging-like verification для Stripe и AI runtime.
- [x] Зафиксировать критерий `prod-ready` как набор automated + manual acceptance checks, а не только локальную сборку.

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
- [ ] AI quality gate пройден по минимуму: assistant, retrieval, workout plan, meal plan, safety. Кодовая часть и явные provider/runtime notices уже доведены; остаётся снять внешний блок по кредитам и embeddings.
- [ ] Android wrapper smoke пройден после стабилизации web/PWA.

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
