alter policy ai_chat_sessions_owner_select on public.ai_chat_sessions
  using ((select auth.uid()) = user_id);

alter policy ai_chat_sessions_owner_insert on public.ai_chat_sessions
  with check ((select auth.uid()) = user_id);

alter policy ai_chat_sessions_owner_update on public.ai_chat_sessions
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy ai_chat_sessions_owner_delete on public.ai_chat_sessions
  using ((select auth.uid()) = user_id);

alter policy ai_chat_messages_owner_select on public.ai_chat_messages
  using ((select auth.uid()) = user_id);

alter policy ai_chat_messages_owner_insert on public.ai_chat_messages
  with check ((select auth.uid()) = user_id);

alter policy ai_chat_messages_owner_update on public.ai_chat_messages
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy ai_chat_messages_owner_delete on public.ai_chat_messages
  using ((select auth.uid()) = user_id);

alter policy export_jobs_owner_select on public.export_jobs
  using ((select auth.uid()) = user_id);

alter policy export_jobs_owner_insert on public.export_jobs
  with check ((select auth.uid()) = user_id);

alter policy export_jobs_owner_update on public.export_jobs
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy export_jobs_owner_delete on public.export_jobs
  using ((select auth.uid()) = user_id);

alter policy deletion_requests_owner_select on public.deletion_requests
  using ((select auth.uid()) = user_id);

alter policy deletion_requests_owner_insert on public.deletion_requests
  with check ((select auth.uid()) = user_id);

alter policy deletion_requests_owner_update on public.deletion_requests
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy deletion_requests_owner_delete on public.deletion_requests
  using ((select auth.uid()) = user_id);

alter policy user_context_snapshots_owner_select on public.user_context_snapshots
  using ((select auth.uid()) = user_id);

alter policy user_context_snapshots_owner_insert on public.user_context_snapshots
  with check ((select auth.uid()) = user_id);

alter policy user_context_snapshots_owner_update on public.user_context_snapshots
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy user_context_snapshots_owner_delete on public.user_context_snapshots
  using ((select auth.uid()) = user_id);

alter policy knowledge_chunks_owner_select on public.knowledge_chunks
  using ((select auth.uid()) = user_id);

alter policy knowledge_chunks_owner_insert on public.knowledge_chunks
  with check ((select auth.uid()) = user_id);

alter policy knowledge_chunks_owner_update on public.knowledge_chunks
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy knowledge_chunks_owner_delete on public.knowledge_chunks
  using ((select auth.uid()) = user_id);

alter policy knowledge_embeddings_owner_select on public.knowledge_embeddings
  using ((select auth.uid()) = user_id);

alter policy knowledge_embeddings_owner_insert on public.knowledge_embeddings
  with check ((select auth.uid()) = user_id);

alter policy knowledge_embeddings_owner_update on public.knowledge_embeddings
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy knowledge_embeddings_owner_delete on public.knowledge_embeddings
  using ((select auth.uid()) = user_id);

alter policy ai_safety_events_owner_select on public.ai_safety_events
  using ((select auth.uid()) = user_id);

alter policy ai_safety_events_owner_insert on public.ai_safety_events
  with check ((select auth.uid()) = user_id);

alter policy ai_safety_events_owner_update on public.ai_safety_events
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy ai_safety_events_owner_delete on public.ai_safety_events
  using ((select auth.uid()) = user_id);
