import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import {
  createFallbackAdminUsersResponse,
  loadAdminUsersData,
  parseActivityFilter,
  parseRoleFilter,
  parseSortKey,
} from "@/lib/admin-users-data";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const roleFilter = parseRoleFilter(searchParams.get("role")?.trim() ?? "all");
  const activityFilter = parseActivityFilter(
    searchParams.get("activity")?.trim() ?? "all",
  );
  const sortKey = parseSortKey(searchParams.get("sort")?.trim() ?? "created_desc");

  try {
    await requireAdminRouteAccess("view_admin_users");

    return Response.json(
      await loadAdminUsersData({
        activityFilter,
        adminSupabase: createAdminSupabaseClient(),
        query,
        roleFilter,
        sortKey,
      }),
    );
  } catch (error) {
    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    logger.warn("admin users route degraded to fallback", { error });

    return Response.json(
      createFallbackAdminUsersResponse({
        activityFilter,
        roleFilter,
        sortKey,
      }),
    );
  }
}
