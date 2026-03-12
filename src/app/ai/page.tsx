import { AiChatPanel } from "@/components/ai-chat-panel";
import { AiProposalStudio } from "@/components/ai-proposal-studio";
import { AiWorkspaceSidebar } from "@/components/ai-workspace-sidebar";
import { AppShell } from "@/components/app-shell";
import { PageWorkspace } from "@/components/page-workspace";
import { PanelCard } from "@/components/panel-card";
import { getAiChatState, listAiChatSessions } from "@/lib/ai/chat";
import { listAiPlanProposals } from "@/lib/ai/proposals";
import { getAiRuntimeContext } from "@/lib/ai/user-context";
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
    case "privileged":
      return "корневой доступ";
    default:
      return "базовый доступ";
  }
}

function formatSubscriptionStatus(
  status: string | null,
  isPrivilegedAccess: boolean,
) {
  if (isPrivilegedAccess) {
    return "полный доступ super-admin";
  }

  return status ?? "нет";
}

function formatSubscriptionProvider(
  provider: string | null,
  isPrivilegedAccess: boolean,
) {
  if (isPrivilegedAccess) {
    return "встроенный административный доступ";
  }

  return provider ?? "не указан";
}

type AiPageProps = {
  searchParams?: Promise<{
    session?: string | string[] | undefined;
  }>;
};

export default async function AiPage({ searchParams }: AiPageProps) {
  const viewer = await requireReadyViewer();
  const supabase = await createServerSupabaseClient();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const sessionParam = Array.isArray(resolvedSearchParams.session)
    ? resolvedSearchParams.session[0]
    : resolvedSearchParams.session ?? null;

  const [runtimeContext, proposals, chatState, recentSessions, access] = await Promise.all([
    getAiRuntimeContext(supabase, viewer.user.id),
    listAiPlanProposals(supabase, viewer.user.id, 10),
    getAiChatState(supabase, viewer.user.id, sessionParam),
    listAiChatSessions(supabase, viewer.user.id, 8),
    readUserBillingAccess(supabase, viewer.user.id, {
      email: viewer.user.email,
    }),
  ]);
  const context = runtimeContext.context;

  return (
    <AppShell eyebrow="AI" title="AI-ассистент, чат и планы">
      <PageWorkspace
        badges={[
          viewer.profile?.full_name ?? viewer.user.email ?? "fit",
          runtimeContext.cache.source === "snapshot"
            ? "Контекст открыт из сохранённого снимка"
            : "Контекст обновлён прямо сейчас",
          access.subscription.isPrivilegedAccess
            ? "Полный доступ открыт"
            : access.features.ai_chat.allowed
              ? "AI-чат доступен"
              : "Доступ к AI ограничен",
        ]}
        description="AI-экран теперь тоже разбит на понятные разделы: диалог, предложения, контекст и доступ. На телефоне это работает как нормальное приложение с коротким меню разделов, а не как длинная лента карточек."
        initialSectionKey="chat"
        metrics={[
          {
            label: "Диалоги",
            value: String(recentSessions.length),
            note: "сохранено в AI-истории",
          },
          {
            label: "Предложения",
            value: String(proposals.length),
            note: "черновиков и применённых планов",
          },
          {
            label: "Факты",
            value: String(context.structuredKnowledge.facts.length),
            note: "нормализовано для AI",
          },
          {
            label: "Тоннаж 28д",
            value:
              context.workoutInsights.tonnageLast28Kg === null
                ? "нет"
                : `${context.workoutInsights.tonnageLast28Kg.toLocaleString("ru-RU")} кг`,
            note: "силовой контекст в памяти AI",
          },
        ]}
        sections={[
          {
            key: "chat",
            label: "Чат",
            description: "Диалог, сохранённые сессии и быстрый вход в разговор.",
            content: (
              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="order-2 xl:order-1">
                  <AiWorkspaceSidebar
                    activeSessionId={chatState.session?.id ?? null}
                    proposalCount={proposals.length}
                    recentSessions={recentSessions}
                    structuredKnowledge={context.structuredKnowledge}
                  />
                </div>

                <div className="order-1 xl:order-2" id="chat-workspace">
                  <PanelCard
                    caption="Диалог"
                    title="Контекстный AI-ассистент по твоим данным"
                  >
                    <AiChatPanel
                      access={access.features.ai_chat}
                      initialMessages={chatState.messages}
                      initialSessionId={chatState.session?.id ?? null}
                      initialSessionTitle={chatState.session?.title ?? null}
                    />
                  </PanelCard>
                </div>
              </div>
            ),
          },
          {
            key: "proposals",
            label: "Предложения",
            description: "Черновики планов, подтверждение и применение одним нажатием.",
            content: (
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
            ),
          },
          {
            key: "context",
            label: "Контекст",
            description: "На каких данных AI строит решения и советы.",
            content: (
              <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                <PanelCard
                  caption="Как работает"
                  title="AI предлагает, а ты подтверждаешь"
                >
                  <p className="text-sm leading-7 text-muted">
                    AI собирает рекомендации из твоих целей, режима, истории
                    тренировок, питания и нормализованных фактов. Новые планы
                    сначала попадают в черновик, а затем применяются только
                    после подтверждения.
                  </p>
                  <p className="mt-3 text-sm text-muted">
                    {runtimeContext.cache.source === "snapshot"
                      ? "Контекст открыт из сохранённого runtime-снимка, чтобы чат и предложения работали быстрее на длинной истории."
                      : "Контекст только что пересчитан и сохранён как свежий runtime-снимок."}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border bg-white/70 px-4 py-4 text-sm">
                      <p className="text-muted">Силовой контекст</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">
                        {context.workoutInsights.tonnageLast28Kg ?? "нет данных"} кг
                      </p>
                      <p className="mt-2 leading-6 text-muted">
                        тоннажа за 28 дней с учётом реальных весов и
                        выполненных сетов.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-white/70 px-4 py-4 text-sm">
                      <p className="text-muted">Пищевой контекст</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">
                        {context.nutritionInsights.daysTrackedLast7}/7
                      </p>
                      <p className="mt-2 leading-6 text-muted">
                        дней питания входят в текущую AI-сводку и сигналы
                        по рациону.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-white/70 px-4 py-4 text-sm">
                      <p className="text-muted">Рабочие факты</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">
                        {context.structuredKnowledge.facts.length}
                      </p>
                      <p className="mt-2 leading-6 text-muted">
                        нормализованных фактов AI держит одновременно в prompt
                        и retrieval.
                      </p>
                    </div>
                  </div>
                </PanelCard>

                <PanelCard
                  caption="Основа"
                  title="На каких параметрах держатся рекомендации"
                >
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
                    <li>
                      Пищевые предпочтения:{" "}
                      <span className="font-semibold text-foreground">
                        {context.onboarding.dietaryPreferences.join(", ") ||
                          "не указаны"}
                      </span>
                      .
                    </li>
                  </ul>
                </PanelCard>
              </div>
            ),
          },
          {
            key: "access",
            label: "Доступ",
            description: "Подписка, лимиты и текущие возможности AI.",
            content: (
              <PanelCard
                caption="Доступ"
                title="Текущий план и возможности AI"
              >
                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
                    <p className="font-semibold text-foreground">
                      Текущее состояние доступа
                    </p>
                    <div className="mt-3 grid gap-1 text-muted">
                      <p>
                        Подписка:{" "}
                        <span className="text-foreground">
                          {formatSubscriptionStatus(
                            access.subscription.status,
                            access.subscription.isPrivilegedAccess,
                          )}
                        </span>
                      </p>
                      <p>
                        Платёжный провайдер:{" "}
                        <span className="text-foreground">
                          {formatSubscriptionProvider(
                            access.subscription.provider,
                            access.subscription.isPrivilegedAccess,
                          )}
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
                            <p className="font-semibold text-foreground">
                              {feature.label}
                            </p>
                            <p className="mt-1 leading-6 text-muted">
                              {feature.description}
                            </p>
                          </div>
                          <span className="pill">
                            {feature.allowed ? "доступно" : "закрыто"}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-1 text-muted">
                          <p>
                            Источник доступа: {formatAccessSource(feature.source)}
                          </p>
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
            ),
          },
        ]}
        title="AI-коуч, диалоги и предложения без длинной прокрутки"
      />
    </AppShell>
  );
}
