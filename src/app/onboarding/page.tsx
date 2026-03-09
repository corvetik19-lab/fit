import { OnboardingForm } from "@/components/onboarding-form";
import { requireViewer } from "@/lib/viewer";

export default async function OnboardingPage() {
  const viewer = await requireViewer();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8 sm:px-10">
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
    </main>
  );
}
