# Execution Plan: RAG v2 для `fit`

## Как вести этот документ

- `[x]` — slice завершён и подтверждён кодом, тестом или проверкой.
- `[ ]` — пункт ещё не закрыт.
- После каждого tranche нужно:
- обновить этот файл;
- пересчитать `done / total`;
- записать актуальный процент прямо здесь;
- добавить короткую запись в [AI_WORKLOG.md](/C:/fit/docs/AI_WORKLOG.md).

Текущий прогресс execution checklist: `13 / 18` (`72%`).

## Execution Checklist

### Wave 1. План и базовый retrieval scaffold

- [x] Создать отдельный execution doc для `RAG v2` с чекбоксами, процентом и правилами обновления.
- [x] Вынести конфиг hybrid retrieval caps: semantic, lexical, fused, rerank, final context.
- [x] Расширить retrieval result type score-breakdown полями: `vectorScore`, `textScore`, `fusedScore`, `rerankScore`, `matchedTerms`, `sourceKind`.
- [x] Добавить app-side fusion layer `BM25-like text + vector` через единый ranking pipeline.
- [x] Добавить детерминированный reranking без нового провайдера.
- [x] Покрыть fusion и reranking отдельным regression test.

### Wave 2. Chunking и indexing v2

- [x] Формализовать chunk policy по source families: profile, workouts, nutrition, weekly programs, structured facts.
- [x] Добавить metadata contract для knowledge chunks: `source_key`, `chunk_version`, `content_hash`, `importance_weight`, `recency_at`, `token_count`.
- [x] Перевести indexing на incremental reindex вместо полного rebuild по умолчанию.
- [x] Добавить cleanup stale chunks по `source_key` и `content_hash`.
- [ ] Добавить DB migration для search/index metadata в `knowledge_chunks`.
- [ ] Добавить lexical search index и hybrid RPC под user-scoped retrieval.

### Wave 3. Eval и release gate

- [x] Расширить eval suites по retrieval intent-категориям: workouts, nutrition, profile, plans, recent history.
- [x] Добавить retrieval metrics: `Recall@5`, `Recall@10`, `nDCG@10`.
- [x] Добавить retrieval regression command в npm/CI.
- [ ] Добавить shadow-mode или feature-flag rollout для hybrid retrieval.
- [ ] Зафиксировать release gate для `assistant`, `retrieval`, `workout plan`, `meal plan`, `safety`.

### Wave 4. Performance и observability

- [ ] Добавить step-level telemetry для retrieval pipeline: embedding, vector, lexical, rerank, index refresh.
- [ ] Зафиксировать latency baseline и performance tuning решения для retrieval слоя.

## Ближайший tranche

- [ ] Wave 3: связать новый retrieval regression command с feature-flag rollout и release gate для assistant/plan suites.
