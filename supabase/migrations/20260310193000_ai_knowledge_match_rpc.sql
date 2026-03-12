set check_function_bodies = off;

alter table public.knowledge_embeddings
  alter column model set default 'voyage/voyage-3-large';

update public.knowledge_embeddings
set model = 'voyage/voyage-3-large',
    updated_at = timezone('utc', now())
where model = 'voyage/voyage-4-large';

create index if not exists knowledge_chunks_user_source_created_idx
on public.knowledge_chunks (user_id, source_type, created_at desc);

drop function if exists public.match_knowledge_chunks(vector, integer, double precision);

create or replace function public.match_knowledge_chunks(
  query_embedding vector(1024),
  match_count integer default 8,
  match_threshold double precision default 0.45
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
  select
    kc.id,
    kc.source_type,
    kc.source_id,
    kc.content,
    kc.metadata,
    1 - (ke.embedding <=> query_embedding) as similarity
  from public.knowledge_embeddings ke
  join public.knowledge_chunks kc on kc.id = ke.chunk_id
  where kc.user_id = auth.uid()
    and ke.user_id = auth.uid()
    and 1 - (ke.embedding <=> query_embedding) >= greatest(match_threshold, 0)
  order by ke.embedding <=> query_embedding asc
  limit least(greatest(match_count, 1), 24);
$$;

grant execute on function public.match_knowledge_chunks(vector, integer, double precision)
to authenticated;
