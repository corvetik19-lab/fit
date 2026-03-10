import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { PRIMARY_SUPER_ADMIN_EMAIL, isPrimarySuperAdminEmail } from "@/lib/admin-permissions";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";

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
        message: "Sign in before bootstrapping admin access.",
      });
    }

    const payload = bootstrapSchema.parse(await request.json());

    if (!serverEnv.ADMIN_BOOTSTRAP_TOKEN) {
      return createApiErrorResponse({
        status: 503,
        code: "ADMIN_BOOTSTRAP_NOT_CONFIGURED",
        message: "ADMIN_BOOTSTRAP_TOKEN is not configured.",
      });
    }

    if (payload.token !== serverEnv.ADMIN_BOOTSTRAP_TOKEN) {
      return createApiErrorResponse({
        status: 403,
        code: "ADMIN_BOOTSTRAP_DENIED",
        message: "Invalid bootstrap token.",
      });
    }

    if (!isPrimarySuperAdminEmail(user.email ?? null)) {
      return createApiErrorResponse({
        status: 403,
        code: "PRIMARY_SUPER_ADMIN_EMAIL_REQUIRED",
        message: `Роль super_admin закреплена только за ${PRIMARY_SUPER_ADMIN_EMAIL}.`,
      });
    }

    const adminSupabase = createAdminSupabaseClient();

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
    logger.error("admin bootstrap route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "ADMIN_BOOTSTRAP_PAYLOAD_INVALID",
        message: "Bootstrap payload is invalid.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "ADMIN_BOOTSTRAP_FAILED",
      message: "Unable to bootstrap admin access.",
    });
  }
}
