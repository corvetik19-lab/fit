import { applyAiPlanProposal } from "@/lib/ai/proposal-actions";
import { getAiPlanProposal } from "@/lib/ai/proposals";
import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  BILLING_FEATURE_KEYS,
  createFeatureAccessDeniedResponse,
  readUserBillingAccess,
} from "@/lib/billing-access";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Нужно войти в аккаунт, чтобы применять AI-предложения.",
      });
    }

    const { id } = await context.params;
    const proposal = await getAiPlanProposal(supabase, user.id, id);

    if (!proposal) {
      return createApiErrorResponse({
        status: 404,
        code: "AI_PROPOSAL_NOT_FOUND",
        message: "AI-предложение не найдено.",
      });
    }

    const access = await readUserBillingAccess(supabase, user.id, {
      email: user.email,
    });
    const featureKey =
      proposal.proposal_type === "meal_plan"
        ? BILLING_FEATURE_KEYS.mealPlan
        : BILLING_FEATURE_KEYS.workoutPlan;
    const feature = access.features[featureKey];

    if (!feature.allowed) {
      return createFeatureAccessDeniedResponse(feature);
    }

    const applied = await applyAiPlanProposal(supabase, {
      userId: user.id,
      proposalId: proposal.id,
    });

    return Response.json({
      data: applied.proposal,
      meta: applied.meta,
    });
  } catch (error) {
    logger.error("ai proposal apply route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "AI_PROPOSAL_APPLY_FAILED",
      message: "Не удалось применить AI-предложение.",
    });
  }
}
