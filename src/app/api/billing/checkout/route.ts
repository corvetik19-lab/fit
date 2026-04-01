import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  createBillingActionErrorResponse,
  startBillingCheckoutSessionForUser,
} from "@/lib/billing-self-service";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
        message: "Нужно войти в аккаунт, чтобы начать оплату.",
      });
    }

    const result = await startBillingCheckoutSessionForUser({
      request,
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
    logger.error("billing checkout route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "BILLING_CHECKOUT_FAILED",
      message: "Не удалось запустить оплату.",
    });
  }
}
