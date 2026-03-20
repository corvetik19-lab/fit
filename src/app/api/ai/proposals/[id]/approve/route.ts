import { z } from "zod";

import {
  approveAiPlanProposal,
  isAiProposalActionError,
} from "@/lib/ai/proposal-actions";
import {
  getAiProposalRouteContext,
  isAiProposalRouteError,
} from "@/lib/ai/proposal-route-helpers";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { createFeatureAccessDeniedResponse } from "@/lib/billing-access";
import { logger } from "@/lib/logger";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const routeContext = await getAiProposalRouteContext(
      context.params,
      "Нужно войти в аккаунт, чтобы подтверждать AI-предложения.",
    );

    if (!routeContext.feature.allowed) {
      return createFeatureAccessDeniedResponse(routeContext.feature);
    }

    const approved = await approveAiPlanProposal(routeContext.supabase, {
      userId: routeContext.user.id,
      proposalId: routeContext.proposal.id,
    });

    return Response.json({ data: approved.proposal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_PROPOSAL_APPROVE_INVALID",
        message: "Некорректный идентификатор AI-предложения.",
        details: error.flatten(),
      });
    }

    if (isAiProposalRouteError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    if (isAiProposalActionError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    logger.error("ai proposal approve route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "AI_PROPOSAL_APPROVE_FAILED",
      message: "Не удалось подтвердить AI-предложение.",
    });
  }
}
