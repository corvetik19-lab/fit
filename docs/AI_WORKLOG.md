# AI Worklog

## Как читать этот файл

- Это не полный исторический дамп всех мелких правок.
- Во время production hardening журнал был сжат и переписан в чистый UTF-8.
- Ниже остаются только ключевые tranche, которые помогают понять текущее состояние продукта и инженерного контура.

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
