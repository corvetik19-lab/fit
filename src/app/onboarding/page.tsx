import { Settings2 } from "lucide-react";
import Image from "next/image";

import { OnboardingForm } from "@/components/onboarding-form";
import { requireViewer } from "@/lib/viewer";

function getViewerInitial(email: string | null, fullName: string | null) {
  const source = fullName?.trim() || email?.trim() || "fitora";
  return source[0]?.toUpperCase() ?? "F";
}

export default async function OnboardingPage() {
  const viewer = await requireViewer();
  const viewerInitial = getViewerInitial(
    viewer.user.email ?? null,
    viewer.profile?.full_name ?? null,
  );

  return (
    <main className="min-h-dvh bg-background">
      <header className="fixed inset-x-0 top-0 z-20 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[780px] items-center justify-between px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2563EB,#0891FF,#2DD4BF)] text-sm font-black text-white shadow-[0_16px_34px_-24px_rgba(8,145,255,0.54)]">
              {viewerInitial}
            </span>
            <div className="flex min-w-0 items-center gap-2">
              <Image
                alt="fitora"
                className="h-8 w-8 object-contain"
                height={32}
                priority
                src="/fit-logo.svg"
                width={32}
              />
              <span className="font-display text-2xl font-black tracking-[-0.08em] text-foreground">
                fitora
              </span>
            </div>
          </div>

          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/72 text-muted shadow-[0_14px_30px_-24px_rgba(15,23,42,0.24)]">
            <Settings2 size={18} strokeWidth={2.1} />
          </span>
        </div>
      </header>

      <section className="mx-auto flex min-h-dvh w-full max-w-[780px] flex-col px-5 pb-28 pt-24 sm:px-6">
        <div className="space-y-4 pb-8">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-3">
              <p className="font-display text-4xl font-black uppercase leading-none tracking-[-0.08em] text-foreground sm:text-5xl">
                Создай свой
                <br />
                профиль
              </p>
              <div className="h-1.5 w-32 rounded-full bg-[#dbeafe]">
                <div className="h-full w-16 rounded-full bg-[linear-gradient(135deg,#2563EB,#2DD4BF)]" />
              </div>
            </div>

            <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-soft)_62%,white)] px-3 py-2 text-[0.62rem] font-extrabold uppercase tracking-[0.24em] text-accent-strong">
              step 02 / 04
            </span>
          </div>
        </div>

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
