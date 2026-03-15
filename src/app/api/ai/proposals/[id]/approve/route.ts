import { z } from "zod";

import {
  approveAiPlanProposal,
  isAiProposalActionError,
} from "@/lib/ai/proposal-actions";
import { getAiPlanProposal } from "@/lib/ai/proposals";
import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  BILLING_FEATURE_KEYS,
  createFeatureAccessDeniedResponse,
  readUserBillingAccessOrFallback,
} from "@/lib/billing-access";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

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
        message: "Нужно войти в аккаунт, чтобы подтверждать AI-предложения.",
      });
    }

    const { id } = paramsSchema.parse(await context.params);
    const proposal = await getAiPlanProposal(supabase, user.id, id);

    if (!proposal) {
      return createApiErrorResponse({
        status: 404,
        code: "AI_PROPOSAL_NOT_FOUND",
        message: "AI-предложение не найдено.",
      });
    }

    const access = await readUserBillingAccessOrFallback(supabase, user.id, {
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

    const approved = await approveAiPlanProposal(supabase, {
      userId: user.id,
      proposalId: proposal.id,
    });

    return Response.json({ data: approved.proposal });
  } catch (error) {
    logger.error("ai proposal approve route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_PROPOSAL_APPROVE_INVALID",
        message: "Некорректный идентификатор AI-предложения.",
        details: error.flatten(),
      });
    }

    if (isAiProposalActionError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "AI_PROPOSAL_APPROVE_FAILED",
      message: "Не удалось подтвердить AI-предложение.",
    });
  }
}
