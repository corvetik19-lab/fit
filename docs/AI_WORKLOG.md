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
