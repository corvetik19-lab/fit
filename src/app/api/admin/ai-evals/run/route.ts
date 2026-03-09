import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { requireAdminRouteAccess } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const aiEvalRunSchema = z.object({
  label: z.string().trim().min(2).max(120).optional(),
  modelId: z.string().trim().min(2).max(160).optional(),
});

export async function POST(request: Request) {
  try {
    const { user } = await requireAdminRouteAccess();
    const payload = aiEvalRunSchema.parse(await request.json().catch(() => ({})));
    const adminSupabase = createAdminSupabaseClient();

    const label =
      payload.label ?? `Локальный eval run ${new Date().toISOString()}`;
    const modelId = payload.modelId ?? "google/gemini-3.1-pro-preview";

    const { data, error } = await adminSupabase
      .from("ai_eval_runs")
      .insert({
        requested_by: user.id,
        label,
        model_id: modelId,
        status: "queued",
      })
      .select("id, label, model_id, status, created_at")
      .single();

    if (error) {
      throw error;
    }

    const { error: auditError } = await adminSupabase
      .from("admin_audit_logs")
      .insert({
        actor_user_id: user.id,
        action: "queue_ai_eval_run",
        reason: "manual admin request",
        payload: {
          runId: data.id,
          modelId,
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

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "AI_EVAL_RUN_INVALID",
        message: "AI eval payload is invalid.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "AI_EVAL_RUN_FAILED",
      message: "Unable to queue AI eval run.",
    });
  }
}
