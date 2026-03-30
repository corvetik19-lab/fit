# Execution Plan: RAG v2 для `fit`

## Как вести этот документ

- `[x]` — tranche закрыт и подтверждён кодом, миграцией, тестами или проверкой.
- `[ ]` — пункт ещё не доведён до завершённого состояния.
- После каждого tranche нужно:
  - обновить этот файл;
  - пересчитать `done / total`;
  - записать актуальный процент прямо здесь;
  - добавить короткую запись в [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).

Текущий прогресс execution checklist: `19 / 19` (`100%`).

## Execution Checklist

### Wave 1. План и базовый retrieval scaffold

- [x] Создать отдельный execution doc для `RAG v2` с чекбоксами, процентом и правилами обновления.
- [x] Вынести конфиг hybrid retrieval caps: semantic, lexical, fused, rerank, final context.
- [x] Расширить retrieval result type score-breakdown полями `vectorScore`, `textScore`, `fusedScore`, `rerankScore`, `matchedTerms`, `sourceKind`.
- [x] Добавить app-side fusion layer `BM25-like text + vector` через единый ranking pipeline.
- [x] Добавить детерминированный reranking без нового провайдера.
- [x] Покрыть fusion и reranking отдельным regression test.

### Wave 2. Chunking и indexing v2

- [x] Формализовать chunk policy по source families: profile, workouts, nutrition, weekly programs, structured facts.
- [x] Добавить metadata contract для knowledge chunks: `source_key`, `chunk_version`, `content_hash`, `importance_weight`, `recency_at`, `token_count`.
- [x] Перевести indexing на incremental reindex вместо полного rebuild по умолчанию.
- [x] Добавить cleanup stale chunks по `source_key` и `content_hash`.
- [x] Добавить DB migration для search/index metadata в `knowledge_chunks`.
- [x] Добавить lexical search index и hybrid RPC под user-scoped retrieval.

### Wave 3. Eval и release gate

- [x] Расширить eval suites по retrieval intent-категориям: workouts, nutrition, profile, plans, recent history.
- [x] Добавить retrieval metrics: `Recall@5`, `Recall@10`, `nDCG@10`.
- [x] Добавить retrieval regression command в npm/CI.
- [x] Добавить shadow-mode и feature-flag rollout для hybrid retrieval.
- [x] Зафиксировать release gate для `assistant`, `retrieval`, `workout plan`, `meal plan`, `safety`.

### Wave 4. Performance и observability

- [x] Добавить step-level telemetry для retrieval pipeline: embedding, vector, lexical, rerank, index refresh.
- [x] Зафиксировать latency baseline и performance tuning решения для retrieval слоя.

## Что именно закрыто последним tranche

- [x] Миграция [20260330113000_knowledge_chunk_search_metadata_hybrid_rpc.sql](/C:/fit/supabase/migrations/20260330113000_knowledge_chunk_search_metadata_hybrid_rpc.sql) применена на правильный Supabase-проект `fit` через `mcp__supabase_mcp_server__apply_migration`.
- [x] В `knowledge_chunks` добавлены явные metadata columns, generated `search_vector`, индексы и user-scoped hybrid RPC `search_knowledge_chunks_hybrid(...)`.
- [x] Runtime переключён на DB-backed hybrid retrieval с app-side fallback: [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts), [knowledge-chunk-sync.ts](/C:/fit/src/lib/ai/knowledge-chunk-sync.ts).
- [x] Regression и RLS fixtures обновлены под новый metadata contract: [hybrid-retrieval.spec.ts](/C:/fit/tests/ai-gate/hybrid-retrieval.spec.ts), [knowledge-chunk-sync.spec.ts](/C:/fit/tests/ai-gate/knowledge-chunk-sync.spec.ts), [supabase-rls.ts](/C:/fit/tests/rls/helpers/supabase-rls.ts).
- [x] Advisors после DDL не показали новых knowledge-specific блокеров: остались только уже известные platform-level warnings по `vector` и leaked password protection.

## Проверка

- [x] `npm run verify:migrations`
- [x] `npm run test:retrieval-gate` -> `18 passed`
- [x] `npm run test:rls` -> `4 passed`
- [x] `npm run typecheck`
- [x] `npm run build`

## Примечания

- Execution-план `RAG v2` закрыт полностью на уровне кода, DB и regression coverage.
- Live AI quality gate на реальных провайдерах остаётся отдельным внешним blocker общего master-plan: текущая среда всё ещё упирается в `OpenRouter 402` и `Voyage 403`.
