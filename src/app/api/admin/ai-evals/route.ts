import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireAdminRouteAccess("view_ai_usage");
    const adminSupabase = createAdminSupabaseClient();

    const { data, error } = await adminSupabase
      .from("ai_eval_runs")
      .select("id, label, model_id, status, created_at, started_at, completed_at, summary")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return Response.json({
      data: data ?? [],
      total: data?.length ?? 0,
    });
  } catch (error) {
    logger.error("admin ai eval list route failed", { error });

    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    return createApiErrorResponse({
      status: 401,
      code: "ADMIN_REQUIRED",
      message: "Для просмотра AI-проверок нужен доступ администратора.",
    });
  }
}
