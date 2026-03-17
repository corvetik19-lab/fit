import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы удалять шаблоны питания.",
      });
    }

    const { id } = paramsSchema.parse(await params);
    const { data, error } = await supabase
      .from("meal_templates")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return createApiErrorResponse({
        status: 404,
        code: "MEAL_TEMPLATE_NOT_FOUND",
        message: "Шаблон питания не найден.",
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "MEAL_TEMPLATE_DELETE_INVALID",
        message: "Идентификатор шаблона питания заполнен некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("meal template delete route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "MEAL_TEMPLATE_DELETE_FAILED",
      message: "Не удалось удалить шаблон питания.",
    });
  }
}
