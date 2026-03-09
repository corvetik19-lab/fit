import { z } from "zod";

import { requireAdminRouteAccess } from "@/lib/admin-auth";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const roleSchema = z.object({
  role: z.enum(["super_admin", "support_admin", "analyst"]),
  reason: z.string().trim().max(300).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminRouteAccess();

    if (actor.role !== "super_admin") {
      return createApiErrorResponse({
        status: 403,
        code: "SUPER_ADMIN_REQUIRED",
        message: "Only super admins can manage admin roles.",
      });
    }

    const { id } = await params;
    const payload = roleSchema.parse(await request.json());

    if (actor.user.id === id && payload.role !== "super_admin") {
      return createApiErrorResponse({
        status: 400,
        code: "ADMIN_SELF_ROLE_CHANGE_BLOCKED",
        message: "Super admin cannot downgrade their own access.",
      });
    }

    const adminSupabase = createAdminSupabaseClient();
    const authUserResult = await adminSupabase.auth.admin.getUserById(id);

    if (authUserResult.error || !authUserResult.data.user) {
      return createApiErrorResponse({
        status: 404,
        code: "ADMIN_TARGET_NOT_FOUND",
        message: "Target user was not found.",
      });
    }

    const { data: previousRoleRow, error: previousRoleError } = await adminSupabase
      .from("platform_admins")
      .select("role")
      .eq("user_id", id)
      .maybeSingle();

    if (previousRoleError) {
      throw previousRoleError;
    }

    const { data, error } = await adminSupabase
      .from("platform_admins")
      .upsert(
        {
          user_id: id,
          role: payload.role,
          granted_by: actor.user.id,
        },
        {
          onConflict: "user_id",
        },
      )
      .select("user_id, role, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    const auditAction = previousRoleRow
      ? previousRoleRow.role === payload.role
        ? "admin_role_confirmed"
        : "admin_role_updated"
      : "admin_role_granted";

    const { error: auditError } = await adminSupabase
      .from("admin_audit_logs")
      .insert({
        actor_user_id: actor.user.id,
        target_user_id: id,
        action: auditAction,
        reason: payload.reason ?? "manual admin role update",
        payload: {
          previousRole: previousRoleRow?.role ?? null,
          nextRole: payload.role,
        },
      });

    if (auditError) {
      throw auditError;
    }

    return Response.json({
      data: {
        ...data,
        email: authUserResult.data.user.email ?? null,
      },
    });
  } catch (error) {
    logger.error("admin role update route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "ADMIN_ROLE_INVALID",
        message: "Admin role payload is invalid.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_ROLE_UPDATE_FAILED",
      message: "Unable to update admin role.",
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminRouteAccess();

    if (actor.role !== "super_admin") {
      return createApiErrorResponse({
        status: 403,
        code: "SUPER_ADMIN_REQUIRED",
        message: "Only super admins can manage admin roles.",
      });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason =
      typeof body?.reason === "string" ? body.reason.trim().slice(0, 300) : "";

    if (actor.user.id === id) {
      return createApiErrorResponse({
        status: 400,
        code: "ADMIN_SELF_REVOKE_BLOCKED",
        message: "Super admin cannot revoke their own access.",
      });
    }

    const adminSupabase = createAdminSupabaseClient();
    const { data: previousRoleRow, error: previousRoleError } = await adminSupabase
      .from("platform_admins")
      .select("role")
      .eq("user_id", id)
      .maybeSingle();

    if (previousRoleError) {
      throw previousRoleError;
    }

    if (!previousRoleRow) {
      return createApiErrorResponse({
        status: 404,
        code: "ADMIN_ROLE_NOT_FOUND",
        message: "Admin role was not found for this user.",
      });
    }

    const { error } = await adminSupabase
      .from("platform_admins")
      .delete()
      .eq("user_id", id);

    if (error) {
      throw error;
    }

    const { error: auditError } = await adminSupabase
      .from("admin_audit_logs")
      .insert({
        actor_user_id: actor.user.id,
        target_user_id: id,
        action: "admin_role_revoked",
        reason: reason || "manual admin role revoke",
        payload: {
          previousRole: previousRoleRow.role,
        },
      });

    if (auditError) {
      throw auditError;
    }

    return Response.json({
      data: {
        user_id: id,
        revoked: true,
      },
    });
  } catch (error) {
    logger.error("admin role revoke route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_ROLE_REVOKE_FAILED",
      message: "Unable to revoke admin role.",
    });
  }
}
