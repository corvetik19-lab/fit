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
        message: "Войди в аккаунт, чтобы удалять рецепты.",
      });
    }

    const { id } = paramsSchema.parse(await params);
    const { data, error } = await supabase
      .from("recipes")
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
        code: "RECIPE_NOT_FOUND",
        message: "Рецепт не найден.",
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "RECIPE_DELETE_INVALID",
        message: "Идентификатор рецепта заполнен некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("recipe delete route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "RECIPE_DELETE_FAILED",
      message: "Не удалось удалить рецепт.",
    });
  }
}
