begin;

alter table public.knowledge_chunks
  add column if not exists source_key text,
  add column if not exists chunk_version integer not null default 1,
  add column if not exists content_hash text,
  add column if not exists importance_weight numeric not null default 0,
  add column if not exists recency_at timestamp with time zone,
  add column if not exists token_count integer not null default 0,
  add column if not exists search_vector tsvector
    generated always as (
      to_tsvector(
        'russian',
        trim(
          coalesce(source_type, '') || ' ' ||
          coalesce(source_id, '') || ' ' ||
          coalesce(content, '')
        )
      )
    ) stored;

update public.knowledge_chunks
set
  source_key = coalesce(
    nullif(metadata ->> 'sourceKey', ''),
    source_type || ':' || coalesce(source_id, 'none')
  ),
  chunk_version = case
    when coalesce(metadata ->> 'chunkVersion', '') ~ '^[0-9]+$'
      then (metadata ->> 'chunkVersion')::integer
    else 1
  end,
  content_hash = coalesce(
    nullif(metadata ->> 'contentHash', ''),
    encode(digest(content, 'sha256'), 'hex')
  ),
  importance_weight = case
    when coalesce(metadata ->> 'importanceWeight', '') ~ '^-?[0-9]+(\\.[0-9]+)?$'
      then (metadata ->> 'importanceWeight')::numeric
    else 0
  end,
  recency_at = case
    when coalesce(metadata ->> 'recencyAt', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}([ tT].*)?$'
      then (metadata ->> 'recencyAt')::timestamp with time zone
    else null
  end,
  token_count = case
    when coalesce(metadata ->> 'tokenCount', '') ~ '^[0-9]+$'
      then greatest((metadata ->> 'tokenCount')::integer, 1)
    else greatest(array_length(regexp_split_to_array(trim(coalesce(content, '')), E'\\s+'), 1), 1)
  end
where
  source_key is null
  or content_hash is null
  or chunk_version = 1
  or importance_weight = 0
  or token_count = 0;

alter table public.knowledge_chunks
  alter column source_key set not null,
  alter column content_hash set not null;

create index if not exists knowledge_chunks_user_source_key_idx
  on public.knowledge_chunks (user_id, source_key);

create index if not exists knowledge_chunks_user_recency_idx
  on public.knowledge_chunks (user_id, recency_at desc nulls last);

drop index if exists knowledge_chunks_user_content_fts_idx;

create index if not exists knowledge_chunks_search_vector_idx
  on public.knowledge_chunks
  using gin (search_vector)
  where user_id is not null;

create index if not exists knowledge_chunks_user_content_hash_idx
  on public.knowledge_chunks (user_id, content_hash);

create or replace function public.search_knowledge_chunks_text(
  query_text text,
  match_count integer default 8
)
returns table (
  id uuid,
  source_type text,
  source_id text,
  content text,
  metadata jsonb,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  with params as (
    select
      nullif(trim(coalesce(query_text, '')), '') as raw_query,
      least(greatest(match_count, 1), 24) as limited_count
  ),
  query as (
    select
      raw_query,
      websearch_to_tsquery('russian', raw_query) as ts_query,
      limited_count
    from params
    where raw_query is not null
  )
  select
    kc.id,
    kc.source_type,
    kc.source_id,
    kc.content,
    kc.metadata,
    ts_rank_cd(kc.search_vector, query.ts_query)::double precision as similarity
  from query
  join public.knowledge_chunks kc
    on kc.user_id = auth.uid()
  where kc.search_vector @@ query.ts_query
  order by
    similarity desc,
    kc.importance_weight desc,
    kc.recency_at desc nulls last,
    kc.created_at desc
  limit (select limited_count from query limit 1);
$$;

grant execute on function public.search_knowledge_chunks_text(text, integer)
to authenticated;

drop function if exists public.search_knowledge_chunks_hybrid(text, vector, integer, double precision, double precision, integer);

create or replace function public.search_knowledge_chunks_hybrid(
  query_text text,
  query_embedding vector(1024),
  match_count integer default 8,
  full_text_weight double precision default 1,
  semantic_weight double precision default 1,
  rrf_k integer default 40
)
returns table (
  id uuid,
  source_type text,
  source_id text,
  content text,
  metadata jsonb,
  vector_score double precision,
  text_score double precision,
  fused_score double precision,
  matched_terms text[],
  source_kind text
)
language sql
stable
security invoker
set search_path = public
as $$
  with params as (
    select
      nullif(trim(coalesce(query_text, '')), '') as raw_query,
      least(greatest(match_count, 1), 24) as limited_count,
      greatest(rrf_k, 1) as fused_rrf_k,
      greatest(full_text_weight, 0) as full_text_weight,
      greatest(semantic_weight, 0) as semantic_weight
  ),
  query as (
    select
      raw_query,
      websearch_to_tsquery('russian', raw_query) as ts_query,
      limited_count,
      fused_rrf_k,
      full_text_weight,
      semantic_weight
    from params
    where raw_query is not null
  ),
  full_text as (
    select
      kc.id,
      row_number() over (
        order by
          ts_rank_cd(kc.search_vector, query.ts_query) desc,
          kc.importance_weight desc,
          kc.recency_at desc nulls last,
          kc.created_at desc
      ) as rank_ix,
      ts_rank_cd(kc.search_vector, query.ts_query)::double precision as text_score
    from query
    join public.knowledge_chunks kc
      on kc.user_id = auth.uid()
    where kc.search_vector @@ query.ts_query
    limit (select least(limited_count, 30) * 2 from query limit 1)
  ),
  semantic as (
    select
      kc.id,
      row_number() over (
        order by
          ke.embedding <=> query_embedding,
          kc.importance_weight desc,
          kc.recency_at desc nulls last,
          kc.created_at desc
      ) as rank_ix,
      (1 - (ke.embedding <=> query_embedding))::double precision as vector_score
    from query
    join public.knowledge_embeddings ke
      on ke.user_id = auth.uid()
    join public.knowledge_chunks kc
      on kc.id = ke.chunk_id
     and kc.user_id = auth.uid()
    limit (select least(limited_count, 30) * 2 from query limit 1)
  ),
  fused as (
    select
      coalesce(full_text.id, semantic.id) as id,
      semantic.vector_score,
      full_text.text_score,
      (
        coalesce(
          (select full_text_weight from query limit 1)
          / ((select fused_rrf_k from query limit 1) + full_text.rank_ix),
          0
        )
        + coalesce(
          (select semantic_weight from query limit 1)
          / ((select fused_rrf_k from query limit 1) + semantic.rank_ix),
          0
        )
      )::double precision as fused_score
    from full_text
    full outer join semantic
      on full_text.id = semantic.id
  )
  select
    kc.id,
    kc.source_type,
    kc.source_id,
    kc.content,
    kc.metadata,
    fused.vector_score,
    fused.text_score,
    fused.fused_score,
    (
      select coalesce(array_agg(token), '{}'::text[])
      from (
        select distinct token
        from regexp_split_to_table(lower((select raw_query from query limit 1)), '[^0-9A-Za-zА-Яа-яЁё]+') as token
        where length(token) >= 2
          and position(
            token in lower(
              kc.source_type || ' ' || coalesce(kc.source_id, '') || ' ' || kc.content
            )
          ) > 0
        limit 6
      ) matched
    ) as matched_terms,
    case
      when kc.source_type like 'workout_%'
        or kc.source_type in ('weekly_program', 'exercise_history')
        then 'workout'
      when kc.source_type like 'nutrition_%'
        or kc.source_type in ('meal_log', 'meal_photo_analysis')
        then 'nutrition'
      when kc.source_type like 'structured_%'
        then 'structured'
      when kc.source_type in ('context_snapshot', 'user_memory')
        then 'memory'
      when kc.source_type in ('user_profile', 'body_metrics_overview', 'body_metric_entry')
        then 'profile'
      when kc.source_type = 'fallback_context'
        then 'fallback'
      else 'general'
    end as source_kind
  from fused
  join public.knowledge_chunks kc
    on kc.id = fused.id
  order by
    fused.fused_score desc,
    kc.importance_weight desc,
    kc.recency_at desc nulls last,
    kc.created_at desc
  limit (select limited_count from query limit 1);
$$;

grant execute on function public.search_knowledge_chunks_hybrid(
  text,
  vector,
  integer,
  double precision,
  double precision,
  integer
)
to authenticated;

commit;
