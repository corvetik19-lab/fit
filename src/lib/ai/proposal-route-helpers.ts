import { z } from "zod";

import { getAiPlanProposal, type AiPlanProposalRow } from "@/lib/ai/proposals";
import {
  BILLING_FEATURE_KEYS,
  readUserBillingAccessOrFallback,
  type FeatureAccessSnapshot,
} from "@/lib/billing-access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const AI_PROPOSAL_NOT_FOUND_MESSAGE = "ИИ-предложение не найдено.";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

type ProposalRouteUser = {
  email?: string | null;
  id: string;
};

export type AiProposalRouteContext = {
  feature: FeatureAccessSnapshot;
  proposal: AiPlanProposalRow;
  proposalId: string;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  user: ProposalRouteUser;
};

export class AiProposalRouteError extends Error {
  readonly code: string;
  readonly details?: unknown;
  readonly status: number;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AiProposalRouteError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isAiProposalRouteError(error: unknown): error is AiProposalRouteError {
  return error instanceof AiProposalRouteError;
}

export async function getAiProposalRouteContext(
  params: Promise<{ id: string }>,
  authMessage: string,
): Promise<AiProposalRouteContext> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AiProposalRouteError(401, "UNAUTHORIZED", authMessage);
  }

  const { id } = paramsSchema.parse(await params);
  const proposal = await getAiPlanProposal(supabase, user.id, id);

  if (!proposal) {
    throw new AiProposalRouteError(
      404,
      "AI_PROPOSAL_NOT_FOUND",
      AI_PROPOSAL_NOT_FOUND_MESSAGE,
    );
  }

  const access = await readUserBillingAccessOrFallback(supabase, user.id, {
    email: user.email,
  });
  const featureKey =
    proposal.proposal_type === "meal_plan"
      ? BILLING_FEATURE_KEYS.mealPlan
      : BILLING_FEATURE_KEYS.workoutPlan;

  return {
    feature: access.features[featureKey],
    proposal,
    proposalId: id,
    supabase,
    user: {
      email: user.email,
      id: user.id,
    },
  };
}
