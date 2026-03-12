begin;

create index if not exists knowledge_chunks_user_content_fts_idx
  on public.knowledge_chunks
  using gin (
    to_tsvector(
      'russian',
      coalesce(content, '') || ' ' || coalesce(source_type, '')
    )
  )
  where user_id is not null;

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
set search_path = public
as $$
  with params as (
    select
      nullif(trim(coalesce(query_text, '')), '') as raw_query,
      least(greatest(match_count, 1), 24) as limited_count
  ),
  query as (
    select
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
    ts_rank_cd(
      to_tsvector(
        'russian',
        coalesce(kc.content, '') || ' ' || coalesce(kc.source_type, '')
      ),
      query.ts_query
    )::double precision as similarity
  from query
  join public.knowledge_chunks kc
    on kc.user_id = auth.uid()
  where to_tsvector(
    'russian',
    coalesce(kc.content, '') || ' ' || coalesce(kc.source_type, '')
  ) @@ query.ts_query
  order by similarity desc, kc.created_at desc
  limit (select limited_count from query limit 1);
$$;

grant execute on function public.search_knowledge_chunks_text(text, integer) to authenticated;

drop policy if exists knowledge_chunks_owner_shared_select on public.knowledge_chunks;
drop policy if exists knowledge_embeddings_owner_shared_select on public.knowledge_embeddings;
drop policy if exists knowledge_chunks_owner_select on public.knowledge_chunks;
drop policy if exists knowledge_embeddings_owner_select on public.knowledge_embeddings;

create policy knowledge_chunks_owner_select
  on public.knowledge_chunks
  for select
  using (auth.uid() = user_id);

create policy knowledge_embeddings_owner_select
  on public.knowledge_embeddings
  for select
  using (auth.uid() = user_id);

alter table public.ai_chat_sessions force row level security;
alter table public.ai_chat_messages force row level security;
alter table public.ai_plan_proposals force row level security;
alter table public.ai_safety_events force row level security;
alter table public.knowledge_chunks force row level security;
alter table public.knowledge_embeddings force row level security;

commit;
