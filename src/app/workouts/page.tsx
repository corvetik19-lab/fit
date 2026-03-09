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
    <AppShell eyebrow="Тренировки" title="Программы и упражнения">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PanelCard caption="Тренировочный контур" title="Первые рабочие тренировочные срезы">
          <ul className="grid gap-3 text-sm leading-7 text-muted">
            <li>
              Пользователь{" "}
              <span className="font-semibold text-foreground">
                {viewer.profile?.full_name ?? viewer.user.email ?? "пользователь fit"}
              </span>{" "}
              уже может вести персональную библиотеку упражнений и собирать
              черновики недель.
            </li>
            <li>
              Управление упражнениями и конструктор недель проходят через Supabase с
              RLS-политиками на владельца, поэтому весь тренировочный домен изолирован по `user_id`.
            </li>
            <li>
              Следующие срезы для этого экрана: фиксация недели, `Моя неделя`,
              экран выполнения и клонирование истории.
            </li>
          </ul>
        </PanelCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          {[
            ["Активные упражнения", String(activeExercises.length)],
            ["Архив", String(archivedExercises.length)],
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
