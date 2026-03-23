# Retrieval Performance Baseline

## Что измеряем

Этот документ фиксирует локальный baseline для детерминированной части `RAG v2`:

- hybrid fusion `vector + lexical`
- deterministic reranking
- rollout selection `legacy / hybrid / shadow`

Сюда не входят сетевые задержки:

- embeddings provider
- OpenRouter runtime
- Supabase RPC round-trips

Они снимаются step-level telemetry в runtime и зависят от внешней среды.

## Актуальный baseline

Команда:

```bash
npm run test:retrieval-gate
```

Набор:

- `30` semantic candidates
- `30` lexical candidates
- `20` fused candidates
- `8` final context items
- `250` synthetic latency samples для deterministic ranking stage

Последний зафиксированный локальный прогон (`2026-03-24`):

- `p50`: `0.1346 ms`
- `p95`: `0.3964 ms`
- `max`: `0.9397 ms`
- `mean`: `0.1944 ms`
- `sampleSize`: `250`

## Текущий budget

- deterministic hybrid ranking `p95 < 25 ms`
- deterministic hybrid ranking `max < 50 ms`
- финальный контекст ограничен `8` chunk-ами
- fused candidate pool ограничен `20`

## Performance decisions

- `legacy / hybrid / shadow` управляются только через `AI_RETRIEVAL_MODE`, без форка route handlers.
- В `shadow` режиме в продукт идёт legacy ranking, а hybrid результат только логируется для безопасного сравнения.
- Hybrid stage не использует второй paid reranker-provider; reranking остаётся детерминированным и дешёвым.
- Candidate caps зафиксированы на уровне [knowledge-retrieval-config.ts](/C:/fit/src/lib/ai/knowledge-retrieval-config.ts), чтобы удерживать latency и размер контекста.
- Step-level telemetry включается через `AI_RETRIEVAL_TELEMETRY=1` или автоматически в `shadow` режиме.
- Если hybrid ranking не дал результатов, pipeline возвращается к legacy selection и пишет явный warning вместо молчаливой деградации.

## Где смотреть runtime telemetry

- [knowledge-retrieval.ts](/C:/fit/src/lib/ai/knowledge-retrieval.ts)
- [knowledge-retrieval-telemetry.ts](/C:/fit/src/lib/ai/knowledge-retrieval-telemetry.ts)

Telemetry summary включает:

- `indexRefreshMs`
- `queryEmbeddingMs`
- `semanticRpcMs`
- `semanticFallbackMs`
- `lexicalRpcMs`
- `lexicalFallbackMs`
- `hybridRankMs`
- candidate counts
- rollout summary и fallback flags

## Что осталось

- DB migration для lexical metadata и hybrid RPC
- server-side lexical index в `knowledge_chunks`
