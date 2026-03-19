# AI Worklog

## Как читать этот файл

- Это не полный исторический дамп всех мелких правок.
- Во время production hardening журнал был сжат и переписан в чистый UTF-8.
- Ниже остаются только ключевые tranche, которые помогают понять текущее состояние продукта и инженерного контура.

## 2026-03-17

### Release docs sanitation and AI reindex copy

- Переписал `docs/RELEASE_CHECKLIST.md`, `docs/PROD_READY.md` и `docs/BUILD_WARNINGS.md` в чистом UTF-8, чтобы release-policy документы снова были пригодны как source of truth, а не содержали mojibake.
- Зафиксировал в release docs два оставшихся platform-level Supabase ручных шага: leaked password protection и осознанное решение по `vector` extension в `public`.
- В `src/app/api/ai/reindex/route.ts` санировал audit reason и user-facing сообщения, чтобы manual reindex path больше не возвращал битую кириллицу в support/admin surface.
- Tranche подтверждён baseline-проверками: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth`, `npm run test:smoke`.

## 2026-03-16

### Admin detail sanitation and regression stabilization

- Полностью санировал `admin user detail` surface в чистый UTF-8: переписал `src/components/admin-user-detail.tsx`, `admin-user-detail-state.ts`, `admin-user-detail-model.ts`, `admin-user-detail-sections.tsx`, `admin-user-detail-operations.tsx`, `admin-user-detail-billing.tsx` и `src/app/admin/users/[id]/page.tsx`.
- Убрал mojibake и сырой operator copy из summary shell, section tabs, profile/activity/operations/billing блоков, словарей статусов и пользовательских fallback-сообщений.
- Добавил стабильный degraded selector `data-testid="admin-user-detail-degraded-banner"` и перевёл `tests/e2e/ui-regressions.spec.ts` на явную проверку clean admin fallback вместо старого текстового mojibake-поиска.
- Переписал `tests/e2e/ai-workspace.spec.ts` и `tests/e2e/mobile-pwa-regressions.spec.ts` в чистый UTF-8 и стабилизировал flaky места: web search toggle теперь проходит с retry-нажатием, а mobile focus-mode не зависит от старых битых текстовых селекторов.
- Tranche подтверждён полным baseline: `npm run lint`, `npm run typecheck`, `npm run build`, targeted `admin/ui/mobile` Playwright suites, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.

### Autonomous tranche execution contract

- В `AGENTS.md` зафиксирован рабочий режим без лишних пауз: агент должен идти tranche-by-tranche по `MASTER_PLAN`, после каждого куска обновлять docs, коммитить, пушить и сразу брать следующий открытый пункт.
- Останавливаться теперь допустимо только на реальном внешнем блокере: отсутствующий доступ, секреты, платный провайдер или недоступный внешний сервис.

### AI plan route validation and auth-e2e stabilization

- В `src/lib/ai/schemas.ts` добавлены общие request schemas для `meal-plan` и `workout-plan`, чтобы AI plan routes валидировали payload до billing/runtime слоя и не смешивали в route handler ручной parsing с доменными правилами.
- `src/app/api/ai/meal-plan/route.ts` и `src/app/api/ai/workout-plan/route.ts` теперь возвращают явные `400 MEAL_PLAN_INVALID` / `WORKOUT_PLAN_INVALID` с `zod.flatten()` для невалидных payload, а не падают глубже в plan-generation или feature gating.
- В `src/components/admin-user-detail.tsx` добавлен стабильный `data-testid` для section heading, а `tests/e2e/admin-app.spec.ts`, `tests/e2e/ui-regressions.spec.ts` и `tests/e2e/authenticated-app.spec.ts` переведены на менее хрупкие селекторы и redirect assumptions.
- После этого снова подтверждён полный baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `34 passed`, `npm run test:smoke` -> `3 passed`.

### Admin dashboard fail-open

- `/admin` больше не падает целиком из-за временного сбоя server-side admin fan-out. В `src/app/admin/page.tsx` добавлен fail-open path: страница показывает hero, быстрые переходы и резервный banner, даже если часть служебных запросов не загрузилась.
- Для e2e добавлен test-only fallback hook `?__test_admin_dashboard_fallback=1`, чтобы деградационный режим можно было подтверждать отдельно и без ожидания случайного внешнего timeout.
- `tests/e2e/admin-app.spec.ts` расширен сценарием на degraded dashboard page. Tranche подтверждён через `lint`, `typecheck`, `build` и целевой `admin-app` Playwright suite.

### Admin user mutation route validation hardening

- Добавлен общий helper `src/lib/admin-route-params.ts` с typed `AdminRouteParamError`, чтобы admin mutation routes не дублировали UUID-парсинг `userId`.
- В `billing`, `billing/reconcile`, `deletion`, `export`, `restore`, `role`, `support-action`, `suspend` route handlers невалидный target user id теперь даёт явные `400` с route-specific кодами вместо случайного провала глубже в доменный слой.
- Ожидаемые invalid-param ветки в этих admin routes больше не логируются как `logger.error`; noisy logging остаётся только для реально неожиданных сбоев.
- `tests/e2e/admin-app.spec.ts` расширен отдельным contract-сценарием на invalid admin user ids, а tranche подтверждён через `lint`, `typecheck`, `build` и полный `npm run test:e2e:auth`.

### Admin detail и bulk invalid-id contracts

- `src/app/api/admin/users/[id]/route.ts` переведён на общий `parseAdminUserIdParam(...)`, так что detail-route теперь использует тот же typed invalid-id path, что и остальные admin user handlers.
- `src/app/api/admin/users/bulk/route.ts` больше не пишет `logger.error` на ожидаемом `ADMIN_BULK_INVALID`; шум остаётся только для неожиданных сбоев bulk execution.
- `tests/e2e/admin-app.spec.ts` расширен так, что invalid admin user id scenario теперь дополнительно покрывает `GET /api/admin/users/not-a-uuid` и `POST /api/admin/users/bulk` с невалидным `user_ids`.
- Целевой контракт подтверждён через `lint`, `typecheck`, `build` и targeted Playwright `--grep "invalid admin user ids"`.

### Mobile PWA regression stabilization

- В `src/components/app-shell-nav.tsx` развёл test ids для shell drawer trigger и drawer surface, чтобы mobile suite больше не цеплялся за скрытый дубль кнопки меню.
- В `src/components/workout-day-session.tsx` focus-header toggle переведён на functional state update и получил стабильный `data-testid`, чтобы mobile focus mode проверял реальный collapse path без double-toggle race.
- В `tests/e2e/mobile-pwa-regressions.spec.ts` добавил `networkidle + settle` перед mobile interactions и перевёл drawer/focus assertions на стабильные selectors и keyboard close path.
- В `tests/e2e/ownership-isolation.spec.ts` поднял timeout тяжёлого nutrition isolation сценария до 90 секунд, чтобы seed nutrition assets не падал ложным таймаутом под медленной сетью.
- Regression tranche подтверждён через `lint`, `typecheck`, `build` и targeted `npm run test:e2e:auth -- --workers=1 --grep "mobile pwa regressions|nutrition assets"` -> `4 passed`.

### Dashboard nutrition extraction and focus-header stabilization

- `metrics.ts` перестал держать nutrition analytics внутри основного runtime-файла: source loading, result formatting и fail-open fallback вынесены в `dashboard-nutrition.ts`.
- Dashboard runtime теперь может деградировать по nutrition-слою отдельно и не валит весь `/dashboard`, если один nutrition-запрос временно не отработал.
- В `workout-day-session.tsx` стабилизирован mobile focus-header toggle: collapse-кнопка больше не возвращается в исходное состояние из-за double-toggle под mobile emulation, и regression suite снова проходит зелёно.
- Baseline после tranche подтверждён через `lint`, `typecheck`, `build`, `test:smoke` и полный `test:e2e:auth`.

### Locked workout execution guard coverage

- В `workout-sync.spec.ts` добавлен прямой сценарий для незалоченной недели: `PATCH /api/workout-days/{id}`, `POST /api/workout-days/{id}/reset` и `PATCH /api/workout-sets/{id}` теперь подтверждены как закрытые контрактом `WORKOUT_DAY_REQUIRES_LOCKED_PROGRAM`.
- Для этого добавлен helper `createUnlockedWorkoutDay(...)`, который сидирует черновую неделю без lock и позволяет проверять mutation-guards отдельно от основного locked-flow.
- Целевой regression-suite `tests/e2e/workout-sync.spec.ts` подтверждён отдельно: `4 passed`.

### Admin user detail timeline decomposition

- `admin-user-detail-sections.tsx` перестал быть монолитом по history/detail surface: timeline и billing-collections вынесены в отдельные модули для операций, аудита, entitlements, usage counters и subscription events.
- Общие `MetricCard`, `KeyValueCard` и `EmptyState` вынесены в отдельный primitives-слой, так что `admin-user-detail-sections.tsx` теперь ближе к секционному orchestrator-компоненту.
- Baseline после refactor подтверждён через `lint`, `typecheck`, `build` и полный `test:e2e:auth`.

### Mobile PWA regression coverage

- Добавлен отдельный mobile/PWA Playwright suite для узкого viewport: shell drawer, workspace section-menu, mobile workout focus-mode и admin drawer теперь проверяются на client-side regressions и horizontal overflow.
- Добавлен layout helper для проверки отсутствия горизонтального переполнения и для подтверждения, что mobile drawer действительно занимает высоту viewport.
- `MASTER_PLAN.md` обновлён: минимальный automated regression contour сверх smoke теперь явно зафиксирован как закрытый пункт.

## 2026-03-13

### Пользовательский контур и mobile/PWA UX

- Унифицирован shell приложения для desktop и mobile PWA.
- Крупные страницы переведены на workspace-паттерн с логическими разделами.
- Тренировочный день получил focus-режим, пошаговое выполнение, таймер, завершение и сброс.
- AI workspace был доведён до chat-first сценария с историей, prompt library и image upload.

### AI и аналитика

- Усилен AI-контекст по тренировкам, питанию и историческим данным пользователя.
- Добавлены structured knowledge, retrieval по личной истории и proposal-first flow.
- Усилены coaching signals по тренировкам и питанию.
- Подготовлен eval-контур для quality gate через `ai-evals`.

### Документация и demo assets

- Добавлены подробный пользовательский гайд и отдельная документация по AI-архитектуре.
- Создан `public/fit-demo-motion.svg` как motion demo приложения.

## 2026-03-14

### Engineering baseline

- Стабилизированы `npm run lint`, `npm run typecheck`, `npm run build`.
- Добавлены smoke checks и release checklist.
- Очищен build/workspace noise и зафиксирован CI-friendly baseline.

### Декомпозиция рискованных модулей

#### Workout execution

- Из `workout-day-session.tsx` вынесены:
  - `session-utils` и `derived-state`;
  - `use-workout-session-timer.ts`;
  - `use-workout-day-sync.ts`;
  - `use-workout-session-actions.ts`;
  - `workout-step-strip.tsx`;
  - `workout-exercise-card.tsx`;
  - `workout-day-overview-card.tsx`;
  - `workout-day-context-card.tsx`.

#### Dashboard analytics

- Из `metrics.ts` вынесены:
  - `dashboard-utils.ts`;
  - `dashboard-snapshot.ts`;
  - `dashboard-workout-helpers.ts`;
  - `dashboard-overview.ts`;
  - `dashboard-aggregate.ts`;
  - `dashboard-runtime-cache.ts`;
  - `dashboard-runtime-assembly.ts`.

#### Admin UI

- Из `admin-users-directory.tsx` вынесены model/helper и bulk-actions слои.
- Из `admin-user-detail.tsx` вынесены:
  - `admin-user-detail-model.ts`;
  - `admin-user-detail-state.ts`;
  - `admin-user-detail-sections.tsx`.

#### AI knowledge и chat

- Из `knowledge.ts` вынесены:
  - `knowledge-retrieval.ts`;
  - `knowledge-source-data.ts`;
  - `knowledge-indexing.ts`;
  - `knowledge-documents.ts`.
- Из `ai-chat-panel.tsx` вынесены:
  - `ai-chat-panel-model.ts`;
  - `ai-chat-panel-cards.tsx`;
  - `ai-chat-transcript.tsx`;
  - `ai-chat-composer.tsx`;
  - `ai-chat-toolbar.tsx`;
  - `ai-chat-notices.tsx`;
  - `use-ai-chat-session-state.ts`;
  - `use-ai-chat-actions.ts`;
  - `use-ai-chat-composer.ts`;
  - `use-ai-chat-view-state.ts`.

### Sanitation wave

- Переписаны в чистом UTF-8:
  - `README.md`;
  - `docs/README.md`;
  - `docs/MASTER_PLAN.md`;
  - `docs/FRONTEND.md`;
  - `docs/BACKEND.md`;
  - `docs/AI_STACK.md`;
  - `docs/USER_GUIDE.md`;
  - `src/lib/ai/domain-policy.ts`;
  - `src/lib/ai/plan-generation.ts`.

### 2026-03-14 23:20 - Санировал AI stack и пользовательскую документацию

- Переписал `docs/AI_STACK.md` в чистом UTF-8 как актуальную карту AI runtime, retrieval, structured knowledge, proposals, safety и eval-контура.
- Переписал `docs/USER_GUIDE.md` в чистом UTF-8 как подробное руководство по `Dashboard`, `Workouts`, `Nutrition`, `AI`, `Settings`, `History`, `PWA` и офлайн-сценариям.
- Сжал и переписал этот `docs/AI_WORKLOG.md`, чтобы убрать mojibake и оставить только полезный production-hardening журнал вместо сломанного исторического дампа.

### 2026-03-14 23:55 - Закрыл backend hardening tranche по workout sync и completion guard

- В `src/app/api/sync/push/route.ts` сделал `workout_day_execution` атомарным: статус, вес тела, заметка и длительность теперь применяются одним вызовом `updateWorkoutDayExecution(...)`, без частично сохранённого статуса при ошибке второго шага.
- В `src/lib/workout/execution.ts` добавил серверный guard на полноту set-performance: сет теперь считается либо пустым, либо полностью заполненным (`actualReps`, `actualWeightKg`, `actualRpe`).
- Там же добавил проверку завершения дня: `status = done` теперь запрещён, если в тренировочном дне есть незаполненные сеты.
- В `src/app/api/sync/pull/route.ts` добавил Zod-валидацию `scope`, `dayId` и `cursor`, чтобы sync-route не принимал невалидные параметры.
- После правок подтверждён baseline: `npm run lint`, `npm run typecheck`, `npm run build`.

### 2026-03-15 00:20 - Ужесточил internal jobs параметры и ошибки

- В `src/lib/internal-jobs.ts` добавил `parseOptionalUuidParam(...)` и `InternalJobParamError`, чтобы internal jobs не принимали произвольный `userId`.
- В `dashboard-warm`, `knowledge-reindex`, `nutrition-summaries` и `billing-reconcile` route handlers невалидный `userId` теперь даёт явный `400`, а не уходит в общий `500`.

### 2026-03-15 05:10 - Перевёл admin user detail на fail-open и degraded contract

- В `src/app/api/admin/users/[id]/route.ts` добавил UUID-валидацию `userId`, резервный degraded snapshot и явный `500 ADMIN_USER_DETAIL_FAILED` для действительно неожиданных ошибок вместо ложного `401`.
- В `src/components/admin-user-detail-state.ts` добавил поддержку `meta.degraded`, а верхний слой `src/components/admin-user-detail.tsx` и `src/app/admin/users/[id]/page.tsx` перевёл в чистый UTF-8.
- В `src/components/admin-user-detail-model.ts` почистил словари ролей, статусов и форматтеры от mojibake, чтобы detail-карточка и связанные admin surface'ы не показывали сломанный русский текст.
- В `tests/e2e/admin-app.spec.ts` добавил отдельный degraded-contract: root-admin может принудительно запросить test-only fallback detail snapshot и получить `meta.degraded = true`.
- Проверки после tranche: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth`, `npm run test:smoke`.
- Это делает cron/admin job контракты предсказуемее и уменьшает ложные server-error сценарии при ручных вызовах и операционных проверках.
- После правок снова подтверждён baseline: `npm run lint`, `npm run typecheck`, `npm run build`.

### 2026-03-15 00:45 - Довёл AI session и proposal route contracts

- В `src/lib/ai/chat.ts` добавил owner-scoped проверку существования session перед удалением: несуществующий или чужой чат теперь не даёт ложный `deleted: true`.
- В `src/app/api/ai/sessions/[id]/route.ts` добавил UUID-валидацию `params.id` и нормальную обработку `404` для отсутствующей AI session.
- В `src/lib/ai/proposal-actions.ts` ввёл `AiProposalActionError` с typed `status/code/message`, чтобы доменные ошибки `not found / type mismatch / already applied` больше не выглядели как внутренний `500`.
- В `src/app/api/ai/proposals/[id]/approve/route.ts` и `.../apply/route.ts` добавил UUID-валидацию и маппинг typed proposal errors в корректные API-ответы.
- После правок снова подтверждён baseline: `npm run lint`, `npm run typecheck`, `npm run build`.

### 2026-03-15 01:10 - Ужесточил direct workout mutation routes

- В `src/app/api/workout-days/[id]/route.ts`, `src/app/api/workout-days/[id]/reset/route.ts` и `src/app/api/workout-sets/[id]/route.ts` добавил UUID-валидацию route params.
- Теперь некорректный `id` на этих mutation routes даёт явный `400` с валидационной ошибкой, а не проходит глубже в execution-слой.
- Это выравнивает прямые workout API-контракты с уже ужесточёнными `sync` и `AI` route handlers.
- После правок снова подтверждён baseline: `npm run lint`, `npm run typecheck`, `npm run build`.

## Что осталось в production hardening

- Дальнейшая санация локального `docs/AI_EXPLAINED.md` после отдельного triage пользовательских изменений.
- Route/backend audit по owner-only access, idempotency, reset/finish/sync и internal jobs.
- Доведение оставшихся orchestrator-модулей до финального состояния.
- Stripe live verification, AI quality gate и Android/TWA readiness.

### 2026-03-15 01:55 - Добавил первый auth e2e baseline

- Добавил `tests/e2e/helpers/auth.ts` с реальным входом, автозавершением онбординга и проверкой восстановления сессии в одном browser context.
- Добавил `tests/e2e/authenticated-app.spec.ts` с проходом по `Dashboard`, `Workouts`, `Nutrition`, `AI`, `Settings` для обычного пользователя.
- В `package.json` добавил `npm run test:e2e:auth`, чтобы auth-regression можно было запускать отдельно от smoke.
- Прогнал сценарий локально с тестовым пользователем `leva@leva.ru`: `npm run test:e2e:auth` зелёный.

### 2026-03-15 02:35 - Закрыл admin e2e и API contract baseline

- Расширил `tests/e2e/helpers/auth.ts`: добавил root-admin credentials, стабилизировал auth helper через ожидание `networkidle`, а ввод в React-controlled формы перевёл на DOM setter + `input/change` events.
- Добавил `tests/e2e/admin-app.spec.ts` с root-сценарием под `corvetik1@yandex.ru`: `/admin`, `/admin/users`, открытие карточки пользователя и проверка секционного operator UI.
- Добавил `tests/e2e/api-contracts.spec.ts` с контрактами без платного AI runtime: invalid UUID дают явные `400`, а owner-scoped delete неизвестной AI session даёт корректный `404 AI_CHAT_SESSION_NOT_FOUND`.
- Упростил e2e-селекторы: вместо хрупких русских строк тесты теперь опираются на URL, `href`, `textarea` и `aria-pressed`, поэтому меньше зависят от локализации и санитарных правок copy.
- Подтвердил baseline полным прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth`.

### 2026-03-15 04:05 - Добавил workout sync regression и owner-only isolation baseline

- Добавил `tests/e2e/helpers/http.ts` и `tests/e2e/helpers/workouts.ts`, чтобы e2e могли сами создавать тестовый locked workout day через обычные product routes, без ручных сидов и без платного AI runtime.
- Добавил `tests/e2e/workout-sync.spec.ts`: тест создаёт locked workout day, прогоняет `sync/push` с duplicate mutation id, incomplete set save и premature `done`, а затем проверяет, что валидная последовательность доходит до `sync/pull` snapshot с правильными `status`, `actual_reps`, `actual_weight_kg`, `actual_rpe` и `session_duration_seconds`.
- Добавил `tests/e2e/ownership-isolation.spec.ts`: root-admin не может читать, сбрасывать или мутировать чужой `workout day` и чужой `workout set`, routes возвращают owner-scoped `404`, а не ложный успех.
- Стабилизировал e2e baseline в `package.json`: `test:e2e` и `test:e2e:auth` пока сериализованы через `--workers=1`, чтобы auth/UI hydration не давали флак при параллельном запуске.
- Подтвердил tranche полным прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run test:e2e:auth`.

## 2026-03-15 10:10 - Расширил user-owned isolation до weekly program ownership

- Обновил `tests/e2e/ownership-isolation.spec.ts`: после seed locked workout day root-admin теперь дополнительно проверяется на owner-isolation в weekly-programs.
- Подтвердил три контракта: чужая программа не попадает в GET /api/weekly-programs, а POST /api/weekly-programs/{id}/lock и POST /api/weekly-programs/{id}/clone на чужом programId возвращают 404 WEEKLY_PROGRAM_NOT_FOUND.
- Перепрогнал полный auth/e2e набор через штатный Playwright webServer на 3000: 7 passed; диагностические server logs от invalid UUID и unknown AI session остались ожидаемыми для contract tests.

## 2026-03-15 12:05 - Перевёл e2e на storage state и изолированный build dir

- Добавил tests/e2e/global-auth-setup.ts и tests/e2e/helpers/auth-state.ts: Playwright теперь заранее готовит storage state для обычного пользователя и root-admin, а сами тесты больше не тратят время на повторный UI-логин.
- Перевёл typecheck, build и start:test на NEXT_DIST_DIR=.next_build через scripts/run-next-with-dist-dir.mjs, чтобы quality gates и тестовый сервер не конфликтовали с локальным .next.
- Перевёл Playwright на выделенный порт 3100 и обновил package.json/playwright.config.ts, чтобы e2e больше не упирались в случайные процессы на 3000.
- Ужесточил e2e helper'ы: fetchJson(...) теперь переживает navigation race, а auth/admin/workout/api scenarios стабилизированы под --workers=2.
- Подтвердил tranche полным прогоном: npm run lint, npm run typecheck, npm run build, npx eslint tests/e2e tests/e2e/helpers, npm run test:e2e:auth -> 7 passed.

### 2026-03-15 13:05 - Расширил user-owned isolation до nutrition assets

- Добавил `tests/e2e/helpers/nutrition.ts`, чтобы e2e могли штатно сидировать food, recipe, meal template и meal через обычные product routes под тестовым пользователем.
- Расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь дополнительно проверяется на owner-isolation в nutrition-контуре и получает корректные `404 FOOD_NOT_FOUND`, `RECIPE_NOT_FOUND`, `MEAL_TEMPLATE_NOT_FOUND`, `MEAL_NOT_FOUND` для чужих assets.
- Переподтвердил полный auth/e2e baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run test:e2e:auth` -> 8 passed.

### 2026-03-15 14:10 - Расширил user-owned isolation до custom exercises и стабилизировал e2e navigation

- Ужесточил `src/app/api/exercises/route.ts` и `src/app/api/exercises/[id]/route.ts`: list/update теперь явно фильтруют по `user_id`, а update route дополнительно валидирует UUID и возвращает owner-scoped `404 EXERCISE_NOT_FOUND` для чужого ресурса.
- Добавил `tests/e2e/helpers/exercises.ts` и расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь не видит чужое custom exercise в `GET /api/exercises` и не может обновить его через `PATCH /api/exercises/{id}`.
- Добавил `tests/e2e/helpers/navigation.ts` и перевёл `authenticated-app.spec.ts` и `admin-app.spec.ts` на `navigateStable(...)`, чтобы убрать flaky `ERR_ABORTED`/timeout при e2e navigation под `--workers=2`.
- Усилил `tests/e2e/helpers/workouts.ts`: lock weekly program теперь переживает `WEEKLY_PROGRAM_ACTIVE_WEEK_CONFLICT` и выбирает следующий weekStartDate, поэтому workout sync regression больше не падает от накопившихся активных недель.
- Переподтвердил полный auth/e2e baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npx eslint tests/e2e/... src/app/api/exercises`, `npm run test:e2e:auth` -> 9 passed.

### 2026-03-15 16:20 - Убрал skip у локального Playwright full suite

- В `tests/e2e/helpers/auth.ts` добавил автозагрузку `.env.local` через `@next/env`, поэтому e2e больше не зависят от ручного export `PLAYWRIGHT_TEST_EMAIL`, `PLAYWRIGHT_TEST_PASSWORD`, `PLAYWRIGHT_ADMIN_EMAIL`, `PLAYWRIGHT_ADMIN_PASSWORD` перед обычным `playwright test`.
- Обновил `playwright.config.ts`: дефолтный full suite теперь идёт на `workers: 2`, а не на агрессивной авто-параллельности машины, из-за которой раньше появлялись ложные таймауты и ощущение, что тесты «не работают».
- Добавил `PLAYWRIGHT_*` ключи в `.env.example`, а локально прописал тестовые креды в `.env.local` без коммита секретов.
- Стабилизировал навигационные e2e через `tests/e2e/helpers/navigation.ts`, `tests/e2e/admin-app.spec.ts` и `tests/e2e/authenticated-app.spec.ts`, чтобы полный suite был зелёным и при обычном `npx playwright test`.
- Переподтвердил baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test` -> 12 passed.

### 2026-03-15 19:40 - Расширил user-owned isolation до self-service settings export

- Добавил `tests/e2e/helpers/settings-data.ts`: helper ставит `queue_export` через обычный product route `/api/settings/data` и при повторных прогонах умеет переиспользовать уже активную выгрузку вместо падения на `SETTINGS_EXPORT_ALREADY_ACTIVE`.
- Расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь дополнительно проверяется на owner-isolation в self-service data center и не видит чужой export job в `GET /api/settings/data`, а `GET /api/settings/data/export/{id}/download` возвращает owner-scoped `404 SETTINGS_EXPORT_NOT_FOUND`.
- Подтвердил tranche полным quality прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `10 passed`, `npx playwright test tests/smoke` -> `3 passed`.

### 2026-03-15 20:25 - Расширил user-owned isolation до workout templates

- Расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь дополнительно проверяется на owner-isolation в `workout_templates`, не видит чужой template в `GET /api/workout-templates` и не может создать новый template из чужого `programId`, получая `404 WORKOUT_TEMPLATE_SOURCE_NOT_FOUND`.
- Чтобы длинный seed/template flow не падал ложным красным, для `user-owned isolation` suite добавил `test.describe.configure({ timeout: 60_000 })`.
- Подтвердил tranche quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `11 passed`, `npx playwright test tests/smoke` -> `3 passed`.

### 2026-03-15 21:05 - Расширил user-owned isolation до self-service deletion и стабилизировал admin e2e

- Дополнил `tests/e2e/helpers/settings-data.ts` helper-ом `ensureSettingsDeletionRequest(...)`, чтобы e2e могли штатно создавать self-service deletion request через обычный product route `/api/settings/data`.
- Расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь дополнительно проверяется на owner-isolation в `settings/data deletion`, не видит чужой deletion request в `GET /api/settings/data`, не может отменить его через `DELETE /api/settings/data` и получает `404 SETTINGS_DELETION_NOT_FOUND`, при этом пользовательский request остаётся на месте.
- Обновил `tests/e2e/admin-app.spec.ts`: тест detail-экрана администратора больше не привязан к раннему появлению `button[aria-pressed]`, а ждёт реальный секционный heading после client-side загрузки карточки.
- Подтвердил tranche quality gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `12 passed`, `npx playwright test tests/smoke` -> `3 passed`.

### 2026-03-15 21:40 - Починил Vercel production output directory и сохранил test-build isolation

- Причина падения Vercel оказалась в `scripts/run-next-with-dist-dir.mjs`: helper по умолчанию подставлял `NEXT_DIST_DIR=.next_build`, поэтому production `npm run build` складывал артефакты не в `.next`, а Vercel искал `/.next/routes-manifest.json` и падал после успешной сборки.
- Переписал `scripts/run-next-with-dist-dir.mjs`: теперь он по умолчанию оставляет стандартный `.next`, а кастомный output directory включается только через явный `--dist-dir=...`.
- Обновил `package.json`: `build` снова production-safe, а `build:test`, `start:test`, `typecheck`, `pretest:e2e`, `pretest:e2e:auth`, `pretest:smoke` работают через отдельный `.next_build`, не смешивая локальный test/build контур с production output.
- Подтвердил hotfix полным прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `12 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-15 23:10 - Расширил settings isolation и отвязал smoke от auth bootstrap

- Дополнил `tests/e2e/helpers/settings-data.ts` helper-ом `ensureSettingsBillingReviewRequest(...)`, чтобы e2e могли создавать self-service billing review через обычный route `/api/settings/billing` и не зависели от прямого seed-а в БД.
- Расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь дополнительно проверяется на owner-isolation в `settings/billing` и не видит чужой billing review request в `GET /api/settings/billing`.
- Ужесточил `src/app/api/settings/data/export/[id]/download/route.ts`: route теперь валидирует UUID-параметр и даёт явный `400 SETTINGS_EXPORT_INVALID` на невалидный `id`.
- Расширил `tests/e2e/api-contracts.spec.ts` новым invalid-param контрактом для `GET /api/settings/data/export/not-a-uuid/download`.
- Санировал user-facing copy в `src/app/api/settings/billing/route.ts`, `src/app/api/settings/data/route.ts` и `src/app/api/settings/data/export/[id]/download/route.ts`, чтобы этот settings self-service контур не отдавал смешанный английский или битые промежуточные формулировки.
- Добавил `PLAYWRIGHT_SKIP_AUTH_SETUP` в `tests/e2e/global-auth-setup.ts` и новый runner `scripts/run-playwright.mjs`; `npm run test:smoke` теперь не пытается логинить тестовых пользователей и не падает от флака auth bootstrap.
- Подтвердил tranche полным прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `13 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-15 23:45 - Расширил user-owned isolation до AI history

- Добавил `tests/e2e/helpers/ai.ts`: helper `ensureAiChatSession(...)` сидирует AI chat session через safe blocked-flow (`/api/ai/chat` с risky prompt), поэтому e2e не зависят от платного AI runtime и всё равно получают реальную owner-scoped session в БД.
- Расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь дополнительно проверяется на owner-isolation в AI history и не может удалить чужую AI session по `DELETE /api/ai/sessions/{id}`.
- Тем же сценарием подтверждён bulk-clear contract: `DELETE /api/ai/sessions` под root-admin очищает только его собственную историю, а пользователь после этого всё ещё может удалить свою seeded session по `id`.
- Полный tranche подтверждён прогоном `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `14 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 00:35 - Добавил workout reset regression для clean snapshot после sync

- Расширил `tests/e2e/workout-sync.spec.ts` новым сценарием `reset clears synced execution and pull stays clean afterwards`.
- Новый e2e сначала доводит locked workout day до сохранённого `done` через `sync/push`, затем вызывает `POST /api/workout-days/{id}/reset` и проверяет два последовательных `sync/pull`, чтобы убедиться: после reset не возвращаются старые `actual_reps`, `actual_weight_kg`, `actual_rpe`, а день снова `planned` с `session_duration_seconds = 0`.
- Для `workout sync contracts` поднял timeout до `60_000`, потому что длинный seed/lock/reset flow реально выходит за дефолтные `30s`, хотя сам контракт уже зелёный.
- Подтвердил tranche командами: `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `15 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 02:10 - Закрыл локальный offline reset контур против stale IndexedDB state

- В `src/lib/offline/workout-sync.ts` добавил `replaceWorkoutDayOfflineState(...)`: helper теперь атомарно очищает `mutationQueue` по `dayId` и сразу заменяет `cacheSnapshots` новым snapshot внутри одной Dexie-транзакции.
- В `src/components/workout-session/use-workout-day-sync.ts` и `src/components/workout-session/use-workout-session-actions.ts` reset переведён на этот helper, поэтому клиентский сброс тренировки больше не зависит от нескольких разнесённых шагов в offline слое.
- Добавил `tests/e2e/helpers/offline-db.ts`, чтобы Playwright мог работать с реальным `fit-offline` IndexedDB, а не только проверять server routes.
- `tests/e2e/workout-sync.spec.ts` расширен новым browser-based regression: тест сидирует stale queued mutations и stale cache snapshot, запускает reset через UI и затем подтверждает, что локальный IndexedDB уже очищен и после reload не возвращает старое execution state.
- Заодно усилил `tests/e2e/helpers/workouts.ts`, чтобы seed locked workout day был стабильнее и не выгорал по `active week conflict` на длинных suite.
- Полный tranche подтверждён командами: `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `16 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 04:35 - Дожал owner-scoped mutation routes и invalid-param контракты

- Ужесточил `src/app/api/weekly-programs/[id]/lock/route.ts`: route теперь валидирует UUID-параметр и при race по lock state возвращает предсказуемый `409 WEEKLY_PROGRAM_LOCK_CONFLICT`, а не общий `500`.
- Ужесточил `src/app/api/weekly-programs/[id]/clone/route.ts`: `params.id` теперь проходит через `z.string().uuid()`, а invalid params попадают в явный `400 WEEKLY_PROGRAM_CLONE_INVALID`.
- Санировал и довёл до явных `400`/`404` owner-scoped nutrition mutation routes: `src/app/api/foods/[id]/route.ts`, `src/app/api/recipes/[id]/route.ts`, `src/app/api/meals/[id]/route.ts`, `src/app/api/meal-templates/[id]/route.ts`.
- Расширил `tests/e2e/api-contracts.spec.ts`: invalid route params теперь проверяются дополнительно для `weekly-programs/[id]/lock`, `weekly-programs/[id]/clone`, `foods/[id]`, `recipes/[id]`, `meals/[id]`, `meal-templates/[id]`.
- Подтвердил tranche командами: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `16 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 05:20 - Санировал AI route surface и стабилизировал auth bootstrap для full e2e

- В `tests/e2e/helpers/auth.ts` добавил более устойчивый post-sign-in flow: если client-side redirect задерживается, helper дожимает переход на `/dashboard`, не ломая storage-state bootstrap.
- Санировал user-facing copy в `src/app/api/ai/chat/route.ts`, `src/app/api/ai/reindex/route.ts`, `src/app/api/ai/sessions/[id]/route.ts`, `src/app/api/ai/proposals/[id]/apply/route.ts`, `src/app/api/ai/proposals/[id]/approve/route.ts`, чтобы AI routes больше не отдавали mojibake в ошибках и ответах.
- Повторно подтвердил полный baseline после AI-route sanitation: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `16 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 06:25 - Закрыл AI session ownership reuse и settings snapshot fail-open

- В `src/lib/ai/chat.ts` изменил контракт `ensureAiChatSession(...)`: переданный `sessionId` больше не может тихо создать новую сессию; неизвестный или чужой валидный id теперь даёт owner-scoped `404 AI_CHAT_SESSION_NOT_FOUND`.
- В `src/app/api/ai/chat/route.ts` и `src/app/api/ai/assistant/route.ts` добавил явный маппинг `AiChatSessionError`, поэтому оба AI route handler'а возвращают корректный `404`, а не общий `500`.
- В `tests/e2e/api-contracts.spec.ts` добавил контракты для `ai chat` и `ai assistant`, подтверждающие, что неизвестный валидный `sessionId` не создаёт новую сессию молча, а даёт `404 AI_CHAT_SESSION_NOT_FOUND`; в `tests/e2e/ownership-isolation.spec.ts` подтвердил, что root-admin не может продолжить чужую AI session ни через chat, ни через assistant surface.
- `tests/e2e/ownership-isolation.spec.ts` и `tests/e2e/admin-app.spec.ts` перевёл на `navigateStable(...)` для стартового `/admin`, чтобы убрать flaky `ERR_ABORTED` на медленном client-side bootstrap.
- В `src/lib/settings-data-server.ts` добавил `loadSettingsDataSnapshotOrFallback(...)`, а `src/app/api/settings/data/route.ts` и `src/app/api/settings/billing/route.ts` перевёл на безопасный fail-open snapshot: при сбое загрузки оболочки settings UI получает пустой snapshot вместо `500`.
- Подтвердил tranche полным прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `18 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 07:10 - Довёл billing-access fail-open до user-facing страниц и AI routes

- В `src/lib/billing-access.ts` добавил `createFallbackUserBillingAccessSnapshot(...)` и `readUserBillingAccessOrFallback(...)`: при временной ошибке чтения `subscriptions / entitlements / usage_counters` surface больше не валится общим `500`, а получает безопасный fallback-access; для root-super-admin fallback остаётся привилегированным.
- В `src/app/settings/page.tsx`, `src/app/ai/page.tsx`, `src/app/nutrition/page.tsx` и `src/app/api/settings/billing/route.ts` user-facing server surfaces переведены на этот fail-open path, поэтому transient billing-access ошибки больше не ломают открытие основных экранов и billing center.
- Тем же паттерном перевёл user-facing AI routes: `src/app/api/ai/chat/route.ts`, `src/app/api/ai/assistant/route.ts`, `src/app/api/ai/meal-photo/route.ts`, `src/app/api/ai/meal-plan/route.ts`, `src/app/api/ai/workout-plan/route.ts`, `src/app/api/ai/proposals/[id]/apply/route.ts`, `src/app/api/ai/proposals/[id]/approve/route.ts`. Теперь AI surface не падает из-за временного сбоя billing-access слоя и использует безопасную fallback policy.
- Подтвердил tranche полным прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `18 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 08:05 - Снизил noisy route errors и довёл admin surfaces до fail-open

- В `src/app/api/ai/sessions/[id]/route.ts`, `src/app/api/ai/chat/route.ts`, `src/app/api/ai/assistant/route.ts`, `src/app/api/settings/data/export/[id]/download/route.ts`, `src/app/api/workout-days/[id]/route.ts`, `src/app/api/workout-sets/[id]/route.ts`, `src/app/api/weekly-programs/[id]/lock/route.ts`, `src/app/api/weekly-programs/[id]/clone/route.ts`, `src/app/api/foods/[id]/route.ts`, `src/app/api/recipes/[id]/route.ts`, `src/app/api/meals/[id]/route.ts`, `src/app/api/meal-templates/[id]/route.ts` разнёс expected и unexpected path в `catch`: валидируемые `400/404` больше не шумят как route-level `logger.error`.
- В `src/app/api/admin/stats/route.ts` добавил `createFallbackAdminStatsSnapshot()`, а в `src/app/api/admin/operations/route.ts` — `createFallbackOperationsSnapshot()`. Теперь при временном сбое внешнего Supabase/fetch слоя admin health и operations inbox отдают безопасный fallback snapshot с `meta.degraded`, а не общий `500`.
- Повторный auth/e2e прогон подтвердил эффект: noisy `ZodError`/`AI_CHAT_SESSION_NOT_FOUND` логи из contract-tested routes ушли, а admin route timeout теперь деградирует до `warn + fallback`, не ломая suite.
- Подтвердил tranche полным прогоном: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `18 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 08:30 - Показал degraded режим прямо в admin UI

- В `src/components/admin-health-dashboard.tsx` и `src/components/admin-operations-inbox.tsx` добавил чтение `meta.degraded` из API и явные amber-notice баннеры для operator UX.
- Теперь `/admin` и inbox операций не сваливаются в молчаливо пустые карточки: если сервер отдал fallback snapshot, оператор видит, что это резервный снимок и часть источников временно недоступна.
- Подтвердил slice командами: `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1` -> `1 passed`.

### 2026-03-16 09:05 - Закрыл owner-isolation для AI proposal approve/apply

- Добавил `tests/e2e/helpers/supabase-admin.ts` как минимальный Playwright helper с `SUPABASE_SERVICE_ROLE_KEY`, чтобы e2e могли находить тестового пользователя по email и сидировать user-owned записи без прямых ручных SQL команд.
- Расширил `tests/e2e/helpers/ai.ts`: кроме blocked AI chat session helper, там теперь есть `ensureAiPlanProposal(...)` и `readAiPlanProposal(...)`, поэтому AI proposal ownership можно проверять без live AI runtime.
- Расширил `tests/e2e/ownership-isolation.spec.ts`: root-admin теперь дополнительно проверяется на owner-isolation в `POST /api/ai/proposals/{id}/approve` и `/apply` и получает `404 AI_PROPOSAL_NOT_FOUND` на чужом proposal.
- Расширил `tests/e2e/api-contracts.spec.ts`: invalid UUID для AI proposal routes теперь подтверждаются явными `400 AI_PROPOSAL_APPROVE_INVALID` и `400 AI_PROPOSAL_APPLY_INVALID`.
- В `src/app/api/ai/proposals/[id]/approve/route.ts` и `src/app/api/ai/proposals/[id]/apply/route.ts` убрал noisy route-level `logger.error` для ожидаемых `400/404`, оставив логирование только для неожиданных `500`.
- Полный tranche подтверждён командами: `npm run lint`, `npx eslint tests/e2e tests/e2e/helpers src/app/api/ai/proposals/[id]/approve/route.ts src/app/api/ai/proposals/[id]/apply/route.ts`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `19 passed`.

### 2026-03-16 09:35 - Добавил отдельный RLS test baseline

- Добавил `tests/rls/helpers/supabase-rls.ts`: helper логинит обычного пользователя и root-admin напрямую через публичный Supabase key, а fixture сидирует через service-role helper без UI и без webServer.
- Добавил `tests/rls/ownership.spec.ts`: suite подтверждает прямую row-level изоляцию в `ai_plan_proposals`, `exercise_library` и `weekly_programs`; владелец видит свои строки, другой auth-user не видит и не может обновить чужой proposal.
- В `package.json` добавил `npm run test:rls`, который идёт отдельно от UI/e2e контура и не требует сборки test-server.
- Подтвердил tranche командами: `npx eslint tests/rls tests/e2e/helpers/supabase-admin.ts tests/e2e/helpers/ai.ts`, `npm run test:rls`, `npm run lint`, `npm run typecheck`, `npm run build`.

### 2026-03-16 10:05 - Перевёл admin users каталог на fail-open degraded snapshot

- В `src/app/api/admin/users/route.ts` добавил `createFallbackAdminUsersResponse(...)`: при временном сбое внешнего Supabase/fetch слоя route больше не падает общим `500`, а отдаёт безопасный пустой snapshot с `meta.degraded`.
- В `src/components/admin-users-directory-model.ts` расширил `AdminUsersFetchResponse` полем `meta.degraded`, а в `src/components/admin-users-directory.tsx` добавил отдельный amber-banner для оператора, если каталог пришёл из резервного снимка.
- Теперь живой `admin users route failed` timeout-path из e2e деградирует предсказуемо и не ломает экран каталога пользователей.
- Подтвердил tranche командами: `npx eslint src/app/api/admin/users/route.ts src/components/admin-users-directory.tsx src/components/admin-users-directory-model.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts --workers=1`.

### 2026-03-16 10:25 - Дожал reindex route contracts

- В `src/app/api/ai/reindex/route.ts` развёл expected и unexpected error path: `AdminAccessError` и `ZodError` теперь возвращаются без noisy `logger.warn`, логирование оставлено только для неожиданных `500`.
- В `tests/e2e/api-contracts.spec.ts` добавил контракт для обычного пользователя: `POST /api/ai/reindex` остаётся строго admin-only и возвращает `403 ADMIN_REQUIRED`.
- В `tests/e2e/admin-app.spec.ts` добавил root-admin сценарий на невалидный `targetUserId`, подтверждающий `400 REINDEX_INVALID`.
- Slice подтверждён таргетными прогонами `npx eslint src/app/api/ai/reindex/route.ts tests/e2e/api-contracts.spec.ts tests/e2e/admin-app.spec.ts` и Playwright contract-suite для `admin-app` + `api-contracts`.

### 2026-03-16 10:55 - Расширил прямой RLS suite до AI history и self-service данных

- В `tests/rls/helpers/supabase-rls.ts` fixture расширен прямыми service-role вставками в `ai_chat_sessions`, `ai_chat_messages`, `export_jobs`, `deletion_requests`, `user_context_snapshots`, `knowledge_chunks`, чтобы direct RLS tests покрывали не только proposals/programs/exercises, но и AI/history, retrieval corpus плюс self-service data.
- В `tests/rls/ownership.spec.ts` добавлены прямые owner-only проверки: обычный пользователь через публичный Supabase client видит свои AI chat/session rows, export/deletion rows, context snapshot и retrieval chunk, а второй auth-user под тем же RLS не видит эти записи вообще.
- Отдельно зафиксировано, что `support_actions` не используется как direct user-visible RLS surface: self-service billing snapshot собирается через admin-backed path, поэтому для прямого row-level coverage выбран `user_context_snapshots`.
- Tranche подтверждён командами `npx eslint tests/rls tests/rls/helpers`, `npm run test:rls`, затем повторным общим baseline `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `22 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 11:25 - Закрыл targeted advisor warnings для AI history и self-service

- Через Supabase MCP посмотрел `security` и `performance` advisors и взял узкий production-tranche по реальным hot tables: `ai_chat_messages`, `export_jobs`, `deletion_requests`, `support_actions`, `admin_audit_logs`.
- Применил корректирующую миграцию `supabase/migrations/20260315173518_ai_history_self_service_index_hardening.sql`: функция `public.set_updated_at()` теперь с фиксированным `search_path = public, pg_temp`, а под AI/history/self-service query paths добавлены индексы на `session_id`, `requested_by`, `actor_user_id`, `target_user_id` и составные user/status маршруты.
- Повторный прогон advisors подтвердил эффект: warning `function_search_path_mutable` для `public.set_updated_at()` ушёл, а targeted `unindexed_foreign_keys` по этой группе таблиц исчезли.
- При этом глобальный advisor backlog сознательно оставлен отдельным последующим tranche: в проекте ещё есть `auth_rls_initplan` и `rls_enabled_no_policy` для более широкого круга admin/system tables, и это уже следующий системный слой, а не точечный hotfix.

### 2026-03-16 11:45 - Закрыл targeted auth_rls_initplan для AI history и retrieval

- Через `pg_policies` снял реальные owner-policy определения для `ai_chat_sessions`, `ai_chat_messages`, `export_jobs`, `deletion_requests`, `user_context_snapshots`, `knowledge_chunks`, `knowledge_embeddings`, `ai_safety_events` и подтвердил, что это безопасный массовый паттерн `auth.uid() = user_id`.
- Применил корректирующую миграцию `supabase/migrations/20260315173725_ai_history_self_service_rls_initplan_hardening.sql`: все эти owner policies переведены на `(select auth.uid())`, чтобы Supabase больше не пересчитывал auth-функции per-row на горячих AI/history/self-service таблицах.
- Повторный прогон performance advisors подтвердил, что targeted `auth_rls_initplan` warnings по этим таблицам ушли; после этого отдельно прогнал `npm run test:rls`, чтобы подтвердить сохранение реальной row-level изоляции после policy-alter.
- Оставшийся advisor backlog теперь сузился до других product/admin/system таблиц и отдельного security-слоя `rls_enabled_no_policy`, который уже пойдёт следующим DB tranche, а не как часть AI/history hotfix.

### 2026-03-16 12:35 - Закрыл internal jobs auth и invalid-param контракты

- Добавил `tests/e2e/internal-jobs.spec.ts` как отдельный contract-suite для `/api/internal/jobs/*`.
- Для обычного пользователя подтверждён `403 ADMIN_REQUIRED` на `dashboard-warm`, `nutrition-summaries`, `knowledge-reindex`, `ai-evals-schedule`, `billing-reconcile`.
- Для root-admin подтверждены явные `400` на невалидных параметрах `dashboard-warm`, `nutrition-summaries`, `knowledge-reindex`, `ai-evals-schedule`.
- В `src/app/api/internal/jobs/ai-evals-schedule/route.ts` разнёс expected и unexpected error path: `ZodError` больше не шумит как route-level `logger.error`.
- Усилил `tests/e2e/helpers/auth.ts`: вход теперь сначала использует обычный `fill`, затем fallback через setter, и ждёт активации submit до 10 секунд. Это убрало flaky bootstrap в `global-auth-setup`.
- Подтвердил tranche полным baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `24 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 13:05 - Расширил CI до полного regression-контура

- В `.github/workflows/quality.yml` добавил secret-guarded jobs `rls` и `auth-e2e`, чтобы GitHub Actions мог прогонять не только `lint/typecheck/build/smoke`, но и прямые RLS tests плюс authenticated e2e.
- `rls` job использует `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PLAYWRIGHT_TEST_EMAIL`, `PLAYWRIGHT_TEST_PASSWORD`, `PLAYWRIGHT_ADMIN_EMAIL`, `PLAYWRIGHT_ADMIN_PASSWORD` и запускает `npm run test:rls`.
- `auth-e2e` job использует тот же секретный набор, ставит Chromium и запускает `npm run test:e2e:auth`.
- В `README.md` и `docs/RELEASE_CHECKLIST.md` зафиксировал явный список secrets для полного CI regression-контура, чтобы это было частью release hygiene, а не неявным знанием.

### 2026-03-16 13:20 - Зафиксировал допустимые build warnings

- Добавил `docs/BUILD_WARNINGS.md` как source of truth по текущему warning-хвосту от `@sentry/nextjs` и `@opentelemetry/*`.
- Зафиксировал, что текущие `Critical dependency: the request of a dependency is an expression` warnings допустимы только пока они приходят из instrumentation dependencies и не ломают `npm run build`, manifest, traces и regression-suite.
- В `docs/README.md`, `README.md` и `docs/MASTER_PLAN.md` добавил явные ссылки и policy, чтобы этот warning-хвост больше не считался “непонятным шумом” без статуса.
### 2026-03-16 13:40 - Добавил migration-aware CI gate

- Добавил `scripts/verify-migrations.ps1` и `scripts/verify-migrations.mjs`: PowerShell-обёртка собирает diff локально и в CI, а JS-валидатор проверяет изменения в `supabase/migrations`, формат migration filenames, пустые `.sql` и обязательный update `docs/MASTER_PLAN.md` плюс `docs/AI_WORKLOG.md`.
- В `package.json` появился `npm run verify:migrations`, а `.github/workflows/quality.yml` теперь запускает тот же gate перед основным `quality` job.
- В `README.md` и `docs/RELEASE_CHECKLIST.md` зафиксировал, что при изменениях `supabase/migrations` этот gate должен быть зелёным и в локальном baseline, и в CI.
- Это сознательно только migration-aware слой: advisor execution через CI пока остаётся отдельным следующим tranche, потому что требует отдельного secret/runtime контура.

### 2026-03-16 14:20 - Вернул test-build на стандартный .next

- На текущем Windows + Next.js 16 custom `NEXT_DIST_DIR` для `next build` стабильно упирался в `spawn EPERM`, поэтому `build:test` и `start:test` откатил на стандартный `.next`.
- Изоляция осталась там, где она реально стабильна: `typecheck` продолжает работать через `.next_build`, а Playwright всё так же использует выделенный порт `3100`.
- После rollback заново прогнал baseline, чтобы `test:smoke`, `test:rls` и `test:e2e:auth` снова были зелёными на реальном локальном контуре.

### 2026-03-16 15:05 - Переписал frontend handoff-док

- `docs/FRONTEND.md` был в mojibake и перестал быть usable handoff-документом.
- Переписал его с нуля под текущий `fit`: shell, workspace-паттерн, workouts, nutrition, AI workspace, admin UI, quality gates и практические правила для frontend-изменений.
- `docs/AI_EXPLAINED.md` сознательно не трогал: он остаётся отдельным triaged локальным документом вне этого sanitation tranche.

### 2026-03-16 15:20 - Зафиксировал критерий prod-ready

- Добавил `docs/PROD_READY.md` как отдельный документ с production-ready критерием: automated gates, manual acceptance, env readiness и release blockers.
- В `docs/README.md`, `README.md` и `docs/MASTER_PLAN.md` закрепил, что `prod-ready` в `fit` больше не равен просто “локальный build зелёный”.
- Это не закрывает Stripe/AI live verification, но даёт нормальный release-контракт, от которого теперь можно двигаться дальше по staging-like tranche.

### 2026-03-16 16:10 - Добавил UI regression suite

- Добавил `tests/e2e/ui-regressions.spec.ts`: отдельный Playwright-slice на client-side reliability, а не только на happy-path навигацию.
- Новый suite проверяет три вещи: отсутствие hydration/render-loop ошибок на user/admin surfaces, отсутствие runaway `sync/pull` в workout focus-mode и сохранение этих проверок внутри общего `test:e2e:auth`.
- Для этого добавил `tests/e2e/helpers/client-regressions.ts`, а `tests/e2e/helpers/http.ts` перевёл на `browserContext.request`, чтобы API contract tests не падали из-за фона страницы и `networkidle`.
- После правок `npm run test:e2e:auth` снова зелёный и теперь проходит как `27 passed`.

### 2026-03-16 18:20 - Закрыл AI workspace regression tranche

- Добавил отдельный `tests/e2e/ai-workspace.spec.ts`: suite покрывает prompt library, web-search toggle, image upload, одиночное удаление чата и массовую очистку истории.
- В `src/components/ai-chat-toolbar.tsx`, `src/components/ai-chat-composer.tsx`, `src/components/ai-prompt-library.tsx`, `src/components/ai-workspace-sidebar.tsx`, `src/components/ai-workspace.tsx`, `src/app/ai/page.tsx` почистил user-facing AI workspace copy до нормального UTF-8 и убрал свежий mojibake из этого surface.
- В `src/components/ai-chat-panel.tsx` добавил стабильный hydration marker `data-hydrated`, а `tests/e2e/ui-regressions.spec.ts` и новый AI workspace suite перевёл на него вместо хрупких ранних селекторов и старых desktop-ссылок.
- Tranche подтверждён полным baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-16 23:10 - Закрыл workspace sanitation и стабилизировал AI surface

- Переписал `src/components/page-workspace.tsx` и `src/components/dashboard-workspace.tsx` в чистом UTF-8, чтобы базовый workspace-контур основных страниц больше не отдавал битую кириллицу.
- Дожал весь AI workspace surface: `src/components/ai-workspace.tsx`, `src/components/ai-workspace-sidebar.tsx`, `src/components/ai-chat-toolbar.tsx`, `src/components/ai-chat-composer.tsx`, `src/components/ai-prompt-library.tsx`, `src/app/ai/page.tsx` теперь в нормальном русском UX без mojibake.
- Перевел web-search toggle в `src/components/ai-chat-panel.tsx` на `useSyncExternalStore` поверх `sessionStorage`, чтобы режим не терялся при remount и не нарушал `react-hooks/set-state-in-effect`.
- Усилил тестовую устойчивость в `tests/e2e/ai-workspace.spec.ts`, `tests/e2e/ui-regressions.spec.ts` и `tests/e2e/helpers/http.ts`: prompt library re-open, degraded admin detail и неожиданные `401` от auth bootstrap больше не дают ложный красный.
- Tranche подтверждён полным baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-17 00:35 - Санировал admin role и operator surfaces

- Переписал `src/lib/admin-permissions.ts` в чистом UTF-8: роль-подписи и capability error copy больше не отдают mojibake.
- Переписал `src/components/admin-role-manager.tsx`, `src/components/admin-user-actions.tsx`, `src/components/admin-ai-operations.tsx`, `src/components/admin-ai-eval-runs.tsx`, `src/components/admin-operations-inbox.tsx` в нормальный русский operator UX.
- Для non-root/admin-only режимов убрал лишний показ role/capability деталей: там, где доступен только просмотр, UI теперь говорит об этом нейтрально, без лишних внутренних формулировок.
- Tranche подтверждён baseline-пакетом: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-17 01:20 - Дожал advisor backlog по owner policies и query paths

- Проверил рабочее дерево и зафиксировал, что ложный sanitation-slice по `admin-users-directory-model.ts` и `admin-user-detail-model.ts` не дал реального git diff; в commit пошёл только настоящий DB tranche плюс тестовый hotfix.
- Применил через Supabase MCP `supabase/migrations/20260317012000_query_path_and_fk_index_hardening.sql`: закрыл первую волну `auth_rls_initplan` для `profiles`, `subscriptions`, `subscription_events`, `workout_days`, `ai_plan_proposals` и добавил targeted FK indexes под горячие query paths.
- Затем применил `supabase/migrations/20260317014500_owner_policy_initplan_hardening.sql`: owner-policies на user-level таблицах питания, тренировок, профиля, usage и memory перевёл на `(select auth.uid())`, чтобы убрать массовый `auth_rls_initplan`.
- Затем применил `supabase/migrations/20260317015500_foods_select_policy_merge.sql`: `foods_owner_select` и `foods_owner_shared_select` схлопнуты в одну permissive select-policy `foods_access_select`, чтобы performance-advisor больше не ругался на `multiple_permissive_policies`.
- Повторный прогон advisors после DDL подтвердил, что performance backlog теперь очищен от `auth_rls_initplan`, `multiple_permissive_policies` и targeted FK warnings; в remaining backlog остались только `unused_index` info и отдельный security-layer (`rls_enabled_no_policy`, `extension_in_public`, `auth_leaked_password_protection`).
- Полный verification после DB tranche зелёный: `npm run verify:migrations`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:rls` -> `1 passed`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-17 01:35 - Убрал flaky селектор из ui-regressions

- В `tests/e2e/ui-regressions.spec.ts` заменил хрупкий `button[aria-pressed]` на гарантированный `main` для `dashboard / workouts / nutrition / settings`, потому что наличие section-pill не является обязательным DOM-контрактом для каждого user surface.
- Сначала подтвердил targeted suite `npx playwright test tests/e2e/ui-regressions.spec.ts --workers=1` -> `3 passed`, затем заново прогнал весь `npm run test:e2e:auth` -> `36 passed`.

### 2026-03-17 02:10 - Закрыл security-advisor baseline для системных таблиц

- Через кодовый аудит подтвердил, что `admin_audit_logs`, `support_actions`, `ai_eval_runs`, `ai_eval_results`, `feature_flags`, `platform_settings`, `system_metrics_snapshots` читаются только через `createAdminSupabaseClient()` или service-role контуры, а не через обычный user client.
- Применил `supabase/migrations/20260317022000_system_table_rls_policy_baseline.sql`: добавил явные deny-all policies на эти таблицы, чтобы закрыть `rls_enabled_no_policy` без изменения runtime-контрактов для владельцев или админских service-role путей.
- Повторный прогон `security` advisors подтвердил, что `rls_enabled_no_policy` полностью ушёл; в security backlog остались только platform-level warnings `extension_in_public` для `vector` и `auth_leaked_password_protection`.
- После DB slice пришлось отдельно дожать flaky AI workspace test: в `tests/e2e/ai-workspace.spec.ts` создание шаблона теперь ждёт visible+enabled состояние кнопки внутри модалки, после чего full `npm run test:e2e:auth` снова зелёный (`36 passed`).
- Tranche подтверждён командами `npm run verify:migrations`, `npm run test:rls`, `npx playwright test tests/e2e/ai-workspace.spec.ts --workers=1`, `npm run test:e2e:auth`, `npm run test:smoke`.

### 2026-03-17 09:45 - Дожал workspace sanitation для dashboard, workouts и nutrition

- Переписал `src/components/page-workspace.tsx` в чистом UTF-8 и добавил стабильные `data-testid` для mobile section-menu и visibility toggles.
- Полностью санировал `src/components/dashboard-workspace.tsx`: hero, summary, AI-блок и mobile section-menu на `/dashboard` больше не показывают битую кириллицу.
- Переписал `src/app/workouts/page.tsx` и `src/app/nutrition/page.tsx` в нормальный русский user-facing copy для badges, metrics, section labels и descriptions.
- Обновил `tests/e2e/mobile-pwa-regressions.spec.ts`: mobile regression теперь опирается на стабильные test ids вместо старых текстовых селекторов и снова подтверждает `Dashboard / Workouts / Nutrition / Admin` на узком viewport.
- Tranche подтверждён baseline-пакетом: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-17 10:35 - Санировал admin user detail surface

- Переписал `src/components/admin-user-detail.tsx`, `src/components/admin-user-detail-state.ts`, `src/components/admin-user-detail-model.ts`, `src/components/admin-user-detail-sections.tsx`, `src/components/admin-user-detail-operations.tsx`, `src/components/admin-user-detail-billing.tsx` и `src/app/admin/users/[id]/page.tsx` в чистом UTF-8.
- Убрал mojibake из summary metrics, degraded-banner, section-switcher, профиля, активности, операций, биллинга и role/status словарей для карточки пользователя.
- Сразу после санации прогнал targeted operator regression: `npx playwright test tests/e2e/admin-app.spec.ts --workers=1` -> `5 passed`, `npx playwright test tests/e2e/mobile-pwa-regressions.spec.ts --workers=1` -> `3 passed`.
- Общие quality gates по tranche тоже зелёные: `npx eslint ...admin-user-detail*`, `npm run typecheck`, `npm run build`.
- После первого полного прогона `npm run test:e2e:auth` поймал flaky degraded-dashboard check: тест цеплялся за общий `a[href="/admin/users"]`, а не за конкретный fallback CTA.
- Для этого добавил стабильные `data-testid` на degraded CTA в `src/app/admin/page.tsx` и перевёл `tests/e2e/admin-app.spec.ts` на эти селекторы.
- После hotfix полный auth baseline снова зелёный: `npm run test:e2e:auth` -> `36 passed`.

### 2026-03-17 11:40 - Санировал user-facing copy в AI API

- Дочистил весь `/api/ai` user-facing слой: `chat`, `assistant`, `meal-photo`, `meal-plan`, `workout-plan`, `reindex`, `sessions`, `sessions/[id]`, `proposals/[id]/apply`, `proposals/[id]/approve`.
- Убрал английские сообщения и технический жаргон вроде `AI runtime`, `live-запросы`, `AI-предложение`; вместо этого ошибки и статусы теперь объясняются по-русски и без лишнего внутреннего языка.
- Прогнал машинный scan по `src/app/api/ai` и подтвердил, что английских `message:` / `return` строк в user-facing слое больше не осталось.
- Tranche подтверждён командами `npx eslint ...src/app/api/ai/*`, `npm run typecheck`, `npm run build`, `npm run build:test`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `6 passed`.

### 2026-03-17 12:25 - Расширил direct RLS ownership и дочистил self-service route copy

- `tests/rls/helpers/supabase-rls.ts` расширен fixture-данными для `foods`, `recipes`, `recipe_items` и `workout_templates`, чтобы direct row-level suite покрывал не только proposals/history/self-service, но и user-scoped nutrition plus workout template surfaces.
- `tests/rls/ownership.spec.ts` теперь напрямую подтверждает, что обычный пользователь видит свои `foods`, `recipes` и `workout_templates`, а root-admin не видит эти строки через обычный user client.
- В `src/app/api/workout-templates/route.ts`, `src/app/api/foods/route.ts` и `src/app/api/recipes/route.ts` дочистил user-facing copy до нормального русского без обрывков старой технической формулировки.
- Tranche подтверждён командами `npx eslint tests/rls tests/rls/helpers src/app/api/workout-templates/route.ts src/app/api/foods/route.ts src/app/api/recipes/route.ts`, `npm run test:rls`, `npm run typecheck`, `npm run build`.

### 2026-03-17 13:20 - Санировал product API copy для тренировок, питания и онбординга

- Перевёл в нормальный русский user-facing ошибки и статусы в `src/app/api/weekly-programs/route.ts`, `src/app/api/weekly-programs/[id]/clone/route.ts`, `src/app/api/weekly-programs/[id]/lock/route.ts`, `src/app/api/nutrition/targets/route.ts`, `src/app/api/onboarding/route.ts`, `src/app/api/chat/route.ts`, `src/app/api/meal-templates/route.ts`, `src/app/api/meals/route.ts`, `src/app/api/settings/billing/route.ts`.
- Закрыл остатки английского и mojibake в self-service/product route surface: weekly programs, nutrition targets, onboarding, legacy chat, meal templates, meals и billing center теперь отдают чистый UTF-8 copy.
- Tranche подтверждён командами `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.

### 2026-03-17 14:10 - Дочистил self-service delete/export routes

- Переписал в чистом UTF-8 `src/app/api/foods/[id]/route.ts`, `src/app/api/meal-templates/[id]/route.ts`, `src/app/api/meals/[id]/route.ts`, `src/app/api/recipes/[id]/route.ts`, `src/app/api/settings/data/route.ts`, `src/app/api/settings/data/export/[id]/download/route.ts`.
- Self-service update/delete/export поверхности для продуктов, шаблонов питания, приёмов пищи, рецептов и центра данных теперь отдают единый понятный русский copy без mojibake.
- Follow-up подтверждён командами `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.

### 2026-03-17 15:00 - Санировал billing, sync и workout route copy

- Перевёл в нормальный русский user-facing copy в `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/checkout/reconcile/route.ts`, `src/app/api/billing/portal/route.ts`, `src/app/api/dashboard/period-compare/route.ts`, `src/app/api/exercises/route.ts`, `src/app/api/exercises/[id]/route.ts`, `src/app/api/sync/pull/route.ts`, `src/app/api/sync/push/route.ts`, `src/app/api/workout-days/[id]/route.ts`, `src/app/api/workout-days/[id]/reset/route.ts`, `src/app/api/workout-sets/[id]/route.ts`.
- Billing, dashboard compare, exercise library, sync и workout execution route surface больше не отдают английские login/update/error сообщения и выровнены по русскому production copy.
- Tranche подтверждён командами `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.

### 2026-03-17 16:05 - Санировал operator и internal API copy

- Перевёл в нормальный русский operator/internal copy в `src/app/api/admin/ai-evals/run/route.ts`, `src/app/api/admin/bootstrap/route.ts`, `src/app/api/admin/operations/route.ts`, `src/app/api/admin/operations/process/route.ts`, `src/app/api/admin/operations/[kind]/[id]/route.ts`, `src/app/api/admin/users/bulk/route.ts`, `src/app/api/admin/users/[id]/billing/route.ts`, `src/app/api/admin/users/[id]/billing/reconcile/route.ts`, `src/app/api/admin/users/[id]/deletion/route.ts`, `src/app/api/admin/users/[id]/export/route.ts`, `src/app/api/admin/users/[id]/restore/route.ts`, `src/app/api/admin/users/[id]/role/route.ts`, `src/app/api/admin/users/[id]/support-action/route.ts`, `src/app/api/admin/users/[id]/suspend/route.ts`, `src/app/api/billing/webhook/stripe/route.ts`, `src/app/api/internal/jobs/billing-reconcile/route.ts`, `src/app/api/internal/jobs/dashboard-warm/route.ts`, `src/app/api/internal/jobs/knowledge-reindex/route.ts`, `src/app/api/internal/jobs/nutrition-summaries/route.ts`.
- Operator/internal API surface больше не отдает английские payload/update/queue/error сообщения и выровнен по русскому operator UX.
- Tranche подтверждён командами `npx eslint ...`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `36 passed`.

### 2026-03-17 17:10 - Добавил CI gate для Supabase advisors

- Добавил `scripts/verify-advisors.mjs` и `scripts/verify-advisors.ps1`: они используют Supabase Management API (`/v1/projects/{ref}/advisors/security` и `/v1/projects/{ref}/advisors/performance`) и автоматически срабатывают только если в diff есть SQL-миграции.
- В `package.json` появился `npm run verify:advisors`, а в `.github/workflows/quality.yml` добавлен secret-guarded job `advisors`, который запускается при наличии `SUPABASE_ACCESS_TOKEN` и `SUPABASE_PROJECT_REF`.
- Gate падает только на новые `WARN/ERROR` findings; текущий platform-level security warning `auth_leaked_password_protection` зафиксирован как baseline allowlist, чтобы workflow не был вечно красным из-за внешней настройки проекта.
- Локально tranche подтверждён командами `npm run verify:advisors`, `npm run lint`, `npm run typecheck`, `npm run build`; `verify:advisors` корректно делает no-op, если в текущем diff нет SQL-миграций.

### 2026-03-17 17:35 - Закрыл retrieval ownership для vector-layer

- `tests/rls/helpers/supabase-rls.ts` расширен fixture-строкой в `knowledge_embeddings`: теперь direct RLS suite сидирует не только `knowledge_chunks`, но и реальный vector row для того же пользователя.
- `tests/rls/ownership.spec.ts` теперь подтверждает, что владелец видит свой `knowledge_embeddings` row, а другой auth-user не видит его даже при точечном запросе по `id`.
- После этого подпункт плана про owner-only доступ для `chat`, `sessions`, `retrieval`, `reindex` и `proposal apply` можно считать закрытым не только по route-level сценариям, но и по прямому retrieval storage layer.
- Tranche подтверждён командами `npx eslint tests/rls tests/rls/helpers`, `npm run test:rls`, `npm run typecheck`, `npm run build`.

### 2026-03-17 21:20 - Развёл AI runtime/config UX и убрал лишний повторный build в тестах

- `src/components/ai-chat-panel-model.ts`, `src/components/ai-chat-notices.tsx`, `src/components/use-ai-chat-actions.ts`, `src/components/use-ai-chat-composer.ts`, `src/components/use-ai-chat-session-state.ts`, `src/components/use-ai-chat-view-state.ts`, `src/components/ai-chat-panel.tsx` перевёл на typed notice-модель: теперь AI surface отдельно показывает `сервис временно недоступен` для provider/config проблем и `повтори позже` для runtime сбоев.
- `src/app/api/ai/chat/route.ts`, `src/app/api/ai/assistant/route.ts`, `src/app/api/ai/meal-photo/route.ts` теперь отдают согласованные русские сообщения и явный `503 AI_PROVIDER_UNAVAILABLE` там, где сбой именно во внешнем провайдере или неготовой конфигурации.
- `scripts/run-next-with-dist-dir.mjs` получил memory guard для `next build`, а новый `scripts/ensure-next-build.mjs` подключён в `pretest:e2e`, `pretest:e2e:auth`, `pretest:smoke`: smoke и auth e2e больше не делают лишний rebuild поверх уже готового `.next`.
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `3 passed`, `npx playwright test tests/e2e/ai-workspace.spec.ts tests/e2e/api-contracts.spec.ts --workers=1` -> `8 passed`, `npm run test:e2e:auth` -> `36 passed`.

### 2026-03-17 22:05 - Подтвердил retrieval по всей исторической базе пользователя

- `src/lib/ai/knowledge-retrieval.ts` перевёл text/vector fallback на пагинацию по всей истории пользователя: больше нет скрытого свежего bias через `limit(400)` на embeddings и `limit(600)` на последние knowledge chunks.
- Вынес чистые helper’ы `collectPaginatedRows`, `rankKnowledgeChunksByText`, `rankKnowledgeMatchesFromEmbeddingRows`, чтобы исторический retrieval был проверяемым без живого AI runtime и без внешнего embedding provider.
- Добавил `tests/rls/retrieval-history.spec.ts`: suite подтверждает, что pager доходит дальше первых страниц, старый релевантный text chunk находится среди сотен новых нерелевантных записей, а старый релевантный embedding выигрывает в vector fallback после загрузки поздних страниц.
- Tranche подтверждён командами `npx eslint src/lib/ai/knowledge-retrieval.ts tests/rls/retrieval-history.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.

### 2026-03-17 21:56 - Довёл AI quality gate до реального внешнего блокера

- В `src/lib/ai/chat.ts` добавил явное создание новой AI-сессии, а `src/app/api/ai/sessions/route.ts` научил `POST`, чтобы новый чат существовал на сервере до первого сообщения.
- `src/components/use-ai-chat-session-state.ts`, `src/components/use-ai-chat-composer.ts`, `src/components/use-ai-chat-actions.ts` и `src/components/ai-chat-panel.tsx` перевёл на этот контракт: новый чат, stale-session recovery и анализ фото еды больше не падают на ложном `AI_CHAT_SESSION_NOT_FOUND`.
- Дочистил AI gate тест `tests/ai-gate/ai-quality-gate.spec.ts`: assistant surface теперь доходит до provider/runtime notice вместо зависания на пустом transcript state.
- Подтвердил общий baseline: `npm run lint`, `npm run typecheck`, `npm run build`, `npx eslint tests/ai-gate tests/e2e/helpers/ai.ts tests/e2e/helpers/auth.ts`, `npx playwright test tests/e2e/ai-workspace.spec.ts --workers=1` -> `2 passed`, `npm run test:e2e:auth` -> `36 passed`, `npm run test:smoke` -> `3 passed`.
- `npm run test:ai-gate` теперь падает только на реальном внешнем блокере: `OpenRouter 402` по кредитам и `Voyage 403` по embeddings.

### 2026-03-18 00:35 - Дожал regression-контур мобильной тренировки

- В `src/components/workout-day-session.tsx` убрал принудительный возврат к первому незавершённому шагу при hydration: focus-mode теперь даёт открыть уже сохранённый шаг и нажать `Редактировать`, если нужно поправить упражнение.
- В `src/components/workout-session/use-workout-session-actions.ts` автопереход на следующий шаг теперь делается в момент сохранения упражнения, а не глобальным эффектом после любого server snapshot.
- Добавил стабильные `data-testid` на шаги, карточки упражнения, save/edit-кнопки и таймер в `src/components/workout-session/workout-step-strip.tsx`, `src/components/workout-session/workout-exercise-card.tsx`, `src/components/workout-day-session.tsx`.
- Расширил тестовые helper'ы `tests/e2e/helpers/workouts.ts` и `tests/e2e/helpers/navigation.ts`, а также добавил новый сценарий `tests/e2e/workout-focus-flow.spec.ts`: теперь отдельным e2e подтверждены ordered-step flow, повторное редактирование сохранённого шага, сохранение времени при завершении и полный reset до стартового состояния.
- Заодно убрал хрупкий `networkidle` из owner-isolation сценария `tests/e2e/ownership-isolation.spec.ts`, чтобы admin/user proposal isolation не флакал на лишнем сетевом шуме.
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth -- --reporter=line` -> `38 passed`.

### 2026-03-18 02:10 - Привёл admin в общий workspace-паттерн и убрал hydration-риск у section visibility

- Вынес `/admin` в новый `src/components/admin-dashboard-workspace.tsx`: операторская главная теперь использует тот же workspace-подход, что `Dashboard`, `Workouts`, `Nutrition` и `Settings`, с секциями `Состояние`, `Очереди`, `Пользователи`, `ИИ` и `Главный доступ`.
- `src/app/admin/page.tsx` стал server-side orchestrator'ом: загрузка данных осталась на странице, а сам heavy UI moved в выделенный workspace surface без giant inline markup.
- `src/components/page-workspace.tsx` перевёл на hydration-safe чтение `localStorage`: состояние скрытия `обзора / меню / раздела` теперь поднимается только после mount и больше не даёт mismatch между серверным HTML и клиентом.
- Для тестового контура зафиксировал production-like build contract в `package.json`: `build`, `build:test` и `start:test` явно работают со стандартным `.next`, чтобы Playwright и Vercel не расходились по `distDir`.
- Обновил `tests/e2e/mobile-pwa-regressions.spec.ts`: mobile regression теперь отдельно подтверждает admin workspace, section-menu и hide/show toggles на `/admin`.
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npm exec playwright test tests/e2e/admin-app.spec.ts tests/e2e/mobile-pwa-regressions.spec.ts --workers=1 --reporter=line` -> `8 passed`, `npm run test:e2e:auth` -> `38 passed`.

### 2026-03-18 03:25 - Дожал shell и навигацию до production-паттерна

- `src/components/app-shell-frame.tsx` полностью пересобран в чистом UTF-8: desktop header и compact header больше не отдают битую кириллицу, а collapsed-state остаётся читаемым и предсказуемым.
- `src/components/app-shell-nav.tsx` теперь поднимает состояние burger-drawer наружу через `onDrawerOpenChange`, так что shell знает, когда mobile drawer действительно открыт.
- `src/components/ai-assistant-widget.tsx` получил `hidden` contract и стабильный `data-testid` для floating launcher; в mobile shell AI-виджет теперь не мешает burger-menu и не перекрывает drawer.
- `src/app/api/admin/users/[id]/route.ts` больше не зависит от `PLAYWRIGHT_TEST_HOOKS` для forced degraded snapshot: admin detail fallback regression теперь стабилен независимо от того, как именно поднят локальный test server.
- Полностью переписал `tests/e2e/mobile-pwa-regressions.spec.ts` и `tests/e2e/ui-regressions.spec.ts` в чистом UTF-8 и добавил отдельную desktop-shell regression: проверяется полный top nav, сворачивание шапки и отсутствие hydration/render-loop regressions на user/admin surface.
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/admin-app.spec.ts tests/e2e/mobile-pwa-regressions.spec.ts tests/e2e/ui-regressions.spec.ts tests/e2e/ownership-isolation.spec.ts -g "AI chat history|admin app|mobile pwa regressions|ui regressions" --workers=1 --reporter=line` -> `13 passed`.

### 2026-03-18 14:25 - Довёл AI chat и knowledge до orchestrator-паттерна

- `src/components/use-ai-chat-web-search.ts` вынес hydration-safe `web search` storage state и toggle-логику из `src/components/ai-chat-panel.tsx`, так что сам чат больше не держит `useSyncExternalStore` plumbing внутри JSX-orchestrator слоя.
- `src/components/use-ai-chat-session-recovery.ts` вынес stale-session recovery: сброс transcript state, повторный `createRemoteSession(...)` и safe retry на `AI_CHAT_SESSION_NOT_FOUND` больше не размазаны по `ai-chat-panel.tsx`.
- `src/components/ai-chat-panel.tsx` теперь сводит только orchestration: toolbar/notices/transcript/composer + вызовы `useAiChatWebSearch`, `useAiChatSessionRecovery`, `useAiChatSessionState`, `useAiChatActions`, `useAiChatComposer`, `useAiChatViewState`.
- `src/lib/ai/knowledge-runtime.ts` вынес `reindexUserKnowledgeBase(...)` и `ensureKnowledgeIndex(...)` из `src/lib/ai/knowledge.ts`; сам `knowledge.ts` теперь остался тонким facade для re-export и `retrieveKnowledgeMatches(...)`.
- Пункт плана про финальную orchestrator-роль `knowledge.ts` и `ai-chat-panel.tsx` закрыт; общий прогресс execution checklist после tranche: `140 / 176` (`80%`).
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/ai-workspace.spec.ts tests/e2e/api-contracts.spec.ts --workers=1` -> `8 passed`, `npm run test:e2e:auth` -> `39 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-18 15:20 - Довёл workout day screen до orchestrator-паттерна

- `src/components/workout-session/workout-status-actions.tsx` вынес action-bar статусов (`Начать`, `Завершить`, `Синхр.`, `Обнулить`) из `src/components/workout-day-session.tsx`, так что day-screen больше не держит внутри business-aware button JSX.
- `src/components/workout-session/workout-day-notices.tsx` вынес offline/lock/error/notice surface из `workout-day-session.tsx`; предупреждения и sync notices теперь живут отдельно от orchestration state.
- `src/components/workout-session/workout-focus-header.tsx` вынес мобильный focus-header: таймер, collapse toggle, regular-mode CTA, progress pills и compact action area больше не смешаны с sync/persistence logic в основном экране.
- `src/components/workout-day-session.tsx` после этого стал ближе к реальной orchestrator-роли: он собирает derived state, sync/actions/timer hooks и композицию через `WorkoutDayOverviewCard`, `WorkoutDayContextCard`, `WorkoutFocusHeader`, `WorkoutDayNotices`, `WorkoutStatusActions`, `WorkoutExerciseCard`.
- Пункт плана про финальную orchestrator-роль `workout-day-session.tsx` закрыт; общий прогресс execution checklist после tranche: `141 / 176` (`80%`).
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e:auth` -> `39 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-18 17:55 - Довёл AI workspace до читаемого сценария и почистил copy

- `src/components/ai-workspace.tsx` получил явный flow-блок `Запрос -> Анализ -> Предложение -> Подтверждение -> Применение`, поэтому путь работы с AI теперь читается прямо на странице, а не только через разрозненные карточки в чате.
- `src/components/ai-chat-panel-cards.tsx`, `src/components/ai-workspace-sidebar.tsx`, `src/components/ai-chat-composer.tsx` и связанный AI surface copy выровнены под читаемый user-facing сценарий без служебных формулировок.
- `tests/e2e/ai-workspace.spec.ts` теперь подтверждает наличие нового assistant-flow surface, а полный regression baseline заново зелёный.
- Пункт плана про сценарий `запрос -> анализ -> предложение -> подтверждение -> применение` закрыт; общий прогресс execution checklist после tranche: `142 / 176` (`81%`).
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/ai-workspace.spec.ts tests/e2e/api-contracts.spec.ts --workers=1` -> `8 passed`, `npm run test:e2e:auth` -> `39 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-18 19:05 - Сделал AI proposal actions идемпотентными

- В `src/lib/ai/proposal-actions.ts` перевёл `approveAiPlanProposal(...)` и `applyAiPlanProposal(...)` в идемпотентный режим: повторное подтверждение возвращает уже `approved` proposal, а повторное применение возвращает уже `applied` proposal и тот же applied meta без лишнего side effect.
- Для applied proposals добавил единый helper `buildAppliedProposalMeta(...)`, чтобы и первый, и повторный `apply` отдавали одинаковый `mealTemplateIds` / `weeklyProgramId` payload вместо скрытого расхождения между первичным и повторным ответом.
- `tests/e2e/api-contracts.spec.ts` расширен admin-only контрактом на повторные `approve/apply` вызовы; сценарий использует реальный seeded proposal и подтверждает, что второй запрос остаётся `200`, не дублирует побочный эффект и возвращает тот же applied result.
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `7 passed`, `npm run test:e2e:auth` -> `40 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-18 20:10 - Восстановил стабильный typecheck и добавил regression на повторные done/reset

- В `package.json` перевёл `typecheck` обратно на стандартный `.next`, а из `tsconfig.json` убрал legacy include-пути `.next_build/types/**/*.ts` и `.next_build/dev/types/**/*.ts`: baseline снова проходит за один запуск без `TS6053` на отсутствующих route types.
- `tests/e2e/workout-sync.spec.ts` получил отдельный direct-route regression: после заполнения сета повторный `PATCH /api/workout-days/[id]` со статусом `done` и повторный `POST /api/workout-days/[id]/reset` оба остаются `200` и возвращают тот же корректный snapshot.
- Тестовый контракт теперь отдельно подтверждает, что direct workout mutation routes безопасно переживают повторные запросы, а не только `sync/push -> reset -> sync/pull` сценарий.
- Tranche подтверждён командами `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/workout-sync.spec.ts -g "done and reset routes stay idempotent on repeated requests" --workers=1` -> `1 passed`, `npm run test:smoke` -> `3 passed`.

### 2026-03-18 21:05 - Расширил direct RLS ownership на nutrition self-service слой

- В `tests/rls/helpers/supabase-rls.ts` добавил fixture rows для `meal_templates`, `meals`, `meal_items`, а затем расширил этот же слой до `recipe_items` и `daily_nutrition_summaries`.
- `tests/rls/ownership.spec.ts` теперь напрямую подтверждает, что владелец видит свои `meal_templates`, `meals`, `meal_items`, `recipe_items`, `daily_nutrition_summaries`, а другой auth-user не видит их даже при точечном запросе по `id`.
- Это добивает прямой row-level слой для nutrition self-service контура: owner-only подтверждён не только route-level e2e, но и raw Supabase client access tests.
- Tranche подтверждён командами `npx eslint tests/rls tests/rls/helpers`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.

### 2026-03-18 22:20 - Довёл typecheck до реально стабильного one-run контракта

- Первый фикс с простым переводом `typecheck` на `.next` оказался недостаточным: `next typegen` не строил полный `app`-набор route wrappers после чистого удаления `.next/types`, из-за чего `tsc` продолжал ловить `TS6053`.
- Для этого добавил `scripts/typecheck-stable.mjs`: runner сначала запускает `npx next typegen`, потом проверяет, действительно ли появились route wrappers в `.next/types/app/...`, и если нет — автоматически догоняет их через `npm run build`, а уже затем запускает `tsc`.
- После этого `package.json` переведён на новый runner, и baseline подтверждён честным сценарием с удалением `.next/types` через Node и последующим одним `npm run typecheck` без ручного повтора.
- Tranche подтверждён командами `node -e \"fs.rmSync('.next/types', ...)\"`, `npm run typecheck`, `npx eslint tests/rls tests/rls/helpers`, `npm run test:rls` -> `4 passed`, `npm run build`.

### 2026-03-19 00:40 - Дожал nutrition targets contract и прямой RLS для профиля питания

- В `src/app/api/nutrition/targets/route.ts` перенёс обработку `ZodError` до unexpected logger-ветки: ожидаемо невалидный payload на `PUT /api/nutrition/targets` теперь даёт явный `400 NUTRITION_TARGETS_INVALID` без лишнего route-level `logger.error`.
- В `tests/e2e/api-contracts.spec.ts` добавил invalid-payload контракт для nutrition targets, а `tests/e2e/helpers/http.ts` расширил общим `PUT`-методом.
- В `tests/rls/helpers/supabase-rls.ts` и `tests/rls/ownership.spec.ts` расширил прямой owner-only coverage до `goals`, `nutrition_goals`, `nutrition_profiles`, `body_metrics`, чтобы nutrition/body/self-profile слой был подтверждён не только route-level e2e, но и raw Supabase client access тестами.
- Проверка зелёная: `npx eslint src/app/api/nutrition/targets/route.ts tests/e2e/api-contracts.spec.ts tests/e2e/helpers/http.ts tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`, `npm run test:smoke` -> `3 passed`, `npm run test:e2e:auth` -> `41 passed`.

### 2026-03-19 02:05 - Расширил direct RLS на профили, метрики и AI memory

- В `tests/rls/helpers/supabase-rls.ts` добавил fixture rows для `profiles`, `onboarding_profiles`, `daily_metrics`, `period_metric_snapshots`, `user_memory_facts`, `ai_safety_events`, чтобы тестовый owner-only слой покрывал уже и профильный/агрегатный/AI-memory контур.
- В `tests/rls/ownership.spec.ts` расширил прямые проверки видимости и blocked-update сценарии: другой auth-user теперь подтверждённо не видит и не может менять `profiles`, `onboarding_profiles`, `daily_metrics`, `period_metric_snapshots`, `user_memory_facts`, `ai_safety_events`.
- Это уменьшает реальный хвост по database audit: RLS теперь подтверждён не только route-level e2e и nutrition/workout assets, но и на нескольких ключевых user-scoped таблицах, из которых читаются `viewer`, onboarding, dashboard aggregates и AI context.
- Проверка зелёная: `npx eslint tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.

### 2026-03-19 02:40 - Закрыл прямой RLS на billing user tables

- В `tests/rls/helpers/supabase-rls.ts` добавил fixture rows для `subscriptions`, `subscription_events`, `entitlements`, `usage_counters`, чтобы billing user-scoped слой тоже был подтверждён direct Supabase client access тестами.
- В `tests/rls/ownership.spec.ts` расширил owner-only проверки: владелец видит свои billing rows, другой auth-user не видит их и не может точечно обновить `usage_counters`.
- Это снижает остаток по database/billing audit: user-scoped billing данные теперь покрыты не только route guards, но и прямой RLS-проверкой.
- Проверка зелёная: `npx eslint tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.

### 2026-03-19 03:15 - Довёл direct RLS до workout execution rows

- В `tests/rls/helpers/supabase-rls.ts` добавил fixture rows для `workout_days`, `workout_exercises`, `workout_sets`, чтобы owner-only suite покрывал уже и фактическое выполнение тренировки, а не только `weekly_programs` и `workout_templates`.
- В `tests/rls/ownership.spec.ts` расширил direct checks: владелец видит свои `workout_day / workout_exercise / workout_set`, другой auth-user не видит их и не может обновить чужой `workout_set`.
- Заодно сделал billing fixture идемпотентным через `upsert` для `entitlements` и `usage_counters`, чтобы `test:rls` не падал на накопленных уникальных ключах предыдущих прогонов.
- Проверка зелёная: `npx eslint tests/rls/helpers/supabase-rls.ts tests/rls/ownership.spec.ts`, `npm run test:rls` -> `4 passed`, `npm run typecheck`, `npm run build`.

### 2026-03-19 05:05 - Зафиксировал полный Supabase DB audit и закрыл DB checklist пункты

- Собрал свежий MCP-снимок базы через `list_tables`, `get_advisors`, прямые SQL-запросы к `pg_indexes`, `pg_policies` и `information_schema.routines`, чтобы закрыть DB checklist не “по памяти”, а по актуальному состоянию проекта.
- Добавил `docs/DB_AUDIT.md` как source of truth по схеме, RLS, RPC, owner/deny-all policies, индексным путям и остаткам Supabase advisors для `fit`.
- В `docs/README.md` и `docs/BACKEND.md` добавил явные ссылки на новый audit-doc, чтобы DB-срез был частью рабочей handoff-документации, а не отдельной временной заметкой.
- Подтверждено, что используемые `public`-таблицы находятся под `RLS`, ключевые owner-only и deny-all policies зафиксированы, а query paths для `sync`, `workout`, `knowledge`, `admin`, `billing` обеспечены индексами.
- По security advisors остались только platform-level residuals: `vector` extension в `public` и выключенная `leaked password protection`; по performance advisors остались только `unused_index` info без блокирующих missing-index warning.
- В `docs/MASTER_PLAN.md` закрыты два основных DB-пункта: полный аудит схемы/RLS/RPC/index-path через MCP и отдельная проверка query paths/индексов для критических контуров. Общий прогресс execution checklist после tranche: `144 / 176` (`82%`).

### 2026-03-19 16:55 - Дожал auth-first billing contracts и invalid payload coverage

- `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/checkout/reconcile/route.ts`, `src/app/api/billing/portal/route.ts`, `src/app/api/settings/billing/route.ts` теперь жёстко auth-first: анонимный запрос получает `401 AUTH_REQUIRED` до любых Stripe/env checks.
- В `src/app/api/billing/checkout/reconcile/route.ts` и `src/app/api/settings/billing/route.ts` ожидаемый `ZodError` теперь возвращает явный `400` до unexpected logger-ветки, поэтому invalid payload больше не шумит как route-level failure.
- `src/app/api/billing/webhook/stripe/route.ts` и весь billing/settings surface в этом tranche переведены в чистый UTF-8: user-facing auth/config/error copy больше не отдаёт битую кириллицу.
- `tests/e2e/api-contracts.spec.ts` расширен двумя контрактами: unauthenticated billing/settings routes остаются auth-first (`401 AUTH_REQUIRED`), а invalid payload на `POST /api/settings/billing` даёт `400 SETTINGS_BILLING_INVALID`.
- В `tests/e2e/helpers/auth.ts` добавлен более устойчивый `waitForSubmitButtonReady(...)`, чтобы Playwright auth bootstrap не флакал из-за delayed React-controlled form state.
- Tranche подтверждён командами `npx eslint src/app/api/billing/checkout/route.ts src/app/api/billing/checkout/reconcile/route.ts src/app/api/billing/portal/route.ts src/app/api/billing/webhook/stripe/route.ts src/app/api/settings/billing/route.ts tests/e2e/api-contracts.spec.ts tests/e2e/helpers/auth.ts`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/api-contracts.spec.ts --workers=1` -> `8 passed`.
