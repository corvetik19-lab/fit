import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { requireAdminRouteAccess } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AdminRoleFilter = "all" | "super_admin" | "support_admin" | "analyst" | "user";

export async function GET(request: Request) {
  try {
    await requireAdminRouteAccess();
    const adminSupabase = createAdminSupabaseClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const roleFilter = (searchParams.get("role")?.trim() ??
      "all") as AdminRoleFilter;

    const [{ data: profiles, error: profilesError }, { data: admins, error: adminsError }, authUsersResult] =
      await Promise.all([
        adminSupabase
          .from("profiles")
          .select("user_id, full_name, created_at, updated_at")
          .order("created_at", { ascending: false }),
        adminSupabase
          .from("platform_admins")
          .select("user_id, role, created_at, updated_at"),
        adminSupabase.auth.admin.listUsers({
          page: 1,
          perPage: 100,
        }),
      ]);

    if (profilesError) {
      throw profilesError;
    }

    if (adminsError) {
      throw adminsError;
    }

    if (authUsersResult.error) {
      throw authUsersResult.error;
    }

    const profilesByUserId = new Map(
      (profiles ?? []).map((profile) => [profile.user_id, profile]),
    );
    const adminsByUserId = new Map(
      (admins ?? []).map((admin) => [admin.user_id, admin]),
    );

    const mergedUsers = (authUsersResult.data.users ?? []).map((authUser) => {
      const profile = profilesByUserId.get(authUser.id);
      const admin = adminsByUserId.get(authUser.id);

      return {
        user_id: authUser.id,
        email: authUser.email ?? null,
        full_name:
          profile?.full_name ??
          ((authUser.user_metadata?.full_name as string | undefined) ?? null),
        created_at: profile?.created_at ?? authUser.created_at,
        updated_at: profile?.updated_at ?? authUser.updated_at ?? authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at ?? null,
        admin_role: admin?.role ?? null,
      };
    });

    const filteredUsers = mergedUsers
      .filter((user) => {
        if (roleFilter !== "all") {
          const effectiveRole = user.admin_role ?? "user";
          if (effectiveRole !== roleFilter) {
            return false;
          }
        }

        if (!query) {
          return true;
        }

        const haystack = [
          user.user_id,
          user.email ?? "",
          user.full_name ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      })
      .sort((left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
      );

    return Response.json({
      data: filteredUsers,
      total: filteredUsers.length,
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
