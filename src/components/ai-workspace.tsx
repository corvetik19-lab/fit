"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Brain,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  History,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AiChatPanel } from "@/components/ai-chat-panel";
import { AiWorkspaceSidebar } from "@/components/ai-workspace-sidebar";
import { PanelCard } from "@/components/panel-card";
import type { AiChatMessageRow, AiChatSessionRow } from "@/lib/ai/chat";
import type { AiPlanProposalRow } from "@/lib/ai/proposals";
import type { AiStructuredKnowledgeSnapshot } from "@/lib/ai/structured-knowledge";
import { mealPlanSchema, workoutPlanSchema } from "@/lib/ai/schemas";
import type { FeatureAccessSnapshot } from "@/lib/billing-access";

type WorkspaceSectionKey = "history" | "context" | "plans";
type AssistantFlowKey = "request" | "analysis" | "proposal" | "approve" | "apply";

type AiWorkspaceProps = {
  chatAccess: FeatureAccessSnapshot;
  initialMessages: AiChatMessageRow[];
  initialSessionId: string | null;
  initialSessionTitle: string | null;
  mealPhotoAccess: FeatureAccessSnapshot;
  proposals: AiPlanProposalRow[];
  recentSessions: AiChatSessionRow[];
  structuredKnowledge: AiStructuredKnowledgeSnapshot;
};

const sectionMeta: Array<{
  description: string;
  icon: typeof Sparkles;
  key: WorkspaceSectionKey;
  label: string;
}> = [
  {
    key: "history",
    label: "История",
    description: "Сохранённые диалоги и быстрый возврат к прошлым сессиям.",
    icon: History,
  },
  {
    key: "context",
    label: "Контекст",
    description: "Факты и сигналы, на которые AI опирается в ответах.",
    icon: Brain,
  },
  {
    key: "plans",
    label: "Планы",
    description: "Черновики, подтверждение и применение готовых предложений.",
    icon: ClipboardList,
  },
];

const assistantFlowSteps: Array<{
  description: string;
  key: AssistantFlowKey;
  label: string;
}> = [
  {
    key: "request",
    label: "Запрос",
    description: "Сформулируйте задачу или приложите фото еды.",
  },
  {
    key: "analysis",
    label: "Анализ",
    description: "AI учитывает историю, факты и текущий контекст.",
  },
  {
    key: "proposal",
    label: "Предложение",
    description: "Формируется черновик плана или конкретный разбор.",
  },
  {
    key: "approve",
    label: "Подтверждение",
    description: "Проверьте черновик и утвердите нужный вариант.",
  },
  {
    key: "apply",
    label: "Применение",
    description: "План переносится в тренировки или питание.",
  },
];

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatProposalStatus(value: string) {
  switch (value) {
    case "approved":
      return "Подтверждено";
    case "applied":
      return "Применено";
    default:
      return "Черновик";
  }
}

function parseProposalTitle(proposal: AiPlanProposalRow) {
  const payload = proposal.payload as { proposal?: unknown };
  const schema =
    proposal.proposal_type === "meal_plan" ? mealPlanSchema : workoutPlanSchema;
  const parsed = schema.safeParse(payload.proposal);

  if (!parsed.success) {
    return proposal.proposal_type === "meal_plan"
      ? "План питания"
      : "План тренировок";
  }

  return parsed.data.title;
}

function parseProposalSummary(proposal: AiPlanProposalRow) {
  const payload = proposal.payload as {
    proposal?: unknown;
    request?: {
      daysPerWeek?: number | null;
      dietaryNotes?: string | null;
      focus?: string | null;
      kcalTarget?: number | null;
      mealsPerDay?: number | null;
    };
  };
  const request = payload.request;

  if (proposal.proposal_type === "meal_plan") {
    const parsed = mealPlanSchema.safeParse(payload.proposal);
    if (parsed.success) {
      return `${parsed.data.caloriesTarget} ккал, ${parsed.data.meals.length} приёмов пищи`;
    }

    return [
      request?.kcalTarget ? `${request.kcalTarget} ккал` : null,
      request?.mealsPerDay ? `${request.mealsPerDay} приёмов пищи` : null,
      request?.dietaryNotes?.trim() || null,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  const parsed = workoutPlanSchema.safeParse(payload.proposal);
  if (parsed.success) {
    return `${parsed.data.days.length} тренировочных дня · ${parsed.data.summary}`;
  }

  return [
    request?.daysPerWeek ? `${request.daysPerWeek} дня в неделю` : null,
    request?.focus?.trim() || null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function getCurrentFlowStep(
  messagesCount: number,
  proposals: AiPlanProposalRow[],
): AssistantFlowKey {
  if (proposals.some((proposal) => proposal.status === "applied")) {
    return "apply";
  }

  if (proposals.some((proposal) => proposal.status === "approved")) {
    return "approve";
  }

  if (proposals.some((proposal) => proposal.status === "draft")) {
    return "proposal";
  }

  if (messagesCount > 0) {
    return "analysis";
  }

  return "request";
}

function getFlowStepState(step: AssistantFlowKey, current: AssistantFlowKey) {
  const currentIndex = assistantFlowSteps.findIndex((item) => item.key === current);
  const stepIndex = assistantFlowSteps.findIndex((item) => item.key === step);

  if (stepIndex < currentIndex) {
    return "done";
  }

  if (stepIndex === currentIndex) {
    return "active";
  }

  return "pending";
}

function getNextFlowHint(current: AssistantFlowKey) {
  switch (current) {
    case "request":
      return "Сформулируйте задачу слева, чтобы AI начал анализ.";
    case "analysis":
      return "Дождитесь ответа или черновика плана в чате.";
    case "proposal":
      return "Откройте раздел «Планы» или используйте карточки в чате для подтверждения.";
    case "approve":
      return "После подтверждения примените план в приложение одним нажатием.";
    case "apply":
      return "Готово: откройте тренировки или питание и работайте с применённым планом.";
    default:
      return "";
  }
}

function FlowCard({
  currentStep,
}: {
  currentStep: AssistantFlowKey;
}) {
  const currentMeta =
    assistantFlowSteps.find((step) => step.key === currentStep) ?? assistantFlowSteps[0];

  return (
    <section
      className="rounded-3xl border border-border bg-white/70 p-4 sm:p-5"
      data-testid="ai-assistant-flow"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
            Сценарий AI
          </p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">
            От запроса до применения
          </h2>
        </div>
        <span className="pill">Сейчас: {currentMeta.label}</span>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-5">
        {assistantFlowSteps.map((step, index) => {
          const state = getFlowStepState(step.key, currentStep);
          const isDone = state === "done";
          const isActive = state === "active";

          return (
            <article
              className={`rounded-2xl border px-4 py-4 text-sm ${
                isActive
                  ? "border-accent/40 bg-accent/10"
                  : isDone
                    ? "border-emerald-300/60 bg-emerald-50/90"
                    : "border-border bg-white/80"
              }`}
              data-flow-state={state}
              key={step.key}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-accent text-white"
                      : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {isDone ? <CheckCircle2 size={14} strokeWidth={2.2} /> : index + 1}
                </span>
                <p className="font-semibold text-foreground">{step.label}</p>
              </div>
              <p className="mt-3 leading-6 text-muted">{step.description}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-muted">
        <span className="font-semibold text-foreground">Следующий шаг.</span>{" "}
        {getNextFlowHint(currentStep)}
      </div>
    </section>
  );
}

function PlansSection({ proposals }: { proposals: AiPlanProposalRow[] }) {
  return (
    <PanelCard caption="Планы" title="Черновики и применение">
      <div className="grid gap-3" id="ai-plans">
        {proposals.length ? (
          proposals.map((proposal) => (
            <article
              className="rounded-3xl border border-border bg-white/70 p-4"
              key={proposal.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill">
                      {proposal.proposal_type === "meal_plan"
                        ? "Питание"
                        : "Тренировки"}
                    </span>
                    <span className="pill">{formatProposalStatus(proposal.status)}</span>
                  </div>
                  <p className="mt-3 text-base font-semibold text-foreground">
                    {parseProposalTitle(proposal)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {parseProposalSummary(proposal) ||
                      "Параметры черновика уже сохранены."}
                  </p>
                </div>
                <p className="text-xs text-muted">
                  {dateFormatter.format(new Date(proposal.updated_at))}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {proposal.status !== "applied" ? (
                  <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white">
                    Можно подтвердить или применить прямо из чата
                  </span>
                ) : (
                  <Link
                    className="rounded-full border border-border bg-white/90 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white"
                    href={
                      proposal.proposal_type === "meal_plan"
                        ? "/nutrition"
                        : "/workouts"
                    }
                  >
                    Открыть раздел
                  </Link>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-white/70 px-4 py-6 text-sm leading-6 text-muted">
            Здесь появятся черновики программ, которые AI соберёт по вашему
            запросу.
          </div>
        )}
      </div>
    </PanelCard>
  );
}

export function AiWorkspace({
  chatAccess,
  initialMessages,
  initialSessionId,
  initialSessionTitle,
  mealPhotoAccess,
  proposals,
  recentSessions,
  structuredKnowledge,
}: AiWorkspaceProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<WorkspaceSectionKey>("history");
  const [activeChatSessionId, setActiveChatSessionId] = useState(initialSessionId);
  const [sessionList, setSessionList] = useState(recentSessions);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [busySessionId, setBusySessionId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);

  useEffect(() => {
    setSessionList(recentSessions);
  }, [recentSessions]);

  useEffect(() => {
    setActiveChatSessionId(initialSessionId);
  }, [initialSessionId]);

  const currentFlowStep = useMemo(
    () => getCurrentFlowStep(initialMessages.length, proposals),
    [initialMessages.length, proposals],
  );

  function upsertSession(session: AiChatSessionRow) {
    setActiveChatSessionId(session.id);
    setSessionList((current) => [
      session,
      ...current.filter((item) => item.id !== session.id),
    ]);
  }

  async function handleDeleteSession(sessionId: string) {
    if (!window.confirm("Удалить этот чат из истории?")) {
      return;
    }

    setHistoryError(null);
    setBusySessionId(sessionId);

    try {
      const response = await fetch(`/api/ai/sessions/${sessionId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Не удалось удалить чат.");
      }

      setSessionList((current) => current.filter((item) => item.id !== sessionId));

      if (sessionId === activeChatSessionId) {
        setActiveChatSessionId(null);
        router.push("/ai");
      }

      router.refresh();
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Не удалось удалить чат.",
      );
    } finally {
      setBusySessionId(null);
    }
  }

  async function handleClearSessions() {
    if (!sessionList.length) {
      return;
    }

    if (!window.confirm("Очистить всю историю AI-чатов? Это действие нельзя отменить.")) {
      return;
    }

    setHistoryError(null);
    setIsClearingAll(true);

    try {
      const response = await fetch("/api/ai/sessions", {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Не удалось очистить историю чатов.");
      }

      setSessionList([]);
      setActiveChatSessionId(null);
      router.push("/ai");
      router.refresh();
    } catch (error) {
      setHistoryError(
        error instanceof Error
          ? error.message
          : "Не удалось очистить историю чатов.",
      );
    } finally {
      setIsClearingAll(false);
    }
  }

  const sectionContent =
    activeSection === "plans" ? (
      <PlansSection proposals={proposals} />
    ) : (
      <AiWorkspaceSidebar
        activeSessionId={activeChatSessionId}
        busySessionId={busySessionId}
        historyError={historyError}
        isClearingAll={isClearingAll}
        onClearSessions={activeSection === "history" ? handleClearSessions : undefined}
        onDeleteSession={activeSection === "history" ? handleDeleteSession : undefined}
        recentSessions={sessionList}
        section={activeSection}
        structuredKnowledge={structuredKnowledge}
      />
    );

  const activeMeta =
    sectionMeta.find((item) => item.key === activeSection) ?? sectionMeta[0];

  function returnToApp() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-full border border-border bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            AI
          </span>
          <p className="text-sm text-muted">
            Полноэкранный чат и управление планами
          </p>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-white"
          onClick={returnToApp}
          type="button"
        >
          <ChevronLeft size={16} strokeWidth={2.2} />
          Свернуть чат
        </button>
      </div>

      <FlowCard currentStep={currentFlowStep} />

      <div className="grid gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {sectionMeta.map((section) => {
            const Icon = section.icon;
            const isActive = section.key === activeSection;

            return (
              <button
                aria-pressed={isActive}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-accent/30 bg-accent/10 text-foreground"
                    : "border-border bg-white/80 text-muted hover:bg-white"
                }`}
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                type="button"
              >
                <Icon size={16} strokeWidth={2.1} />
                {section.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-border bg-white/70 px-4 py-3 text-sm text-muted">
          <span className="font-semibold text-foreground">{activeMeta.label}.</span>{" "}
          {activeMeta.description}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_22rem]">
        <div className="min-w-0">
          <AiChatPanel
            access={chatAccess}
            initialMessages={initialMessages}
            initialSessionId={initialSessionId}
            initialSessionTitle={initialSessionTitle}
            mealPhotoAccess={mealPhotoAccess}
            onSessionTouched={upsertSession}
          />
        </div>

        <div className="min-w-0">{sectionContent}</div>
      </div>
    </div>
  );
}
