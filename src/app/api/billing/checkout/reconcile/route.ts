import { z } from "zod";

import { readUserBillingAccess } from "@/lib/billing-access";
import { createApiErrorResponse } from "@/lib/api/error-response";
import {
  getMissingStripeCheckoutEnv,
  hasStripeCheckoutEnv,
} from "@/lib/env";
import { logger } from "@/lib/logger";
import { loadSettingsDataSnapshot } from "@/lib/settings-data-server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getStripeClient,
  reconcileStripeCheckoutSession,
} from "@/lib/stripe-billing";

const reconcileCheckoutSchema = z.object({
  sessionId: z.string().trim().min(1).max(255),
});

async function loadBillingCenterData(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
) {
  const [snapshot, access] = await Promise.all([
    loadSettingsDataSnapshot(supabase, userId),
    readUserBillingAccess(supabase, userId),
  ]);

  return {
    access,
    snapshot,
  };
}

async function writeAuditLog(
  actorUserId: string,
  payload: Record<string, unknown>,
) {
  try {
    const adminSupabase = createAdminSupabaseClient();
    const { error } = await adminSupabase.from("admin_audit_logs").insert({
      action: "user_reconciled_stripe_checkout_return",
      actor_user_id: actorUserId,
      payload,
      reason: "self-service stripe checkout return reconcile",
      target_user_id: actorUserId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.warn("stripe checkout return reconcile audit log failed", {
      actorUserId,
      error,
    });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasStripeCheckoutEnv()) {
      return createApiErrorResponse({
        status: 503,
        code: "STRIPE_CHECKOUT_NOT_CONFIGURED",
        message: "Stripe checkout is not configured yet.",
        details: {
          missing: getMissingStripeCheckoutEnv(),
        },
      });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Sign in before reconciling checkout.",
      });
    }

    const payload = reconcileCheckoutSchema.parse(
      await request.json().catch(() => ({})),
    );
    const stripe = getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      payload.sessionId,
    );
    const resolvedUserId =
      checkoutSession.client_reference_id ??
      checkoutSession.metadata?.userId ??
      null;

    if (resolvedUserId !== user.id) {
      return createApiErrorResponse({
        status: 403,
        code: "STRIPE_CHECKOUT_SESSION_FORBIDDEN",
        message: "This Stripe checkout session does not belong to the current user.",
      });
    }

    if (checkoutSession.status !== "complete") {
      const data = await loadBillingCenterData(supabase, user.id);

      return Response.json({
        data: {
          ...data,
          checkoutReturn: {
            checkoutSessionId: checkoutSession.id,
            paymentStatus: checkoutSession.payment_status,
            reconciled: false,
            sessionStatus: checkoutSession.status,
          },
        },
      });
    }

    const adminSupabase = createAdminSupabaseClient();
    const reconciliation = await reconcileStripeCheckoutSession(
      adminSupabase,
      checkoutSession,
      null,
    );

    await writeAuditLog(user.id, {
      checkoutSessionId: checkoutSession.id,
      paymentStatus: checkoutSession.payment_status,
      reconciled: Boolean(reconciliation),
      sessionStatus: checkoutSession.status,
    });

    const data = await loadBillingCenterData(supabase, user.id);

    return Response.json({
      data: {
        ...data,
        checkoutReturn: {
          checkoutSessionId: checkoutSession.id,
          paymentStatus: checkoutSession.payment_status,
          reconciled: Boolean(reconciliation),
          sessionStatus: checkoutSession.status,
        },
      },
    });
  } catch (error) {
    logger.error("stripe checkout reconcile route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "STRIPE_CHECKOUT_RECONCILE_INVALID",
        message: "Checkout reconcile payload is invalid.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "STRIPE_CHECKOUT_RECONCILE_FAILED",
      message: "Unable to reconcile Stripe checkout return.",
    });
  }
}
