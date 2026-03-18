import type { SupabaseClient } from "@supabase/supabase-js";

import { ensureKnowledgeIndex } from "@/lib/ai/knowledge-runtime";
import { type RetrievedKnowledgeItem } from "@/lib/ai/knowledge-model";
import { retrieveKnowledgeMatchesWithPipeline } from "@/lib/ai/knowledge-retrieval";

export type {
  KnowledgeReindexResult,
  RetrievedKnowledgeItem,
} from "@/lib/ai/knowledge-model";
export { reindexUserKnowledgeBase } from "@/lib/ai/knowledge-runtime";

export async function retrieveKnowledgeMatches(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  limit = 6,
): Promise<RetrievedKnowledgeItem[]> {
  return retrieveKnowledgeMatchesWithPipeline({
    ensureKnowledgeIndex,
    limit,
    query,
    supabase,
    userId,
  });
}
