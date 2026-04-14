import { AppShell, toAppShellViewer } from "@/components/app-shell";
import { ExerciseLibraryManager } from "@/components/exercise-library-manager";
import { PageWorkspace } from "@/components/page-workspace";
import { WeeklyProgramBuilder } from "@/components/weekly-program-builder";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listWorkoutTemplates } from "@/lib/workout/templates";
import { listWeeklyProgramsOverview } from "@/lib/workout/weekly-programs";
import { requireReadyViewer } from "@/lib/viewer";

const WORKOUTS_PAGE_DATA_TIMEOUT_MS = 8_000;
const WORKOUTS_PAGE_EXERCISE_LIMIT = 120;

function withTimeout<T>(promise: Promise<T>, label: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${label} timed out after ${WORKOUTS_PAGE_DATA_TIMEOUT_MS}ms`));
      }, WORKOUTS_PAGE_DATA_TIMEOUT_MS);
    }),
  ]);
}

async function loadWorkoutsResource<T>(
  label: string,
  promise: Promise<T>,
  fallback: T,
  userId: string,
) {
  try {
    return await withTimeout(promise, label);
  } catch (error) {
    logger.warn("workouts page fallback activated", { error, label, userId });
    return fallback;
  }
}

export default async function WorkoutsPage() {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const [exercisePage, programs, templates] = await Promise.all([
    loadWorkoutsResource(
      "workout exercise library",
      Promise.resolve(
        supabase
          .from("exercise_library")
          .select(
            "id, title, muscle_group, description, note, image_url, is_archived, created_at, updated_at",
            { count: "exact" },
          )
          .order("updated_at", { ascending: false })
          .range(0, WORKOUTS_PAGE_EXERCISE_LIMIT - 1)
          .then(({ count, data, error }) => {
            if (error) {
              throw error;
            }

            const total = count ?? 0;
            return {
              items: data ?? [],
              nextOffset:
                (data?.length ?? 0) < total ? WORKOUTS_PAGE_EXERCISE_LIMIT : null,
              total,
            };
          }),
      ),
      { items: [], nextOffset: null, total: 0 },
      viewer.user.id,
    ),
    loadWorkoutsResource(
      "weekly programs",
      listWeeklyProgramsOverview(supabase, viewer.user.id),
      [],
      viewer.user.id,
    ),
    loadWorkoutsResource(
      "workout templates",
      listWorkoutTemplates(supabase, viewer.user.id),
      [],
      viewer.user.id,
    ),
  ]);
  const exercises = exercisePage.items;

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
    <AppShell
      eyebrow="Тренировки"
      title="Программы, недели и библиотека упражнений"
      viewer={toAppShellViewer(viewer)}
    >
      <PageWorkspace
        badges={[
          viewer.profile?.full_name ?? viewer.user.email ?? "fit",
          lastUpdatedAt
            ? `Обновлено ${lastUpdatedAt}`
            : "Библиотека упражнений пока пустая",
        ]}
        description="Это рабочая зона для недельного плана: здесь собраны текущая программа, шаблоны и библиотека упражнений. На телефоне разделы открываются по очереди и не превращаются в длинную перегруженную ленту."
        metrics={[
          {
            label: "Активные",
            value: String(activeExercises.length),
            note: "упражнений в работе",
          },
          {
            label: "В архиве",
            value: String(archivedExercises.length),
            note: "временно скрыто",
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
            description: "Конструктор, текущая неделя и шаблоны.",
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
            description: "Собственная база и быстрые правки без лишних экранов.",
            content: (
              <ExerciseLibraryManager
                initialExercises={exercises}
                initialNextOffset={exercisePage.nextOffset}
                initialTotalCount={exercisePage.total}
              />
            ),
          },
        ]}
        storageKey="workouts-page"
        title="Собирай недельный цикл и управляй библиотекой упражнений из одного места"
      />
    </AppShell>
  );
}
