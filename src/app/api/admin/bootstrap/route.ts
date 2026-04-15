import { z } from "zod";

import { ensureSuperAdminSlotAvailable } from "@/lib/admin-role-management";
import { createApiErrorResponse } from "@/lib/api/error-response";
import { serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const bootstrapSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы выдать админ-доступ.",
      });
    }

    const payload = bootstrapSchema.parse(await request.json());

    if (!serverEnv.ADMIN_BOOTSTRAP_TOKEN) {
      return createApiErrorResponse({
        status: 503,
        code: "ADMIN_BOOTSTRAP_NOT_CONFIGURED",
        message: "Токен bootstrap для админ-доступа пока не настроен.",
      });
    }

    if (payload.token !== serverEnv.ADMIN_BOOTSTRAP_TOKEN) {
      return createApiErrorResponse({
        status: 403,
        code: "ADMIN_BOOTSTRAP_DENIED",
        message: "Токен bootstrap заполнен некорректно.",
      });
    }

    const adminSupabase = createAdminSupabaseClient();
    const superAdminSlotGuard = await ensureSuperAdminSlotAvailable({
      adminSupabase,
      nextRole: "super_admin",
      previousRole: null,
      targetUserId: user.id,
    });

    if (superAdminSlotGuard) {
      return superAdminSlotGuard;
    }

    const { error: platformAdminError } = await adminSupabase
      .from("platform_admins")
      .upsert(
        {
          user_id: user.id,
          role: "super_admin",
          granted_by: user.id,
        },
        { onConflict: "user_id" },
      );

    if (platformAdminError) {
      throw platformAdminError;
    }

    const { error: auditLogError } = await adminSupabase
      .from("admin_audit_logs")
      .insert({
        actor_user_id: user.id,
        target_user_id: user.id,
        action: "bootstrap_super_admin",
        reason: "local bootstrap",
        payload: {
          role: "super_admin",
        },
      });

    if (auditLogError) {
      throw auditLogError;
    }

    return Response.json({
      ok: true,
      data: {
        role: "super_admin",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "ADMIN_BOOTSTRAP_PAYLOAD_INVALID",
        message: "Параметры bootstrap заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("admin bootstrap route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_BOOTSTRAP_FAILED",
      message: "Не удалось выдать админ-доступ.",
    });
  }
}
