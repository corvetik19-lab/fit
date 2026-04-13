import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { normalizeOptionalImageUrl, optionalImageUrlSchema } from "@/lib/image-url";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const exerciseCreateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  muscleGroup: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().default(""),
  note: z.string().trim().max(500).optional().default(""),
  imageUrl: optionalImageUrlSchema,
});

const exerciseSelect =
  "id, title, muscle_group, description, note, image_url, is_archived, created_at, updated_at";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы открыть упражнения.",
      });
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    let query = supabase
      .from("exercise_library")
      .select(exerciseSelect)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!includeArchived) {
      query = query.eq("is_archived", false);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return Response.json({
      data: data ?? [],
    });
  } catch (error) {
    logger.error("exercise list route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "EXERCISE_LIST_FAILED",
      message: "Не удалось загрузить библиотеку упражнений.",
    });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createApiErrorResponse({
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Нужно войти в аккаунт, чтобы создавать упражнения.",
      });
    }

    const payload = exerciseCreateSchema.parse(await request.json());

    const { data, error } = await supabase
      .from("exercise_library")
      .insert({
        user_id: user.id,
        title: payload.title,
        muscle_group: payload.muscleGroup,
        description: payload.description || null,
        note: payload.note || null,
        image_url: normalizeOptionalImageUrl(payload.imageUrl),
      })
      .select(exerciseSelect)
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "EXERCISE_CREATE_INVALID",
        message: "Параметры упражнения заполнены некорректно.",
        details: error.flatten(),
      });
    }

    logger.error("exercise create route failed", { error });

    return createApiErrorResponse({
      status: 500,
      code: "EXERCISE_CREATE_FAILED",
      message: "Не удалось создать упражнение.",
    });
  }
}
