import { createApiErrorResponse } from "@/lib/api/error-response";
import { buildCloudpaymentsCheckoutIntent } from "@/lib/cloudpayments-billing";
import {
  getMissingCloudpaymentsCheckoutEnv,
  hasCloudpaymentsCheckoutEnv,
} from "@/lib/env";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы открыть оплату.",
      });
    }

    if (!hasCloudpaymentsCheckoutEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "CLOUDPAYMENTS_CHECKOUT_NOT_CONFIGURED",
        message: "CloudPayments пока не настроен для запуска оплаты.",
        details: {
          missing: getMissingCloudpaymentsCheckoutEnv(),
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const referenceId = searchParams.get("reference");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const intent = buildCloudpaymentsCheckoutIntent({
      fullName: profile?.full_name ?? null,
      referenceId,
      user: {
        email: user.email,
        id: user.id,
      },
    });

    return Response.json({
      data: intent,
    });
  } catch (error) {
    logger.error("cloudpayments intent route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "CLOUDPAYMENTS_INTENT_FAILED",
      message: "Не удалось подготовить оплату через CloudPayments.",
    });
  }
}
