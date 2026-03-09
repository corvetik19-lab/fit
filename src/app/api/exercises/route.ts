import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api/error-response";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const exerciseCreateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  muscleGroup: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().default(""),
  note: z.string().trim().max(500).optional().default(""),
});

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
        message: "Sign in before loading exercises.",
      });
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    let query = supabase
      .from("exercise_library")
      .select(
        "id, title, muscle_group, description, note, is_archived, created_at, updated_at",
      )
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
      message: "Unable to load exercise library.",
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
        message: "Sign in before creating exercises.",
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
      })
      .select(
        "id, title, muscle_group, description, note, is_archived, created_at, updated_at",
      )
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ data });
  } catch (error) {
    logger.error("exercise create route failed", { error });

    if (error instanceof z.ZodError) {
      return createApiErrorResponse({
        status: 400,
        code: "EXERCISE_CREATE_INVALID",
        message: "Exercise payload is invalid.",
        details: error.flatten(),
      });
    }

    return createApiErrorResponse({
      status: 500,
      code: "EXERCISE_CREATE_FAILED",
      message: "Unable to create exercise.",
    });
  }
}
