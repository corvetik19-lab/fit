import { AiChatPanel } from "@/components/ai-chat-panel";
import { AiProposalStudio } from "@/components/ai-proposal-studio";
import { AppShell } from "@/components/app-shell";
import { PanelCard } from "@/components/panel-card";
import { getLatestAiChatState } from "@/lib/ai/chat";
import { listAiPlanProposals } from "@/lib/ai/proposals";
import { getAiUserContext } from "@/lib/ai/user-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireReadyViewer } from "@/lib/viewer";

function formatGoal(value: string | null) {
  switch (value) {
    case "fat_loss":
      return "Снижение веса";
    case "muscle_gain":
      return "Набор мышц";
    case "performance":
      return "Производительность";
    case "maintenance":
      return "Поддержание формы";
    default:
      return "не указана";
  }
}

export default async function AiPage() {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const [context, proposals, chatState] = await Promise.all([
    getAiUserContext(supabase, viewer.user.id),
    listAiPlanProposals(supabase, viewer.user.id, 10),
    getLatestAiChatState(supabase, viewer.user.id),
  ]);

  return (
    <AppShell eyebrow="AI" title="AI-коуч, чат и центр предложений">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PanelCard caption="Работа" title="AI-поверхность с подтверждением">
          <p className="text-sm leading-7 text-muted">
            Теперь AI-планы генерируются из реального пользовательского контекста
            и сначала сохраняются как предложения в `ai_plan_proposals`. Для AI-чата
            добавлен retrieval-слой поверх `knowledge_chunks` и
            `knowledge_embeddings`. Автозаписи в тренировки или питание без
            подтверждения здесь нет.
          </p>
        </PanelCard>
        <PanelCard caption="Контекст" title="На чём AI строит предложения">
          <ul className="grid gap-3 text-sm leading-7 text-muted">
            <li>
              Цель:{" "}
              <span className="font-semibold text-foreground">
                {formatGoal(context.goal.goalType)}
              </span>
              .
            </li>
            <li>
              Тренировочных дней в неделю:{" "}
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

      <PanelCard caption="AI-чат" title="Контекстный фитнес-ассистент">
        <AiChatPanel
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
        proposals={proposals}
      />
    </AppShell>
  );
}
