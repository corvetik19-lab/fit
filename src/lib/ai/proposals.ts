import type { SupabaseClient } from "@supabase/supabase-js";

export type AiPlanProposalType = "meal_plan" | "workout_plan";

export type AiPlanProposalRow = {
  id: string;
  proposal_type: AiPlanProposalType;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export async function listAiPlanProposals(
  supabase: SupabaseClient,
  userId: string,
  limit = 8,
) {
  const { data, error } = await supabase
    .from("ai_plan_proposals")
    .select("id, proposal_type, status, payload, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as AiPlanProposalRow[];
}

export async function createAiPlanProposal(
  supabase: SupabaseClient,
  input: {
    userId: string;
    proposalType: AiPlanProposalType;
    payload: Record<string, unknown>;
    status?: string;
  },
) {
  const { data, error } = await supabase
    .from("ai_plan_proposals")
    .insert({
      user_id: input.userId,
      proposal_type: input.proposalType,
      status: input.status ?? "draft",
      payload: input.payload,
    })
    .select("id, proposal_type, status, payload, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data as AiPlanProposalRow;
}

export async function getAiPlanProposal(
  supabase: SupabaseClient,
  userId: string,
  proposalId: string,
) {
  const { data, error } = await supabase
    .from("ai_plan_proposals")
    .select("id, proposal_type, status, payload, created_at, updated_at")
    .eq("user_id", userId)
    .eq("id", proposalId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as AiPlanProposalRow | null) ?? null;
}

export async function updateAiPlanProposal(
  supabase: SupabaseClient,
  input: {
    userId: string;
    proposalId: string;
    status?: string;
    payload?: Record<string, unknown>;
  },
) {
  const nextPatch: Record<string, unknown> = {};

  if (input.status) {
    nextPatch.status = input.status;
  }

  if (input.payload) {
    nextPatch.payload = input.payload;
  }

  const { data, error } = await supabase
    .from("ai_plan_proposals")
    .update(nextPatch)
    .eq("user_id", input.userId)
    .eq("id", input.proposalId)
    .select("id, proposal_type, status, payload, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data as AiPlanProposalRow;
}
