# Документация по AI-стеку

## Текущий AI runtime

Основной runtime живёт в:

- `src/lib/ai/gateway.ts`

Сейчас проект использует два отдельных слоя:

- chat/generation runtime;
- embeddings/retrieval runtime.

## Текущие модели и провайдеры

### Chat / generation

- основной runtime ориентирован на OpenRouter;
- рабочая chat-модель задаётся через env и используется в `models.chat`;
- в коде уже подготовлен production-путь для sports-only assistant, workout plan, meal plan и meal-photo сценариев.

### Embeddings

- embeddings идут отдельно от chat runtime;
- retrieval слой опирается на dedicated embedding runtime;
- knowledge индекс не жёстко привязан к chat-провайдеру.

## Основные AI маршруты

- `src/app/api/ai/assistant/route.ts`
- `src/app/api/ai/chat/route.ts`
- `src/app/api/ai/meal-photo/route.ts`
- `src/app/api/ai/meal-plan/route.ts`
- `src/app/api/ai/workout-plan/route.ts`
- `src/app/api/ai/reindex/route.ts`
- `src/app/api/ai/sessions/route.ts`
- `src/app/api/ai/sessions/[id]/route.ts`
- `src/app/api/ai/proposals/[id]/approve/route.ts`
- `src/app/api/ai/proposals/[id]/apply/route.ts`

## Слои AI-контура

### 1. User context

`src/lib/ai/user-context.ts` собирает:

- профиль;
- onboarding;
- цели;
- тренировочные сигналы;
- nutrition сигналы;
- body metrics;
- structured knowledge;
- snapshots.

Это основной персональный контекст для assistant и генерации планов.

### 2. Knowledge / retrieval

Главный оркестратор:

- `src/lib/ai/knowledge.ts`

Вынесенные модули:

- `src/lib/ai/knowledge-retrieval.ts`
- `src/lib/ai/knowledge-source-data.ts`
- `src/lib/ai/knowledge-indexing.ts`
- `src/lib/ai/knowledge-documents.ts`

Что делает knowledge layer:

- собирает user-scoped corpus;
- строит knowledge documents из тренировок, питания, snapshots и structured facts;
- поддерживает retrieval через vector/text fallback;
- умеет reindex и embeddings refresh;
- не должен выходить за границы данных текущего пользователя.

### 3. Structured knowledge

`src/lib/ai/structured-knowledge.ts` нормализует факты:

- ключевые сигналы по тренировкам;
- сигналы по питанию;
- meal-patterns;
- nutrition strategy;
- приоритеты для AI-ответа и планов.

Это слой KAG/CAG-подобной нормализации поверх сырой истории.

### 4. Proposals

`src/lib/ai/proposals.ts` и `src/lib/ai/proposal-actions.ts` обеспечивают flow:

- создать proposal;
- показать draft;
- подтвердить proposal;
- применить proposal в приложение.

Принцип остаётся proposal-first: AI не должен молча менять пользовательские данные.

## AI chat workspace

Ключевой клиентский экран:

- `src/app/ai/page.tsx`

Основные клиентские модули:

- `src/components/ai-chat-panel.tsx`
- `src/components/ai-chat-transcript.tsx`
- `src/components/ai-chat-composer.tsx`
- `src/components/ai-chat-toolbar.tsx`
- `src/components/ai-chat-notices.tsx`
- `src/components/ai-prompt-library.tsx`
- `src/components/ai-workspace.tsx`
- `src/components/ai-workspace-sidebar.tsx`

Вынесенные hook-слои:

- `src/components/use-ai-chat-session-state.ts`
- `src/components/use-ai-chat-actions.ts`
- `src/components/use-ai-chat-composer.ts`
- `src/components/use-ai-chat-view-state.ts`

## Safety posture

Главный guardrail слой:

- `src/lib/ai/domain-policy.ts`

Что он делает:

- ограничивает AI только темами спорта, тренировок, питания, восстановления и фитнес-здоровья;
- блокирует off-topic запросы;
- запрещает раскрытие модели, провайдера, system prompt и внутренней архитектуры;
- требует русскоязычный ответ;
- запрещает cross-user доступ к данным.

`src/lib/ai/plan-generation.ts` теперь тоже санирован в чистом UTF-8 и использует нормальные русские prompt-строки для workout/meal proposals.

## Meal photo flow

Маршрут:

- `src/app/api/ai/meal-photo/route.ts`

Что делает flow:

- принимает изображение еды;
- валидирует тип и размер файла;
- отправляет изображение в vision runtime;
- возвращает proposal-first разбор блюда: summary, kcal, macros, suggestions.

Важно: этот flow не должен автоматически создавать meal log без подтверждения пользователя.

## Evaluations

Отдельный eval-контур лежит в:

- `ai-evals/README.md`
- `ai-evals/datasets/README.md`
- `ai-evals/fit_eval/runner.py`

Назначение:

- benchmark assistant/retrieval/meal-plan/workout-plan/safety сценариев;
- future quality gate через Ragas;
- сравнение изменений prompt/retrieval/policy до релиза.

## Текущее состояние

Уже реализовано:

- assistant/chat runtime;
- history sessions;
- fullscreen AI workspace;
- prompt library;
- image upload;
- retrieval по персональной истории;
- structured knowledge;
- proposal approve/apply flow;
- admin reindex/eval surface;
- sports-only guardrails;
- чистый prompt/guardrail слой без mojibake.

Ещё не закрыто до production hardening:

- полноценный eval quality gate;
- staging-like verification runtime провайдеров;
- финальная sanitation-волна по всем AI docs;
- полное подтверждение owner-only route isolation на каждом AI mutation/read path.
