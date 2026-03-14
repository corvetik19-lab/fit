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
