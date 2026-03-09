import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { requireAdminRouteAccess } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireAdminRouteAccess();
    const adminSupabase = createAdminSupabaseClient();

    const { data, error } = await adminSupabase
      .from("profiles")
      .select("user_id, full_name, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      throw error;
    }

    return Response.json({
      data: data ?? [],
      total: data?.length ?? 0,
    });
  } catch (error) {
    logger.error("admin users route failed", { error });

    return createApiErrorResponse({
      status: 401,
      code: "ADMIN_REQUIRED",
      message: "Admin access is required.",
    });
  }
}
