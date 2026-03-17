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
  hasProcessedStripeEvent,
  recordStripeEvent,
  reconcileStripeCheckoutSession,
  reconcileStripeSubscription,
  resolveStripeUserId,
} from "@/lib/stripe-billing";

function getCustomerId(
  customer:
    | string
    | Stripe.Customer
    | Stripe.DeletedCustomer
    | null
    | undefined,
) {
  if (!customer) {
    return null;
  }

  return typeof customer === "string" ? customer : customer.id;
}

function getSubscriptionId(
  subscription:
    | string
    | Stripe.Subscription
    | null
    | undefined,
) {
  if (!subscription) {
    return null;
  }

  return typeof subscription === "string" ? subscription : subscription.id;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  return getSubscriptionId(
    invoice.parent?.subscription_details?.subscription ?? null,
  );
}

export async function POST(request: Request) {
  try {
    if (!hasStripeWebhookEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "STRIPE_WEBHOOK_NOT_CONFIGURED",
        message: "Stripe webhook is not configured yet.",
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
        message: "Stripe signature header is missing.",
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
        message: "Stripe webhook signature verification failed.",
      });
    }

    const adminSupabase = createAdminSupabaseClient();

    if (await hasProcessedStripeEvent(adminSupabase, event.id)) {
      return Response.json({ data: { duplicate: true, received: true } });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        await reconcileStripeCheckoutSession(
          adminSupabase,
          event.data.object as Stripe.Checkout.Session,
          event,
        );
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await reconcileStripeSubscription(adminSupabase, {
          event,
          stripeSubscription: event.data.object as Stripe.Subscription,
        });
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const providerCustomerId = getCustomerId(invoice.customer);
        const providerSubscriptionId = getInvoiceSubscriptionId(invoice);
        const userId = await resolveStripeUserId(adminSupabase, {
          explicitUserId: null,
          providerCustomerId,
          providerSubscriptionId,
        });

        if (userId) {
          await recordStripeEvent(adminSupabase, {
            eventType: event.type,
            payload: {
              amountDue: invoice.amount_due,
              amountPaid: invoice.amount_paid,
              billingReason: invoice.billing_reason,
              invoiceId: invoice.id,
              isPaid: invoice.status === "paid",
              providerCustomerId,
              providerSubscriptionId,
              status: invoice.status,
            },
            providerEventId: event.id,
            subscriptionId: null,
            userId,
          });
        }
        break;
      }
      default: {
        logger.info("stripe webhook received unhandled event", {
          eventId: event.id,
          eventType: event.type,
        });
      }
    }

    return Response.json({ data: { received: true } });
  } catch (error) {
    logger.error("stripe webhook route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "STRIPE_WEBHOOK_FAILED",
      message: "Не удалось обработать Stripe webhook.",
    });
  }
}
