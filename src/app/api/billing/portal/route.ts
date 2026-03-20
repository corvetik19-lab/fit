import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  createBillingActionErrorResponse,
  createStripePortalSessionForUser,
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
        message: "Нужно войти в аккаунт, чтобы открыть платежный кабинет.",
      });
    }

    const result = await createStripePortalSessionForUser({
      request,
      userId: user.id,
    });

    if (!result.ok) {
      return createBillingActionErrorResponse(result);
    }

    return Response.json({
      data: result.data,
    });
  } catch (error) {
    logger.error("stripe billing portal route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "STRIPE_PORTAL_FAILED",
      message: "Не удалось открыть Stripe Billing Portal.",
    });
  }
}
