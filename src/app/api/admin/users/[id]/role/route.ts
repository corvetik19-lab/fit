import { z } from "zod";

import {
  ensureAdminRoleAssignmentAllowed,
  ensurePrimarySuperAdminDowngradeAllowed,
  ensurePrimarySuperAdminRevokeAllowed,
  loadAdminRoleTarget,
  recordAdminRoleAudit,
} from "@/lib/admin-role-management";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAdminAccessError, requireAdminRouteAccess } from "@/lib/admin-auth";
import {
  isAdminRouteParamError,
  parseAdminUserIdParam,
} from "@/lib/admin-route-params";
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
    const actor = await requireAdminRouteAccess("manage_admin_roles");

    const { id: rawId } = await params;
    const id = parseAdminUserIdParam(rawId, {
      code: "ADMIN_ROLE_TARGET_INVALID",
      message: "Target user id is invalid.",
    });
    const payload = roleSchema.parse(await request.json());

    if (actor.user.id === id && payload.role !== "super_admin") {
      return createApiErrorResponse({
        status: 400,
        code: "ADMIN_SELF_ROLE_CHANGE_BLOCKED",
        message: "Super admin cannot downgrade their own access.",
      });
    }

    const adminSupabase = createAdminSupabaseClient();
    const target = await loadAdminRoleTarget(adminSupabase, id);

    if (target.response) {
      return target.response;
    }

    const roleAssignmentGuard = ensureAdminRoleAssignmentAllowed(
      payload.role,
      target.targetEmail,
    );

    if (roleAssignmentGuard) {
      return roleAssignmentGuard;
    }

    const downgradeGuard = ensurePrimarySuperAdminDowngradeAllowed(
      target.previousRoleRow?.role ?? null,
      payload.role,
      target.targetEmail,
    );

    if (downgradeGuard) {
      return downgradeGuard;
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

    const auditAction = target.previousRoleRow
      ? target.previousRoleRow.role === payload.role
        ? "admin_role_confirmed"
        : "admin_role_updated"
      : "admin_role_granted";

    await recordAdminRoleAudit({
      action: auditAction,
      actorUserId: actor.user.id,
      nextRole: payload.role,
      previousRole: target.previousRoleRow?.role ?? null,
      reason: payload.reason ?? "manual admin role update",
      supabase: adminSupabase,
      targetUserId: id,
    });

    return Response.json({
      data: {
        ...data,
        email: target.targetEmail,
      },
    });
  } catch (error) {
    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    if (isAdminRouteParamError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "ADMIN_ROLE_INVALID",
        message: "Параметры админ-роли заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("admin role update route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_ROLE_UPDATE_FAILED",
      message: "Не удалось обновить админ-роль.",
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdminRouteAccess("manage_admin_roles");

    const { id: rawId } = await params;
    const id = parseAdminUserIdParam(rawId, {
      code: "ADMIN_ROLE_TARGET_INVALID",
      message: "Target user id is invalid.",
    });
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
    const target = await loadAdminRoleTarget(adminSupabase, id);

    if (target.response) {
      return target.response;
    }

    if (!target.previousRoleRow) {
      return createApiErrorResponse({
        status: 404,
        code: "ADMIN_ROLE_NOT_FOUND",
        message: "Admin role was not found for this user.",
      });
    }

    const revokeGuard = ensurePrimarySuperAdminRevokeAllowed(
      target.previousRoleRow.role,
      target.targetEmail,
    );

    if (revokeGuard) {
      return revokeGuard;
    }

    const { error } = await adminSupabase
      .from("platform_admins")
      .delete()
      .eq("user_id", id);

    if (error) {
      throw error;
    }

    await recordAdminRoleAudit({
      action: "admin_role_revoked",
      actorUserId: actor.user.id,
      previousRole: target.previousRoleRow.role,
      reason: reason || "manual admin role revoke",
      supabase: adminSupabase,
      targetUserId: id,
    });

    return Response.json({
      data: {
        user_id: id,
        revoked: true,
      },
    });
  } catch (error) {
    if (isAdminAccessError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    if (isAdminRouteParamError(error)) {
      return createApiErrorResponse({
        status: error.status,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    logger.error("admin role revoke route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_ROLE_REVOKE_FAILED",
      message: "Не удалось отозвать админ-роль.",
    });
  }
}
