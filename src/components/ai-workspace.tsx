"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, ChevronLeft, ClipboardList, History, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { AiChatPanel } from "@/components/ai-chat-panel";
import { AiWorkspaceSidebar } from "@/components/ai-workspace-sidebar";
import { PanelCard } from "@/components/panel-card";
import type { AiChatMessageRow, AiChatSessionRow } from "@/lib/ai/chat";
import type { AiPlanProposalRow } from "@/lib/ai/proposals";
import type { AiStructuredKnowledgeSnapshot } from "@/lib/ai/structured-knowledge";
import { mealPlanSchema, workoutPlanSchema } from "@/lib/ai/schemas";
import type { FeatureAccessSnapshot } from "@/lib/billing-access";

type WorkspaceSectionKey = "history" | "context" | "plans";

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
    description: "Сохранённые переписки",
    icon: History,
  },
  {
    key: "context",
    label: "Контекст",
    description: "Что AI учитывает в ответах",
    icon: Brain,
  },
  {
    key: "plans",
    label: "Планы",
    description: "Черновики и применение",
    icon: ClipboardList,
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
    return proposal.proposal_type === "meal_plan" ? "План питания" : "План тренировок";
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
                      {proposal.proposal_type === "meal_plan" ? "Питание" : "Тренировки"}
                    </span>
                    <span className="pill">{formatProposalStatus(proposal.status)}</span>
                  </div>
                  <p className="mt-3 text-base font-semibold text-foreground">
                    {parseProposalTitle(proposal)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {parseProposalSummary(proposal) || "Параметры черновика уже сохранены."}
                  </p>
                </div>
                <p className="text-xs text-muted">
                  {dateFormatter.format(new Date(proposal.updated_at))}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {proposal.status !== "applied" ? (
                  <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white">
                    Применить можно прямо из чата
                  </span>
                ) : (
                  <Link
                    className="rounded-full border border-border bg-white/90 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white"
                    href={proposal.proposal_type === "meal_plan" ? "/nutrition" : "/workouts"}
                  >
                    Открыть раздел
                  </Link>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-white/70 px-4 py-6 text-sm leading-6 text-muted">
            Здесь появятся черновики программ, которые AI соберёт по твоему запросу.
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
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

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
      setHistoryError(error instanceof Error ? error.message : "Не удалось удалить чат.");
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
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Не удалось очистить историю чатов.");
      }

      setSessionList([]);
      setActiveChatSessionId(null);
      router.push("/ai");
      router.refresh();
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Не удалось очистить историю чатов.",
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

  const activeMeta = sectionMeta.find((item) => item.key === activeSection) ?? sectionMeta[0];

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
