import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { queueAiEvalRun } from "@/lib/ai/eval-runs";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import { AI_EVAL_SUITES } from "@/lib/ai/eval-suites";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const aiEvalRunSchema = z.object({
  label: z.string().trim().min(2).max(120).optional(),
  modelId: z.string().trim().min(2).max(160).optional(),
  suite: z.enum(AI_EVAL_SUITES).optional(),
});

export async function POST(request: Request) {
  try {
    const { user } = await requireAdminRouteAccess("queue_ai_eval_runs");
    const payload = aiEvalRunSchema.parse(await request.json().catch(() => ({})));
    const adminSupabase = createAdminSupabaseClient();

    const suite = payload.suite ?? "all";
    const label = payload.label ?? `AI eval ${suite} ${new Date().toISOString()}`;
    const modelId = payload.modelId ?? "google/gemini-3.1-pro-preview";

    const queuedRun = await queueAiEvalRun(adminSupabase, {
      isScheduled: false,
      label,
      modelId,
      requestedBy: user.id,
      suite,
      trigger: "manual_admin",
    });
    const data = queuedRun.data;

    const { error: auditError } = await adminSupabase.from("admin_audit_logs").insert({
      actor_user_id: user.id,
      action: "queue_ai_eval_run",
      reason: "manual admin request",
      payload: {
        runId: data.id,
        modelId,
        suite,
      },
    });

    if (auditError) {
      throw auditError;
    }

    return Response.json({
      data: {
        ...data,
        message: "AI eval run поставлен в очередь.",
      },
    });
  } catch (error) {
    logger.error("admin ai eval run route failed", { error });

    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_EVAL_RUN_INVALID",
        message: "Параметры AI eval заполнены некорректно.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "AI_EVAL_RUN_FAILED",
      message: "Не удалось поставить AI eval в очередь.",
    });
  }
}
