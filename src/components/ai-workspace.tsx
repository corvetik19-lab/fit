"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  Brain,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  ClipboardList,
  Dumbbell,
  History,
  ScanBarcode,
  Sparkles,
  Utensils,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AiChatPanel } from "@/components/ai-chat-panel";
import { AiWorkspaceSidebar } from "@/components/ai-workspace-sidebar";
import {
  createAiAgentLaunchHref,
  type AiAgentLaunchContext,
  type AiAgentIntent,
} from "@/lib/ai/agent-intents";
import type { AiChatMessageRow, AiChatSessionRow } from "@/lib/ai/chat";
import type { AiPlanProposalRow } from "@/lib/ai/proposals";
import { mealPlanSchema, workoutPlanSchema } from "@/lib/ai/schemas";
import type { AiStructuredKnowledgeSnapshot } from "@/lib/ai/structured-knowledge";
import type { FeatureAccessSnapshot } from "@/lib/billing-access";

type WorkspaceSectionKey = "history" | "context" | "plans";

type AiWorkspaceProps = {
  chatAccess: FeatureAccessSnapshot;
  initialMessages: AiChatMessageRow[];
  initialSessionId: string | null;
  initialSessionTitle: string | null;
  launchContext: AiAgentLaunchContext | null;
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
    description: "Сохранённые диалоги и быстрый возврат к прошлым решениям.",
    icon: History,
  },
  {
    key: "context",
    label: "Контекст",
    description: "Факты, на которые AI опирается в ответах.",
    icon: Brain,
  },
  {
    key: "plans",
    label: "Планы",
    description: "Черновики тренировок и питания, созданные AI.",
    icon: ClipboardList,
  },
];

const agentActionMeta: Array<{
  description: string;
  icon: typeof Sparkles;
  intent: AiAgentIntent;
  label: string;
  title: string;
}> = [
  {
    description: "Рацион, калории и приемы пищи как черновик с подтверждением.",
    icon: Utensils,
    intent: "meal_plan",
    label: "Питание",
    title: "План питания",
  },
  {
    description: "Неделя тренировок, нагрузка и адаптация под цель.",
    icon: Dumbbell,
    intent: "workout_plan",
    label: "Тренировки",
    title: "План тренировок",
  },
  {
    description: "Загрузка изображения блюда прямо в чат AI-коуча.",
    icon: Camera,
    intent: "meal_photo",
    label: "Фото",
    title: "Разбор еды",
  },
  {
    description: "Состав, КБЖУ и вывод по продукту после Open Food Facts.",
    icon: ScanBarcode,
    intent: "barcode",
    label: "Штрихкод",
    title: "Разбор продукта",
  },
  {
    description: "История, факты и следующий практичный шаг.",
    icon: History,
    intent: "progress_review",
    label: "Прогресс",
    title: "Анализ прогресса",
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
      return "Подтверждён";
    case "applied":
      return "Применён";
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

async function fetchMutationWithTimeout(
  input: Parameters<typeof fetch>[0],
  init?: RequestInit,
  timeoutMs = 10_000,
) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

function clearSessionQueryParam() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete("session");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function WorkspaceStatCard({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "accent";
  value: string;
}) {
  return (
    <article className={`metric-tile p-2 ${tone === "accent" ? "surface-panel--accent" : ""}`}>
      <p className="workspace-kicker text-[0.55rem]">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-foreground">{value}</p>
    </article>
  );
}

function AiLaunchContextCard({
  launchContext,
}: {
  launchContext: AiAgentLaunchContext | null;
}) {
  if (!launchContext) {
    return null;
  }

  return (
    <section
      className="surface-panel surface-panel--accent p-3.5 sm:p-4"
      data-testid="ai-launch-context"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <span className="pill">{launchContext.badge}</span>
            <span className="pill">из раздела {launchContext.sourceLabel}</span>
          </div>
          <h2 className="mt-2 text-base font-semibold text-foreground sm:text-lg">
            {launchContext.title}
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted">
            {launchContext.description}
          </p>
        </div>
        <a
          className="toggle-chip toggle-chip--active shrink-0 px-3 py-2 text-xs font-semibold"
          href="#ai-chat-composer"
        >
          Начать в чате
        </a>
      </div>
    </section>
  );
}

function AiAgentActionDeck({
  sourceRoute,
}: {
  sourceRoute: AiAgentLaunchContext["sourceRoute"];
}) {
  return (
    <section className="surface-panel p-3 sm:p-3.5" data-testid="ai-agent-actions">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="workspace-kicker">AI-действия</p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            Что может сделать агент
          </h2>
        </div>
        <span className="pill">proposal-first</span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {agentActionMeta.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              className="section-chip flex min-w-0 items-start gap-2.5 px-3 py-2.5 text-left"
              href={createAiAgentLaunchHref({
                intent: action.intent,
                sourceRoute,
              }) as Route}
              key={action.intent}
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] bg-[color:var(--accent-soft)] text-accent-strong">
                <Icon size={17} strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="pill px-2 py-1 text-[0.62rem]">
                  {action.label}
                </span>
                <span className="mt-1 block text-sm font-semibold">
                  {action.title}
                </span>
                <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                  {action.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function PlansSection({ proposals }: { proposals: AiPlanProposalRow[] }) {
  return (
    <section className="surface-panel p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="workspace-kicker">Планы</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Черновики AI
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted">
            Предложения по тренировкам и питанию остаются proposal-first.
          </p>
        </div>
        <span className="pill">{proposals.length}</span>
      </div>

      <div className="mt-3 grid gap-2.5" id="ai-plans">
        {proposals.length ? (
          proposals.map((proposal) => (
            <article className="metric-tile p-3" key={proposal.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill">
                      {proposal.proposal_type === "meal_plan"
                        ? "Питание"
                        : "Тренировки"}
                    </span>
                    <span className="pill">{formatProposalStatus(proposal.status)}</span>
                  </div>
                  <p className="mt-2 break-words text-base font-semibold text-foreground">
                    {parseProposalTitle(proposal)}
                  </p>
                  <p className="mt-1 break-words text-sm leading-5 text-muted">
                    {parseProposalSummary(proposal) ||
                      "Параметры черновика сохранены и готовы к проверке."}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-muted">
                  {dateFormatter.format(new Date(proposal.updated_at))}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {proposal.status !== "applied" ? (
                  <span className="toggle-chip toggle-chip--active px-3 py-1.5 text-xs font-semibold">
                    Подтверждение и применение доступны из чата
                  </span>
                ) : (
                  <Link
                    className="toggle-chip px-3 py-1.5 text-sm font-semibold"
                    href={proposal.proposal_type === "meal_plan" ? "/nutrition" : "/workouts"}
                  >
                    Открыть раздел
                  </Link>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="metric-tile border-dashed px-3.5 py-5 text-sm leading-5 text-muted">
            Здесь появятся черновики, которые AI соберёт по твоим запросам.
          </div>
        )}
      </div>
    </section>
  );
}

export function AiWorkspace({
  chatAccess,
  initialMessages,
  initialSessionId,
  initialSessionTitle,
  launchContext,
  mealPhotoAccess,
  proposals,
  recentSessions,
  structuredKnowledge,
}: AiWorkspaceProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<WorkspaceSectionKey>("history");
  const [activeChatSessionId, setActiveChatSessionId] = useState(initialSessionId);
  const [sessionList, setSessionList] = useState(() => recentSessions);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [busySessionId, setBusySessionId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chatPanelResetVersion, setChatPanelResetVersion] = useState(0);

  useEffect(() => {
    setActiveChatSessionId(initialSessionId);
  }, [initialSessionId]);

  function upsertSession(session: AiChatSessionRow) {
    const sessionAlreadyKnown = sessionList.some((item) => item.id === session.id);

    if (sessionAlreadyKnown || session.id === initialSessionId) {
      setActiveChatSessionId(session.id);
    }

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
    const previousSessions = sessionList;
    const previousActiveSessionId = activeChatSessionId;
    const nextSessions = previousSessions.filter((item) => item.id !== sessionId);
    const isDeletingActiveSession = sessionId === activeChatSessionId;

    setSessionList(nextSessions);

    try {
      if (isDeletingActiveSession) {
        setActiveChatSessionId(null);
        clearSessionQueryParam();
        setChatPanelResetVersion((current) => current + 1);
      }

      const response = await fetchMutationWithTimeout(`/api/ai/sessions/${sessionId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Не удалось удалить чат.");
      }
    } catch (error) {
      setSessionList(previousSessions);
      setActiveChatSessionId(previousActiveSessionId);

      if (isDeletingActiveSession) {
        setChatPanelResetVersion((current) => current + 1);
      }

      setHistoryError(
        error instanceof Error
          ? error.name === "AbortError"
            ? "Сессия не удалилась вовремя. Попробуй ещё раз."
            : error.message
          : "Не удалось удалить чат.",
      );
    } finally {
      setBusySessionId(null);
    }
  }

  async function handleClearSessions() {
    if (!sessionList.length) {
      return;
    }

    if (!window.confirm("Очистить всю историю AI-чатов? Это нельзя отменить.")) {
      return;
    }

    setHistoryError(null);
    setIsClearingAll(true);
    const previousSessions = sessionList;
    const previousActiveSessionId = activeChatSessionId;

    setSessionList([]);
    setActiveChatSessionId(null);
    clearSessionQueryParam();
    setChatPanelResetVersion((current) => current + 1);

    try {
      const response = await fetchMutationWithTimeout("/api/ai/sessions", {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Не удалось очистить историю чатов.");
      }
    } catch (error) {
      setSessionList(previousSessions);
      setActiveChatSessionId(previousActiveSessionId);
      setChatPanelResetVersion((current) => current + 1);
      setHistoryError(
        error instanceof Error
          ? error.name === "AbortError"
            ? "История не очистилась вовремя. Попробуй ещё раз."
            : error.message
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
  const shouldReuseServerSession =
    activeChatSessionId !== null && activeChatSessionId === initialSessionId;
  const summaryCards = [
    {
      label: "Чатов",
      tone: "default" as const,
      value: sessionList.length.toLocaleString("ru-RU"),
    },
    {
      label: "Фактов",
      tone: "default" as const,
      value: structuredKnowledge.facts.length.toLocaleString("ru-RU"),
    },
    {
      label: "Планов",
      tone: "accent" as const,
      value: proposals.length.toLocaleString("ru-RU"),
    },
  ];

  function handleSectionSelect(nextSection: WorkspaceSectionKey) {
    setActiveSection(nextSection);
    setIsMobileMenuOpen(false);
  }

  function returnToApp() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="grid gap-2.5 sm:gap-3">
      <section className="surface-panel p-2.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              <span className="pill">AI-коуч</span>
              <span className="pill">
                {chatAccess.allowed ? "Чат доступен" : "Доступ ограничен"}
              </span>
              <span className="pill">
                {mealPhotoAccess.allowed ? "Фото еды включено" : "Фото еды выключено"}
              </span>
            </div>
            <h1 className="mt-2 text-[1.12rem] font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
              Чат, планы и контекст
            </h1>
            <p className="mt-1 text-[0.78rem] leading-5 text-muted sm:text-sm">
              Задавай вопросы, собирай план питания или тренировку и подтверждай предложения перед применением.
            </p>
          </div>

          <button
            className="toggle-chip shrink-0 px-2.5 py-2 text-xs font-semibold"
            onClick={returnToApp}
            type="button"
          >
            <ChevronLeft size={16} strokeWidth={2.2} />
            Назад
          </button>
        </div>

        <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:gap-2">
          {summaryCards.map((card) => (
            <WorkspaceStatCard
              key={card.label}
              label={card.label}
              tone={card.tone}
              value={card.value}
            />
          ))}
        </div>
      </section>

      <AiLaunchContextCard launchContext={launchContext} />

      <AiAgentActionDeck sourceRoute={launchContext?.sourceRoute ?? "ai"} />

      <section className="surface-panel p-2.5 sm:p-3">
        <div className="md:hidden">
          <button
            aria-expanded={isMobileMenuOpen}
            className="section-chip flex w-full items-center justify-between gap-2.5 px-3 py-2.5 text-left"
            data-testid="ai-workspace-mobile-trigger"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            type="button"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">
                Раздел AI
              </span>
              <span className="mt-0.5 block text-sm font-semibold text-foreground">
                {activeMeta.label}
              </span>
            </span>
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground">
              {isMobileMenuOpen ? (
                <ChevronUp size={18} strokeWidth={2.2} />
              ) : (
                <ChevronDown size={18} strokeWidth={2.2} />
              )}
            </span>
          </button>

          {isMobileMenuOpen ? (
            <div className="mt-2 grid gap-1.5 rounded-[1rem] border border-border bg-white p-1.5">
              {sectionMeta.map((section) => {
                const Icon = section.icon;
                const isActive = section.key === activeSection;

                return (
                  <button
                    aria-pressed={isActive}
                    className={`section-chip flex w-full items-start justify-between gap-2.5 px-3 py-2.5 text-left ${
                      isActive ? "section-chip--active" : "border-transparent"
                    }`}
                    data-testid={`ai-workspace-option-${section.key}`}
                    key={section.key}
                    onClick={() => handleSectionSelect(section.key)}
                    type="button"
                  >
                    <span className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-accent">
                        <Icon size={17} strokeWidth={2.2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">
                          {section.label}
                        </span>
                        <span className="mt-0.5 hidden text-xs leading-5 text-muted min-[390px]:block">
                          {section.description}
                        </span>
                      </span>
                    </span>
                    {isActive ? (
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700">
                        <Check size={16} strokeWidth={2.3} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="hidden items-center gap-2 overflow-x-auto md:flex">
          {sectionMeta.map((section) => {
            const Icon = section.icon;
            const isActive = section.key === activeSection;

            return (
              <button
                aria-pressed={isActive}
                className={`section-chip inline-flex min-w-[9rem] items-center gap-2 px-3 py-2.5 text-sm font-medium ${
                  isActive ? "section-chip--active" : ""
                }`}
                key={section.key}
                onClick={() => handleSectionSelect(section.key)}
                type="button"
              >
                <Icon size={16} strokeWidth={2.1} />
                {section.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1.15fr)_22rem]">
        <div className="min-w-0">
          <AiChatPanel
            access={chatAccess}
            initialMessages={shouldReuseServerSession ? initialMessages : []}
            initialSessionId={shouldReuseServerSession ? initialSessionId : null}
            initialSessionTitle={shouldReuseServerSession ? initialSessionTitle : null}
            key={`${chatPanelResetVersion}:${activeChatSessionId ?? "new-chat"}:${launchContext?.intent ?? "no-intent"}`}
            launchContext={launchContext}
            mealPhotoAccess={mealPhotoAccess}
            onSessionTouched={upsertSession}
          />
        </div>

        <div className="min-w-0">{sectionContent}</div>
      </div>
    </div>
  );
}
