import Stripe from "stripe";

import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  getMissingStripeWebhookEnv,
  hasStripeWebhookEnv,
  serverEnv,
} from "@/lib/env";
import { logger } from "@/lib/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  getStripeClient,
  processStripeWebhookEvent,
} from "@/lib/stripe-billing";

export async function POST(request: Request) {
  try {
    if (!hasStripeWebhookEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "STRIPE_WEBHOOK_NOT_CONFIGURED",
        message: "Stripe webhook пока не настроен.",
        details: {
          missing: getMissingStripeWebhookEnv(),
        },
      });
    }

    const signature = request.headers.get("stripe-signature");

    if (!signature || !serverEnv.STRIPE_WEBHOOK_SECRET) {
      return createApiErrorResponse({
        status: 400,
        code: "STRIPE_SIGNATURE_MISSING",
        message: "Заголовок Stripe Signature не передан.",
      });
    }

    const rawBody = await request.text();
    const stripe = getStripeClient();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        serverEnv.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      logger.warn("stripe webhook signature verification failed", { error });

      return createApiErrorResponse({
        status: 400,
        code: "STRIPE_WEBHOOK_INVALID_SIGNATURE",
        message: "Не удалось проверить подпись Stripe webhook.",
      });
    }

    const adminSupabase = createAdminSupabaseClient();

    const result = await processStripeWebhookEvent(adminSupabase, event);

    return Response.json({ data: result });
  } catch (error) {
    logger.error("stripe webhook route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "STRIPE_WEBHOOK_FAILED",
      message: "Не удалось обработать Stripe webhook.",
    });
  }
}
