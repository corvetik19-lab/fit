import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const nutritionTargetsSchema = z.object({
  kcalTarget: z.number().int().min(0).max(10000).nullable(),
  proteinTarget: z.number().int().min(0).max(1000).nullable(),
  fatTarget: z.number().int().min(0).max(1000).nullable(),
  carbsTarget: z.number().int().min(0).max(1000).nullable(),
});

export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Войди в аккаунт, чтобы сохранять цели по питанию.",
      });
    }

    const payload = nutritionTargetsSchema.parse(await request.json());
    const { data, error } = await supabase
      .from("nutrition_profiles")
      .upsert(
        {
          user_id: user.id,
          kcal_target: payload.kcalTarget,
          protein_target: payload.proteinTarget,
          fat_target: payload.fatTarget,
          carbs_target: payload.carbsTarget,
        },
        { onConflict: "user_id" },
      )
      .select("kcal_target, protein_target, fat_target, carbs_target")
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ data });
  } catch (error) {
    logger.error("nutrition targets route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "NUTRITION_TARGETS_INVALID",
        message: "Цели по питанию заполнены некорректно.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "NUTRITION_TARGETS_FAILED",
      message: "Не удалось сохранить цели по питанию.",
    });
  }
}
