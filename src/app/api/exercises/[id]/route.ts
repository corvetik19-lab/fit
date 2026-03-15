import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const exerciseUpdateSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  muscleGroup: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  isArchived: z.boolean().optional(),
});

const exerciseParamsSchema = z.object({
  id: z.string().uuid(),
});

function normalizeText(value: string | null | undefined) {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
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
        message: "Sign in before updating exercises.",
      });
    }

    const payload = exerciseUpdateSchema.parse(await request.json());
    const { id } = exerciseParamsSchema.parse(await context.params);

    const updateData: Record<string, unknown> = {};

    if (payload.title !== undefined) {
      updateData.title = payload.title;
    }

    if (payload.muscleGroup !== undefined) {
      updateData.muscle_group = payload.muscleGroup;
    }

    if (payload.description !== undefined) {
      updateData.description = normalizeText(payload.description);
    }

    if (payload.note !== undefined) {
      updateData.note = normalizeText(payload.note);
    }

    if (payload.isArchived !== undefined) {
      updateData.is_archived = payload.isArchived;
    }

    if (!Object.keys(updateData).length) {
      return createApiErrorResponse({
        status: 400,
        code: "EXERCISE_UPDATE_EMPTY",
        message: "Nothing to update.",
      });
    }

    const { data, error } = await supabase
      .from("exercise_library")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        "id, title, muscle_group, description, note, is_archived, created_at, updated_at",
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return createApiErrorResponse({
        status: 404,
        code: "EXERCISE_NOT_FOUND",
        message: "Exercise was not found.",
      });
    }

    return Response.json({ data });
  } catch (error) {
    logger.error("exercise update route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "EXERCISE_UPDATE_INVALID",
        message: "Exercise update payload is invalid.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "EXERCISE_UPDATE_FAILED",
      message: "Unable to update exercise.",
    });
  }
}
