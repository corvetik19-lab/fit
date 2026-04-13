import { OnboardingForm } from "@/components/onboarding-form";
import { requireViewer } from "@/lib/viewer";

export default async function OnboardingPage() {
  const viewer = await requireViewer();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="card card--hero p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap gap-2">
            <span className="pill">онбординг</span>
            <span className="pill">персональный контекст</span>
          </div>

          <div className="mt-6 space-y-4">
            <h1 className="app-display max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Соберём базовый контекст для тренировок, питания и AI.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
              Заполни анкету один раз. После этого рекомендации, программы и AI-коуч
              будут работать уже с твоими реальными целями и ограничениями.
            </p>
          </div>
        </article>

        <OnboardingForm
          initialValues={{
            fullName: viewer.profile?.full_name ?? "",
            age: viewer.onboarding?.age?.toString() ?? "",
            sex: viewer.onboarding?.sex ?? "",
            heightCm: viewer.onboarding?.height_cm?.toString() ?? "",
            weightKg: viewer.onboarding?.weight_kg?.toString() ?? "",
            fitnessLevel: viewer.onboarding?.fitness_level ?? "",
            equipment: viewer.onboarding?.equipment?.join(", ") ?? "",
            injuries: viewer.onboarding?.injuries?.join(", ") ?? "",
            dietaryPreferences:
              viewer.onboarding?.dietary_preferences?.join(", ") ?? "",
            goalType: viewer.goal?.goal_type ?? "maintenance",
            targetWeightKg: viewer.goal?.target_weight_kg?.toString() ?? "",
            weeklyTrainingDays:
              viewer.goal?.weekly_training_days?.toString() ?? "",
          }}
          userEmail={viewer.user.email ?? "no-email"}
        />
      </section>
    </main>
  );
}
