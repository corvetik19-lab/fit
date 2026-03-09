# Документация по AI-стеку

## Runtime choices

- AI Gateway provider: Vercel AI Gateway
- основная generation model: `google/gemini-3.1-pro-preview`
- основная embedding model: `voyage/voyage-4-large`

## Текущий runtime helper

- `src/lib/ai/gateway.ts`

Сейчас он определяет:

- `models.chat`
- `models.embeddings`

## Текущая AI route-поверхность

- `src/app/api/chat/route.ts`
- `src/app/api/ai/workout-plan/route.ts`
- `src/app/api/ai/meal-plan/route.ts`
- `src/app/api/ai/meal-photo/route.ts`
- `src/app/api/ai/reindex/route.ts`

## Safety posture

- AI-действия должны оставаться proposal-first
- нельзя молча записывать workout plans или meal plans в пользовательские данные
- risky или medical-style prompts должны блокироваться или понижаться до safe response
- safety events предполагается логировать в `ai_safety_events`

## Текущее состояние реализации

Реализовано:

- локальный `AI_GATEWAY_API_KEY`
- AI Gateway helper
- route scaffolding для основных AI-сценариев
- реальный meal photo route через AI Gateway OpenResponses с image input
- реальный user-context helper для AI routes
- persistence слой для `ai_plan_proposals`
- реальные meal/workout proposal routes с сохранением результата
- confirmation/apply routes для AI proposals
- eval workspace scaffold внутри `ai-evals/`
- admin-only queueing для `ai_eval_runs`
- admin-only queueing для `ai/reindex`

Пока не завершено:

- реальная retrieval wiring
- сбор user-context из workout, nutrition и profile data
- proposal confirmation UX
- embeddings ingestion и query pipeline
- eval runners и admin reporting

## Meal photo flow

- `src/app/api/ai/meal-photo/route.ts` принимает изображение блюда и optional контекст через `FormData`
- route валидирует размер и MIME-type изображения, а затем вызывает Vercel AI Gateway OpenResponses API
- модель возвращает только proposal-оценку: название блюда, summary, confidence, estimated kcal, macros, detected items и suggestions
- ответ валидируется через `mealPhotoAnalysisSchema`, чтобы UI не зависел от произвольного текстового формата модели
- flow намеренно не создаёт meal log автоматически и остаётся proposal-first

## Plan proposal flow

- `meal-plan` и `workout-plan` routes теперь используют реальный user context вместо голых входных полей
- контекст собирается из профиля, onboarding, goals, nutrition targets, body metrics и текущей nutrition summary
- каждый успешный ответ модели сохраняется в `ai_plan_proposals`
- `/ai` показывает эти предложения как историю AI-proposals, но не применяет их автоматически

## Confirmation flow

- `approve` переводит proposal в подтверждённое состояние без немедленного изменения workout/nutrition домена
- `apply` для workout proposals создаёт draft weekly program и при необходимости недостающие упражнения
- `apply` для meal proposals создаёт reference-only `meal_templates`, которые служат управляемыми nutrition-артефактами
- такой apply остаётся controlled: пользователь инициирует его вручную из `/ai`

## AI evaluation workspace

- `ai-evals/README.md`
- `ai-evals/datasets/README.md`

Назначение:

- держать evaluation-логику вне runtime app code
- запускать benchmark-наборы для chat, workout planning, meal planning, retrieval и safety
- поддерживать будущие Ragas-based quality gates

## Операционная заметка

Локальный AI-ключ уже существует, но deploy work пока поставлен на паузу. Текущий AI-контур нужно считать локально готовым для разработки, но не production-final.
## Runtime RAG и AI-чат

- В runtime добавлен user-scoped RAG pipeline:
  - индексация knowledge chunks;
  - embeddings через `voyage/voyage-4-large`;
  - retrieval по пользовательскому запросу;
  - подстановка источников контекста в system prompt AI-чата.
- Chat runtime использует:
  - [chat/route.ts](/C:/fit/src/app/api/ai/chat/route.ts);
  - [chat.ts](/C:/fit/src/lib/ai/chat.ts);
  - [knowledge.ts](/C:/fit/src/lib/ai/knowledge.ts).
- На текущем этапе реализован базовый RAG по пользовательским данным. Следующие крупные незакрытые пункты AI-слоя:
  - runtime CAG snapshots;
  - структурированный KAG layer;
  - admin knowledge base management;
  - Ragas-based eval runs и quality gate.
