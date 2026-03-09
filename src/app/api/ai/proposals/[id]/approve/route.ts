import { getAiPlanProposal, updateAiPlanProposal } from "@/lib/ai/proposals";
import { createApiErrorResponse } from "@/lib/api/error-response";
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
        message: "Нужно войти в аккаунт, чтобы подтверждать AI-предложения.",
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

    if (proposal.status === "applied") {
      return createApiErrorResponse({
        status: 409,
        code: "AI_PROPOSAL_ALREADY_APPLIED",
        message: "AI-предложение уже применено и не требует отдельного подтверждения.",
      });
    }

    const payload = {
      ...proposal.payload,
      approvedAt: new Date().toISOString(),
    };

    const updated = await updateAiPlanProposal(supabase, {
      userId: user.id,
      proposalId: proposal.id,
      status: "approved",
      payload,
    });

    return Response.json({ data: updated });
  } catch (error) {
    logger.error("ai proposal approve route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "AI_PROPOSAL_APPROVE_FAILED",
      message: "Не удалось подтвердить AI-предложение.",
    });
  }
}
