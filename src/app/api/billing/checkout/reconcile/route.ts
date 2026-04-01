import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  createBillingActionErrorResponse,
  reconcileBillingCheckoutReturnForUser,
} from "@/lib/billing-self-service";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const reconcileCheckoutSchema = z
  .object({
    referenceId: z.string().trim().min(1).max(255).optional(),
    sessionId: z.string().trim().min(1).max(255).optional(),
  })
  .refine((value) => Boolean(value.sessionId || value.referenceId), {
    message: "Нужен идентификатор оплаты.",
    path: ["sessionId"],
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
        message: "Нужно войти в аккаунт, чтобы подтвердить оплату.",
      });
    }

    const payload = reconcileCheckoutSchema.parse(
      await request.json().catch(() => ({})),
    );

    const result = await reconcileBillingCheckoutReturnForUser({
      referenceId: payload.referenceId,
      sessionId: payload.sessionId,
      supabase,
      user,
    });

    if (!result.ok) {
      return createBillingActionErrorResponse(result);
    }

    return Response.json({
      data: result.data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "BILLING_CHECKOUT_RECONCILE_INVALID",
        message: "Параметры подтверждения оплаты заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("billing checkout reconcile route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "BILLING_CHECKOUT_RECONCILE_FAILED",
      message: "Не удалось подтвердить оплату после возврата из платёжной формы.",
    });
  }
}
