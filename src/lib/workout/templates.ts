import type { SupabaseClient } from "@supabase/supabase-js";

export type WorkoutTemplateExercise = {
  exerciseLibraryId: string | null;
  exerciseTitleSnapshot: string;
  setsCount: number;
  plannedReps: number;
};

export type WorkoutTemplateDay = {
  dayOfWeek: number;
  exercises: WorkoutTemplateExercise[];
};

export type WorkoutTemplatePayload = {
  days: WorkoutTemplateDay[];
};

export type WorkoutTemplateSummary = {
  id: string;
  title: string;
  payload: WorkoutTemplatePayload;
  created_at: string;
};

export async function listWorkoutTemplates(
  supabase: SupabaseClient,
  userId: string,
  limit = 8,
) {
  const { data, error } = await supabase
    .from("workout_templates")
    .select("id, title, payload, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data as WorkoutTemplateSummary[] | null) ?? []).map((template) => ({
    ...template,
    payload: (template.payload ?? { days: [] }) as WorkoutTemplatePayload,
  }));
}
