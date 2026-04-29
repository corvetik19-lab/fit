import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { readUserBillingAccessOrFallback } from "@/lib/billing-access";
import { BILLING_FEATURE_KEYS } from "@/lib/billing-access";
import { logger } from "@/lib/logger";
import { createEmptySettingsDataSnapshot } from "@/lib/settings-data-server-model";
import {
  getAuthenticatedSettingsContext,
  loadSettingsBillingCenterData,
  requestSettingsBillingAccessReview,
} from "@/lib/settings-self-service";

const billingFeatureKeySchema = z.enum([
  BILLING_FEATURE_KEYS.aiChat,
  BILLING_FEATURE_KEYS.mealPlan,
  BILLING_FEATURE_KEYS.workoutPlan,
  BILLING_FEATURE_KEYS.mealPhoto,
]);

const settingsBillingActionSchema = z.object({
  action: z.literal("request_access_review"),
  feature_keys: z.array(billingFeatureKeySchema).min(1).max(4),
  note: z.string().trim().max(300).optional(),
});

export async function GET(request: Request) {
  try {
    const context = await getAuthenticatedSettingsContext(request);

    if (!context) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы открыть центр доступа.",
      });
    }

    const data = await loadSettingsBillingCenterData(
      context.supabase,
      context.user.id,
      context.user.email,
    );

    return Response.json({ data });
  } catch (error) {
    logger.error("settings billing snapshot route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "SETTINGS_BILLING_SNAPSHOT_FAILED",
      message: "Не удалось загрузить центр доступа.",
    });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getAuthenticatedSettingsContext(request);

    if (!context) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы отправить запрос на доступ.",
      });
    }

    const payload = settingsBillingActionSchema.parse(
      await request.json().catch(() => ({})),
    );
    const reviewResult = await requestSettingsBillingAccessReview({
      note: payload.note,
      requestedFeatures: payload.feature_keys,
      userId: context.user.id,
    });

    if (!reviewResult.ok) {
      return createApiErrorResponse({
        status: reviewResult.status,
        code: reviewResult.code,
        message: reviewResult.message,
      });
    }

    const access = await readUserBillingAccessOrFallback(
      context.supabase,
      context.user.id,
      {
        email: context.user.email,
      },
    );
    const snapshot = createEmptySettingsDataSnapshot();
    snapshot.billingReviewRequest = reviewResult.reviewRequest;

    return Response.json({
      data: {
        access,
        snapshot,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "SETTINGS_BILLING_INVALID",
        message: "Запрос на проверку доступа заполнен некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("settings billing mutation route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "SETTINGS_BILLING_UPDATE_FAILED",
      message: "Не удалось отправить запрос на проверку доступа.",
    });
  }
}
