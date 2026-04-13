import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { isAuthProviderUnavailableError } from "@/lib/auth/auth-route-errors";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(256),
});

export async function POST(request: Request) {
  try {
    const payload = signInSchema.parse(await request.json());
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_INVALID_CREDENTIALS",
        message: error.message,
      });
    }

    return Response.json({
      ok: true,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "AUTH_SIGNIN_INVALID",
        message: "Данные для входа заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("auth sign-in route failed", { error });

    if (isAuthProviderUnavailableError(error)) {
      return createApiErrorResponse({
        status: 503,
        code: "AUTH_PROVIDER_UNAVAILABLE",
        message: "Сервис входа временно недоступен. Попробуй ещё раз немного позже.",
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "AUTH_SIGNIN_FAILED",
      message: "Не удалось выполнить вход. Попробуй ещё раз.",
    });
  }
}
