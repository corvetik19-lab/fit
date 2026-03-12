import { AppShell } from "@/components/app-shell";
import { ExerciseLibraryManager } from "@/components/exercise-library-manager";
import { PageWorkspace } from "@/components/page-workspace";
import { WeeklyProgramBuilder } from "@/components/weekly-program-builder";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listWorkoutTemplates } from "@/lib/workout/templates";
import { listWeeklyPrograms } from "@/lib/workout/weekly-programs";
import { requireReadyViewer } from "@/lib/viewer";

export default async function WorkoutsPage() {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const [{ data, error }, programs, templates] = await Promise.all([
    supabase
      .from("exercise_library")
      .select(
        "id, title, muscle_group, description, note, is_archived, created_at, updated_at",
      )
      .order("updated_at", { ascending: false }),
    listWeeklyPrograms(supabase, viewer.user.id),
    listWorkoutTemplates(supabase, viewer.user.id),
  ]);

  if (error) {
    throw error;
  }

  const exercises = data ?? [];
  const activeExercises = exercises.filter((exercise) => !exercise.is_archived);
  const archivedExercises = exercises.filter((exercise) => exercise.is_archived);
  const draftPrograms = programs.filter((program) => program.status === "draft");
  const lastUpdatedAt = exercises[0]?.updated_at
    ? new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(exercises[0].updated_at))
    : null;

  return (
    <AppShell eyebrow="Тренировки" title="Программы, недели и упражнения">
      <PageWorkspace
        badges={[
          viewer.profile?.full_name ?? viewer.user.email ?? "fit",
          lastUpdatedAt
            ? `Обновлено ${lastUpdatedAt}`
            : "Библиотека пока пустая",
        ]}
        description="Здесь собраны недельный план, текущая программа и библиотека упражнений. На телефоне разделы открываются по очереди, без длинной ленты из блоков."
        metrics={[
          {
            label: "Активные",
            value: String(activeExercises.length),
            note: "упражнений в работе",
          },
          {
            label: "В архиве",
            value: String(archivedExercises.length),
            note: "временно убрано из базы",
          },
          {
            label: "Черновики",
            value: String(draftPrograms.length),
            note: "недель ждут фиксации",
          },
          {
            label: "Программ",
            value: String(programs.length),
            note: "в истории профиля",
          },
        ]}
        sections={[
          {
            key: "plan",
            label: "План недели",
            description: "Конструктор, текущая неделя и шаблоны",
            content: (
              <WeeklyProgramBuilder
                activeExercises={activeExercises}
                initialPrograms={programs}
                initialTemplates={templates}
              />
            ),
          },
          {
            key: "library",
            label: "Упражнения",
            description: "Своя база и быстрые правки",
            content: <ExerciseLibraryManager initialExercises={exercises} />,
          },
        ]}
        storageKey="workouts-page"
        title="Рабочая зона для недельного плана и библиотеки упражнений"
      />
    </AppShell>
  );
}
