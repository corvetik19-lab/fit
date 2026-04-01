import { createApiErrorResponse } from "@/lib/api/error-response";
import { processCloudpaymentsWebhookNotification, verifyCloudpaymentsWebhookRequest } from "@/lib/cloudpayments-billing";
import {
  getMissingCloudpaymentsWebhookEnv,
  hasCloudpaymentsWebhookEnv,
} from "@/lib/env";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  try {
    if (!hasCloudpaymentsWebhookEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "CLOUDPAYMENTS_WEBHOOK_NOT_CONFIGURED",
        message: "CloudPayments webhook пока не настроен.",
        details: {
          missing: getMissingCloudpaymentsWebhookEnv(),
        },
      });
    }

    const { kind } = await params;
    const rawBody = await request.text();
    const verification = verifyCloudpaymentsWebhookRequest(request, rawBody);

    if (!verification.valid) {
      logger.warn("cloudpayments webhook signature verification failed", {
        kind,
        receivedSignature: verification.received,
      });

      return createApiErrorResponse({
        status: 400,
        code: "CLOUDPAYMENTS_WEBHOOK_INVALID_SIGNATURE",
        message: "Не удалось проверить подпись CloudPayments webhook.",
      });
    }

    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const adminSupabase = createAdminSupabaseClient();
    const result = await processCloudpaymentsWebhookNotification(
      adminSupabase,
      kind,
      payload,
    );

    return Response.json({
      code: 0,
      data: result,
    });
  } catch (error) {
    logger.error("cloudpayments webhook route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "CLOUDPAYMENTS_WEBHOOK_FAILED",
      message: "Не удалось обработать CloudPayments webhook.",
    });
  }
}
