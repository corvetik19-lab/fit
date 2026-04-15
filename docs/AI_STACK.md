# Документация по AI-стеку

## Текущий runtime

Основной AI runtime собран вокруг [gateway.ts](/C:/fit/src/lib/ai/gateway.ts).
Сейчас проект разделяет два независимых контура:

- `chat / generation` для assistant, chat, workout plan, meal plan и vision-сценариев;
- `embeddings / retrieval` для knowledge search, reindex и гибридного контекста.

Это разделение принципиально: chat-runtime может быть зелёным, даже если embeddings-провайдер временно деградировал.

## Провайдеры и модели

### Chat / generation

- Базовый внешний runtime идёт через `OpenRouter`.
- Дефолтная модель для chat и vision сейчас зафиксирована как `google/gemini-3.1-pro-preview`.
- Точка правды по дефолтам: [gateway.ts](/C:/fit/src/lib/ai/gateway.ts).
- Preflight для разработчика: [ai-runtime-preflight.mjs](/C:/fit/scripts/ai-runtime-preflight.mjs).

### Embeddings

- Embeddings живут отдельно от chat runtime.
- Код сначала пытается использовать прямой `Voyage`, затем fallback через AI Gateway embeddings.
- Точка правды: [embeddings.ts](/C:/fit/src/lib/ai/embeddings.ts).
- Если обе embeddings-ветки недоступны, retrieval не падает целиком, а уходит в text-only режим с явным warning.

## Что сейчас считается рабочим

На `2026-04-14` локально подтверждено:

- `assistant` и `chat` работают на `OpenRouter + google/gemini-3.1-pro-preview`;
- `meal plan` и `workout plan` возвращают proposal even при деградации model-json пути;
- `retrieval` сохраняет полезность в text-only fallback;
- barcode/product import через Open Food Facts подтверждён e2e-сценарием;
- AI runtime preflight больше не валит весь gate из-за embeddings-провайдера.

Остающийся внешний blocker:

- direct `Voyage` embeddings всё ещё могут отвечать `403`;
- AI Gateway embeddings могут требовать `customer verification / credit card`.

Это считается внешним provider-access blocker, а не дефектом текущего app-runtime.

## Основные AI маршруты

- [assistant/route.ts](/C:/fit/src/app/api/ai/assistant/route.ts)
- [chat/route.ts](/C:/fit/src/app/api/ai/chat/route.ts)
- [meal-photo/route.ts](/C:/fit/src/app/api/ai/meal-photo/route.ts)
- [meal-plan/route.ts](/C:/fit/src/app/api/ai/meal-plan/route.ts)
- [workout-plan/route.ts](/C:/fit/src/app/api/ai/workout-plan/route.ts)
- [reindex/route.ts](/C:/fit/src/app/api/ai/reindex/route.ts)
- [sessions/route.ts](/C:/fit/src/app/api/ai/sessions/route.ts)
- [sessions/[id]/route.ts](/C:/fit/src/app/api/ai/sessions/%5Bid%5D/route.ts)
- [proposals/[id]/approve/route.ts](/C:/fit/src/app/api/ai/proposals/%5Bid%5D/approve/route.ts)
- [proposals/[id]/apply/route.ts](/C:/fit/src/app/api/ai/proposals/%5Bid%5D/apply/route.ts)

## Слои AI-контура

### User context

[user-context.ts](/C:/fit/src/lib/ai/user-context.ts) собирает профиль, onboarding, цели, body metrics, nutrition/workout signals, snapshots и structured knowledge.

Важно:

- при частичном runtime-сбое контекст теперь умеет возвращать пустой безопасный результат;
- helper `createEmptyAiUserContext()` нужен для fail-open сценариев, а не для подмены реального контекста.

### Runtime retry и timeout budget

- [runtime-retry.ts](/C:/fit/src/lib/runtime-retry.ts) задаёт общие timeout/retry helpers;
- [runtime-budgets.ts](/C:/fit/src/lib/ai/runtime-budgets.ts) держит лимиты для AI-вызовов;
- эти модули обязательны для difficult-problem slices, где provider может быть медленным или нестабильным.

### Knowledge / retrieval

Главный orchestrator:

- [knowledge.ts](/C:/fit/src/lib/ai/knowledge.ts)

Основные вынесенные модули:

- [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts)
- [knowledge-source-data.ts](/C:/fit/src/lib/ai/knowledge-source-data.ts)
- [knowledge-indexing.ts](/C:/fit/src/lib/ai/knowledge-indexing.ts)
- [knowledge-documents.ts](/C:/fit/src/lib/ai/knowledge-documents.ts)
- [knowledge-model.ts](/C:/fit/src/lib/ai/knowledge-model.ts)
- [knowledge-hybrid-ranking.ts](/C:/fit/src/lib/ai/knowledge-hybrid-ranking.ts)

Текущий retrieval contract:

- собирает owner-scoped corpus;
- умеет `vector + lexical + fused` ranking;
- при недоступных embeddings не падает, а деградирует в text-only retrieval;
- поднимает exact lookup токены вроде barcode/marker-like значений;
- возвращает usable `sources`, даже если semantic ветка временно недоступна.

Это важно для nutrition/barcode сценариев и для исторических lookup-запросов.

### Structured knowledge

[structured-knowledge.ts](/C:/fit/src/lib/ai/structured-knowledge.ts) нормализует тренировки, питание, паттерны и ключевые факты в слой, который потом используют assistant и plan routes.

### Plans и proposal-first contract

Основная логика:

- [plan-generation.ts](/C:/fit/src/lib/ai/plan-generation.ts)
- [proposals.ts](/C:/fit/src/lib/ai/proposals.ts)
- [proposal-actions.ts](/C:/fit/src/lib/ai/proposal-actions.ts)

Текущий контракт plan-generation:

- сначала пробует компактную model-driven генерацию;
- при timeout, обрыве JSON или нестабильном structured output уходит в детерминированный fallback;
- всегда возвращает `generationMode`, чтобы разработчик видел, был ли использован model-path или fallback-path;
- не должен молча применять изменения без явного proposal flow.

Дополнение по текущему runtime-контракту:

- [plan-generation.ts](/C:/fit/src/lib/ai/plan-generation.ts) теперь сохраняет proposal в компактном виде: `contextSnapshot` и сокращённый `knowledge` вместо тяжёлого полного payload;
- [proposals.ts](/C:/fit/src/lib/ai/proposals.ts) создаёт `id` локально и делает insert без дополнительного post-insert select, чтобы proposal-path не подвисал на лишнем roundtrip;
- [meal-plan route](/C:/fit/src/app/api/ai/meal-plan/route.ts) и [workout-plan route](/C:/fit/src/app/api/ai/workout-plan/route.ts) считают usage best-effort и не блокируют ответ пользователю, если metering-слой медленный.

## Safety posture

Главный guardrail-модуль:

- [domain-policy.ts](/C:/fit/src/lib/ai/domain-policy.ts)

Что он гарантирует:

- AI ограничен доменами спорта, тренировок, питания, восстановления и фитнес-здоровья;
- off-topic запросы блокируются;
- запрещено раскрывать system prompt и внутреннюю архитектуру;
- ответы должны оставаться русскоязычными;
- cross-user доступ к данным запрещён.

## AI workspace

Ключевые клиентские точки:

- [ai/page.tsx](/C:/fit/src/app/ai/page.tsx)
- [ai-workspace.tsx](/C:/fit/src/components/ai-workspace.tsx)
- [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx)

Важная деталь текущего состояния:

- AI workspace должен выдерживать отсутствие embeddings и частичные provider timeout’ы без полного обрушения UI;
- состояние web-search toggle, history и composer не должно зависеть от hydration-заглушек.

Текущий UI-контракт для деградации:

- если assistant уже вернул осмысленный fallback-ответ, [ai-chat-panel.tsx](/C:/fit/src/components/ai-chat-panel.tsx) не должен одновременно показывать ложный runtime-banner;
- баннер ошибки допустим только когда у пользователя нет renderable assistant-reply и он действительно остался без usable результата.

## Meal photo и barcode/import

### Meal photo

- Маршрут: [meal-photo/route.ts](/C:/fit/src/app/api/ai/meal-photo/route.ts)
- Контракт: изображение валидируется, анализируется vision runtime и возвращается как proposal-first разбор блюда.

### Barcode / product import

- Пользовательский импорт продукта по штрихкоду подтверждён e2e через Open Food Facts.
- Для retrieval это важно потому, что barcode-like токены теперь специально поднимаются в ранжировании и не теряются при text-only fallback.

## Evaluator loop и verification

Для сложных AI-задач в репозитории обязателен цикл:

- `goal`
- `baseline`
- `evaluator`
- `artifacts`
- `stop condition`
- `escalation rule`

Базовые проверочные поверхности:

- `tests/ai-gate/ai-quality-gate.spec.ts`
- `npm run test:retrieval-gate`
- `npm run verify:retrieval-release`
- `node scripts/ai-runtime-preflight.mjs`
- таргетированные Playwright-сценарии для user-facing AI surfaces

Если провайдер недоступен, это нужно фиксировать как внешний blocker или degrade-mode, а не скрывать в зелёном отчёте.

## Что ещё остаётся внешним блокером

- полноценный vector-runtime на `Voyage`/AI Gateway embeddings;
- live staging-like проверка с реальными embeddings-кредитами;
- production-level provider verification вне локального degrade-safe режима.

Пока эти пункты не закрыты, текущий официальный статус такой:

- chat/generation runtime — рабочий;
- retrieval runtime — рабочий в degrade-safe text-only режиме;
- AI product surface — можно развивать дальше без ожидания live embeddings unblock.
