import { AiChatPanel } from "@/components/ai-chat-panel";
import { AiProposalStudio } from "@/components/ai-proposal-studio";
import { AppShell } from "@/components/app-shell";
import { PanelCard } from "@/components/panel-card";
import { getLatestAiChatState } from "@/lib/ai/chat";
import { listAiPlanProposals } from "@/lib/ai/proposals";
import { getAiUserContext } from "@/lib/ai/user-context";
import { readUserBillingAccess } from "@/lib/billing-access";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireReadyViewer } from "@/lib/viewer";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatGoal(value: string | null) {
  switch (value) {
    case "fat_loss":
      return "снижение веса";
    case "muscle_gain":
      return "набор мышц";
    case "performance":
      return "рост выносливости";
    case "maintenance":
      return "поддержание формы";
    default:
      return "не указана";
  }
}

function formatAccessDate(value: string | null) {
  if (!value) {
    return "не задан";
  }

  return dateFormatter.format(new Date(value));
}

function formatAccessSource(value: string) {
  switch (value) {
    case "subscription":
      return "по подписке";
    case "entitlement":
      return "открыто вручную";
    default:
      return "базовый доступ";
  }
}

export default async function AiPage() {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const [context, proposals, chatState, access] = await Promise.all([
    getAiUserContext(supabase, viewer.user.id),
    listAiPlanProposals(supabase, viewer.user.id, 10),
    getLatestAiChatState(supabase, viewer.user.id),
    readUserBillingAccess(supabase, viewer.user.id),
  ]);

  return (
    <AppShell eyebrow="AI" title="AI-ассистент, чат и планы">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PanelCard caption="Как работает" title="AI предлагает, а ты подтверждаешь">
          <p className="text-sm leading-7 text-muted">
            AI собирает рекомендации из твоих целей, текущего режима и истории.
            Новые планы сначала попадают в черновик, а потом уже применяются
            после подтверждения.
          </p>
        </PanelCard>

        <PanelCard caption="Основа" title="На каких данных строятся рекомендации">
          <ul className="grid gap-3 text-sm leading-7 text-muted">
            <li>
              Цель:{" "}
              <span className="font-semibold text-foreground">
                {formatGoal(context.goal.goalType)}
              </span>
              .
            </li>
            <li>
              Тренировок в неделю:{" "}
              <span className="font-semibold text-foreground">
                {context.goal.weeklyTrainingDays ?? "не указано"}
              </span>
              .
            </li>
            <li>
              Цель по калориям:{" "}
              <span className="font-semibold text-foreground">
                {context.nutritionTargets.kcalTarget ?? "не указана"}
              </span>
              .
            </li>
            <li>
              Оборудование:{" "}
              <span className="font-semibold text-foreground">
                {context.onboarding.equipment.join(", ") || "не указано"}
              </span>
              .
            </li>
          </ul>
        </PanelCard>
      </div>

      <PanelCard caption="Доступ" title="Текущий план и возможности AI">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
            <p className="font-semibold text-foreground">Текущее состояние доступа</p>
            <div className="mt-3 grid gap-1 text-muted">
              <p>
                Подписка:{" "}
                <span className="text-foreground">
                  {access.subscription.status ?? "нет"}
                </span>
              </p>
              <p>
                Платёжный провайдер:{" "}
                <span className="text-foreground">
                  {access.subscription.provider ?? "не указан"}
                </span>
              </p>
              <p>
                Подписка активна:{" "}
                <span className="text-foreground">
                  {access.subscription.isActive ? "да" : "нет"}
                </span>
              </p>
              <p>
                Период до:{" "}
                <span className="text-foreground">
                  {formatAccessDate(access.subscription.currentPeriodEnd)}
                </span>
              </p>
            </div>
          </article>

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.values(access.features).map((feature) => (
              <article
                className="rounded-2xl border border-border bg-white/60 p-4 text-sm"
                key={feature.featureKey}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{feature.label}</p>
                    <p className="mt-1 leading-6 text-muted">
                      {feature.description}
                    </p>
                  </div>
                  <span className="pill">
                    {feature.allowed ? "доступно" : "закрыто"}
                  </span>
                </div>
                <div className="mt-3 grid gap-1 text-muted">
                  <p>Источник доступа: {formatAccessSource(feature.source)}</p>
                  <p>
                    Использовано: {feature.usage.count}
                    {typeof feature.usage.limit === "number"
                      ? ` / ${feature.usage.limit}`
                      : ""}
                  </p>
                  <p>
                    Следующее обновление лимита:{" "}
                    {formatAccessDate(feature.usage.resetAt)}
                  </p>
                  {feature.reason ? (
                    <p className="text-amber-700">{feature.reason}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </PanelCard>

      <PanelCard caption="Чат" title="Контекстный AI-ассистент">
        <AiChatPanel
          access={access.features.ai_chat}
          initialMessages={chatState.messages}
          initialSessionId={chatState.session?.id ?? null}
          initialSessionTitle={chatState.session?.title ?? null}
        />
      </PanelCard>

      <AiProposalStudio
        contextSnapshot={{
          goalType: context.goal.goalType,
          weeklyTrainingDays: context.goal.weeklyTrainingDays,
          kcalTarget: context.nutritionTargets.kcalTarget,
          equipment: context.onboarding.equipment,
          dietaryPreferences: context.onboarding.dietaryPreferences,
        }}
        mealPlanAccess={access.features.meal_plan}
        proposals={proposals}
        workoutPlanAccess={access.features.workout_plan}
      />
    </AppShell>
  );
}
