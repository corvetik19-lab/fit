import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAuthProviderUnavailableError } from "@/lib/auth/auth-route-errors";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const signUpSchema = z.object({
  email: z.string().trim().email(),
  fullName: z.string().trim().min(2).max(120),
  password: z.string().min(6).max(256),
});

export async function POST(request: Request) {
  try {
    const payload = signUpSchema.parse(await request.json());
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName,
        },
      },
    });

    if (error) {
      return createApiErrorResponse({
        status: 400,
        code: "AUTH_SIGNUP_FAILED",
        message: error.message,
      });
    }

    if (!data.session) {
      return Response.json({
        ok: true,
        requiresEmailConfirmation: true,
        notice:
          "Аккаунт создан. Если включено подтверждение почты, подтверди email и затем войди в приложение.",
      });
    }

    return Response.json({
      ok: true,
      redirectTo: "/onboarding",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "AUTH_SIGNUP_INVALID",
        message: "Данные для регистрации заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("auth sign-up route failed", { error });

    if (isAuthProviderUnavailableError(error)) {
      return createApiErrorResponse({
        status: 503,
        code: "AUTH_PROVIDER_UNAVAILABLE",
        message: "Сервис регистрации временно недоступен. Попробуй ещё раз немного позже.",
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "AUTH_SIGNUP_UNAVAILABLE",
      message: "Не удалось создать аккаунт. Попробуй ещё раз.",
    });
  }
}
