import { AppShell } from "@/components/app-shell";
import { ExerciseLibraryManager } from "@/components/exercise-library-manager";
import { PanelCard } from "@/components/panel-card";
import { WeeklyProgramBuilder } from "@/components/weekly-program-builder";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireReadyViewer } from "@/lib/viewer";
import { listWeeklyPrograms } from "@/lib/workout/weekly-programs";
import { listWorkoutTemplates } from "@/lib/workout/templates";

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
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <PanelCard caption="План на неделю" title="Собери удобную структуру тренировок">
          <div className="space-y-3 text-sm leading-7 text-muted">
            <p>
              Здесь ты собираешь неделю из любимых упражнений, шаблонов и готовых сетов. Всё
              сохранено за твоим профилем и всегда под рукой на телефоне.
            </p>
            <p>
              Сначала удобно собрать библиотеку, затем выбрать упражнения для дней недели и
              зафиксировать черновик программы. После этого можно переходить к выполнению.
            </p>
            <p>
              {viewer.profile?.full_name ?? viewer.user.email ?? "Пользователь fit"}, начни с
              рабочего плана и оставь в библиотеке только то, что действительно используешь.
            </p>
          </div>
        </PanelCard>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Активные упражнения", String(activeExercises.length)],
            ["В архиве", String(archivedExercises.length)],
            ["Черновики программ", String(draftPrograms.length)],
            ["Последнее обновление", lastUpdatedAt ?? "Пока пусто"],
          ].map(([label, value]) => (
            <article className="kpi p-5" key={label}>
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
            </article>
          ))}
        </div>
      </div>

      <WeeklyProgramBuilder
        activeExercises={activeExercises}
        initialPrograms={programs}
        initialTemplates={templates}
      />

      <ExerciseLibraryManager initialExercises={exercises} />
    </AppShell>
  );
}
