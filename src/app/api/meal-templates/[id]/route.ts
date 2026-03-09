import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
        message: "Войди в аккаунт, чтобы удалять шаблоны питания.",
      });
    }

    const { id } = await params;
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
    logger.error("meal template delete route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "MEAL_TEMPLATE_DELETE_FAILED",
      message: "Не удалось удалить шаблон питания.",
    });
  }
}
